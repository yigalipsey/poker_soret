"use server";

import connectDB from "@/lib/db";
import GameSession from "@/models/GameSession";
import User from "@/models/User";
import Club from "@/models/Club";
import ClubBankroll from "@/models/ClubBankroll";
import { calculateSettlements } from "@/lib/settlement";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { cookies } from "next/headers";
// bcrypt removed - using plain text passwords for simplicity
import { chipsToShekels } from "@/lib/utils";
import {
  sendBuyInRequestEmail,
  sendDepositRequestEmail,
  sendJoinGameRequestEmail,
} from "@/lib/email";
import DepositRequest from "@/models/DepositRequest";
import JoinGameRequest from "@/models/JoinGameRequest";

/**
 * המרת אובייקט Mongoose ל-plain object עבור Client Components
 */
function toPlainObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // אם זה ObjectId, המר ל-string
  if (
    obj instanceof mongoose.Types.ObjectId ||
    obj.constructor?.name === "ObjectId"
  ) {
    return obj.toString();
  }

  // אם זה Buffer (מ-MongoDB), המר ל-string
  if (Buffer.isBuffer(obj)) {
    return obj.toString("hex");
  }

  // אם זה תאריך, השאר אותו
  if (obj instanceof Date) {
    return obj;
  }

  // אם זה מערך, המר כל איבר
  if (Array.isArray(obj)) {
    return obj.map((item) => toPlainObject(item));
  }

  // אם זה אובייקט, המר כל שדה
  if (typeof obj === "object") {
    const plain: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        plain[key] = toPlainObject(obj[key]);
      }
    }
    return plain;
  }

  // אחרת, החזר את הערך כמו שהוא
  return obj;
}

export async function getUsers(clubId?: string) {
  await connectDB();
  const query: any = { isAdmin: false }; // רק שחקנים, לא מנהלים
  if (clubId) {
    query.clubId = clubId;
  }
  const users = await User.find(query).sort({ globalBalance: -1 }).lean();
  // המרה ל-plain objects כדי למנוע בעיות עם Client Components
  const usersData = toPlainObject(users);

  // אם זה מוד קופה משותפת, נטען את היתרות מהקופה המשותפת
  if (clubId) {
    const club = await Club.findById(clubId).lean();
    if (club?.gameMode === "shared_bankroll") {
      const clubBankroll = await ClubBankroll.findOne({ clubId }).lean();
      if (clubBankroll) {
        // עדכון bankroll לכל שחקן מה-ClubBankroll
        usersData.forEach((user: any) => {
          const playerBankroll = clubBankroll.players.find(
            (p: any) => p.userId.toString() === user._id
          );
          user.bankroll = playerBankroll?.balance || 0;
        });
      }
    }
  }

  // וידוא שכל האובייקטים הם plain objects
  return usersData.map((user: any) => toPlainObject(user));
}

