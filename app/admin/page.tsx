import { getClubSession } from "../actions";
import LogoutButton from "@/components/admin/LogoutButton";
import ClubManagement from "@/components/admin/ClubManagement";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const clubId = await getClubSession();

  // If no club selected, redirect to login
  if (!clubId) {
    redirect("/admin/login");
  }

  return (
    <div className="pt-4 pb-24 space-y-8 min-h-screen px-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gradient tracking-tight text-right">
          לוח בקרה - מנהל
        </h1>
        <LogoutButton />
      </div>

      <ClubManagement clubId={clubId} />
    </div>
  );
}
