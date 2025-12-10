import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";

export async function GET() {
  try {
    await connectDB();

    // עדכון כל המשתמשים עם סיסמה 1234
    const result = await User.updateMany({}, { password: "1234" });

    // קבלת רשימת כל המשתמשים כדי לוודא
    const users = await User.find({}).select("name password").lean();

    return NextResponse.json({
      success: true,
      updated: result.modifiedCount,
      matched: result.matchedCount,
      users: users.map((u) => ({
        name: u.name,
        hasPassword: !!u.password,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}


