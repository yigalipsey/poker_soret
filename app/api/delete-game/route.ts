import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import GameSession from "@/models/GameSession";
import { getClubSession } from "@/app/actions";
import { revalidatePath } from "next/cache";

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

    // Find the game
    const game = await GameSession.findById(gameId);

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
