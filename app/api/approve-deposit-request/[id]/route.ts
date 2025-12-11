import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import DepositRequest from "@/models/DepositRequest";
import User from "@/models/User";
import Club from "@/models/Club";
import { depositToBankroll } from "@/app/actions";
import { revalidatePath } from "next/cache";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const depositRequest = await DepositRequest.findById(id)
      .populate("userId")
      .populate("clubId")
      .lean();

    if (!depositRequest) {
      return NextResponse.json({ error: "בקשה לא נמצאה" }, { status: 404 });
    }

    if (depositRequest.status !== "pending") {
      return NextResponse.json(
        {
          error: `הבקשה כבר ${
            depositRequest.status === "approved" ? "אושרה" : "נדחתה"
          }`,
          status: depositRequest.status,
        },
        { status: 400 }
      );
    }

    // אישור הבקשה וביצוע הטעינה
    await DepositRequest.findByIdAndUpdate(id, {
      status: "approved",
      approvedAt: new Date(),
    });

    // ביצוע הטעינה
    const userId = (depositRequest.userId as any)._id
      ? (depositRequest.userId as any)._id.toString()
      : depositRequest.userId.toString();

    await depositToBankroll(userId, depositRequest.amountInShekels);

    revalidatePath("/profile");
    revalidatePath("/admin");
    revalidatePath("/admin/bankroll");

    const userName = (depositRequest.userId as any).name || "השחקן";
    const amount = depositRequest.amountInShekels.toLocaleString("he-IL");

    return NextResponse.json({
      success: true,
      message: `הטעינה אושרה בהצלחה! ${amount} ₪ נטענו לקופה של ${userName}`,
    });
  } catch (error: any) {
    console.error("Error approving deposit request:", error);
    return NextResponse.json(
      { error: error.message || "שגיאה באישור הטעינה" },
      { status: 500 }
    );
  }
}

