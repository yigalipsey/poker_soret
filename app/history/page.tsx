import { getGameHistory, getClubSession, getClub } from "@/app/actions";
import Link from "next/link";
import {
  Calendar,
  ChevronLeft,
  Users,
  ArrowRight,
  Trophy,
  Coins,
  Wallet,
} from "lucide-react";
import { cn, chipsToShekels, formatChips } from "@/lib/utils";
import ClubLoginScreen from "@/components/ClubLoginScreen";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const clubId = await getClubSession();

  // If no club session, show login screen
  if (!clubId) {
    return (
      <div className="min-h-screen flex items-start justify-center pt-8 px-4">
        <ClubLoginScreen />
      </div>
    );
  }

  const [games, club] = await Promise.all([
    getGameHistory(clubId),
    getClub(clubId),
  ]);

  const isSharedBankrollMode = club?.gameMode === "shared_bankroll";

  return (
    <div className="min-h-screen pb-24 px-4 pt-4 max-w-md mx-auto relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[20%] right-[-20%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[100px] animate-pulse-slow"></div>
      </div>

      <header className="flex items-center gap-4 mb-8 relative z-10">
        <Link
          href="/"
          className="p-3 bg-slate-800/50 rounded-full hover:bg-slate-700 transition border border-slate-700 backdrop-blur-md group"
        >
          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-400">
            היסטוריית משחקים
          </h1>
          <p className="text-xs text-slate-500">ארכיון משחקים ותוצאות</p>
        </div>
      </header>

      <div className="space-y-4 relative z-10">
        {games.map((game: any, index: number) => {
          const totalPot = game.players.reduce(
            (acc: number, p: any) => acc + p.totalApprovedBuyIn,
            0
          );
          // מציאת המרוויח הגדול - רק אם יש שחקן עם רווח חיובי
          const playersWithProfit = game.players.filter(
            (p: any) => (p.netProfit || 0) > 0
          );
          const winner =
            playersWithProfit.length > 0
              ? playersWithProfit.reduce((prev: any, current: any) =>
                  (prev.netProfit || 0) > (current.netProfit || 0)
                    ? prev
                    : current
                )
              : null;

          return (
            <Link
              href={`/game/${game._id}`}
              key={game._id}
              className="block glass-card p-5 rounded-2xl hover:border-slate-500/30 transition-all duration-300 group animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-800/50 rounded-xl flex flex-col items-center justify-center border border-slate-700/50">
                    <span className="text-xs text-slate-500 font-medium uppercase">
                      {new Date(game.date).toLocaleDateString("he-IL", {
                        month: "short",
                      })}
                    </span>
                    <span className="text-lg font-bold text-slate-200 leading-none">
                      {new Date(game.date).getDate()}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                      <Users className="w-3 h-3" />
                      <span>{game.players.length} שחקנים</span>
                    </div>
                    <div className="font-bold text-slate-200 flex items-center gap-1.5">
                      <Coins className="w-4 h-4 text-amber-500" />
                      {chipsToShekels(totalPot).toFixed(2)} ₪
                    </div>
                    {game.isSharedBankroll && (
                      <div className="flex items-center gap-1.5 text-xs text-purple-400 mt-1">
                        <Wallet className="w-3 h-3" />
                        <span>קופה משותפת</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-2 bg-slate-800/50 rounded-full group-hover:bg-amber-500/20 group-hover:text-amber-500 transition-colors">
                  <ChevronLeft className="w-5 h-5 text-slate-600 group-hover:text-amber-500 transition-colors" />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-700/50 space-y-2">
                {winner && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      המרוויח הגדול
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-emerald-400">
                        +{chipsToShekels(winner.netProfit || 0).toFixed(2)} ₪
                      </span>
                      <span className="text-sm text-slate-300 font-medium">
                        {winner.userId.name}
                      </span>
                      <Trophy className="w-4 h-4 text-amber-400" />
                    </div>
                  </div>
                )}
                {game.settlementTransfers &&
                  game.settlementTransfers.length > 0 && (
                    <div
                      className={`flex items-center justify-between ${
                        winner ? "pt-2 border-t border-slate-800/50" : ""
                      }`}
                    >
                      <span className="text-xs text-slate-500">התחשבנות</span>
                      <span className="text-xs text-purple-400 font-medium">
                        {game.settlementTransfers.length} העברות
                      </span>
                    </div>
                  )}
              </div>
            </Link>
          );
        })}

        {games.length === 0 && (
          <div className="text-center py-16 px-6 glass rounded-2xl border-dashed border-2 border-slate-700/50">
            <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-slate-400">לא נמצאו משחקים שהסתיימו</p>
          </div>
        )}
      </div>
    </div>
  );
}
