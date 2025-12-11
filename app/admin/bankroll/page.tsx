import {
  getClubSession,
  getUsers,
  getClub,
  getPendingDepositRequests,
} from "@/app/actions";
import LogoutButton from "@/components/admin/LogoutButton";
import { redirect } from "next/navigation";
import Link from "next/link";
import LoadMoneyToPlayer from "@/components/admin/LoadMoneyToPlayer";
import PendingDepositRequests from "@/components/admin/PendingDepositRequests";
import { ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminBankrollPage() {
  const clubId = await getClubSession();

  if (!clubId) {
    redirect("/admin/login");
  }

  const [club, users, pendingRequests] = await Promise.all([
    getClub(clubId),
    getUsers(clubId),
    getPendingDepositRequests(clubId),
  ]);

  // רק במוד קופה משותפת
  if (club?.gameMode !== "shared_bankroll") {
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
              טעינת כסף
            </h1>
          </div>
          <LogoutButton />
        </div>

        <div className="glass-card p-8 rounded-2xl text-center">
          <p className="text-slate-400 mb-4">
            טעינת כסף זמינה רק במוד קופה משותפת
          </p>
          <Link
            href="/admin/settings"
            className="text-emerald-400 hover:text-emerald-300 underline"
          >
            שנה למוד קופה משותפת בהגדרות
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-4 pb-24 space-y-8 min-h-screen px-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="text-slate-400 hover:text-white transition"
          >
            <ArrowRight className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl font-bold text-gradient tracking-tight text-right">
            טעינת כסף לשחקנים
          </h1>
        </div>
        <LogoutButton />
      </div>

      {/* Pending Deposit Requests */}
      {pendingRequests && pendingRequests.length > 0 && (
        <PendingDepositRequests
          requests={pendingRequests}
          chipsPerShekel={club?.chipsPerShekel || 100}
        />
      )}

      <LoadMoneyToPlayer
        users={users}
        clubId={clubId}
        chipsPerShekel={club?.chipsPerShekel || 100}
      />
    </div>
  );
}
