import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Club from "@/models/Club";
import User from "@/models/User";

export async function POST() {
  try {
    await connectDB();

    // מצא את מועדון לדוגמא
    const club = await Club.findOne({ name: "מועדון לדוגמא" });

    if (!club) {
      return NextResponse.json(
        { error: "מועדון לדוגמא לא נמצא" },
        { status: 404 }
      );
    }

    // מצא את המנהל הנוכחי
    let manager = await User.findById(club.managerId);

    if (!manager) {
      // אם אין מנהל, צור אחד חדש
      manager = await User.create({
        name: "מנהל מועדון לדוגמא",
        isAdmin: true,
        password: "1111",
        clubId: club._id,
      });

      // עדכן את המועדון עם המנהל החדש
      club.managerId = manager._id;
      await club.save();
    } else {
      // עדכן את הסיסמה של המנהל הקיים
      manager.password = "1111";
      // ודא שהוא מקושר למועדון
      manager.clubId = club._id;
      await manager.save();
    }

    return NextResponse.json({
      success: true,
      message: "מנהל מועדון לדוגמא עודכן בהצלחה",
      manager: {
        _id: manager._id.toString(),
        name: manager.name,
        password: "1111",
      },
    });
  } catch (error: any) {
    console.error("Error updating demo club manager:", error);
    return NextResponse.json(
      { error: error.message || "שגיאה בעדכון מנהל מועדון לדוגמא" },
      { status: 500 }
    );
  }
}


