import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function POST() {
  const cookieStore = await cookies();

  // Clear club session and admin session
  cookieStore.delete("club_session");
  cookieStore.delete("manager_session");
  cookieStore.delete("admin_session");
  // Clear player session - כשמתנתקים ממועדון, גם הפרופיל מתנתק
  cookieStore.delete("player_session");

  revalidatePath("/");
  revalidatePath("/profile");
  revalidatePath("/admin");

  return NextResponse.json({ success: true });
}
