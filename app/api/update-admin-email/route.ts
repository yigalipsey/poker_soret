import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Club from "@/models/Club";
import { getClubSession } from "@/app/actions";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { adminEmail } = await request.json();

    // בדיקת תקינות כתובת המייל
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (adminEmail && !emailRegex.test(adminEmail)) {
      return NextResponse.json(
        { error: "כתובת מייל לא תקינה" },
        { status: 400 }
      );
    }

    const clubId = await getClubSession();
    if (!clubId) {
      return NextResponse.json({ error: "אין מועדון פעיל" }, { status: 400 });
    }

    console.log(
      `[update-admin-email] Club ID: ${clubId}, Admin email to save: ${
        adminEmail || "null/empty"
      }`
    );

    const club = await Club.findByIdAndUpdate(
      clubId,
      { adminEmail: adminEmail || undefined },
      { new: true }
    );

    if (!club) {
      return NextResponse.json({ error: "מועדון לא נמצא" }, { status: 404 });
    }

    console.log(
      `[update-admin-email] Saved admin email: ${
        club.adminEmail || "undefined/null"
      }`
    );

    revalidatePath("/admin");
    revalidatePath("/");

    return NextResponse.json({
      success: true,
      adminEmail: club.adminEmail,
    });
  } catch (error: any) {
    console.error("Error updating admin email:", error);
    return NextResponse.json(
      { error: error.message || "שגיאה בעדכון כתובת המייל" },
      { status: 500 }
    );
  }
}
