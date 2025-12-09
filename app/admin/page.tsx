import { getUsers, getActiveGame, getGameHistory } from "../actions";
import AdminView from "@/components/AdminView";
import LogoutButton from "@/components/admin/LogoutButton";
import GameHistoryList from "@/components/admin/GameHistoryList";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const users = await getUsers();
  const activeGame = await getActiveGame();
  const gameHistory = await getGameHistory();

  return (
    <div className="py-8 space-y-8 min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gradient tracking-tight text-right">
          לוח בקרה - מנהל
        </h1>
        <LogoutButton />
      </div>
      <AdminView users={users} activeGame={activeGame} />
      <GameHistoryList gameHistory={gameHistory} />
    </div>
  );
}
