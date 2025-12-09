import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import connectDB from "@/lib/db";
import Club from "@/models/Club";

export async function POST(request: NextRequest) {
  try {
    const { clubId } = await request.json();

    if (!clubId) {
      return NextResponse.json(
        { error: "נא לספק ID של מועדון" },
        { status: 400 }
      );
    }

    await connectDB();
    const club = await Club.findById(clubId).lean();

    if (!club) {
      return NextResponse.json({ error: "מועדון לא נמצא" }, { status: 404 });
    }

    // Set club session cookie
    (await cookies()).set("club_session", clubId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365 * 10, // 10 years
    });

    // לא נותנים admin_session כאן - רק כשנכנסים לדף ניהול
    // מחק admin_session אם היה (חוזר למגבלות רגילות)
    (await cookies()).delete("admin_session");
    (await cookies()).delete("manager_session");

    revalidatePath("/");
    revalidatePath("/admin");

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error setting club session:", error);
    return NextResponse.json(
      { error: error.message || "שגיאה בהגדרת סשן מועדון" },
      { status: 500 }
    );
  }
}