export async function createUser(
  name: string,
  isAdmin: boolean = false,
  clubId?: string,
  password?: string
) {
  try {
    await connectDB();

    // אם זה לא מנהל, חייב להיות clubId
    if (!isAdmin && !clubId) {
      throw new Error("נא לבחור קלאב לפני יצירת שחקן");
    }

    // בדוק אם כבר קיים משתמש עם אותו שם באותו קלאב
    if (clubId) {
      const existingUser = await User.findOne({
        name: name.trim(),
        clubId: clubId,
      });

      if (existingUser) {
        throw new Error(`שחקן עם השם "${name.trim()}" כבר קיים בקלאב זה`);
      }
    }

    const userData: any = {
      name: name.trim(),
      isAdmin,
      password: password || "1234",
    };

    // תמיד להגדיר clubId אם זה לא מנהל
    if (clubId) {
      userData.clubId = clubId;
    }

    console.log(`[createUser] Creating user with data:`, {
      name: userData.name,
      isAdmin: userData.isAdmin,
      clubId: userData.clubId,
      hasPassword: !!userData.password,
    });

    const userResult = await User.create(userData);
    // User.create can return an array or a single document, but we're passing a single object
    const user = Array.isArray(userResult)
      ? userResult[0]
      : (userResult as any);

    console.log(`[createUser] User created successfully:`, {
      userId: user._id.toString(),
      name: user.name,
    });

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/admin/users");

    // Return serializable object using toPlainObject
    return toPlainObject(user);
  } catch (error: any) {
    console.error("[createUser] Error creating user:", error);
    console.error("[createUser] Error details:", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    throw error;
  }
}

export async function createGame(
  playerIds: string[],
  initialBuyIns: Record<string, number>,
  clubId?: string
) {
  await connectDB();

  // בדיקה במוד קופה משותפת - האם יש כסף מוטען ושהסכום מספיק
  if (clubId) {
    const club = await Club.findById(clubId);
    if (club?.gameMode === "shared_bankroll") {
      const clubBankroll = await ClubBankroll.findOne({ clubId });
      if (!clubBankroll) {
        throw new Error("קופה משותפת לא נמצאה. נא ליצור קופה משותפת תחילה.");
      }

      for (const playerId of playerIds) {
        const user = await User.findById(playerId);
        if (!user) throw new Error(`שחקן ${playerId} לא נמצא`);

        const playerBankroll = clubBankroll.players.find(
          (p) => p.userId.toString() === playerId
        );
        const currentBankroll = playerBankroll?.balance || 0;

        // במצב קופה משותפת - לא ניתן להוסיף שחקן ללא כסף מוטען
        if (currentBankroll === 0) {
          throw new Error(
            `לא ניתן להוסיף את ${user.name} למשחק במצב קופה משותפת ללא כסף מוטען. נא להטעין כסף לשחקן תחילה.`
          );
        }

        const initialBuyIn = initialBuyIns[playerId] || 0;
        // אם מנסים להכניס כסף ראשוני, צריך לבדוק שיש מספיק
        if (initialBuyIn > 0) {
          if (initialBuyIn > currentBankroll) {
            throw new Error(
              `לשחקן ${
                user.name
              } אין מספיק זיטונים בקופה. יתרה נוכחית: ${currentBankroll.toLocaleString()} זיטונים, נדרש: ${initialBuyIn.toLocaleString()} זיטונים. ניתן להכניס עד ${currentBankroll.toLocaleString()} זיטונים.`
            );
          }
        }
      }
    }
  }

  // Deactivate any currently active games for this club
  const deactivateQuery: any = { isActive: true };
  if (clubId) {
    deactivateQuery.clubId = clubId;
  }
  await GameSession.updateMany(deactivateQuery, { isActive: false });

  const players = playerIds.map((id) => ({
    userId: new mongoose.Types.ObjectId(id),
    totalApprovedBuyIn: initialBuyIns[id] || 0,
    buyInRequests: initialBuyIns[id]
      ? [
          {
            amount: initialBuyIns[id],
            status: "approved" as const,
            timestamp: new Date(),
            isInitial: true,
            addedBy: "admin" as const,
          },
        ]
      : [],
    cashOut: 0,
    netProfit: 0,
    isCashedOut: false,
  }));

  // קביעת מצב הקופה המשותפת לפי מצב המועדון
  let isSharedBankroll = false;
  if (clubId) {
    const club = await Club.findById(clubId).select("gameMode").lean();
    isSharedBankroll = club?.gameMode === "shared_bankroll";
  }

  const gameData: any = {
    players,
    isActive: true,
    isSharedBankroll, // שמירת מצב הקופה המשותפת במשחק
  };
  if (clubId) {
    gameData.clubId = clubId;
  }
  const game = await GameSession.create(gameData);

  revalidatePath("/");
  return JSON.parse(JSON.stringify(game));
}

export async function getActiveGame(clubId?: string) {
  await connectDB();
  const query: any = { isActive: true };
  if (clubId) {
    query.clubId = clubId;
  }
  const game = await GameSession.findOne(query)
    .populate("players.userId")
    .lean();

  if (!game) {
    return null;
  }

  // אם זה מוד קופה משותפת, נטען את היתרות מהקופה המשותפת
  if (clubId && game.players) {
    const club = await Club.findById(clubId).lean();
    if (club?.gameMode === "shared_bankroll") {
      const clubBankroll = await ClubBankroll.findOne({ clubId }).lean();
      if (clubBankroll) {
        // עדכון bankroll לכל שחקן מה-ClubBankroll
        game.players.forEach((player: any) => {
          if (player.userId) {
            // אחרי populate, userId הוא אובייקט User עם _id
            const userIdString =
              player.userId._id?.toString() || player.userId.toString();

            const playerBankroll = clubBankroll.players.find(
              (p: any) => p.userId.toString() === userIdString
            );

            // עדכון bankroll על האובייקט User
            player.userId.bankroll = playerBankroll?.balance || 0;
          }
        });
      }
    }
  }

  return JSON.parse(JSON.stringify(game));
}

export async function getGameById(id: string) {
  await connectDB();
  const game = await GameSession.findById(id)
    .populate("players.userId")
    .populate("settlementTransfers.payerId")
    .populate("settlementTransfers.receiverId")
    .lean();
  return JSON.parse(JSON.stringify(game));
}

export async function requestBuyIn(
  gameId: string,
  userId: string,
  amount: number
) {
  await connectDB();
  const game = await GameSession.findById(gameId);
  if (!game) throw new Error("Game not found");

  const player = game.players.find((p) => {
    const playerId = p.userId._id
      ? p.userId._id.toString()
      : p.userId.toString();
    return playerId === userId;
  });
  if (!player) throw new Error("Player not found in this game");

  // בדיקה במוד קופה משותפת - האם יש כסף מוטען ושהסכום הכולל לא עולה על המוטען
  const isSharedBankroll =
    game.isSharedBankroll ||
    (game.clubId &&
      (await Club.findById(game.clubId))?.gameMode === "shared_bankroll");

  if (isSharedBankroll && game.clubId) {
    const clubBankroll = await ClubBankroll.findOne({ clubId: game.clubId });
    if (!clubBankroll) {
      throw new Error("קופה משותפת לא נמצאה");
    }

    const playerBankroll = clubBankroll.players.find(
      (p) => p.userId.toString() === userId
    );
    const currentBankroll = playerBankroll?.balance || 0;
    const totalAfterRequest = (player.totalApprovedBuyIn || 0) + amount;

    // בדיקה שהסכום הכולל (כולל הכניסות הקודמות) לא עולה על הכסף המוטען
    if (totalAfterRequest > currentBankroll) {
      throw new Error(
        `אין מספיק זיטונים בקופה. יתרה נוכחית: ${currentBankroll.toLocaleString()} זיטונים, סכום כולל מבוקש: ${totalAfterRequest.toLocaleString()} זיטונים. ניתן להכניס עד ${currentBankroll.toLocaleString()} זיטונים בסך הכל.`
      );
    }
  }

  player.buyInRequests.push({
    amount,
    status: "pending",
    timestamp: new Date(),
    isInitial: false,
    addedBy: "user",
  });

  await game.save();

  // שליחת מייל למנהל על הבקשה החדשה
  try {
    const user = await User.findById(userId);
    if (user) {
      // קבלת מייל האדמין מהמועדון
      let adminEmail: string | undefined;
      if (game.clubId) {
        const club = await Club.findById(game.clubId)
          .select("adminEmail")
          .lean();
        adminEmail = club?.adminEmail;
        console.log(
          `[requestBuyIn] Club ID: ${game.clubId}, Admin email from DB: ${
            adminEmail || "undefined/null"
          }`
        );
      } else {
        console.log(`[requestBuyIn] No clubId found in game`);
      }
      console.log(
        `[requestBuyIn] Calling sendBuyInRequestEmail - User: ${user.name}, Amount: ${amount}`
      );
      await sendBuyInRequestEmail(user.name, amount, adminEmail);
      console.log(`[requestBuyIn] Email send completed`);
    } else {
      console.log(`[requestBuyIn] User not found, skipping email send`);
    }
  } catch (error: any) {
    // לא נזרוק שגיאה כדי לא לעצור את תהליך הבקשה
    console.error("[requestBuyIn] Error sending buy-in request email:", error);
    console.error(`[requestBuyIn] Error details:`, {
      message: error?.message,
      stack: error?.stack,
    });
  }

  revalidatePath(`/game/${gameId}`);
  revalidatePath("/admin");
}

export async function approveRequest(
  gameId: string,
  userId: string,
  requestId: string
) {
  await connectDB();
  const game = await GameSession.findById(gameId);
  if (!game) throw new Error("Game not found");

  const player = game.players.find((p) => {
    const playerId = p.userId._id
      ? p.userId._id.toString()
      : p.userId.toString();
    return playerId === userId;
  });
  if (!player) throw new Error("Player not found");

  const request = player.buyInRequests.find(
    (r: any) => r._id.toString() === requestId
  );
  if (!request) throw new Error("Request not found");

  if (request.status !== "pending") return;

  // בדיקה במוד קופה משותפת - האם יש כסף מוטען ושהסכום הכולל לא עולה על המוטען
  const isSharedBankroll =
    game.isSharedBankroll ||
    (game.clubId &&
      (await Club.findById(game.clubId))?.gameMode === "shared_bankroll");

  if (isSharedBankroll && game.clubId) {
    const clubBankroll = await ClubBankroll.findOne({ clubId: game.clubId });
    if (!clubBankroll) {
      throw new Error("קופה משותפת לא נמצאה");
    }

    const playerBankroll = clubBankroll.players.find(
      (p) => p.userId.toString() === userId
    );
    const currentBankroll = playerBankroll?.balance || 0;
    const totalAfterApproval =
      (player.totalApprovedBuyIn || 0) + request.amount;

    // בדיקה שהסכום הכולל (כולל הכניסות הקודמות) לא עולה על הכסף המוטען
    if (totalAfterApproval > currentBankroll) {
      throw new Error(
        `אין מספיק זיטונים בקופה. יתרה נוכחית: ${currentBankroll.toLocaleString()} זיטונים, סכום כולל מבוקש: ${totalAfterApproval.toLocaleString()} זיטונים. ניתן לאשר עד ${currentBankroll.toLocaleString()} זיטונים בסך הכל.`
      );
    }
  }

  request.status = "approved";
  player.totalApprovedBuyIn += request.amount;

  await game.save();
  revalidatePath("/admin");
}

export async function rejectRequest(
  gameId: string,
  userId: string,
  requestId: string
) {
  await connectDB();
  const game = await GameSession.findById(gameId);
  if (!game) throw new Error("Game not found");

  const player = game.players.find((p) => {
    const playerId = p.userId._id
      ? p.userId._id.toString()
      : p.userId.toString();
    return playerId === userId;
  });
  if (!player) throw new Error("Player not found");

  const request = player.buyInRequests.find(
    (r: any) => r._id.toString() === requestId
  );
  if (!request) throw new Error("Request not found");

  request.status = "rejected";

  await game.save();
  revalidatePath("/admin");
}

export async function adminAddBuyIn(
  gameId: string,
  userId: string,
  amount: number
) {
  await connectDB();
  const game = await GameSession.findById(gameId);
  if (!game) throw new Error("Game not found");

  const player = game.players.find((p) => {
    const playerId = p.userId._id
      ? p.userId._id.toString()
      : p.userId.toString();
    return playerId === userId;
  });
  if (!player) throw new Error("Player not found");

  // בדיקה במוד קופה משותפת - האם יש כסף מוטען ושהסכום הכולל לא עולה על המוטען
  const isSharedBankroll =
    game.isSharedBankroll ||
    (game.clubId &&
      (await Club.findById(game.clubId))?.gameMode === "shared_bankroll");

  if (isSharedBankroll && game.clubId) {
    const clubBankroll = await ClubBankroll.findOne({ clubId: game.clubId });
    if (!clubBankroll) {
      throw new Error("קופה משותפת לא נמצאה");
    }

    const playerBankroll = clubBankroll.players.find(
      (p) => p.userId.toString() === userId
    );
    const currentBankroll = playerBankroll?.balance || 0;
    const alreadyInGame = player.totalApprovedBuyIn || 0;
    const totalAfterAdd = alreadyInGame + amount;
    const availableToAdd = currentBankroll - alreadyInGame;

    // בדיקה שהסכום הכולל (כולל הכניסות הקודמות) לא עולה על הכסף המוטען
    if (totalAfterAdd > currentBankroll) {
      const user = await User.findById(userId);
      const userName = user?.name || "השחקן";
      throw new Error(
        `אין מספיק זיטונים בקופה המשותפת עבור ${userName}. יתרה בקופה: ${currentBankroll.toLocaleString()} זיטונים, כבר במשחק: ${alreadyInGame.toLocaleString()} זיטונים, ניתן להוסיף עד ${availableToAdd.toLocaleString()} זיטונים נוספים.`
      );
    }
  }

  // Create an approved request record for tracking
  player.buyInRequests.push({
    amount,
    status: "approved",
    timestamp: new Date(),
    isInitial: false,
    addedBy: "admin",
  });

  player.totalApprovedBuyIn += amount;

  await game.save();
  revalidatePath("/admin");
}

export async function cancelBuyIn(
  gameId: string,
  userId: string,
  requestId: string
) {
  await connectDB();
  const game = await GameSession.findById(gameId);
  if (!game) throw new Error("Game not found");

  const player = game.players.find((p) => {
    const playerId = p.userId._id
      ? p.userId._id.toString()
      : p.userId.toString();
    return playerId === userId;
  });
  if (!player) throw new Error("Player not found");

  const request = player.buyInRequests.find(
    (r: any) => r._id.toString() === requestId
  );
  if (!request) throw new Error("Request not found");

  if (request.status !== "approved") {
    throw new Error("Can only cancel approved buy-ins");
  }

  // הסרת הכניסה מה-totalApprovedBuyIn
  player.totalApprovedBuyIn -= request.amount;
  if (player.totalApprovedBuyIn < 0) {
    player.totalApprovedBuyIn = 0;
  }

  // מחיקת הבקשה מהרשימה
  player.buyInRequests = player.buyInRequests.filter(
    (r: any) => r._id.toString() !== requestId
  );

  await game.save();
  revalidatePath("/admin");
  revalidatePath(`/game/${gameId}`);
}

export async function removePlayerFromGame(gameId: string, userId: string) {
  await connectDB();
  const game = await GameSession.findById(gameId);
  if (!game) throw new Error("Game not found");

  if (!game.isActive) {
    throw new Error("Can only remove players from active games");
  }

  // הסרת השחקן מהמשחק
  game.players = game.players.filter((p: any) => {
    const playerId = p.userId._id
      ? p.userId._id.toString()
      : p.userId.toString();
    return playerId !== userId;
  });

  await game.save();
  revalidatePath("/admin");
  revalidatePath(`/game/${gameId}`);
}

export async function endGame(
  gameId: string,
  cashOutData: Record<string, number>
) {
  await connectDB();
  const game = await GameSession.findById(gameId).populate("players.userId");
  if (!game) throw new Error("Game not found");

  // בדיקה שהמשחק עדיין פעיל - אם לא, לא נעדכן globalBalance שוב
  if (!game.isActive) {
    console.warn(
      `Game ${gameId} is already inactive, skipping globalBalance update`
    );
  }

  // חישוב סך הקופה
  const totalChipsInPot = game.players.reduce(
    (sum: number, p: any) => sum + (p.totalApprovedBuyIn || 0),
    0
  );

  // בדיקה שכל השחקנים הוזן להם cashOut
  // שינוי לוגיקה: אין צורך שכולם יזינו, מי שלא הזין נחשב כ-0 אם הסכום תואם
  const playersWithoutCashOut: any[] = [];
  game.players.forEach((player: any) => {
    const playerId = player.userId._id
      ? player.userId._id.toString()
      : player.userId.toString();
    const cashOut = cashOutData[playerId];

    if (!player.isCashedOut && (cashOut === undefined || cashOut === null)) {
      // לא הזינו עבורו ערך
    }
  });

  // חישוב סך ה-cashOut כולל שחקנים שכבר יצאו
  let totalCashOut = 0;

  // 1. שחקנים שיצאו כבר
  game.players.forEach((p: any) => {
    if (p.isCashedOut) {
      totalCashOut += p.cashOut || 0;
    }
  });

  // 2. שחקנים שעדיין במשחק - סכום מהטופס (מי שחסר נחשב 0)
  game.players.forEach((p: any) => {
    if (p.isCashedOut) return;
    const playerId = p.userId._id
      ? p.userId._id.toString()
      : p.userId.toString();
    const val = cashOutData[playerId];
    totalCashOut += Number(val) || 0;
  });

  // בדיקה שסכום ה-cashOut לא עולה על הקופה (אבל יכול להיות נמוך ממנה)
  if (totalCashOut > totalChipsInPot) {
    throw new Error(
      `סכום ה-cashOut (${totalCashOut.toLocaleString()} זיטונים) עולה על סך הקופה (${totalChipsInPot.toLocaleString()} זיטונים).`
    );
  }

  // אם הסכום נמוך מהקופה - רק אזהרה אבל לא מונע סיום
  if (totalCashOut < totalChipsInPot) {
    const difference = totalChipsInPot - totalCashOut;
    console.warn(
      `CashOut (${totalCashOut}) is lower than pot (${totalChipsInPot}). Difference: ${difference} chips. This is allowed - chips may have been lost or not sold.`
    );
  }

  // עדכון cashOut ו-netProfit לכל השחקנים
  game.players.forEach((player: any) => {
    // userId הוא User document (populated), אז נשתמש ב-userId._id.toString()
    // זה תמיד מחזיר את ה-ID כש-string
    const playerId = player.userId._id
      ? player.userId._id.toString()
      : player.userId.toString();

    // אם השחקן כבר יצא, נשאיר את ה-cashOut שלו כמו שהוא
    if (player.isCashedOut) {
      // עדכון netProfit גם לשחקנים שיצאו מוקדם
      player.netProfit =
        (player.cashOut || 0) - (player.totalApprovedBuyIn || 0);
      return;
    }

    // שחקנים שעדיין במשחק - עדכון מה-cashOutData
    const cashOut = cashOutData[playerId];
    // שימוש ב-Number() עם בדיקה מפורשת ל-null/undefined כדי לתמוך גם ב-0 כערך תקין
    const cashOutValue =
      cashOut === undefined || cashOut === null ? 0 : Number(cashOut);

    player.cashOut = cashOutValue;
    player.netProfit = cashOutValue - (player.totalApprovedBuyIn || 0);
  });

  game.isActive = false;
  await game.save();

  // בדיקת מוד המשחק של המועדון
  const club = await Club.findById(game.clubId);
  const isSharedBankrollMode = club?.gameMode === "shared_bankroll";

  // עדכון יתרה לכל השחקנים לפי ה-netProfit שלהם
  // במוד קופה משותפת: עדכון bankroll
  // במוד רגיל: עדכון globalBalance
  for (const player of game.players) {
    const userId = player.userId._id ? player.userId._id : player.userId;
    const netProfit = player.netProfit || 0;

    if (netProfit !== 0) {
      if (isSharedBankrollMode) {
        // מוד קופה משותפת - עדכון bankroll
        await updateBankrollAfterGame(userId.toString(), gameId, netProfit);
        console.log(
          `Updated bankroll for player ${userId}: ${netProfit} chips (shared bankroll mode)`
        );
      } else {
        // מוד רגיל - עדכון globalBalance
        const balanceChange = chipsToShekels(netProfit); // המרה לשקלים (100 זיטונים = 1 שקל)
        const updatedUser = await User.findByIdAndUpdate(
          userId,
          { $inc: { globalBalance: balanceChange } },
          { new: true }
        );
        console.log(
          `Updated globalBalance for player ${updatedUser?.name || userId}: ` +
            `${balanceChange} ₪ (netProfit: ${netProfit} chips, new balance: ${
              updatedUser?.globalBalance || 0
            } ₪)`
        );
      }
    }
  }

  // חישוב אוטומטי של ההתחשבנות אחרי סיום המשחק
  // חשוב: אם יש שגיאה, המשחק כבר נשמר כלא פעיל, רק ההתחשבנות לא תישמר
  try {
    // המרת זיטונים לשקלים לפני חישוב ההתחשבנות (100 זיטונים = 1 שקל)
    // משתמשים ב-game שכבר מעודכן עם netProfit
    const balances = game.players.map((p: any) => {
      const netProfit = p.netProfit || 0;
      const balanceInShekels = chipsToShekels(netProfit);
      const userId = p.userId as any;
      // userId הוא User document (populated), אז נשתמש ב-userId._id.toString()
      const playerId = userId._id ? userId._id.toString() : userId.toString();
      return {
        playerId: playerId,
        balance: balanceInShekels,
        playerName: userId.name || "Unknown",
        netProfitChips: netProfit,
      };
    });

    // Verify sum is zero (or close to it)
    const sum = balances.reduce((acc, curr) => acc + curr.balance, 0);
    console.log("Automatic settlement calculation:", {
      gameId: gameId,
      sum,
      balances: balances.map((b) => ({
        player: b.playerName,
        netProfitChips: b.netProfitChips,
        balanceShekels: b.balance,
      })),
    });

    // אם הסכום שלילי (cashOut נמוך מהקופה) - זה בסדר, מעגלים למטה
    // אם הסכום חיובי (cashOut גבוה מהקופה) - זה שגיאה
    if (sum > 0.01) {
      console.warn(
        `Game ${gameId}: Sum of net profits is positive (cashOut > pot):`,
        sum,
        "- skipping automatic settlement calculation. Game ended successfully but settlement not calculated."
      );
      // המשחק כבר נשמר כלא פעיל, רק ההתחשבנות לא תישמר
    } else {
      // אם הסכום שלילי או קרוב לאפס - חשב את ההעברות
      // הסכום השלילי מייצג זיטונים שלא חולקו (מעגלים למטה)
      if (sum < -0.01) {
        console.log(
          `Game ${gameId}: Sum is negative (${sum.toFixed(
            2
          )}), meaning cashOut < pot. This is allowed (rounding down).`
        );
      }

      const transfers = calculateSettlements(balances);
      console.log(`Game ${gameId}: Calculated transfers:`, transfers);

      // עדכון המשחק עם ההעברות - כל ההתחשבנות משויכת למשחק הספציפי הזה
      game.settlementTransfers = transfers.map((t) => ({
        payerId: new mongoose.Types.ObjectId(t.payerId),
        receiverId: new mongoose.Types.ObjectId(t.receiverId),
        amount: t.amount, // amount בשקלים
      }));

      await game.save();
      console.log(`Game ${gameId}: Settlement saved successfully`);
    }
  } catch (error) {
    console.error(
      `Game ${gameId}: Error calculating automatic settlement:`,
      error
    );
    // לא נזרוק שגיאה כדי לא לעצור את סיום המשחק
    // המשחק כבר נשמר כלא פעיל עם כל הנתונים (cashOut, netProfit)
    // רק ההתחשבנות לא תישמר, אבל המשתמש יראה את הסיכום הבסיסי
  }

  revalidatePath("/admin");
}

export async function cashOutPlayer(
  gameId: string,
  userId: string,
  amount: number
) {
  await connectDB();
  const game = await GameSession.findById(gameId);
  if (!game) throw new Error("Game not found");

  // חישוב סך הקופה במשחק הספציפי
  const totalChipsInPot = game.players.reduce(
    (sum: number, p: any) => sum + (p.totalApprovedBuyIn || 0),
    0
  );

  const player = game.players.find((p) => {
    const playerId = p.userId._id
      ? p.userId._id.toString()
      : p.userId.toString();
    return playerId === userId;
  });
  if (!player) throw new Error("Player not found");

  // וידוא ש-amount הוא מספר תקין
  const cashOutValue = Number(amount) || 0;
  const buyInValue = Number(player.totalApprovedBuyIn) || 0;

  // חישוב סך ה-cashOut שכבר הוזן (רק משחקנים שכבר יצאו, לא כולל השחקן הנוכחי אם הוא כבר יצא)
  const totalCashOut = game.players.reduce((sum: number, p: any) => {
    // דלג על השחקן הנוכחי אם הוא כבר יצא (נעדכן אותו אחר כך)
    const playerId = p.userId._id
      ? p.userId._id.toString()
      : p.userId.toString();
    if (playerId === userId && p.isCashedOut) {
      return sum; // לא נכלול את ה-cashOut הישן שלו
    }
    // רק שחקנים שכבר יצאו (isCashedOut = true)
    if (p.isCashedOut) {
      return sum + (p.cashOut || 0);
    }
    return sum;
  }, 0);

  // חישוב כמה זיטונים נשארו בקופה (כולל ה-cashOut החדש של השחקן הנוכחי)
  const remainingChips = totalChipsInPot - totalCashOut;

  // בדיקה שהסכום לא עולה על מה שנשאר בקופה
  if (cashOutValue > remainingChips) {
    throw new Error(
      `לא ניתן לתת יותר מ-${remainingChips.toLocaleString()} זיטונים (נותרו בקופה). סך הקופה: ${totalChipsInPot.toLocaleString()} זיטונים`
    );
  }

  // אם השחקן כבר יצא, מאפשרים עדכון (לתיקון שגיאות)
  // אם לא יצא, מגדירים אותו כיצא
  player.cashOut = cashOutValue;
  player.netProfit = cashOutValue - buyInValue;
  if (!player.isCashedOut) {
    player.isCashedOut = true;
  }

  await game.save();

  // הערה: במצב קופה משותפת, יציאה מהמשחק (cashOut) לא משפיעה על הקופה המשותפת
  // הקופה תתעדכן רק בסיום המשחק (endGame) לפי הרווח/הפסד הסופי
  // משיכת כסף מהקופה (withdrawFromBankroll) היא הפעולה היחידה שמורידה מהקופה

  revalidatePath("/admin");
}

export async function cancelCashOut(gameId: string, userId: string) {
  await connectDB();
  const game = await GameSession.findById(gameId);
  if (!game) throw new Error("Game not found");

  const player = game.players.find((p) => {
    const playerId = p.userId._id
      ? p.userId._id.toString()
      : p.userId.toString();
    return playerId === userId;
  });
  if (!player) throw new Error("Player not found");

  if (!player.isCashedOut) {
    throw new Error("Player has not cashed out");
  }

  // ביטול יציאה - החזרת השחקן למשחק
  player.isCashedOut = false;
  player.cashOut = 0;
  player.netProfit = 0;

  await game.save();
  revalidatePath("/admin");
  revalidatePath(`/game/${gameId}`);
}

export async function calculateSettlementAction(gameId: string) {
  await connectDB();
  const game = await GameSession.findById(gameId).populate("players.userId");
  if (!game) throw new Error("Game not found");

  // בדיקה שכל השחקנים יש להם cashOut (יכול להיות 0 אם הפסיד הכל)
  // לא צריך לבדוק אם cashOut > 0 כי שחקן יכול להפסיד הכל
  const playersWithoutCashOut = game.players.filter((p: any) => {
    return p.cashOut === undefined || p.cashOut === null;
  });
  if (playersWithoutCashOut.length > 0) {
    throw new Error(
      `יש ${playersWithoutCashOut.length} שחקנים שלא הוזן להם cashOut סופי. נא להזין את כל ה-cashOut לפני החישוב (0 אם הפסיד הכל).`
    );
  }

  // המרת זיטונים לשקלים לפני חישוב ההתחשבנות (1000 זיטונים = 1 שקל)
  const balances = game.players.map((p: any) => {
    const netProfit = p.netProfit || 0;
    const balanceInShekels = chipsToShekels(netProfit);
    const userId = p.userId as any;
    // userId הוא User document (populated), אז נשתמש ב-userId._id.toString()
    const playerId = userId._id ? userId._id.toString() : userId.toString();
    return {
      playerId: playerId,
      balance: balanceInShekels,
      playerName: userId.name || "Unknown",
      netProfitChips: netProfit,
    };
  });

  // Verify sum is zero (or close to it)
  const sum = balances.reduce((acc, curr) => acc + curr.balance, 0);
  console.log("Manual settlement calculation:", {
    sum,
    balances: balances.map((b) => ({
      player: b.playerName,
      netProfitChips: b.netProfitChips,
      balanceShekels: b.balance,
    })),
  });

  // אם הסכום שלילי (cashOut נמוך מהקופה) - זה בסדר, מעגלים למטה
  // אם הסכום חיובי (cashOut גבוה מהקופה) - זה שגיאה
  if (sum > 0.01) {
    // This might happen if inputs are wrong
    console.warn("Sum of net profits is positive (cashOut > pot):", sum);
    throw new Error(
      `סכום הרווחים/הפסדים לא מאוזן: ${sum.toFixed(
        2
      )}. נא לבדוק את ה-cashOut שהוזנו.`
    );
  }

  // אם הסכום שלילי (cashOut < pot) - זה בסדר, נחשב את ההתחשבנות
  // ההפרש מייצג זיטונים שלא חולקו (מעגלים למטה)
  if (sum < -0.01) {
    console.log(
      `Sum is negative (${sum.toFixed(
        2
      )}), meaning cashOut < pot. This is allowed (rounding down).`
    );
  }

  const transfers = calculateSettlements(balances);
  console.log("Calculated transfers:", transfers);

  game.settlementTransfers = transfers.map((t) => ({
    payerId: new mongoose.Types.ObjectId(t.payerId),
    receiverId: new mongoose.Types.ObjectId(t.receiverId),
    amount: t.amount, // amount בשקלים
  }));

  await game.save();
  revalidatePath("/admin");
  return JSON.parse(JSON.stringify(transfers));
}

// finalizeGame removed - התחשבנות רק לפי משחק ספציפי, ללא מאזן גלובלי

export async function getUnsettledGame() {
  await connectDB();
  // מחפש משחקים לא פעילים שעדיין לא מסודרו (יש להם settlementTransfers או לא)
  const game = await GameSession.findOne({ isActive: false })
    .populate("players.userId")
    .populate("settlementTransfers.payerId")
    .populate("settlementTransfers.receiverId")
    .sort({ date: -1 })
    .lean();
  return JSON.parse(JSON.stringify(game));
}

export async function login(formData: FormData) {
  const name = formData.get("name");
  const password = formData.get("password");

  if (name === "admin" && password === "poker123") {
    (await cookies()).set("admin_session", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });
    return { success: true };
  }
  return { success: false };
}

