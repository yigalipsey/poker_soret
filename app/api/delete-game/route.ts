import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import GameSession from "@/models/GameSession";
import User from "@/models/User";
import { getClubSession } from "@/app/actions";
import { revalidatePath } from "next/cache";
import { chipsToShekels } from "@/lib/utils";

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get("id");

    if (!gameId) {
      return NextResponse.json(
        { error: "נא לספק ID של משחק" },
        { status: 400 }
      );
    }

    const clubId = await getClubSession();

    // Find the game with populated players
    const game = await GameSession.findById(gameId).populate("players.userId");

    if (!game) {
      return NextResponse.json({ error: "משחק לא נמצא" }, { status: 404 });
    }

    // Verify the game belongs to the active club
    if (clubId && game.clubId?.toString() !== clubId) {
      return NextResponse.json(
        { error: "אין הרשאה למחוק משחק זה" },
        { status: 403 }
      );
    }

    // אם המשחק כבר הסתיים (isActive = false), צריך להחזיר את המאזן בחזרה
    // כי המאזן עודכן בסיום המשחק
    if (!game.isActive && game.players && game.players.length > 0) {
      for (const player of game.players) {
        const userId = player.userId._id ? player.userId._id : player.userId;
        const netProfit = player.netProfit || 0;

        // אם יש רווח/הפסד, נחזיר את המאזן בחזרה
        if (netProfit !== 0) {
          const balanceChange = chipsToShekels(netProfit);
          // מחסירים את הרווח/הפסד (מחזירים את המאזן למצב הקודם)
          const balanceReversal = -balanceChange;

          const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $inc: { globalBalance: balanceReversal } },
            { new: true }
          );

          console.log(
            `Reverted globalBalance for player ${
              updatedUser?.name || userId
            }: ` +
              `${balanceReversal} ₪ (netProfit was: ${netProfit} chips, new balance: ${
                updatedUser?.globalBalance || 0
              } ₪)`
          );
        }
      }
    }

    // Delete the game
    await GameSession.findByIdAndDelete(gameId);

    revalidatePath("/admin");
    revalidatePath("/");
    revalidatePath("/history");

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting game:", error);
    return NextResponse.json(
      { error: error.message || "שגיאה במחיקת משחק" },
      { status: 500 }
    );
  }
}
