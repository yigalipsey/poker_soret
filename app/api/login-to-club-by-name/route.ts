import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Club from "@/models/Club";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { clubName, password } = await request.json();

    if (!clubName || !clubName.trim()) {
      return NextResponse.json(
        { error: "נא להזין שם מועדון" },
        { status: 400 }
      );
    }

    // Find club by name
    const club = await Club.findOne({ name: clubName.trim() });
    if (!club) {
      return NextResponse.json({ error: "מועדון לא נמצא" }, { status: 404 });
    }

    // אם זה מועדון לדוגמא - לא צריך סיסמה
    // למועדונים אחרים - צריך לבדוק סיסמת מועדון
    if (club.name !== "מועדון לדוגמא") {
      if (!password) {
        return NextResponse.json(
          { error: "נא להזין סיסמת מועדון" },
          { status: 400 }
        );
      }

      // בדוק סיסמת מועדון
      if (club.clubPassword && club.clubPassword !== password) {
        return NextResponse.json(
          { error: "סיסמת מועדון שגויה" },
          { status: 401 }
        );
      }
    }

    // Set club session cookie
    (await cookies()).set("club_session", club._id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365 * 10, // 10 years
    });

    // לא נותנים admin_session כאן - רק כשנכנסים לדף ניהול
    // מחק admin_session אם היה (חוזר למגבלות רגילות)
    (await cookies()).delete("admin_session");
    (await cookies()).delete("manager_session");
    // מחק player_session - כשנכנסים למועדון חדש, צריך להתחבר מחדש עם משתמש מהמועדון החדש
    (await cookies()).delete("player_session");

    return NextResponse.json({
      success: true,
      club: {
        _id: club._id.toString(),
        name: club.name,
      },
    });
  } catch (error: any) {
    console.error("Error logging in to club:", error);
    return NextResponse.json(
      { error: error.message || "שגיאה בכניסה למועדון" },
      { status: 500 }
    );
  }
}