export async function logoutAdmin() {
  (await cookies()).delete("admin_session");
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function logoutPlayer() {
  (await cookies()).delete("player_session");
  revalidatePath("/");
}

export async function getGameHistory(clubId?: string) {
  await connectDB();
  const query: any = { isActive: false };
  if (clubId) {
    query.clubId = clubId;
  }
  // מחזיר את כל המשחקים הלא פעילים (ללא תלות ב-isSettled)
  const games = await GameSession.find(query)
    .sort({ date: -1 })
    .populate("players.userId")
    .populate("settlementTransfers.payerId")
    .populate("settlementTransfers.receiverId")
    .lean();
  return JSON.parse(JSON.stringify(games));
}

export async function addPlayerToGame(
  gameId: string,
  userId: string,
  initialBuyIn: number
) {
  try {
    // Convert gameId to string if it's an ObjectId
    const gameIdString =
      typeof gameId === "string"
        ? gameId
        : (gameId as any)?.toString() || String(gameId);
    const userIdString =
      typeof userId === "string"
        ? userId
        : (userId as any)?.toString() || String(userId);

    console.log(
      `[addPlayerToGame] Starting - GameId: ${gameIdString}, UserId: ${userIdString}, InitialBuyIn: ${initialBuyIn}`
    );

    await connectDB();

    const game = await GameSession.findById(gameIdString);
    if (!game) {
      console.error(`[addPlayerToGame] Game not found: ${gameIdString}`);
      throw new Error("Game not found");
    }

    if (!game.isActive) {
      console.error(`[addPlayerToGame] Game is not active: ${gameIdString}`);
      throw new Error("Game is not active");
    }

    console.log(
      `[addPlayerToGame] Game found - Active: ${game.isActive}, ClubId: ${game.clubId}`
    );

    // בדיקה במוד קופה משותפת - האם יש כסף מוטען ושהסכום מספיק
    const clubIdString = game.clubId
      ? typeof game.clubId === "string"
        ? game.clubId
        : game.clubId.toString()
      : null;
    let isSharedBankroll = game.isSharedBankroll;

    if (!isSharedBankroll && clubIdString) {
      const club = await Club.findById(clubIdString).lean();
      isSharedBankroll = club?.gameMode === "shared_bankroll";
      console.log(
        `[addPlayerToGame] Club check - ClubId: ${clubIdString}, GameMode: ${club?.gameMode}, IsSharedBankroll: ${isSharedBankroll}`
      );
    }

    if (isSharedBankroll && clubIdString) {
      console.log(
        `[addPlayerToGame] Checking ClubBankroll for clubId: ${clubIdString}`
      );
      const clubBankroll = await ClubBankroll.findOne({ clubId: clubIdString });
      if (!clubBankroll) {
        console.error(
          `[addPlayerToGame] ClubBankroll not found for clubId: ${clubIdString}`
        );
        throw new Error("קופה משותפת לא נמצאה");
      }

      const playerBankroll = clubBankroll.players.find(
        (p) => p.userId.toString() === userIdString
      );
      const currentBankroll = playerBankroll?.balance || 0;

      console.log(
        `[addPlayerToGame] Bankroll check - UserId: ${userIdString}, CurrentBankroll: ${currentBankroll}, InitialBuyIn: ${initialBuyIn}`
      );

      // אם אין כסף מוטען בכלל, לא ניתן להוסיף את השחקן
      if (currentBankroll === 0) {
        // קבלת שם השחקן להודעה
        const user = await User.findById(userIdString);
        const userName = user?.name || "השחקן";

        throw new Error(
          `❌ לא ניתן להוסיף את ${userName} למשחק\n\n` +
            `הסיבה: אין יתרה בקופה המשותפת\n` +
            `יתרה נוכחית: 0 זיטונים\n\n` +
            `📝 פתרון: נא להטעין כסף לשחקן בקופה המשותפת דרך דף ניהול הקופה לפני הוספתו למשחק.`
        );
      }

      // בדיקה שהסכום המבוקש לא עולה על הכסף המוטען
      if (initialBuyIn > currentBankroll) {
        // קבלת שם השחקן להודעה
        const user = await User.findById(userIdString);
        const userName = user?.name || "השחקן";

        throw new Error(
          `❌ לא ניתן להוסיף את ${userName} למשחק\n\n` +
            `הסיבה: אין מספיק יתרה בקופה המשותפת\n` +
            `יתרה נוכחית: ${currentBankroll.toLocaleString()} זיטונים\n` +
            `סכום מבוקש: ${initialBuyIn.toLocaleString()} זיטונים\n` +
            `חסר: ${(
              initialBuyIn - currentBankroll
            ).toLocaleString()} זיטונים\n\n` +
            `📝 פתרון: נא להטעין כסף נוסף לשחקן בקופה המשותפת או להקטין את סכום הכניסה הראשונית.`
        );
      }
    }

    // Check if player already in game
    const existingPlayer = game.players.find((p: any) => {
      const playerId = p.userId._id
        ? p.userId._id.toString()
        : p.userId.toString();
      return playerId === userIdString;
    });

    if (existingPlayer) {
      console.error(
        `[addPlayerToGame] Player already in game - UserId: ${userIdString}`
      );
      throw new Error("Player already in game");
    }

    console.log(
      `[addPlayerToGame] Adding player to game - UserId: ${userIdString}, InitialBuyIn: ${initialBuyIn}`
    );

    // Add new player
    game.players.push({
      userId: new mongoose.Types.ObjectId(userIdString),
      totalApprovedBuyIn: initialBuyIn,
      buyInRequests:
        initialBuyIn > 0
          ? [
              {
                amount: initialBuyIn,
                status: "approved" as const,
                timestamp: new Date(),
                isInitial: true,
                addedBy: "admin" as const,
              },
            ]
          : [],
      cashOut: 0,
      netProfit: 0,
      isCashedOut: false,
    });

    await game.save();
    console.log(
      `[addPlayerToGame] Player added successfully - GameId: ${gameIdString}, UserId: ${userIdString}`
    );

    revalidatePath("/admin");
    revalidatePath("/admin/games");
    revalidatePath(`/game/${gameIdString}`);

    return { success: true };
  } catch (error: any) {
    console.error("[addPlayerToGame] Error:", error);
    console.error("[addPlayerToGame] Error details:", {
      message: error?.message,
      stack: error?.stack,
      gameId:
        typeof gameId === "string"
          ? gameId
          : (gameId as any)?.toString() || String(gameId),
      userId:
        typeof userId === "string"
          ? userId
          : (userId as any)?.toString() || String(userId),
      initialBuyIn,
    });
    throw error;
  }
}

export async function setPlayerPassword(userId: string, password: string) {
  await connectDB();
  // שמירת סיסמה כטקסט רגיל (ללא הצפנה)
  await User.findByIdAndUpdate(userId, { password: password });
  revalidatePath("/admin");
}

export async function playerLogin(name: string, password: string) {
  await connectDB();

  // בדוק אם יש club_session (חייב להיות מחובר למועדון)
  const clubSession = await getClubSession();
  if (!clubSession) {
    return {
      success: false,
      error: "נא להיכנס למועדון תחילה לפני התחברות כשחקן",
    };
  }

  // מצא משתמש עם השם והקלאב הנוכחי
  const user = await User.findOne({
    name: name.trim(),
    clubId: clubSession,
  });

  if (!user) {
    return {
      success: false,
      error: `שחקן עם השם "${name.trim()}" לא נמצא במועדון הנוכחי`,
    };
  }

  if (!user.password) {
    return { success: false, error: "נא להגדיר סיסמה תחילה" };
  }

  // השוואה ישירה של הסיסמה (ללא הצפנה)
  if (password !== user.password) {
    return { success: false, error: "סיסמה שגויה" };
  }

  // Set permanent session cookie
  (await cookies()).set("player_session", user._id.toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365 * 10, // 10 years
  });

  return { success: true, userId: user._id.toString() };
}

