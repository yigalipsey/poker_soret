import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { userId, newPassword } = await request.json();

    if (!userId || !newPassword) {
      return NextResponse.json(
        { error: "נא למלא את כל השדות" },
        { status: 400 }
      );
    }

    // Update password
    await User.findByIdAndUpdate(userId, { password: newPassword });

    revalidatePath("/profile");
    revalidatePath("/");

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error("Error changing password:", error);
    return NextResponse.json(
      { error: error.message || "שגיאה בעדכון הסיסמה" },
      { status: 500 }
    );
  }
}
