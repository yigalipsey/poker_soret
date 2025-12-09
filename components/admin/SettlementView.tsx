"use client";
import { useState, useEffect } from "react";
import { calculateSettlementAction } from "@/app/actions";
import {
  Loader2,
  ArrowLeft,
  CheckCircle2,
  Calculator,
  AlertCircle,
  X,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { formatChips, chipsToShekels, formatShekels, cn } from "@/lib/utils";

export default function SettlementView({ game }: { game: any }) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  // If transfers exist, show them. Else show calculate button.
  const hasTransfers =
    game.settlementTransfers && game.settlementTransfers.length > 0;

  // בדיקה אם כל השחקנים יש להם cashOut (יכול להיות 0 אם הפסיד הכל)
  const playersWithoutCashOut = game.players.filter((p: any) => {
    return p.cashOut === undefined || p.cashOut === null;
  });
  const allPlayersHaveCashOut = playersWithoutCashOut.length === 0;

  // חישוב אוטומטי אם אין transfers אבל יש cashOut לכל השחקנים
  useEffect(() => {
    if (!hasTransfers && allPlayersHaveCashOut && !loading) {
      console.log("Auto-calculating settlement:", {
        hasTransfers,
        allPlayersHaveCashOut,
        gameId: game._id,
        players: game.players.map((p: any) => ({
          name: p.userId?.name,
          cashOut: p.cashOut,
          netProfit: p.netProfit,
          totalBuyIn: p.totalApprovedBuyIn,
        })),
      });
      handleCalculate();
    }
  }, [hasTransfers, allPlayersHaveCashOut]); // רץ כשהנתונים משתנים

  async function handleCalculate() {
    try {
      setLoading(true);
      await calculateSettlementAction(game._id);
      router.refresh(); // עדכון הדף כדי להציג את התוצאות
    } catch (error: any) {
      console.error("Error calculating settlement:", error);
      const errorMsg = error?.message || "שגיאה בחישוב ההתחשבנות";
      setErrorMessage(errorMsg);
      setTimeout(() => setErrorMessage(null), 10000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="glass-card p-6 rounded-2xl max-w-2xl mx-auto">
      {/* Error Message */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl border border-rose-500/50 bg-rose-500/10 animate-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-rose-400 font-medium">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-rose-300 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-purple-500/20 rounded-lg">
          <Calculator className="w-5 h-5 text-purple-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-200">סיכום והתחשבנות</h2>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-12 h-12 text-amber-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">מחשב התחשבנות...</p>
        </div>
      ) : !allPlayersHaveCashOut ? (
        <div className="text-center py-12">
          <div className="mb-6 p-4 bg-amber-900/20 border border-amber-500/30 rounded-xl">
            <p className="text-amber-400 font-bold mb-2">
              ⚠️ המשחק לא הסתיים כראוי
            </p>
            <p className="text-slate-400 text-sm">
              יש {playersWithoutCashOut.length} שחקנים שלא הוזן להם cashOut
              סופי. נא לחזור למשחק הפעיל ולהזין את כל ה-cashOut לפני החישוב.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* סיכום בסיסי - תמיד מוצג */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-300 mb-4">
              סיכום שחקנים
            </h3>
            <div className="space-y-2">
              {game.players.map((p: any) => (
                <div
                  key={p.userId._id}
                  className="flex items-center justify-between bg-slate-800/40 p-4 rounded-xl border border-slate-700/50"
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={p.userId.name}
                      imageUrl={p.userId.avatarUrl}
                      size="sm"
                    />
                    <div>
                      <div className="font-medium text-slate-200">
                        {p.userId.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        נכנס: {formatChips(p.totalApprovedBuyIn || 0)} | יצא:{" "}
                        {formatChips(p.cashOut || 0)}
                      </div>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "font-bold font-mono flex items-center gap-1",
                      (p.netProfit || 0) > 0
                        ? "text-emerald-400"
                        : (p.netProfit || 0) < 0
                        ? "text-rose-400"
                        : "text-slate-400"
                    )}
                  >
                    {(p.netProfit || 0) > 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (p.netProfit || 0) < 0 ? (
                      <TrendingDown className="w-4 h-4" />
                    ) : null}
                    {(p.netProfit || 0) > 0 ? "+" : ""}
                    {formatShekels(chipsToShekels(p.netProfit || 0))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* התחשבנות - רק אם יש */}
          {hasTransfers ? (
            <div className="space-y-8">
              <h3 className="text-lg font-bold text-slate-300 mb-4">
                העברות נדרשות
              </h3>
              <div className="space-y-3">
                {game.settlementTransfers.map((t: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center gap-2">
                        <Avatar
                          name={t.payerId.name}
                          imageUrl={t.payerId.avatarUrl}
                          size="sm"
                        />
                        <span className="font-bold text-rose-400 text-lg">
                          {t.payerId.name}
                        </span>
                      </div>
                      <div className="flex-1 flex flex-col items-center px-2">
                        <span className="text-xs text-slate-500 mb-1">
                          מעביר ל
                        </span>
                        <div className="h-[1px] w-full bg-slate-700 relative">
                          <ArrowLeft className="w-3 h-3 text-slate-500 absolute top-1/2 left-0 -translate-y-1/2" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-400 text-lg">
                          {t.receiverId.name}
                        </span>
                        <Avatar
                          name={t.receiverId.name}
                          imageUrl={t.receiverId.avatarUrl}
                          size="sm"
                        />
                      </div>
                    </div>
                    <div className="font-mono font-bold text-amber-400 text-xl ml-4 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
                      ₪{t.amount}
                    </div>
                  </div>
                ))}
                {game.settlementTransfers.length === 0 && (
                  <div className="text-center py-8 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                    <p className="text-emerald-400 font-bold text-lg">
                      כולם מאוזנים! אין העברות נדרשות.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : errorMessage ? (
            <div className="text-center py-8 bg-amber-500/10 rounded-xl border border-amber-500/20">
              <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-2" />
              <p className="text-amber-400 font-bold text-lg mb-2">
                לא ניתן לחשב התחשבנות
              </p>
              <p className="text-slate-400 text-sm">{errorMessage}</p>
              <p className="text-slate-500 text-xs mt-4">
                המשחק הסתיים בהצלחה. הסיכום הבסיסי מוצג למעלה.
              </p>
            </div>
          ) : (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 text-amber-400 animate-spin mx-auto mb-4" />
              <p className="text-slate-400">מחשב התחשבנות...</p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
