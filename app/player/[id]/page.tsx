import { getPlayerGameHistory, getClubSession, getUsers } from "@/app/actions";
import Link from "next/link";
import {
  Calendar,
  ArrowRight,
  Users,
  Trophy,
  Coins,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { cn, chipsToShekels, formatChips, formatShekels } from "@/lib/utils";
import ClubLoginScreen from "@/components/ClubLoginScreen";
import { Avatar } from "@/components/ui/Avatar";

export const dynamic = "force-dynamic";

export default async function PlayerHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const clubId = await getClubSession();

  // If no club session, show login screen
  if (!clubId) {
    return (
      <div className="min-h-screen flex items-start justify-center pt-8 px-4">
        <ClubLoginScreen />
      </div>
    );
  }

  const [playerGames, users] = await Promise.all([
    getPlayerGameHistory(id, clubId),
    getUsers(clubId),
  ]);

  const player = users.find((u: any) => u._id.toString() === id);

  if (!player) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-slate-400 mb-4">שחקן לא נמצא</p>
          <Link
            href="/"
            className="text-amber-400 hover:text-amber-300 underline"
          >
            חזור לדף הבית
          </Link>
        </div>
      </div>
    );
  }

  // חישוב סטטיסטיקות
  const totalGames = playerGames.length;
  const totalBuyInChips = playerGames.reduce((acc: number, game: any) => {
    const playerInGame = game.players.find((p: any) => {
      const playerId = p.userId._id
        ? p.userId._id.toString()
        : p.userId.toString();
      return playerId === id;
    });
    return acc + (playerInGame?.totalApprovedBuyIn || 0);
  }, 0);
  const totalCashOutChips = playerGames.reduce((acc: number, game: any) => {
    const playerInGame = game.players.find((p: any) => {
      const playerId = p.userId._id
        ? p.userId._id.toString()
        : p.userId.toString();
      return playerId === id;
    });
    return acc + (playerInGame?.cashOut || 0);
  }, 0);
  const totalNetProfitChips = totalCashOutChips - totalBuyInChips;
  const totalNetProfitShekels = chipsToShekels(totalNetProfitChips);

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
        <div className="flex items-center gap-3 flex-1">
          <Avatar
            name={player.name}
            imageUrl={player.avatarUrl}
            size="lg"
            className="border-2 border-amber-500/50"
          />
          <div>
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-400">
              {player.name}
            </h1>
            <p className="text-xs text-slate-500">היסטוריית משחקים</p>
          </div>
        </div>
      </header>

      {/* Statistics Card */}
      <div className="glass-card p-6 rounded-2xl mb-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="text-xs text-slate-400 mb-1 flex items-center justify-center gap-1">
              <Users className="w-3 h-3" />
              משחקים
            </div>
            <div className="text-2xl font-bold text-white">{totalGames}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-400 mb-1 flex items-center justify-center gap-1">
              <Coins className="w-3 h-3" />
              כניסה כוללת
            </div>
            <div className="text-2xl font-bold text-white">
              {formatShekels(chipsToShekels(totalBuyInChips))}
            </div>
          </div>
        </div>
        <div className="pt-4 border-t border-slate-700/50">
          <div className="text-center">
            <div className="text-xs text-slate-400 mb-1 flex items-center justify-center gap-1">
              {totalNetProfitShekels >= 0 ? (
                <TrendingUp className="w-3 h-3 text-emerald-400" />
              ) : (
                <TrendingDown className="w-3 h-3 text-rose-400" />
              )}
              רווח/הפסד כולל
            </div>
            <div
              className={cn(
                "text-3xl font-bold",
                totalNetProfitShekels > 0
                  ? "text-emerald-400"
                  : totalNetProfitShekels < 0
                  ? "text-rose-400"
                  : "text-slate-400"
              )}
            >
              {totalNetProfitShekels > 0 ? "+" : ""}
              {totalNetProfitShekels.toFixed(2)} ₪
            </div>
          </div>
        </div>
      </div>

      {/* Games List */}
      <div className="space-y-4 relative z-10">
        {playerGames.map((game: any, index: number) => {
          const playerInGame = game.players.find((p: any) => {
            const playerId = p.userId._id
              ? p.userId._id.toString()
              : p.userId.toString();
            return playerId === id;
          });

          if (!playerInGame) return null;

          const buyIn = playerInGame.totalApprovedBuyIn || 0;
          const cashOut = playerInGame.cashOut || 0;
          const netProfit = playerInGame.netProfit || 0;
          const netProfitShekels = chipsToShekels(netProfit);

          // מציאת המרוויח הגדול במשחק
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
          const isWinner = winner && winner.userId._id.toString() === id;

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
                      {formatShekels(chipsToShekels(buyIn))}
                    </div>
                  </div>
                </div>
                <div className="p-2 bg-slate-800/50 rounded-full group-hover:bg-amber-500/20 group-hover:text-amber-500 transition-colors">
                  <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-amber-500 transition-colors" />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-700/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">כניסה</span>
                  <span className="text-sm font-mono text-slate-300">
                    {formatChips(buyIn)} ({formatShekels(chipsToShekels(buyIn))}
                    )
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">יציאה</span>
                  <span className="text-sm font-mono text-slate-300">
                    {formatChips(cashOut)} (
                    {formatShekels(chipsToShekels(cashOut))})
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/50">
                  <span className="text-xs text-slate-500">רווח/הפסד</span>
                  <div className="flex items-center gap-2">
                    {isWinner && <Trophy className="w-4 h-4 text-amber-400" />}
                    <span
                      className={cn(
                        "text-sm font-bold",
                        netProfitShekels > 0
                          ? "text-emerald-400"
                          : netProfitShekels < 0
                          ? "text-rose-400"
                          : "text-slate-400"
                      )}
                    >
                      {netProfitShekels > 0 ? "+" : ""}
                      {netProfitShekels.toFixed(2)} ₪
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}

        {playerGames.length === 0 && (
          <div className="text-center py-16 px-6 glass rounded-2xl border-dashed border-2 border-slate-700/50">
            <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-slate-400">
              {player.name} עדיין לא השתתף במשחקים
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

