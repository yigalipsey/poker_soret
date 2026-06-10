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
import GameModeSettings from "@/components/admin/GameModeSettings";
import PlayerBankrollManager from "@/components/admin/PlayerBankrollManager";

export default async function ClubManagement({ clubId }: { clubId: string }) {
  const [club, users, activeGame, gameHistory] = await Promise.all([
    getClub(clubId),
    getUsers(clubId),
    getActiveGame(clubId),
    getGameHistory(clubId),
  ]);

  return (
    <div className="space-y-8">
      {/* אינדיקטור מוד נוכחי - במוד קופה משותפת */}
      {club?.gameMode === "shared_bankroll" && (
        <div className="glass-card p-4 rounded-xl border-2 border-purple-500/50 bg-gradient-to-r from-purple-900/30 to-purple-800/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <svg
                  className="w-5 h-5 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <div className="font-bold text-purple-300 text-lg">
                  מצב קופה משותפת פעיל
                </div>
                <div className="text-xs text-purple-400/80">
                  שחקנים יכולים להיכנס למשחק רק עד יתרת הקופה שלהם
                </div>
              </div>
            </div>
            <div className="px-4 py-2 bg-purple-500/20 border border-purple-500/50 rounded-lg">
              <span className="text-sm font-bold text-purple-300 uppercase tracking-wider">
                פעיל
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Club Name Editor */}
      <ClubNameEditor clubId={clubId} currentName={club?.name} />

      {/* Main Management Content */}
      <AdminView
        users={users}
        activeGame={activeGame}
        clubId={clubId}
        club={club}
      />
      <GameHistoryList gameHistory={gameHistory} />

      {/* Game Mode Settings */}
      <GameModeSettings
        clubId={clubId}
        currentMode={club?.gameMode || "free"}
      />

      {/* Player Bankroll Manager - רק במוד קופה משותפת */}
      {club?.gameMode === "shared_bankroll" && (
        <PlayerBankrollManager
          users={users}
          clubId={clubId}
          chipsPerShekel={club?.chipsPerShekel || 100}
        />
      )}

      {/* Chips Per Shekel Settings */}
      <ChipsPerShekelSettings
        clubId={clubId}
        currentValue={club?.chipsPerShekel || 100}
      />
    </div>
  );
}