export async function getPlayerSession() {
  const sessionCookie = (await cookies()).get("player_session");
  if (!sessionCookie) return null;

  await connectDB();
  const user = await User.findById(sessionCookie.value).lean();
  if (!user) return null;

  const userData = JSON.parse(JSON.stringify(user));

  // אם יש clubId וזה מוד קופה משותפת, נטען את ה-bankroll מהקופה המשותפת
  if (user.clubId) {
    const club = await Club.findById(user.clubId).lean();
    if (club?.gameMode === "shared_bankroll") {
      const clubBankroll = await ClubBankroll.findOne({
        clubId: user.clubId,
      }).lean();
      if (clubBankroll) {
        const playerBankroll = clubBankroll.players.find(
          (p: any) => p.userId.toString() === user._id.toString()
        );
        userData.bankroll = playerBankroll?.balance || 0;
      } else {
        userData.bankroll = 0;
      }
    }
  }

  return userData;
}

// פונקציה לעדכון כל המשתמשים עם סיסמה 1234
export async function setAllUsersPasswordTo1234() {
  await connectDB();
  const result = await User.updateMany({}, { password: "1234" });
  revalidatePath("/admin");
  return { updated: result.modifiedCount };
}

export async function getClubSession(): Promise<string | null> {
  const sessionCookie = (await cookies()).get("club_session");
  return sessionCookie ? sessionCookie.value : null;
}

