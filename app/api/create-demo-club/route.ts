import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Club from "@/models/Club";
import User from "@/models/User";
import { cookies } from "next/headers";
import mongoose from "mongoose";

export async function POST() {
  try {
    await connectDB();

    // Check if demo club already exists
    let club = await Club.findOne({ name: "מועדון לדוגמא" });

    if (!club) {
      // Create demo manager user
      let manager = await User.findOne({ name: "מנהל מועדון לדוגמא" });
      if (!manager) {
        manager = await User.create({
          name: "מנהל מועדון לדוגמא",
          isAdmin: true,
          password: "1234",
        });
      }

      // Create demo club (ללא סיסמת מועדון - כל אחד יכול להיכנס)
      club = await Club.create({
        name: "מועדון לדוגמא",
        managerId: manager._id,
        // clubPassword לא מוגדר - כל אחד יכול להיכנס
      });

      // Set manager's clubId
      manager.clubId = club._id;
      await manager.save();
    }

    // תמיד לוודא שיש שחקנים לדוגמא (אם אין)
    const existingPlayers = await User.countDocuments({
      clubId: club._id,
      isAdmin: false,
    });

    if (existingPlayers === 0) {
      // Create some demo players
      const demoPlayers = [
        { name: "יוסי", balance: 500 },
        { name: "דני", balance: -200 },
        { name: "שרה", balance: 300 },
        { name: "מיכאל", balance: -100 },
      ];

      for (const player of demoPlayers) {
        await User.create({
          name: player.name,
          isAdmin: false,
          globalBalance: player.balance,
          password: "1234",
          clubId: club._id,
        });
      }
    }

    // Set club session cookie
    (await cookies()).set("club_session", club._id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365 * 10, // 10 years
    });

    // לא נותנים admin_session כאן - רק כשנכנסים לדף ניהול

    return NextResponse.json({
      success: true,
      club: {
        _id: club._id.toString(),
        name: club.name,
      },
    });
  } catch (error: any) {
    console.error("Error creating demo club:", error);
    return NextResponse.json(
      { error: error.message || "שגיאה ביצירת מועדון לדוגמא" },
      { status: 500 }
    );
  }
}
