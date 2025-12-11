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
    const { clubName, managerName, managerPassword, clubPassword } =
      await request.json();

    if (
      !clubName ||
      !clubName.trim() ||
      !managerName ||
      !managerName.trim() ||
      !managerPassword ||
      !clubPassword
    ) {
      return NextResponse.json(
        { error: "נא למלא את כל השדות" },
        { status: 400 }
      );
    }

    // Check if club name already exists
    const existingClub = await Club.findOne({ name: clubName.trim() });
    if (existingClub) {
      return NextResponse.json(
        { error: "מועדון עם שם זה כבר קיים" },
        { status: 400 }
      );
    }

    // Note: Manager name is always "מנהל", so we don't check for duplicate names
    // Multiple managers can have the same name as long as they belong to different clubs

    // Create manager user - automatically set as admin
    const managerUser = await User.create({
      name: managerName.trim(),
      isAdmin: true,
      password: managerPassword,
    });

    // Create the club with club password
    const clubData = {
      name: clubName.trim(),
      managerId: managerUser._id,
      clubPassword: clubPassword,
      gameMode: "shared_bankroll" as const, // כל מועדון חדש במצב קופה משותפת
    };

    console.log(
      "Creating club with manager, data:",
      JSON.stringify(clubData, null, 2)
    );
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

    // Set manager's clubId
    managerUser.clubId = club._id;
    await managerUser.save();

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
    (await cookies()).set("manager_session", managerUser._id.toString(), {
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
      { error: error.message || "שגיאה ביצירת מועדון" },
      { status: 500 }
    );
  }
}