export async function getClub(clubId: string) {
  await connectDB();
  // טעינה ישירה ללא populate כדי לוודא שאנחנו מקבלים את הערך הנכון
  const club = await Club.findById(clubId)
    .select(
      "name managerId clubPassword chipsPerShekel gameMode adminEmail createdAt"
    )
    .lean();
  if (!club) return null;

  // טעינת managerId בנפרד אם צריך
  const managerId = club.managerId;

  // המרה ל-plain object כדי למנוע בעיות עם Client Components
  let clubData: any = toPlainObject(club);

  // המרת managerId ל-string אם זה ObjectId (לפני טעינת המנהל)
  const managerIdString = clubData.managerId?.toString() || clubData.managerId;

  // וידוא שה-gameMode קיים - אם לא, נשמור default במסד נתונים
  // זה חשוב למועדונים ישנים שלא נוצרו עם השדה
  if (
    !clubData.gameMode ||
    (clubData.gameMode !== "free" && clubData.gameMode !== "shared_bankroll")
  ) {
    console.log(
      `[getClub] Club ${clubId} missing gameMode field, adding default "shared_bankroll" to database`
    );
    // עדכון במסד נתונים - חשוב מאוד! מועדונים חדשים במצב קופה משותפת
    const updateResult = await Club.updateOne(
      { _id: clubId },
      { $set: { gameMode: "shared_bankroll" } },
      { runValidators: true }
    );
    console.log(
      `[getClub] Update result: matched=${updateResult.matchedCount}, modified=${updateResult.modifiedCount}`
    );

    // טעינה מחדש מהמסד נתונים כדי לוודא שהשדה נשמר
    const updatedClub = await Club.findById(clubId).select("gameMode").lean();
    if (updatedClub && updatedClub.gameMode) {
      clubData.gameMode = updatedClub.gameMode;
      console.log(
        `[getClub] Successfully added gameMode: ${clubData.gameMode}`
      );
    } else {
      clubData.gameMode = "shared_bankroll";
      console.log(`[getClub] Using fallback gameMode: shared_bankroll`);
    }
  }

  // אם זה מוד קופה משותפת, ניצור קופה משותפת אם לא קיימת
  if (clubData.gameMode === "shared_bankroll") {
    const existingBankroll = await ClubBankroll.findOne({ clubId }).lean();
    if (!existingBankroll) {
      // יצירת קופה משותפת חדשה
      await ClubBankroll.create({
        clubId,
        players: [],
        totalBalance: 0,
      });
    }
  }

  // טעינת managerId אם צריך - המרה ל-plain object
  if (managerId) {
    const manager = await User.findById(managerId).lean();
    if (manager) {
      // המרה ל-plain object כדי למנוע בעיות עם Client Components
      clubData.managerId = toPlainObject(manager);
    } else {
      // אם המנהל לא נמצא, נשמור רק את ה-ID
      clubData.managerId = managerIdString;
    }
  } else {
    // אם אין managerId, נשמור את ה-ID כ-string
    clubData.managerId = managerIdString;
  }

  // המרה סופית ל-plain object כדי למנוע בעיות עם Client Components
  return toPlainObject(clubData);
}

export async function getAllClubs() {
  await connectDB();
  const clubs = await Club.find({}).populate("managerId").lean();
  return JSON.parse(JSON.stringify(clubs));
}

export async function createClub(name: string, managerId: string) {
  await connectDB();
  const clubData = {
    name,
    managerId,
    gameMode: "shared_bankroll" as const, // כל מועדון חדש במצב קופה משותפת
  };

  console.log(
    "Creating club via action, data:",
    JSON.stringify(clubData, null, 2)
  );
  const club = await Club.create(clubData);

  // וידוא שהשדה נשמר
  const savedClub = await Club.findById(club._id);
  console.log("Club created via action, gameMode:", savedClub?.gameMode);

  if (!savedClub?.gameMode) {
    console.error("ERROR: gameMode not saved! Updating...");
    await Club.updateOne({ _id: club._id }, { gameMode: "shared_bankroll" });
    const updatedClub = await Club.findById(club._id);
    console.log("After update, gameMode:", updatedClub?.gameMode);
  }

  // יצירת קופה משותפת למועדון החדש
  await ClubBankroll.create({
    clubId: club._id,
    players: [],
    totalBalance: 0,
  });

  revalidatePath("/admin");
  return JSON.parse(JSON.stringify(club));
}

export async function setClubSession(clubId: string) {
  (await cookies()).set("club_session", clubId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365 * 10, // 10 years
  });
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function getUserClubs(userId: string) {
  await connectDB();
  const user = await User.findById(userId).lean();
  if (!user) return [];

  // Get clubs where user is a member (has clubId matching)
  const clubs = await Club.find({
    $or: [{ _id: user.clubId }, { managerId: userId }],
  })
    .populate("managerId")
    .lean();

  return JSON.parse(JSON.stringify(clubs));
}

