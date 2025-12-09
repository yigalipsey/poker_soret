import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Club from "@/models/Club";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { clubName, password } = await request.json();

    if (!clubName || !clubName.trim() || !password) {
      return NextResponse.json(
        { error: "נא למלא את כל השדות" },
        { status: 400 }
      );
    }

    // Find club by name
    const club = await Club.findOne({ name: clubName.trim() });
    if (!club) {
      return NextResponse.json({ error: "מועדון לא נמצא" }, { status: 404 });
    }

    // בדוק סיסמת המנהל לכל המועדונים (כולל מועדון לדוגמא)
    const manager = await User.findById(club.managerId);
    if (!manager) {
      return NextResponse.json(
        { error: "מנהל המועדון לא נמצא" },
        { status: 404 }
      );
    }

    // Check password (manager's password)
    if (manager.password !== password) {
      return NextResponse.json({ error: "סיסמה שגויה" }, { status: 401 });
    }

    // Set admin session (for middleware)
    (await cookies()).set("admin_session", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365 * 10, // 10 years
    });

    // Set club session cookie
    (await cookies()).set("club_session", club._id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365 * 10, // 10 years
    });

    // Set manager session cookie
    (await cookies()).set("manager_session", manager._id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365 * 10, // 10 years
    });

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
