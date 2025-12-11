"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  History,
  ChevronDown,
  ChevronUp,
  Calendar,
  Coins,
  Trophy,
  Users,
  ChevronLeft,
  Trash2,
  Loader2,
  Wallet,
} from "lucide-react";
import { chipsToShekels, formatChips } from "@/lib/utils";

export default function GameHistoryList({ gameHistory }: { gameHistory: any }) {
  const [showHistory, setShowHistory] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  async function handleDeleteGame(gameId: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("האם אתה בטוח שברצונך למחוק משחק זה?")) {
      return;
    }

    setDeletingId(gameId);
    try {
      const response = await fetch(`/api/delete-game?id=${gameId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.refresh();
      } else {
        const error = await response.json();
        alert(error.error || "שגיאה במחיקת משחק");
      }
    } catch (error) {
      console.error("Error deleting game:", error);
      alert("שגיאה במחיקת משחק");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="border-t border-slate-800/50 pt-8">
      <button
        onClick={() => setShowHistory(!showHistory)}
        className="w-full flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800/70 rounded-xl border border-slate-700/50 transition group"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg group-hover:bg-indigo-500/30 transition">
            <History className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold text-slate-200">
              היסטוריית משחקים
            </h2>
            <p className="text-xs text-slate-400">
              {gameHistory?.length || 0} משחקים
            </p>
          </div>
        </div>
        {showHistory ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>

      {showHistory && (
        <div className="mt-4 space-y-4">
          {gameHistory && gameHistory.length > 0 ? (
            gameHistory.map((game: any, index: number) => {
              const totalPot = game.players.reduce(
                (acc: number, p: any) => acc + (p.totalApprovedBuyIn || 0),
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
              const hasSettlement =
                game.settlementTransfers && game.settlementTransfers.length > 0;

              return (
                <div
                  key={game._id}
                  className="glass-card p-5 rounded-2xl hover:border-slate-500/30 transition-all duration-300 group"
                >
                  {/* Link content */}
                  <Link href={`/admin/game/${game._id}`} className="block">
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
                            <Coins className="w-4 h-4 text-amber-500" />₪
                            {chipsToShekels(totalPot).toFixed(2)}
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
                              +
                              {chipsToShekels(winner.netProfit || 0).toFixed(2)}{" "}
                              ₪
                            </span>
                            <span className="text-sm text-slate-300 font-medium">
                              {winner.userId.name}
                            </span>
                            <Trophy className="w-4 h-4 text-amber-400" />
                          </div>
                        </div>
                      )}
                      {hasSettlement && (
                        <div
                          className={`flex items-center justify-between ${
                            winner ? "pt-2 border-t border-slate-800/50" : ""
                          }`}
                        >
                          <span className="text-xs text-slate-500">
                            התחשבנות
                          </span>
                          <span className="text-xs text-purple-400 font-medium">
                            {game.settlementTransfers.length} העברות
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Delete button - on separate row */}
                  <div className="mt-4 pt-4 border-t border-slate-700/50 flex justify-end">
                    <button
                      onClick={(e) => handleDeleteGame(game._id, e)}
                      disabled={deletingId === game._id}
                      className="p-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                      title="מחק משחק"
                    >
                      {deletingId === game._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-16 px-6 glass rounded-2xl border-dashed border-2 border-slate-700/50">
              <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-slate-600" />
              </div>
              <p className="text-slate-400">לא נמצאו משחקים שהסתיימו</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
