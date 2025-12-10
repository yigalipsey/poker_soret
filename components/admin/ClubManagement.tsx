import {
  getUsers,
  getActiveGame,
  getGameHistory,
  getClub,
} from "@/app/actions";
import AdminView from "@/components/AdminView";
import GameHistoryList from "@/components/admin/GameHistoryList";
import ChipsPerShekelSettings from "@/components/admin/ChipsPerShekelSettings";
import ClubNameEditor from "@/components/admin/ClubNameEditor";

export default async function ClubManagement({ clubId }: { clubId: string }) {
  const [club, users, activeGame, gameHistory] = await Promise.all([
    getClub(clubId),
    getUsers(clubId),
    getActiveGame(clubId),
    getGameHistory(clubId),
  ]);

  return (
    <div className="space-y-8">
      {/* Club Name Editor */}
      <ClubNameEditor clubId={clubId} currentName={club?.name} />

      {/* Main Management Content */}
      <AdminView users={users} activeGame={activeGame} clubId={clubId} />
      <GameHistoryList gameHistory={gameHistory} />

      {/* Chips Per Shekel Settings */}
      <ChipsPerShekelSettings
        clubId={clubId}
        currentValue={club?.chipsPerShekel || 100}
      />
    </div>
  );
}