export async function addPlayerToClub(userId: string, clubId: string) {
  await connectDB();
  await User.findByIdAndUpdate(userId, { clubId });
  revalidatePath("/admin");
}

export async function isClubManager(clubId: string, userId: string) {
  await connectDB();
  const club = await Club.findById(clubId).lean();
  if (!club) return false;
  return club.managerId.toString() === userId;
}

export async function getChipsPerShekel(clubId?: string): Promise<number> {
  await connectDB();
  if (!clubId) {
    const currentClubId = await getClubSession();
    if (!currentClubId) return 100; // default
    clubId = currentClubId;
  }
  const club = await Club.findById(clubId).select("chipsPerShekel").lean();
  return club?.chipsPerShekel || 100;
}

export async function getPlayerGameHistory(
  userId: string,
  clubId?: string
): Promise<any[]> {
  await connectDB();
  const query: any = { isActive: false };
  if (clubId) {
    query.clubId = clubId;
  }
  // מציאת כל המשחקים שבהם השחקן השתתף
  const games = await GameSession.find(query)
    .sort({ date: -1 })
    .populate("players.userId")
    .populate("settlementTransfers.payerId")
    .populate("settlementTransfers.receiverId")
    .lean();

  // סינון רק משחקים שבהם השחקן השתתף
  const playerGames = games.filter((game: any) =>
    game.players.some((p: any) => {
      const playerId = p.userId._id
        ? p.userId._id.toString()
        : p.userId.toString();
      return playerId === userId;
    })
  );

  return JSON.parse(JSON.stringify(playerGames));
}

// ========== קופה משותפת (Shared Bankroll) ==========

/**
 * בדיקה אם יש לשחקן מספיק זיטונים בקופה
 */
export async function checkBankrollSufficient(
  userId: string,
  requiredChips: number
): Promise<boolean> {
  await connectDB();
  const user = await User.findById(userId);
  if (!user) return false;
  return (user.bankroll || 0) >= requiredChips;
}

/**
 * קבלת או יצירת ClubBankroll למועדון
 */
async function getOrCreateClubBankroll(clubId: string) {
  await connectDB();
  let clubBankroll = await ClubBankroll.findOne({ clubId }).lean();

  if (!clubBankroll) {
    // יצירת קופה משותפת חדשה למועדון
    const newBankroll = await ClubBankroll.create({
      clubId,
      players: [],
      totalBalance: 0,
    });
    return newBankroll;
  }

  const foundBankroll = await ClubBankroll.findById(clubBankroll._id);
  if (!foundBankroll) {
    throw new Error("קופה משותפת לא נמצאה");
  }
  return foundBankroll;
}

/**
 * קבלת יתרה של שחקן בקופה המשותפת
 */
export async function getPlayerBankrollBalance(
  userId: string,
  clubId: string
): Promise<number> {
  await connectDB();
  const clubBankroll = await ClubBankroll.findOne({ clubId }).lean();
  if (!clubBankroll) return 0;

  const playerBankroll = clubBankroll.players.find(
    (p: any) => p.userId.toString() === userId
  );
  return playerBankroll?.balance || 0;
}

/**
 * הפקדת זיטונים לקופה משותפת (רכישה בשקלים)
 * במצב קופה משותפת: מוסיף כסף לקופה המשותפת של השחקן
 * הערה: הכנסת כסף למשחק לא מורידה מהקופה, רק בודקת שיש מספיק כסף
 */
export async function depositToBankroll(
  userId: string,
  amountInShekels: number
) {
  await connectDB();
  const user = await User.findById(userId);
  if (!user) throw new Error("שחקן לא נמצא");

  if (!user.clubId) {
    throw new Error("שחקן לא משויך למועדון");
  }

  const club = await Club.findById(user.clubId);
  if (!club) throw new Error("מועדון לא נמצא");

  // אם זה לא מוד קופה משותפת, נשתמש בלוגיקה הישנה
  if (club.gameMode !== "shared_bankroll") {
    const chipsPerShekel = await getChipsPerShekel(user.clubId.toString());
    const chipsAmount = amountInShekels * chipsPerShekel;

    user.bankroll = (user.bankroll || 0) + chipsAmount;
    user.totalDeposited = (user.totalDeposited || 0) + amountInShekels;

    // הוספת רשומה להיסטוריה
    if (!user.bankrollHistory) {
      user.bankrollHistory = [];
    }
    user.bankrollHistory.push({
      type: "deposit",
      amount: amountInShekels,
      date: new Date(),
      description: `הפקדה של ${amountInShekels.toFixed(
        2
      )} ₪ (${chipsAmount.toLocaleString()} זיטונים)`,
    });

    await user.save();
    revalidatePath("/profile");
    revalidatePath("/admin");
    revalidatePath("/admin/bankroll");
    return;
  }

  // מוד קופה משותפת - עבודה עם ClubBankroll
  const clubBankroll = await getOrCreateClubBankroll(user.clubId.toString());
  if (!clubBankroll) {
    throw new Error("קופה משותפת לא נמצאה");
  }
  const chipsPerShekel = await getChipsPerShekel(user.clubId.toString());
  const chipsAmount = amountInShekels * chipsPerShekel;

  // מציאת או יצירת יתרה לשחקן
  const playerIndex = clubBankroll.players.findIndex(
    (p) => p.userId.toString() === userId
  );

  if (playerIndex === -1) {
    // יצירת יתרה חדשה לשחקן
    clubBankroll.players.push({
      userId: new mongoose.Types.ObjectId(userId),
      balance: chipsAmount,
      totalDeposited: amountInShekels,
      totalWithdrawn: 0,
    });
  } else {
    // עדכון יתרה קיימת
    clubBankroll.players[playerIndex].balance += chipsAmount;
    clubBankroll.players[playerIndex].totalDeposited += amountInShekels;
  }

  // עדכון סך הכל בקופה
  clubBankroll.totalBalance += chipsAmount;

  await clubBankroll.save();

  // עדכון גם ב-User להיסטוריה (אופציונלי)
  if (!user.bankrollHistory) {
    user.bankrollHistory = [];
  }
  user.bankrollHistory.push({
    type: "deposit",
    amount: amountInShekels,
    date: new Date(),
    description: `הפקדה של ${amountInShekels.toFixed(
      2
    )} ₪ (${chipsAmount.toLocaleString()} זיטונים)`,
  });
  await user.save();

  revalidatePath("/profile");
  revalidatePath("/admin");
  revalidatePath("/admin/bankroll");
  revalidatePath("/");
}

/**
 * משיכת זיטונים מהקופה (המרה לשקלים)
 * במצב קופה משותפת: מוריד כסף מהקופה המשותפת של השחקן ומהקופה הכללית
 * הערה: זו הפעולה היחידה שמורידה מהקופה המשותפת (לא יציאה מהמשחק או סיום משחק)
 */
export async function withdrawFromBankroll(
  userId: string,
  amountInChips: number
) {
  await connectDB();
  const user = await User.findById(userId);
  if (!user) throw new Error("שחקן לא נמצא");

  if (!user.clubId) {
    throw new Error("שחקן לא משויך למועדון");
  }

  const club = await Club.findById(user.clubId);
  if (!club) throw new Error("מועדון לא נמצא");

  // אם זה לא מוד קופה משותפת, נשתמש בלוגיקה הישנה
  if (club.gameMode !== "shared_bankroll") {
    const currentBankroll = user.bankroll || 0;
    if (amountInChips > currentBankroll) {
      throw new Error("אין מספיק זיטונים בקופה");
    }

    const chipsPerShekel = await getChipsPerShekel(user.clubId.toString());
    const shekelsAmount = chipsToShekels(amountInChips, chipsPerShekel);

    user.bankroll = currentBankroll - amountInChips;
    user.totalWithdrawn = (user.totalWithdrawn || 0) + shekelsAmount;

    // הוספת רשומה להיסטוריה
    if (!user.bankrollHistory) {
      user.bankrollHistory = [];
    }
    user.bankrollHistory.push({
      type: "withdrawal",
      amount: amountInChips,
      date: new Date(),
      description: `משיכה של ${amountInChips.toLocaleString()} זיטונים (${shekelsAmount.toFixed(
        2
      )} ₪)`,
    });

    await user.save();
    revalidatePath("/profile");
    revalidatePath("/admin");
    return;
  }

  // מוד קופה משותפת - עבודה עם ClubBankroll
  const clubBankroll = await ClubBankroll.findOne({ clubId: user.clubId });
  if (!clubBankroll) {
    throw new Error("קופה משותפת לא נמצאה");
  }

  const playerIndex = clubBankroll.players.findIndex(
    (p) => p.userId.toString() === userId
  );

  if (playerIndex === -1) {
    throw new Error("לא נמצאה יתרה לשחקן בקופה המשותפת");
  }

  const playerBankroll = clubBankroll.players[playerIndex];
  if (playerBankroll.balance < amountInChips) {
    throw new Error("אין מספיק זיטונים בקופה");
  }

  const chipsPerShekel = await getChipsPerShekel(user.clubId.toString());
  const shekelsAmount = chipsToShekels(amountInChips, chipsPerShekel);

  // עדכון יתרה
  playerBankroll.balance -= amountInChips;
  playerBankroll.totalWithdrawn += shekelsAmount;

  // עדכון סך הכל בקופה
  clubBankroll.totalBalance -= amountInChips;

  await clubBankroll.save();

  // עדכון גם ב-User להיסטוריה
  if (!user.bankrollHistory) {
    user.bankrollHistory = [];
  }
  user.bankrollHistory.push({
    type: "withdrawal",
    amount: amountInChips,
    date: new Date(),
    description: `משיכה של ${amountInChips.toLocaleString()} זיטונים (${shekelsAmount.toFixed(
      2
    )} ₪)`,
  });
  await user.save();

  revalidatePath("/profile");
  revalidatePath("/admin");
  revalidatePath("/");
}

