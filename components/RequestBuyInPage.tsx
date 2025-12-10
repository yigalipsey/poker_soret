"use client";

import { useState } from "react";
import { requestBuyIn } from "@/app/actions";
import { useRouter } from "next/navigation";
import { Loader2, Coins } from "lucide-react";
import { formatChips, formatShekels, chipsToShekels } from "@/lib/utils";

export default function RequestBuyInPage({
  game,
  currentUser,
}: {
  game: any;
  currentUser: any;
}) {
  const [amount, setAmount] = useState(20000);
  const [customAmount, setCustomAmount] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const userId = currentUser?._id;
  const player = userId
    ? game.players.find((p: any) => p.userId._id === userId)
    : null;

  // אם המשתמש לא מחובר או לא משתתף במשחק
  if (!currentUser) {
    return (
      <div className="glass-card p-8 rounded-2xl text-center">
        <p className="text-slate-400 mb-4">נא להתחבר תחילה</p>
        <a
          href="/player-login"
          className="text-emerald-400 hover:text-emerald-300 underline"
        >
          התחבר עכשיו
        </a>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="glass-card p-8 rounded-2xl text-center">
        <p className="text-slate-400 mb-4">
          אינך משתתף במשחק זה. פנה למנהל המשחק להוספתך.
        </p>
        <a
          href={`/game/${game._id}`}
          className="text-emerald-400 hover:text-emerald-300 underline"
        >
          חזור למשחק
        </a>
      </div>
    );
  }

  const chipOptions = [
    { value: 2000, label: "2,000 (₪20)" },
    { value: 4000, label: "4,000 (₪40)" },
    { value: 5000, label: "5,000 (₪50)" },
    { value: 8000, label: "8,000 (₪80)" },
    { value: 10000, label: "10,000 (₪100)" },
    { value: 20000, label: "20,000 (₪200)" },
    { value: 40000, label: "40,000 (₪400)" },
    { value: 50000, label: "50,000 (₪500)" },
    { value: 80000, label: "80,000 (₪800)" },
    { value: 100000, label: "100,000 (₪1,000)" },
    { value: 200000, label: "200,000 (₪2,000)" },
    { value: 400000, label: "400,000 (₪4,000)" },
    { value: 500000, label: "500,000 (₪5,000)" },
    { value: 800000, label: "800,000 (₪8,000)" },
    { value: 1000000, label: "1,000,000 (₪10,000)" },
    { value: "custom", label: "אחר" },
  ];

  async function handleRequest() {
    const finalAmount = showCustomInput ? Number(customAmount) || 0 : amount;

    if (finalAmount <= 0) {
      alert("נא לבחור סכום כניסה");
      return;
    }

    setLoading(true);
    try {
      await requestBuyIn(game._id, userId!, finalAmount);
      router.push(`/game/${game._id}`);
      router.refresh();
    } catch (error: any) {
      alert(error?.message || "שגיאה בשליחת בקשה");
    } finally {
      setLoading(false);
    }
  }

  const selectedAmount = showCustomInput ? Number(customAmount) || 0 : amount;

  return (
    <div className="glass-card p-6 rounded-2xl space-y-6">
      {/* Amount Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-400 mb-3">
          בחר סכום כניסה נוספת
        </label>
        <select
          value={showCustomInput ? "custom" : amount}
          onChange={(e) => {
            if (e.target.value === "custom") {
              setShowCustomInput(true);
            } else {
              setShowCustomInput(false);
              setAmount(Number(e.target.value));
            }
          }}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-lg"
        >
          {chipOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Custom Input */}
      {showCustomInput && (
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-3">
            הזן סכום מותאם
          </label>
          <input
            type="number"
            min="0"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            placeholder="הזן זיטונים"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-lg"
          />
        </div>
      )}

      {/* Selected Amount Preview */}
      <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl">
        <div className="flex items-center gap-2 mb-2">
          <Coins className="w-5 h-5 text-emerald-400" />
          <div className="text-sm text-slate-400">סכום נבחר</div>
        </div>
        <div className="text-3xl font-bold text-emerald-400 font-mono mb-1">
          {formatChips(selectedAmount)}
        </div>
        <div className="text-sm text-slate-500">
          {formatShekels(chipsToShekels(selectedAmount))}
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleRequest}
        disabled={
          loading ||
          (showCustomInput
            ? !customAmount || Number(customAmount) <= 0
            : amount <= 0)
        }
        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-4 rounded-xl font-bold text-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            שולח בקשה...
          </>
        ) : (
          "שלח בקשה למנהל"
        )}
      </button>

      {/* Info */}
      <div className="text-xs text-slate-500 text-center pt-2 border-t border-slate-700/50">
        הבקשה תישלח למנהל המשחק לאישור
      </div>
    </div>
  );
}
