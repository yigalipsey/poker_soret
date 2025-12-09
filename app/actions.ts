"use server";

import connectDB from "@/lib/db";
import GameSession from "@/models/GameSession";
import User from "@/models/User";
import { calculateSettlements } from "@/lib/settlement";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { cookies } from "next/headers";
// bcrypt removed - using plain text passwords for simplicity
import { chipsToShekels } from "@/lib/utils";

export async function getUsers() {
  await connectDB();
  const users = await User.find({}).sort({ globalBalance: -1 }).lean();
  return JSON.parse(JSON.stringify(users));
}

export async function createUser(name: string, isAdmin: boolean = false) {
  await connectDB();
  // כל משתמש חדש מקבל סיסמה 1234 כברירת מחדל
  const user = await User.create({ name, isAdmin, password: "1234" });
  revalidatePath("/");
  return JSON.parse(JSON.stringify(user));
}

export async function createGame(
  playerIds: string[],
  initialBuyIns: Record<string, number>
) {
  await connectDB();

  // Deactivate any currently active games
  await GameSession.updateMany({ isActive: true }, { isActive: false });

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

  const game = await GameSession.create({
    players,
    isActive: true,
  });

  revalidatePath("/");
  return JSON.parse(JSON.stringify(game));
}

export async function getActiveGame() {
  await connectDB();
  const game = await GameSession.findOne({ isActive: true })
    .populate("players.userId")
    .lean();
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

  const player = game.players.find((p) => p.userId.toString() === userId);
  if (!player) throw new Error("Player not found in this game");

  player.buyInRequests.push({
    amount,
    status: "pending",
    timestamp: new Date(),
    isInitial: false,
    addedBy: "user",
  });

  await game.save();
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

  const player = game.players.find((p) => p.userId.toString() === userId);
  if (!player) throw new Error("Player not found");

  const request = player.buyInRequests.find(
    (r: any) => r._id.toString() === requestId
  );
  if (!request) throw new Error("Request not found");

  if (request.status !== "pending") return;

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

  const player = game.players.find((p) => p.userId.toString() === userId);
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

  const player = game.players.find((p) => p.userId.toString() === userId);
  if (!player) throw new Error("Player not found");

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

export async function endGame(
  gameId: string,
  cashOutData: Record<string, number>
) {
  await connectDB();
  const game = await GameSession.findById(gameId);
  if (!game) throw new Error("Game not found");

  // חישוב סך הקופה
  const totalChipsInPot = game.players.reduce(
    (sum: number, p: any) => sum + (p.totalApprovedBuyIn || 0),
    0
  );

  // בדיקה שכל השחקנים הוזן להם cashOut
  // שינוי לוגיקה: אין צורך שכולם יזינו, מי שלא הזין נחשב כ-0 אם הסכום תואם
  const playersWithoutCashOut: any[] = [];
  game.players.forEach((player: any) => {
    const playerId = player.userId.toString();
    const cashOut = cashOutData[playerId];

    if (
      !player.isCashedOut &&
      (cashOut === undefined || cashOut === null || cashOut === "")
    ) {
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
    const val = cashOutData[p.userId.toString()];
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
    const playerId = player.userId.toString();

    // אם השחקן כבר יצא, נשאיר את ה-cashOut שלו כמו שהוא
    if (player.isCashedOut) {
      // עדכון netProfit גם לשחקנים שיצאו מוקדם
      player.netProfit =
        (player.cashOut || 0) - (player.totalApprovedBuyIn || 0);
      return;
    }

    // שחקנים שעדיין במשחק - עדכון מה-cashOutData
    const cashOut = cashOutData[playerId];
    const cashOutValue = Number(cashOut) || 0;

    player.cashOut = cashOutValue;
    player.netProfit = cashOutValue - (player.totalApprovedBuyIn || 0);
  });

  game.isActive = false;
  await game.save();

  // חישוב אוטומטי של ההתחשבנות אחרי סיום המשחק
  // חשוב: אם יש שגיאה, המשחק כבר נשמר כלא פעיל, רק ההתחשבנות לא תישמר
  try {
    // המרת זיטונים לשקלים לפני חישוב ההתחשבנות (1000 זיטונים = 1 שקל)
    // משתמשים ב-game שכבר מעודכן עם netProfit
    const balances = game.players.map((p: any) => {
      const netProfit = p.netProfit || 0;
      const balanceInShekels = chipsToShekels(netProfit);
      return {
        playerId: p.userId.toString(),
        balance: balanceInShekels,
        playerName: p.userId.name || "Unknown",
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

  const player = game.players.find((p) => p.userId.toString() === userId);
  if (!player) throw new Error("Player not found");

  // וידוא ש-amount הוא מספר תקין
  const cashOutValue = Number(amount) || 0;
  const buyInValue = Number(player.totalApprovedBuyIn) || 0;

  // חישוב סך ה-cashOut שכבר הוזן (רק משחקנים שכבר יצאו, לא כולל השחקן הנוכחי אם הוא כבר יצא)
  const totalCashOut = game.players.reduce((sum: number, p: any) => {
    // דלג על השחקן הנוכחי אם הוא כבר יצא (נעדכן אותו אחר כך)
    if (p.userId.toString() === userId && p.isCashedOut) {
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
  revalidatePath("/admin");
}

export async function calculateSettlementAction(gameId: string) {
  await connectDB();
  const game = await GameSession.findById(gameId);
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
  const balances = game.players.map((p) => {
    const netProfit = p.netProfit || 0;
    const balanceInShekels = chipsToShekels(netProfit);
    return {
      playerId: p.userId.toString(),
      balance: balanceInShekels,
      playerName: p.userId.name || "Unknown",
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

export async function getGameHistory() {
  await connectDB();
  // מחזיר את כל המשחקים הלא פעילים (ללא תלות ב-isSettled)
  const games = await GameSession.find({ isActive: false })
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
  await connectDB();
  const game = await GameSession.findById(gameId);
  if (!game) throw new Error("Game not found");
  if (!game.isActive) throw new Error("Game is not active");

  // Check if player already in game
  const existingPlayer = game.players.find(
    (p) => p.userId.toString() === userId
  );
  if (existingPlayer) throw new Error("Player already in game");

  // Add new player
  game.players.push({
    userId: new mongoose.Types.ObjectId(userId),
    totalApprovedBuyIn: initialBuyIn,
    buyInRequests:
      initialBuyIn > 0
        ? [
            {
              amount: initialBuyIn,
              status: "approved",
              timestamp: new Date(),
            },
          ]
        : [],
    cashOut: 0,
    netProfit: 0,
    isCashedOut: false,
  });

  await game.save();
  revalidatePath("/admin");
}

export async function setPlayerPassword(userId: string, password: string) {
  await connectDB();
  // שמירת סיסמה כטקסט רגיל (ללא הצפנה)
  await User.findByIdAndUpdate(userId, { password: password });
  revalidatePath("/admin");
}

export async function playerLogin(name: string, password: string) {
  await connectDB();
  const user = await User.findOne({ name });

  if (!user) {
    return { success: false, error: "שחקן לא נמצא" };
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
  return user ? JSON.parse(JSON.stringify(user)) : null;
}

// פונקציה לעדכון כל המשתמשים עם סיסמה 1234
export async function setAllUsersPasswordTo1234() {
  await connectDB();
  const result = await User.updateMany({}, { password: "1234" });
  revalidatePath("/admin");
  return { updated: result.modifiedCount };
}
