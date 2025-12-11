import {
  getClubSession,
  getActiveGame,
  getGameHistory,
  getClub,
  getUsers,
  getPendingJoinGameRequests,
} from "@/app/actions";
import LogoutButton from "@/components/admin/LogoutButton";
import { redirect } from "next/navigation";
import Link from "next/link";
import CreateGameForm from "@/components/admin/CreateGameForm";
import ActiveGameDashboard from "@/components/admin/ActiveGameDashboard";
import GameHistoryList from "@/components/admin/GameHistoryList";
import { ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminGamesPage() {
  const clubId = await getClubSession();

  if (!clubId) {
    redirect("/admin/login");
  }

  const [club, activeGame, gameHistory, users] = await Promise.all([
    getClub(clubId),
    getActiveGame(clubId),
    getGameHistory(clubId),
    getUsers(clubId),
  ]);

  // טעינת בקשות הצטרפות ממתינות אם יש משחק פעיל
  const pendingJoinRequests = activeGame
    ? await getPendingJoinGameRequests(
        typeof activeGame._id === "string"
          ? activeGame._id
          : activeGame._id?.toString() || ""
      )
    : [];

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
            ניהול משחקים
          </h1>
        </div>
        <LogoutButton />
      </div>

      {activeGame ? (
        <ActiveGameDashboard
          game={activeGame}
          users={users}
          club={club}
          pendingJoinRequests={pendingJoinRequests}
        />
      ) : (
        <CreateGameForm users={users} clubId={clubId} club={club} />
      )}

      <GameHistoryList gameHistory={gameHistory} />
    </div>
  );
}

