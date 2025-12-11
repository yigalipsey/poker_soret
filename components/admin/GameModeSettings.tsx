"use client";

import { useState, useEffect } from "react";
import { updateClubGameMode } from "@/app/actions";
import { useRouter } from "next/navigation";
import { Loader2, Gamepad2, Wallet } from "lucide-react";

export default function GameModeSettings({
  clubId,
  currentMode,
  hasActiveGame,
}: {
  clubId: string;
  currentMode?: "free" | "shared_bankroll";
  hasActiveGame?: boolean;
}) {
  const [mode, setMode] = useState<"free" | "shared_bankroll">(
    currentMode || "free"
  );
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // עדכון state כשהפרופס משתנים (אחרי רענון)
  useEffect(() => {
    setMode(currentMode || "free");
  }, [currentMode]);

  async function handleModeChange(newMode: "free" | "shared_bankroll") {
    if (newMode === mode) return;

    // בדיקה אם יש משחק פעיל
    if (hasActiveGame) {
      alert(
        "לא ניתן לשנות מוד משחק כאשר יש משחק פעיל. נא לסיים את המשחק הפעיל תחילה."
      );
      return;
    }

    try {
      setLoading(true);
      const result = await updateClubGameMode(clubId, newMode);

      if (result?.success) {
        setMode(newMode);

        // המתן קצת לפני רענון כדי לוודא שהשמירה הסתיימה
        await new Promise((resolve) => setTimeout(resolve, 300));

        // רענון הדף כדי לטעון את הנתונים המעודכנים
        router.refresh();

        // רענון נוסף אחרי זמן קצר כדי לוודא שהנתונים מעודכנים
        setTimeout(() => {
          router.refresh();
        }, 500);
      } else {
        throw new Error("העדכון נכשל");
      }
    } catch (error: any) {
      console.error("Error updating game mode:", error);
      alert(error?.message || "שגיאה בעדכון מוד המשחק");
      // רענון גם במקרה של שגיאה כדי לטעון את הערך הנכון
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="glass-card p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Gamepad2 className="w-5 h-5 text-purple-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-200">מוד משחק</h2>
        </div>
        {/* אינדיקטור מוד נוכחי */}
        {mode === "shared_bankroll" && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 border border-purple-500/50 rounded-lg">
            <Wallet className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
              קופה משותפת פעילה
            </span>
          </div>
        )}
        {mode === "free" && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/50 rounded-lg">
            <Gamepad2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              מוד חופשי
            </span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {hasActiveGame && (
          <div className="bg-rose-500/10 border border-rose-500/50 rounded-lg p-3 mb-4">
            <p className="text-sm text-rose-400 text-right">
              ⚠️ יש משחק פעיל - לא ניתן לשנות מוד משחק עד לסיום המשחק
            </p>
          </div>
        )}
        <div className="text-sm text-slate-400 mb-4">
          בחר את מוד המשחק למועדון:
        </div>

        {/* Free Mode */}
        <button
          onClick={() => handleModeChange("free")}
          disabled={loading || hasActiveGame}
          className={`
            w-full p-4 rounded-xl border-2 transition-all text-right
            ${
              mode === "free"
                ? "border-emerald-500/50 bg-emerald-500/10"
                : "border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/50"
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {mode === "free" && (
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
              )}
              <div className="text-right">
                <div className="font-bold text-slate-200 mb-1">מוד חופשי</div>
                <div className="text-xs text-slate-400">
                  שחקנים יכולים להיכנס למשחק עם כל סכום זיטונים
                </div>
              </div>
            </div>
            <Gamepad2
              className={`w-5 h-5 ${
                mode === "free" ? "text-emerald-400" : "text-slate-500"
              }`}
            />
          </div>
        </button>

        {/* Shared Bankroll Mode */}
        <button
          onClick={() => handleModeChange("shared_bankroll")}
          disabled={loading || hasActiveGame}
          className={`
            w-full p-4 rounded-xl border-2 transition-all text-right
            ${
              mode === "shared_bankroll"
                ? "border-purple-500/50 bg-purple-500/10"
                : "border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/50"
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {mode === "shared_bankroll" && (
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              )}
              <div className="text-right">
                <div className="font-bold text-slate-200 mb-1">קופה משותפת</div>
                <div className="text-xs text-slate-400">
                  שחקנים קונים זיטונים בשקלים ויכולים להיכנס רק עד יתרת הקופה
                </div>
              </div>
            </div>
            <Wallet
              className={`w-5 h-5 ${
                mode === "shared_bankroll"
                  ? "text-purple-400"
                  : "text-slate-500"
              }`}
            />
          </div>
        </button>

        {loading && (
          <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            מעדכן...
          </div>
        )}
      </div>
    </section>
  );
}
