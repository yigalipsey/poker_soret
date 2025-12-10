import {
  getUsers,
  getActiveGame,
  getGameHistory,
  getClubSession,
  getClub,
  getPlayerSession,
} from "./actions";
import connectDB from "@/lib/db";
import Club from "@/models/Club";
import User from "@/models/User";
import Link from "next/link";
import { cn, chipsToShekels, formatChips, formatShekels } from "@/lib/utils";
import {
  Trophy,
  Users,
  Wallet,
  ArrowRight,
  Crown,
  Sparkles,
  PlayCircle,
  Calendar,
  Building2,
} from "lucide-react";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { TiltCard } from "@/components/ui/TiltCard";
import { Avatar } from "@/components/ui/Avatar";
import ClubLoginScreen from "@/components/ClubLoginScreen";
import ClubLogoutButton from "@/components/ClubLogoutButton";
import QuickBuyInRequest from "@/components/QuickBuyInRequest";

export const dynamic = "force-dynamic";

export default async function Home() {
  const clubId = await getClubSession();

  // If no club session, show login/creation screen
  if (!clubId) {
    return (
      <div className="min-h-screen flex items-start justify-center pt-8 px-4">
        <ClubLoginScreen />
      </div>
    );
  }

  const club = await getClub(clubId);
  const currentUser = await getPlayerSession();

  const [users, activeGame, history] = await Promise.all([
    getUsers(clubId),
    getActiveGame(clubId),
    getGameHistory(clubId),
  ]);

  // מאזן מועדון כולל - סכום של כל ה-globalBalance של המשתמשים
  // הערה: globalBalance לא מתעדכן יותר כי עברנו להתחשבנות לפי משחק ספציפי
  // זה מציג את הסכום המצטבר הישן
  const lastGame = history[0];

  // Calculate total games and total money played (in shekels)
  const totalGames = history.length;
  const totalMoneyPlayedChips = history.reduce((acc: number, game: any) => {
    return (
      acc +
      game.players.reduce((gameAcc: number, player: any) => {
        return gameAcc + (player.totalApprovedBuyIn || 0);
      }, 0)
    );
  }, 0);
  const totalMoneyPlayed = chipsToShekels(totalMoneyPlayedChips); // המרה לשקלים

  // Sort users by balance (descending) to highlight top players
  const sortedUsers = [...users].sort(
    (a, b) => b.globalBalance - a.globalBalance
  );

  return (
    <div className="min-h-screen pb-24 px-4 pt-4 max-w-md mx-auto relative overflow-hidden">
      {/* Header */}
      <header className="mb-6 relative z-10">
        {/* Logout button - top right */}
        <div className="flex justify-start mb-4">
          <ClubLogoutButton />
        </div>

        {/* Title - below button */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gradient tracking-tight flex items-center gap-2 justify-center">
            {club?.name || "מועדון"}{" "}
            <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
          </h1>
        </div>
      </header>

      {/* Live Game Banner */}
      {activeGame &&
        (() => {
          const totalChipsInPot = activeGame.players.reduce(
            (sum: number, p: any) => sum + (p.totalApprovedBuyIn || 0),
            0
          );
          return (
            <div className="mb-8">
              <Link href={`/game/${activeGame._id}`}>
                <TiltCard
                  className="cursor-pointer"
                  glowColor="rgba(244, 63, 94, 0.3)"
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-500 to-orange-500 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse-slow"></div>
                  <div className="relative glass-card p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-rose-500/20 rounded-full flex items-center justify-center animate-pulse">
                          <PlayCircle className="w-6 h-6 text-rose-500" />
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-lg flex items-center gap-2">
                            משחק פעיל כעת
                            <span className="flex h-2 w-2 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                            </span>
                          </h3>
                          <p className="text-slate-400 text-sm">
                            {activeGame.players.length} שחקנים בשולחן
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-white transition-transform group-hover:translate-x-1" />
                    </div>
                    <div className="pt-3 border-t border-slate-700/50 grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-slate-500 mb-1">
                          סך זיטונים
                        </div>
                        <div className="text-lg font-bold text-emerald-400 font-mono">
                          {formatChips(totalChipsInPot)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 mb-1">
                          בשקלים
                        </div>
                        <div className="text-lg font-bold text-emerald-400">
                          {formatShekels(chipsToShekels(totalChipsInPot))}
                        </div>
                      </div>
                    </div>
                  </div>
                </TiltCard>
              </Link>
              <div className="mt-3">
                <QuickBuyInRequest
                  game={activeGame}
                  currentUser={currentUser}
                />
              </div>
            </div>
          );
        })()}

      {/* Last Session Highlight (if no active game) */}
      {!activeGame && lastGame && (
        <div className="mb-8">
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3 px-1 text-right">
            המשחק האחרון
          </h3>
          <Link href={`/game/${lastGame._id}`}>
            <div className="glass p-4 rounded-xl hover:bg-slate-800/60 transition group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>

              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700">
                    <Calendar className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <div className="text-slate-200 font-bold">
                      {new Date(lastGame.date).toLocaleDateString("he-IL", {
                        day: "numeric",
                        month: "long",
                      })}
                    </div>
                    <div className="text-xs text-slate-500">
                      מחזור: ₪
                      {chipsToShekels(
                        lastGame.players.reduce(
                          (acc: number, p: any) =>
                            acc + (p.totalApprovedBuyIn || 0),
                          0
                        )
                      ).toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Winner of last game */}
                <div className="text-right">
                  <div className="text-xs text-slate-500 mb-0.5">
                    המרוויח הגדול
                  </div>
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="font-bold text-emerald-400">
                      {(() => {
                        const winner = lastGame.players.reduce(
                          (prev: any, current: any) =>
                            prev.netProfit > current.netProfit ? prev : current
                        );
                        return winner.userId.name;
                      })()}
                    </span>
                    <Trophy className="w-3 h-3 text-amber-400" />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Hero Stats - Premium Card */}
      <TiltCard
        className="glass-card rounded-3xl p-8 mb-10 overflow-hidden group animate-fade-in shadow-2xl shadow-amber-900/10"
        glowColor="rgba(251, 191, 36, 0.2)"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-50"></div>
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl group-hover:bg-amber-500/30 transition-all duration-700"></div>
        <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Game Statistics */}
          <div className="w-full flex items-center justify-center gap-6">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                <PlayCircle className="w-3.5 h-3.5" />
                <span>משחקים</span>
              </div>
              <div className="text-lg font-bold text-white">{totalGames}</div>
            </div>
            <div className="w-px h-8 bg-amber-500/20"></div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>סך הכל ששוחק</span>
              </div>
              <div className="text-lg font-bold text-white flex items-center gap-1">
                <AnimatedCounter value={Math.round(totalMoneyPlayed)} />
                <span className="text-sm text-amber-400/80 font-bold">₪</span>
              </div>
            </div>
          </div>
        </div>
      </TiltCard>

      {/* Players List */}
      <div className="space-y-6 relative z-10">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2 text-right">
            דירוג שחקנים
          </h2>
          <span className="text-xs font-medium text-slate-400 bg-slate-800/40 px-3 py-1 rounded-full border border-slate-700/50">
            {users.length} חברים פעילים
          </span>
        </div>

        <div className="grid gap-4">
          {sortedUsers.map((user: any, index: number) => (
            <Link
              href={`/player/${user._id}`}
              key={user._id}
              className={cn(
                "relative overflow-hidden rounded-2xl p-4 transition-all duration-300 animate-slide-up group cursor-pointer",
                index < 3
                  ? "glass-card border-amber-500/20"
                  : "glass border-slate-700/30 hover:bg-slate-800/60"
              )}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Shimmer effect for top 3 */}
              {index < 3 && (
                <div className="absolute inset-0 shimmer-bg opacity-30 pointer-events-none"></div>
              )}

              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {index === 0 && (
                      <div className="absolute -top-3 -right-2 z-10">
                        <Crown className="w-6 h-6 text-amber-400 animate-bounce" />
                      </div>
                    )}
                    <Avatar
                      name={user.name}
                      imageUrl={user.avatarUrl}
                      size="lg"
                      className={cn(
                        "border-2",
                        index === 0
                          ? "border-amber-400 shadow-amber-500/20 shadow-lg"
                          : index === 1
                          ? "border-slate-300 shadow-slate-500/20 shadow-lg"
                          : index === 2
                          ? "border-orange-400 shadow-orange-500/20 shadow-lg"
                          : "border-slate-700"
                      )}
                    />
                    {index < 3 && (
                      <div className="absolute -bottom-1 -right-1 bg-slate-900 rounded-full w-5 h-5 flex items-center justify-center border border-slate-700 text-[10px] font-bold">
                        {index + 1}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3
                      className={cn(
                        "font-bold text-lg transition-colors",
                        index < 3
                          ? "text-white"
                          : "text-slate-300 group-hover:text-white"
                      )}
                    >
                      {user.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider",
                          user.globalBalance > 0
                            ? "bg-emerald-500/10 text-emerald-400"
                            : user.globalBalance < 0
                            ? "bg-rose-500/10 text-rose-400"
                            : "bg-slate-500/10 text-slate-400"
                        )}
                      >
                        {user.globalBalance > 0
                          ? "מורווח"
                          : user.globalBalance < 0
                          ? "מופסד"
                          : "מאוזן"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={cn(
                      "text-lg font-bold tracking-tight flex items-center gap-1 justify-end",
                      user.globalBalance > 0
                        ? "text-emerald-400"
                        : user.globalBalance < 0
                        ? "text-rose-400"
                        : "text-slate-400"
                    )}
                  >
                    {user.globalBalance > 0 ? "+" : ""}
                    {user.globalBalance.toLocaleString()}
                    <span className="text-xs font-normal opacity-70">₪</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}

          {users.length === 0 && (
            <div className="text-center py-16 px-6 text-slate-500 glass rounded-2xl border-dashed border-2 border-slate-700/50">
              <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-slate-600" />
              </div>
              <p className="text-lg font-medium text-slate-400">
                אין שחקנים עדיין
              </p>
              <p className="text-sm text-slate-600 mb-6">
                התחל להוסיף שחקנים כדי לראות סטטיסטיקות
              </p>
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 hover:-translate-y-1"
              >
                הוסף שחקן ראשון <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
