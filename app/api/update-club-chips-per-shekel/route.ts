import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Club from "@/models/Club";
import { getClubSession } from "@/app/actions";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { chipsPerShekel } = await request.json();

    if (!chipsPerShekel || chipsPerShekel <= 0) {
      return NextResponse.json(
        { error: "נא להזין מספר חיובי" },
        { status: 400 }
      );
    }

    const clubId = await getClubSession();
    if (!clubId) {
      return NextResponse.json(
        { error: "אין מועדון פעיל" },
        { status: 400 }
      );
    }

    const club = await Club.findByIdAndUpdate(
      clubId,
      { chipsPerShekel: chipsPerShekel },
      { new: true }
    );

    if (!club) {
      return NextResponse.json(
        { error: "מועדון לא נמצא" },
        { status: 404 }
      );
    }

    revalidatePath("/admin");
    revalidatePath("/");

    return NextResponse.json({
      success: true,
      chipsPerShekel: club.chipsPerShekel,
    });
  } catch (error: any) {
    console.error("Error updating chips per shekel:", error);
    return NextResponse.json(
      { error: error.message || "שגיאה בעדכון יחס צ'יפים לשקל" },
      { status: 500 }
    );
  }
}