/**
 * בקשת טעינת כסף לקופה משותפת
 * יוצרת בקשה ושולחת מייל למנהל עם קישור לאישור
 */
export async function requestDeposit(amountInShekels: number) {
  await connectDB();
  const sessionCookie = (await cookies()).get("player_session");
  if (!sessionCookie) {
    throw new Error("נא להתחבר תחילה");
  }

  const user = await User.findById(sessionCookie.value);
  if (!user) {
    throw new Error("שחקן לא נמצא");
  }

  if (!user.clubId) {
    throw new Error("שחקן לא משויך למועדון");
  }

  const club = await Club.findById(user.clubId);
  if (!club) {
    throw new Error("מועדון לא נמצא");
  }

  if (club.gameMode !== "shared_bankroll") {
    throw new Error("בקשת טעינה זמינה רק במצב קופה משותפת");
  }

  if (amountInShekels <= 0) {
    throw new Error("נא להזין סכום תקין");
  }

  // יצירת בקשה חדשה
  const depositRequest = await DepositRequest.create({
    userId: user._id,
    clubId: user.clubId,
    amountInShekels,
    status: "pending",
  });

  // שליחת מייל למנהל
  try {
    console.log(
      `[requestDeposit] Preparing to send email - User: ${
        user.name
      }, Amount: ${amountInShekels}, RequestId: ${depositRequest._id.toString()}`
    );
    console.log(
      `[requestDeposit] Club admin email: ${club.adminEmail || "undefined"}`
    );
    await sendDepositRequestEmail(
      user.name,
      amountInShekels,
      depositRequest._id.toString(),
      club.adminEmail
    );
    console.log(`[requestDeposit] Email send completed`);
  } catch (error: any) {
    console.error(
      "[requestDeposit] Error sending deposit request email:",
      error
    );
    console.error(`[requestDeposit] Error details:`, {
      message: error?.message,
      stack: error?.stack,
    });
    // לא נזרוק שגיאה כדי לא לעצור את תהליך הבקשה
  }

  revalidatePath("/profile");
  return { success: true, requestId: depositRequest._id.toString() };
}

/**
 * קבלת בקשות טעינה ממתינות למועדון
 */
export async function getPendingDepositRequests(clubId: string) {
  await connectDB();
  const requests = await DepositRequest.find({
    clubId,
    status: "pending",
  })
    .populate("userId")
    .sort({ createdAt: -1 })
    .lean();
  return JSON.parse(JSON.stringify(requests));
}

/**
 * אישור בקשה לטעינת כסף
 */
export async function approveDepositRequest(requestId: string) {
  await connectDB();
  const depositRequest = await DepositRequest.findById(requestId);

  if (!depositRequest) {
    throw new Error("בקשה לא נמצאה");
  }

  if (depositRequest.status !== "pending") {
    throw new Error(
      `הבקשה כבר ${depositRequest.status === "approved" ? "אושרה" : "נדחתה"}`
    );
  }

  // אישור הבקשה וביצוע הטעינה
  depositRequest.status = "approved";
  depositRequest.approvedAt = new Date();
  await depositRequest.save();

  // ביצוע הטעינה
  await depositToBankroll(
    depositRequest.userId.toString(),
    depositRequest.amountInShekels
  );

  revalidatePath("/profile");
  revalidatePath("/admin");
  revalidatePath("/admin/bankroll");

  return { success: true };
}

/**
 * בקשת שחקן להצטרף למשחק פעיל
 * יוצרת בקשה ושולחת מייל למנהל
 */
export async function requestJoinGame(gameId: string, amount: number) {
  await connectDB();
  const sessionCookie = (await cookies()).get("player_session");
  if (!sessionCookie) {
    throw new Error("נא להתחבר תחילה");
  }

  const user = await User.findById(sessionCookie.value);
  if (!user) {
    throw new Error("שחקן לא נמצא");
  }

  if (!user.clubId) {
    throw new Error("שחקן לא משויך למועדון");
  }

  const game = await GameSession.findById(gameId);
  if (!game) {
    throw new Error("משחק לא נמצא");
  }

  if (!game.isActive) {
    throw new Error("המשחק לא פעיל");
  }

  // בדיקה שהשחקן לא כבר במשחק
  const existingPlayer = game.players.find((p: any) => {
    const playerId = p.userId._id
      ? p.userId._id.toString()
      : p.userId.toString();
    return playerId === user._id.toString();
  });

  if (existingPlayer) {
    throw new Error("אתה כבר משתתף במשחק זה");
  }

  // בדיקה במוד קופה משותפת - האם יש כסף מוטען ושהסכום מספיק
  const isSharedBankroll =
    game.isSharedBankroll ||
    (game.clubId &&
      (await Club.findById(game.clubId))?.gameMode === "shared_bankroll");

  if (isSharedBankroll && game.clubId) {
    const clubBankroll = await ClubBankroll.findOne({ clubId: game.clubId });
    if (!clubBankroll) {
      throw new Error("קופה משותפת לא נמצאה");
    }

    const playerBankroll = clubBankroll.players.find(
      (p) => p.userId.toString() === user._id.toString()
    );
    const currentBankroll = playerBankroll?.balance || 0;

    // אם אין כסף מוטען בכלל, לא ניתן לבקש להצטרף
    if (currentBankroll === 0) {
      throw new Error(
        "לא ניתן להצטרף למשחק במצב קופה משותפת ללא כסף מוטען. נא להטעין כסף תחילה."
      );
    }

    // בדיקה שהסכום המבוקש לא עולה על הכסף המוטען
    if (amount > currentBankroll) {
      throw new Error(
        `אין מספיק זיטונים בקופה. יתרה נוכחית: ${currentBankroll.toLocaleString()} זיטונים, נדרש: ${amount.toLocaleString()} זיטונים`
      );
    }
  }

  if (amount <= 0) {
    throw new Error("נא להזין סכום תקין");
  }

  // יצירת בקשה חדשה
  const joinRequest = await JoinGameRequest.create({
    userId: user._id,
    gameId: game._id,
    clubId: user.clubId,
    amount,
    status: "pending",
  });

  // שליחת מייל למנהל
  try {
    console.log(
      `[requestJoinGame] Preparing to send email - User: ${user.name}, Amount: ${amount}, GameId: ${gameId}`
    );
    const club = await Club.findById(user.clubId).lean();
    console.log(
      `[requestJoinGame] Club found: ${club ? "YES" : "NO"}, Admin email: ${
        club?.adminEmail || "undefined"
      }`
    );
    await sendJoinGameRequestEmail(user.name, amount, gameId, club?.adminEmail);
    console.log(`[requestJoinGame] Email send completed`);
  } catch (error: any) {
    console.error(
      "[requestJoinGame] Error sending join game request email:",
      error
    );
    console.error(`[requestJoinGame] Error details:`, {
      message: error?.message,
      stack: error?.stack,
    });
    // לא נזרוק שגיאה כדי לא לעצור את תהליך הבקשה
  }

  revalidatePath("/");
  revalidatePath(`/game/${gameId}`);
  return { success: true, requestId: joinRequest._id.toString() };
}

/**
 * קבלת בקשות הצטרפות ממתינות למשחק
 */
export async function getPendingJoinGameRequests(gameId: string) {
  await connectDB();
  const requests = await JoinGameRequest.find({
    gameId,
    status: "pending",
  })
    .populate("userId")
    .sort({ createdAt: -1 })
    .lean();
  return JSON.parse(JSON.stringify(requests));
}

/**
 * בדיקה אם יש בקשה ממתינה למשתמש ספציפי במשחק
 */
export async function getUserPendingJoinRequest(
  gameId: string,
  userId: string
) {
  await connectDB();
  const request = await JoinGameRequest.findOne({
    gameId,
    userId,
    status: "pending",
  })
    .populate("userId")
    .lean();
  return request ? JSON.parse(JSON.stringify(request)) : null;
}

/**
 * בדיקה אם יש בקשה ממתינה לכניסה נוספת למשתמש במשחק
 */
export async function getUserPendingBuyInRequest(
  gameId: string,
  userId: string
) {
  await connectDB();
  const game = await GameSession.findById(gameId).lean();
  if (!game) return null;

  const player = game.players.find((p: any) => {
    const playerId = p.userId._id
      ? p.userId._id.toString()
      : p.userId.toString();
    return playerId === userId;
  });

  if (!player) return null;

  // מציאת בקשה ממתינה
  const pendingRequest = player.buyInRequests?.find(
    (r: any) => r.status === "pending"
  );

  return pendingRequest ? JSON.parse(JSON.stringify(pendingRequest)) : null;
}

/**
 * אישור בקשה להצטרפות למשחק
 */
export async function approveJoinGameRequest(requestId: string) {
  await connectDB();
  const joinRequest = await JoinGameRequest.findById(requestId)
    .populate("userId")
    .populate("gameId");

  if (!joinRequest) {
    throw new Error("בקשה לא נמצאה");
  }

  if (joinRequest.status !== "pending") {
    throw new Error(
      `הבקשה כבר ${joinRequest.status === "approved" ? "אושרה" : "נדחתה"}`
    );
  }

  const game = joinRequest.gameId as any;
  if (!game.isActive) {
    throw new Error("המשחק לא פעיל");
  }

  // אישור הבקשה והוספת השחקן למשחק
  joinRequest.status = "approved";
  joinRequest.approvedAt = new Date();
  await joinRequest.save();

  // הוספת השחקן למשחק
  await addPlayerToGame(
    game._id.toString(),
    (joinRequest.userId as any)._id.toString(),
    joinRequest.amount
  );

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/games");
  revalidatePath(`/game/${game._id}`);

  return { success: true };
}

