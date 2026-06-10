import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Club from "@/models/Club";
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
    const club = await Club.create({
      name: clubName.trim(),
      managerId: managerUser._id,
      clubPassword: clubPassword,
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
