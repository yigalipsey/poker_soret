import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Club from "@/models/Club";
import ClubBankroll from "@/models/ClubBankroll";
import User from "@/models/User";
import { cookies } from "next/headers";
import mongoose from "mongoose";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { name } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "שם קלאב נדרש" }, { status: 400 });
    }

    // Check if admin session exists - if so, use that user as manager
    // Otherwise, create a new manager user
    const adminCookie = (await cookies()).get("admin_session");
    let managerId: mongoose.Types.ObjectId;

    if (adminCookie && adminCookie.value === "true") {
      // Admin is logged in - find or create a manager user
      let adminUser = await User.findOne({ isAdmin: true });
      if (!adminUser) {
        adminUser = await User.create({
          name: "מנהל",
          isAdmin: true,
          password: "1234",
        });
      }
      managerId = adminUser._id;
    } else {
      // Create a new manager user for this club
      const managerName = `מנהל ${name}`;
      const managerUser = await User.create({
        name: managerName,
        isAdmin: false,
        password: "1234",
      });
      managerId = managerUser._id;
    }

    // Create the club
    const clubData = {
      name: name.trim(),
      managerId,
      gameMode: "shared_bankroll" as const, // כל מועדון חדש במצב קופה משותפת
    };

    console.log("Creating club with data:", JSON.stringify(clubData, null, 2));
    const club = await Club.create(clubData);

    // וידוא שהשדה נשמר
    const savedClub = await Club.findById(club._id);
    console.log("Club created, gameMode:", savedClub?.gameMode);

    if (!savedClub?.gameMode) {
      console.error("ERROR: gameMode not saved! Updating...");
      await Club.updateOne({ _id: club._id }, { gameMode: "shared_bankroll" });
      const updatedClub = await Club.findById(club._id);
      console.log("After update, gameMode:", updatedClub?.gameMode);
    }

    // יצירת קופה משותפת למועדון החדש
    await ClubBankroll.create({
      clubId: club._id,
      players: [],
      totalBalance: 0,
    });

    // Set club session cookie
    (await cookies()).set("club_session", club._id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365 * 10, // 10 years
    });

    return NextResponse.json({
      success: true,
      club: {
        _id: club._id.toString(),
        name: club.name,
        managerId: club.managerId.toString(),
      },
    });
  } catch (error: any) {
    console.error("Error creating club:", error);
    return NextResponse.json(
      { error: error.message || "שגיאה ביצירת קלאב" },
      { status: 500 }
    );
  }
}