/**
 * קבלת כל הבקשות הממתינות למועדון (להצגת התראות)
 */
export async function getAllPendingRequests(clubId: string) {
  await connectDB();

  const [depositRequests, activeGame] = await Promise.all([
    getPendingDepositRequests(clubId),
    getActiveGame(clubId),
  ]);

  let joinGameRequests: any[] = [];
  let buyInRequests: any[] = [];

  if (activeGame) {
    const gameIdString =
      typeof activeGame._id === "string"
        ? activeGame._id
        : activeGame._id?.toString() || "";

    // בקשות הצטרפות למשחק
    joinGameRequests = await getPendingJoinGameRequests(gameIdString);

    // בקשות כניסה נוספת (buy-in requests)
    if (activeGame.players) {
      buyInRequests = activeGame.players.flatMap((p: any) =>
        (p.buyInRequests || [])
          .filter((r: any) => r.status === "pending")
          .map((r: any) => ({
            ...r,
            playerId: p.userId._id?.toString() || p.userId.toString(),
            playerName: p.userId.name || "שחקן",
            gameId: gameIdString,
          }))
      );
    }
  }

  return {
    depositRequests: depositRequests || [],
    joinGameRequests: joinGameRequests || [],
    buyInRequests: buyInRequests || [],
    totalCount:
      (depositRequests?.length || 0) +
      (joinGameRequests?.length || 0) +
      (buyInRequests?.length || 0),
  };
}

/**
 * עדכון קופה אחרי משחק (רווח/הפסד)
 * במצב קופה משותפת: מוסיף את הרווח/הפסד לקופה המשותפת של השחקן
 * הערה: הכנסת כסף למשחק לא מורידה מהקופה, רק סיום המשחק מעדכן את הקופה לפי הרווח/הפסד
 */
export async function updateBankrollAfterGame(
  userId: string,
  gameId: string,
  profitLossChips: number
) {
  await connectDB();
  const user = await User.findById(userId);
  if (!user) throw new Error("שחקן לא נמצא");

  if (!user.clubId) {
    // אם אין מועדון, נשתמש בלוגיקה הישנה
    const currentBankroll = user.bankroll || 0;
    user.bankroll = currentBankroll + profitLossChips;

    // הוספת רשומה להיסטוריה
    if (!user.bankrollHistory) {
      user.bankrollHistory = [];
    }
    user.bankrollHistory.push({
      type: profitLossChips > 0 ? "game_profit" : "game_loss",
      amount: Math.abs(profitLossChips),
      date: new Date(),
      gameId: new mongoose.Types.ObjectId(gameId),
      description: `${profitLossChips > 0 ? "רווח" : "הפסד"} במשחק: ${Math.abs(
        profitLossChips
      ).toLocaleString()} זיטונים`,
    });

    await user.save();
    revalidatePath("/profile");
    revalidatePath("/admin");
    return;
  }

  const club = await Club.findById(user.clubId);
  if (!club) throw new Error("מועדון לא נמצא");

  // אם זה מוד קופה משותפת, נעדכן את ClubBankroll
  if (club.gameMode === "shared_bankroll") {
    const clubBankroll = await ClubBankroll.findOne({ clubId: user.clubId });
    if (!clubBankroll) {
      throw new Error("קופה משותפת לא נמצאה");
    }

    const playerIndex = clubBankroll.players.findIndex(
      (p) => p.userId.toString() === userId
    );

    if (playerIndex === -1) {
      throw new Error("לא נמצאה יתרה לשחקן בקופה המשותפת");
    }

    // עדכון יתרה
    clubBankroll.players[playerIndex].balance += profitLossChips;
    clubBankroll.totalBalance += profitLossChips;

    await clubBankroll.save();
  } else {
    // מוד רגיל - עדכון bankroll של User
    const currentBankroll = user.bankroll || 0;
    user.bankroll = currentBankroll + profitLossChips;
  }

  // הוספת רשומה להיסטוריה
  if (!user.bankrollHistory) {
    user.bankrollHistory = [];
  }
  user.bankrollHistory.push({
    type: profitLossChips > 0 ? "game_profit" : "game_loss",
    amount: Math.abs(profitLossChips),
    date: new Date(),
    gameId: new mongoose.Types.ObjectId(gameId),
    description: `${profitLossChips > 0 ? "רווח" : "הפסד"} במשחק: ${Math.abs(
      profitLossChips
    ).toLocaleString()} זיטונים`,
  });

  await user.save();
  revalidatePath("/profile");
  revalidatePath("/admin");
  revalidatePath("/");
}

/**
 * קבלת היסטוריית קופה של שחקן
 */
export async function getBankrollHistory(userId: string) {
  await connectDB();
  const user = await User.findById(userId).select("bankrollHistory");
  if (!user) return [];
  return JSON.parse(JSON.stringify(user.bankrollHistory || []));
}

/**
 * עדכון מוד המשחק של המועדון
 */
export async function updateClubGameMode(
  clubId: string,
  gameMode: "free" | "shared_bankroll"
) {
  await connectDB();

  // בדיקה אם יש משחק פעיל
  const activeGame = await GameSession.findOne({
    clubId,
    isActive: true,
  }).lean();

  if (activeGame) {
    throw new Error(
      "לא ניתן לשנות מוד משחק כאשר יש משחק פעיל. נא לסיים את המשחק הפעיל תחילה."
    );
  }

  try {
    // עדכון ישיר עם updateOne - הכי בטוח
    // חשוב: נשתמש ב-$set כדי לוודא שהשדה מתעדכן
    // נשתמש גם ב-$setOnInsert כדי לוודא שהשדה נוצר אם לא קיים
    const updateResult = await Club.updateOne(
      { _id: clubId },
      {
        $set: { gameMode: gameMode },
        $setOnInsert: { gameMode: gameMode }, // אם המסמך לא קיים, ניצור אותו עם gameMode
      },
      { runValidators: true, upsert: false }
    );

    if (updateResult.matchedCount === 0) {
      throw new Error("מועדון לא נמצא");
    }

    console.log(
      `[updateClubGameMode] Update result: matched=${updateResult.matchedCount}, modified=${updateResult.modifiedCount}`
    );

    // המתן קצת כדי לוודא שהעדכון נשמר
    await new Promise((resolve) => setTimeout(resolve, 200));

    // וידוא שהשדה נשמר נכון - טעינה מחדש מהמסד נתונים
    // חשוב: נטען ישירות מהמסד נתונים ללא cache
    const updatedClub = await Club.findById(clubId).select("gameMode").lean();
    if (!updatedClub) {
      throw new Error("מועדון לא נמצא אחרי עדכון");
    }

    console.log(
      `[updateClubGameMode] After update, club gameMode is: "${updatedClub.gameMode}", expected: "${gameMode}"`
    );

    if (updatedClub.gameMode !== gameMode) {
      console.error(
        `[updateClubGameMode] ERROR: gameMode mismatch! Expected: "${gameMode}", Got: "${updatedClub.gameMode}"`
      );
      // נסיון נוסף עם save() ישירות
      const club = await Club.findById(clubId);
      if (!club) {
        throw new Error("מועדון לא נמצא");
      }

      club.gameMode = gameMode;
      await club.save();

      // בדיקה נוספת
      await new Promise((resolve) => setTimeout(resolve, 200));
      const finalCheck = await Club.findById(clubId).select("gameMode").lean();
      if (!finalCheck || finalCheck.gameMode !== gameMode) {
        console.error(
          `[updateClubGameMode] Final check failed. Got: ${finalCheck?.gameMode}`
        );
        throw new Error(`שגיאה בשמירת מוד המשחק. נסיון אחרון נכשל.`);
      }
      console.log(
        `[updateClubGameMode] Fixed with save() - gameMode is now: "${finalCheck.gameMode}"`
      );
    } else {
      console.log(
        `[updateClubGameMode] Successfully updated club ${clubId} gameMode to "${gameMode}"`
      );
    }

    // אם עברו למוד קופה משותפת, ניצור קופה משותפת אם לא קיימת
    if (gameMode === "shared_bankroll") {
      const existingBankroll = await ClubBankroll.findOne({ clubId }).lean();
      if (!existingBankroll) {
        await ClubBankroll.create({
          clubId,
          players: [],
          totalBalance: 0,
        });
      }
    }

    // רענון כל הנתיבים הרלוונטיים - חשוב מאוד!
    revalidatePath("/admin");
    revalidatePath("/admin/settings");
    revalidatePath("/admin/bankroll");
    revalidatePath("/admin/users");
    revalidatePath("/admin/games");
    revalidatePath("/");
    revalidatePath("/profile");

    // המתן קצת כדי לוודא שהשמירה הסתיימה
    await new Promise((resolve) => setTimeout(resolve, 100));

    return { success: true, gameMode };
  } catch (error: any) {
    console.error("Error updating club gameMode:", error);

    // נסיון נוסף עם updateOne ישירות
    try {
      const result = await Club.updateOne(
        { _id: clubId },
        { $set: { gameMode } }
      );

      if (result.matchedCount === 0) {
        throw new Error("מועדון לא נמצא");
      }

      revalidatePath("/admin");
      revalidatePath("/admin/settings");
      revalidatePath("/admin/bankroll");
      revalidatePath("/admin/users");
      revalidatePath("/admin/games");
      revalidatePath("/");
      revalidatePath("/profile");

      // המתן קצת כדי לוודא שהשמירה הסתיימה
      await new Promise((resolve) => setTimeout(resolve, 100));

      return { success: true, gameMode };
    } catch (retryError: any) {
      throw new Error(
        `שגיאה בשמירת מוד המשחק: ${retryError.message || "שגיאה לא ידועה"}`
      );
    }
  }
}
