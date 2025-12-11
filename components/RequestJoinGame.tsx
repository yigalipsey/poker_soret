"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestJoinGame } from "@/app/actions";
import {
  Loader2,
  UserPlus,
  AlertCircle,
  X,
  CheckCircle,
  Clock,
} from "lucide-react";
import { formatChips, chipsToShekels, formatShekels } from "@/lib/utils";

export default function RequestJoinGame({
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
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  // בדיקה אם השחקן כבר במשחק
  const userId = currentUser?._id;
  const player = userId
    ? game.players.find((p: any) => {
        const playerId = p.userId._id
          ? p.userId._id.toString()
          : p.userId.toString();
        return playerId === userId;
      })
    : null;

  // אם השחקן כבר במשחק או לא מחובר, לא להציג כלום
  if (!currentUser || player) {
    return null;
  }

  // אם יש בקשה ממתינה, הצג הודעה במקום הטופס
  if (userPendingRequest) {
    const requestDate = new Date(userPendingRequest.createdAt).toLocaleString(
      "he-IL"
    );
    return (
      <div className="glass-card p-4 rounded-xl border border-amber-500/30 bg-amber-500/10">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-amber-500/20 rounded-lg">
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-200 text-right">
            בקשה ממתינה לאישור
          </h3>
        </div>
        <div className="text-right space-y-2">
          <p className="text-amber-300 text-sm">
            יש לך בקשה ממתינה להצטרפות למשחק עם{" "}
            <span className="font-bold">
              {formatChips(userPendingRequest.amount)}
            </span>{" "}
            זיטונים
          </p>
          <p className="text-amber-300/70 text-xs">נשלח ב-{requestDate}</p>
          <p className="text-amber-300/70 text-xs">
            המנהל יקבל מייל ויאשר את הבקשה בקרוב
          </p>
        </div>
      </div>
    );
  }

  const chipsPerShekel = club?.chipsPerShekel || 100;
  const isSharedBankroll =
    game.isSharedBankroll || club?.gameMode === "shared_bankroll";
  const currentBankroll = currentUser?.bankroll || 0;

  const handleRequest = async () => {
    const amountNum = Number(amount);
    if (!amountNum || amountNum <= 0) {
      setErrorMessage("נא להזין סכום תקין");
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    // בדיקה במצב קופה משותפת
    if (isSharedBankroll) {
      if (currentBankroll === 0) {
        setErrorMessage("אין כסף מוטען בקופה. נא להטעין כסף תחילה מהפרופיל.");
        setTimeout(() => setErrorMessage(null), 5000);
        return;
      }

      if (amountNum > currentBankroll) {
        setErrorMessage(
          `אין מספיק זיטונים בקופה. יתרה נוכחית: ${formatChips(
            currentBankroll
          )}`
        );
        setTimeout(() => setErrorMessage(null), 5000);
        return;
      }
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      await requestJoinGame(game._id, amountNum);
      setAmount("");
      setSuccessMessage(
        `בקשה להצטרפות עם ${formatChips(
          amountNum
        )} נשלחה למנהל. תקבל עדכון לאחר אישור הבקשה.`
      );
      setTimeout(() => {
        setSuccessMessage(null);
        router.refresh();
      }, 5000);
    } catch (error: any) {
      setErrorMessage(error?.message || "שגיאה בשליחת הבקשה");
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-4 rounded-xl border border-blue-500/30 bg-blue-500/10">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <UserPlus className="w-5 h-5 text-blue-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-200 text-right">
          בקשה להצטרפות למשחק
        </h3>
      </div>

      {successMessage && (
        <div className="mb-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm text-right flex items-start gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-3 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-sm text-right flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {isSharedBankroll && (
        <div className="mb-3 p-2 bg-purple-500/10 border border-purple-500/30 rounded-lg text-xs text-purple-400 text-right">
          יתרה בקופה: {formatChips(currentBankroll)}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1 text-right">
            סכום כניסה (זיטונים)
          </label>
          <input
            type="number"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="לדוגמה: 5000"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none transition text-right"
            disabled={loading}
          />
          {amount && Number(amount) > 0 && (
            <div className="text-xs text-slate-500 mt-1 text-right">
              = {formatShekels(chipsToShekels(Number(amount), chipsPerShekel))}
            </div>
          )}
        </div>

        <button
          onClick={handleRequest}
          disabled={
            loading ||
            !amount ||
            Number(amount) <= 0 ||
            (isSharedBankroll && Number(amount) > currentBankroll)
          }
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              שלח בקשה להצטרפות
            </>
          )}
        </button>
      </div>
    </div>
  );
}
