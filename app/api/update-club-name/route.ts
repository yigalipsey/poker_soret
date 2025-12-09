import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Club from "@/models/Club";
import { getClubSession } from "@/app/actions";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { clubName } = await request.json();

    if (!clubName || !clubName.trim()) {
      return NextResponse.json(
        { error: "נא להזין שם מועדון" },
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

    // Check if club name already exists (excluding current club)
    const existingClub = await Club.findOne({
      name: clubName.trim(),
      _id: { $ne: clubId },
    });
    if (existingClub) {
      return NextResponse.json(
        { error: "מועדון עם שם זה כבר קיים" },
        { status: 400 }
      );
    }

    const club = await Club.findByIdAndUpdate(
      clubId,
      { name: clubName.trim() },
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
      clubName: club.name,
    });
  } catch (error: any) {
    console.error("Error updating club name:", error);
    return NextResponse.json(
      { error: error.message || "שגיאה בעדכון שם המועדון" },
      { status: 500 }
    );
  }
}
