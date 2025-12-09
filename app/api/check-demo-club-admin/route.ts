import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getClubSession, getClub } from "@/app/actions";

export async function POST(request: NextRequest) {
  try {
    const clubId = await getClubSession();

    if (!clubId) {
      return NextResponse.json({ error: "אין מועדון פעיל" }, { status: 400 });
    }

    const club = await getClub(clubId);

    // אם זה מועדון לדוגמא - תן admin_session
    if (club && club.name === "מועדון לדוגמא") {
      (await cookies()).set("admin_session", "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 365 * 10, // 10 years
      });
      return NextResponse.json({ success: true, isDemoClub: true });
    }

    return NextResponse.json({ success: true, isDemoClub: false });
  } catch (error: any) {
    console.error("Error checking demo club admin:", error);
    return NextResponse.json(
      { error: error.message || "שגיאה בבדיקת הרשאות" },
      { status: 500 }
    );
  }
}
