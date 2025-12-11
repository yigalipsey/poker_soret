import { getClubSession, getUsers, getClub } from "@/app/actions";
import LogoutButton from "@/components/admin/LogoutButton";
import { redirect } from "next/navigation";
import Link from "next/link";
import AdminView from "@/components/AdminView";
import { ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AdminUsersPage() {
  const clubId = await getClubSession();

  if (!clubId) {
    redirect("/admin/login");
  }

  const [users, club] = await Promise.all([
    getUsers(clubId),
    getClub(clubId),
  ]);

  return (
    <div className="pt-4 pb-24 space-y-8 min-h-screen px-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="text-slate-400 hover:text-white transition"
          >
            <ArrowRight className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl font-bold text-gradient tracking-tight text-right">
            ניהול שחקנים
          </h1>
        </div>
        <LogoutButton />
      </div>

      <AdminView users={users} activeGame={null} clubId={clubId} club={club} />
    </div>
  );
}
