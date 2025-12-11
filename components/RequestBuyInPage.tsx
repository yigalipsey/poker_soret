"use client";

import { useState } from "react";
import { requestBuyIn } from "@/app/actions";
import { useRouter } from "next/navigation";
import { Loader2, Coins, Clock } from "lucide-react";
import { formatChips, formatShekels, chipsToShekels } from "@/lib/utils";

export default function RequestBuyInPage({
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
  const [amount, setAmount] = useState(0);
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

  // אם יש בקשה ממתינה, הצג הודעה במקום הטופס
  if (userPendingRequest) {
    const requestDate = new Date(userPendingRequest.timestamp).toLocaleString(
      "he-IL"
    );
    return (
      <div className="glass-card p-6 rounded-2xl border border-amber-500/30 bg-amber-500/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-500/20 rounded-lg">
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-200 text-right">
            בקשה כניסה קיימת ממתינה לאישור
          </h3>
        </div>
        <div className="text-right space-y-3">
          <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
            <p className="text-amber-300 text-sm mb-2">
              יש לך בקשה ממתינה לכניסה נוספת עם{" "}
              <span className="font-bold text-amber-400">
                {formatChips(userPendingRequest.amount)}
              </span>{" "}
              זיטונים
            </p>
            <p className="text-amber-300/70 text-xs">נשלח ב-{requestDate}</p>
          </div>
          <p className="text-amber-300/70 text-xs">
            המנהל יקבל מייל ויאשר את הבקשה בקרוב. נא לאשר את הבקשה הזו לפני
            שליחת בקשה חדשה.
          </p>
          <a
            href={`/game/${game._id}`}
            className="block w-full bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-lg font-medium transition text-center text-sm"
          >
            חזור למשחק
          </a>
        </div>
      </div>
    );
  }

  const chipOptions = [
    { value: 0, label: "בחר סכום" },
    { value: 1000, label: "1,000 (₪10)" },
    { value: 2000, label: "2,000 (₪20)" },
    { value: 3000, label: "3,000 (₪30)" },
    { value: 4000, label: "4,000 (₪40)" },
    { value: 5000, label: "5,000 (₪50)" },
    { value: 6000, label: "6,000 (₪60)" },
    { value: 7000, label: "7,000 (₪70)" },
    { value: 8000, label: "8,000 (₪80)" },
    { value: 9000, label: "9,000 (₪90)" },
    { value: 10000, label: "10,000 (₪100)" },
    { value: 12000, label: "12,000 (₪120)" },
    { value: 15000, label: "15,000 (₪150)" },
    { value: 18000, label: "18,000 (₪180)" },
    { value: 20000, label: "20,000 (₪200)" },
    { value: "custom", label: "אחר" },
  ];

  async function handleRequest() {
    const finalAmount = showCustomInput
      ? (Number(customAmount) || 0) * 1000
      : amount;

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

  const selectedAmount = showCustomInput
    ? (Number(customAmount) || 0) * 1000
    : amount;

  // חישוב יתרה זמינה (יתרה פחות כניסות מאושרות)
  const availableBankroll =
    club?.gameMode === "shared_bankroll" && currentUser
      ? (currentUser.bankroll || 0) - (player?.totalApprovedBuyIn || 0)
      : Infinity;

  return (
    <div className="glass-card p-6 rounded-2xl space-y-6">
      {/* יתרת קופה - רק במוד קופה משותפת */}
      {club?.gameMode === "shared_bankroll" && currentUser && (
        <div className="bg-purple-900/20 p-4 rounded-xl border border-purple-500/30">
          <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">
            יתרה זמינה
          </div>
          <div className="text-2xl font-bold text-purple-400 font-mono">
            {formatChips(availableBankroll)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            יתרה כוללת: {formatChips(currentUser.bankroll || 0)} | כניסות
            מאושרות: {formatChips(player?.totalApprovedBuyIn || 0)}
          </div>
        </div>
      )}

      {/* אזהרה אם הכניסה גדולה מהיתרה */}
      {club?.gameMode === "shared_bankroll" &&
        selectedAmount > availableBankroll && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg">
            <p className="text-xs text-rose-400 text-right">
              ⚠️ הכניסה המבוקשת גדולה מהיתרה הזמינה! יתרה זמינה:{" "}
              {formatChips(availableBankroll)}, מבוקש:{" "}
              {formatChips(selectedAmount)}
            </p>
          </div>
        )}
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
            הזן סכום מותאם (באלפים)
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="לדוגמה: 54"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-lg"
            />
            {customAmount && Number(customAmount) > 0 && (
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                = {formatChips(Number(customAmount) * 1000)} (
                {formatShekels(chipsToShekels(Number(customAmount) * 1000))})
              </div>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            הערך יוכפל ב-1,000 אוטומטית (לדוגמה: 54 = 54,000 זיטונים)
          </p>
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
