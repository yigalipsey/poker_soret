"use client";
import { useState, useEffect } from "react";
import { logoutPlayer } from "@/app/actions";
import { Coins, Clock, TrendingUp, Users, LogOut, Plus } from "lucide-react";
import { cn, formatChips, chipsToShekels, formatShekels } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import Link from "next/link";

import RequestJoinGame from "@/components/RequestJoinGame";

export default function PlayerGameClient({
  game,
  currentUser,
  club,
  userPendingRequest,
}: {
  game: any;
  currentUser: any;
  club?: any;
  userPendingRequest?: any;
}) {
  const [elapsedTime, setElapsedTime] = useState("");
  const router = useRouter();

  // Calculate elapsed time
  useEffect(() => {
    const updateElapsedTime = () => {
      const now = new Date();
      const start = new Date(game.date);
      const diff = now.getTime() - start.getTime();

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setElapsedTime(`${hours}:${minutes.toString().padStart(2, "0")}`);
    };

    updateElapsedTime();
    const interval = setInterval(updateElapsedTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [game.date]);

  const userId = currentUser?._id;
  const player = userId
    ? game.players.find((p: any) => p.userId._id === userId)
    : null;

  async function handleLogout() {
    await logoutPlayer();
    router.push("/player-login");
    router.refresh();
  }

  const pendingTotal = player
    ? player.buyInRequests
        .filter((r: any) => r.status === "pending")
        .reduce((acc: number, r: any) => acc + r.amount, 0)
    : 0;

  // Get all approved buy-ins with timestamps
  const approvedBuyIns = player
    ? player.buyInRequests
        .filter((r: any) => r.status === "approved")
        .sort(
          (a: any, b: any) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        )
    : [];

  // Check if there are multiple buy-ins or non-initial buy-ins
  const hasMultipleBuyIns =
    approvedBuyIns.length > 1 ||
    approvedBuyIns.some((buyIn: any) => !buyIn.isInitial);

  return (
    <div className="min-h-screen px-4 pt-4 pb-24 max-w-md mx-auto space-y-6">
      {/* Header */}
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-300">
            {currentUser && player
              ? `שלום, ${player.userId.name}`
              : "צפייה במשחק"}
          </h1>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Clock className="w-3 h-3" />
            <span>זמן משחק: {elapsedTime}</span>
          </div>
        </div>
      </header>

      {/* Request Join Game - Only if logged in and NOT a player - בראש הדף */}
      {currentUser && !player && game.isActive && (
        <RequestJoinGame
          game={game}
          currentUser={currentUser}
          club={club}
          userPendingRequest={userPendingRequest}
        />
      )}

      {/* Current Balance Card - Only if player is logged in and has multiple buy-ins */}
      {currentUser && player && hasMultipleBuyIns && (
        <>
          <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 text-center space-y-2 shadow-2xl">
            <div className="text-slate-400 text-sm uppercase tracking-wider">
              אושר לכניסה
            </div>
            <div className="text-5xl font-bold text-emerald-400 font-mono">
              {formatChips(player.totalApprovedBuyIn)}
            </div>
            <div className="text-slate-500 text-sm">
              ({formatShekels(chipsToShekels(player.totalApprovedBuyIn))})
            </div>
          </div>

          {/* Pending Alert */}
          {pendingTotal > 0 && (
            <div className="bg-amber-900/20 p-4 rounded-xl border border-amber-500/30 text-center animate-pulse">
              <div className="text-amber-400 font-bold">
                ממתין לאישור: {formatChips(pendingTotal)} (
                {formatShekels(chipsToShekels(pendingTotal))})
              </div>
            </div>
          )}
        </>
      )}

      {/* Pending Alert - Show even if only initial buy-in */}
      {currentUser && player && !hasMultipleBuyIns && pendingTotal > 0 && (
        <div className="bg-amber-900/20 p-4 rounded-xl border border-amber-500/30 text-center animate-pulse">
          <div className="text-amber-400 font-bold">
            ממתין לאישור: {formatChips(pendingTotal)} (
            {formatShekels(chipsToShekels(pendingTotal))})
          </div>
        </div>
      )}

      {/* Not logged in message */}
      {!currentUser && (
        <div className="bg-blue-900/20 p-4 rounded-xl border border-blue-500/30 text-center">
          <div className="text-blue-400 font-medium mb-2">
            להתחברות כדי לבקש זיטונים
          </div>
          <Link
            href="/player-login"
            className="text-blue-300 text-sm underline hover:text-blue-200"
          >
            התחבר עכשיו
          </Link>
        </div>
      )}

      {/* Pot Summary */}
      {(() => {
        const totalChipsInPot = game.players.reduce(
          (sum: number, p: any) => sum + (p.totalApprovedBuyIn || 0),
          0
        );
        return (
          <div className="glass p-4 rounded-xl">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Coins className="w-4 h-4" />
              סיכום קופה
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                <div className="text-xs text-slate-500 mb-1">סך זיטונים</div>
                <div className="text-lg font-bold text-emerald-400 font-mono">
                  {formatChips(totalChipsInPot)}
                </div>
              </div>
              <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                <div className="text-xs text-slate-500 mb-1">בשקלים</div>
                <div className="text-lg font-bold text-emerald-400">
                  {formatShekels(chipsToShekels(totalChipsInPot))}
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-700/50">
              <div className="text-xs text-slate-500 mb-1">כניסות כוללות</div>
              <div className="text-sm font-bold text-amber-400 font-mono">
                {formatChips(totalChipsInPot)} (
                {formatShekels(chipsToShekels(totalChipsInPot))})
              </div>
            </div>
          </div>
        );
      })()}

      {/* All Players Status */}
      <div className="glass p-4 rounded-xl">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Users className="w-4 h-4" />
          שחקנים בשולחן
        </h3>
        <div className="space-y-2">
          {game.players.map((p: any) => (
            <div
              key={p.userId._id}
              className={cn(
                "flex justify-between items-center p-2 rounded-lg",
                p.userId._id === userId
                  ? "bg-amber-500/10 border border-amber-500/30"
                  : "bg-slate-800/30"
              )}
            >
              <div className="flex items-center gap-3">
                <Avatar
                  name={p.userId.name}
                  imageUrl={p.userId.avatarUrl}
                  size="sm"
                />
                <span
                  className={cn(
                    "font-medium",
                    p.userId._id === userId
                      ? "text-amber-400"
                      : "text-slate-400"
                  )}
                >
                  {p.userId.name}
                </span>
              </div>
              <span className="text-emerald-400 font-mono text-sm">
                {formatChips(p.totalApprovedBuyIn)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Buy-in History */}
      {approvedBuyIns.length > 0 && (
        <div className="glass p-4 rounded-xl">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            היסטוריית כניסות
          </h3>
          <div className="space-y-2">
            {approvedBuyIns.map((buyIn: any, index: number) => {
              const timestamp = new Date(buyIn.timestamp);
              const timeStr = timestamp.toLocaleTimeString("he-IL", {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "Asia/Jerusalem",
              });
              const isInitial = buyIn.isInitial || false;
              const addedBy = buyIn.addedBy || "admin";

              return (
                <div
                  key={buyIn._id || index}
                  className="p-3 bg-slate-800/50 rounded-lg space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 text-xs font-bold">
                        {index + 1}
                      </div>
                      <span className="text-slate-300 font-mono font-bold">
                        {formatChips(buyIn.amount)}
                      </span>
                      <span className="text-xs text-slate-500">
                        ({formatShekels(chipsToShekels(buyIn.amount))})
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                      {timeStr}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {isInitial && (
                      <span className="text-xs bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded">
                        כניסה ראשונית
                      </span>
                    )}
                    <span className="text-xs text-slate-400">
                      {addedBy === "admin"
                        ? "👤 הוסף על ידי מנהל"
                        : "👤 בקשה שלך שאושרה"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Request Buy-in Button - Only if logged in and is a player */}
      {currentUser && player && game.isActive && (
        <Link
          href={`/game/${game._id}/request-buyin`}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-xl flex items-center justify-center gap-3 shadow-lg shadow-blue-900/20 transition"
        >
          <Plus className="w-5 h-5" />
          בקשה לכניסה נוספת
        </Link>
      )}

      {/* Logout Button - Only if logged in */}
      {currentUser && (
        <div className="fixed bottom-4 left-0 right-0 max-w-md mx-auto px-4">
          <button
            onClick={handleLogout}
            className="w-full bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700 py-3 rounded-xl font-medium transition flex items-center justify-center gap-2 backdrop-blur-sm"
          >
            <LogOut className="w-4 h-4" />
            התנתק
          </button>
        </div>
      )}
    </div>
  );
}
