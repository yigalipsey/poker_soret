import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function POST() {
  const cookieStore = await cookies();

  // Clear all club-related sessions
  cookieStore.delete("club_session");
  cookieStore.delete("manager_session");
  cookieStore.delete("admin_session");

  revalidatePath("/");
  revalidatePath("/profile");
  revalidatePath("/admin");

  return NextResponse.json({ success: true });
}
