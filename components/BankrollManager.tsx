"use client";

import { useState } from "react";
import {
  depositToBankroll,
  withdrawFromBankroll,
  getBankrollHistory,
} from "@/app/actions";
import {
  Loader2,
  Wallet,
  TrendingUp,
  TrendingDown,
  History,
} from "lucide-react";
import { formatChips, formatShekels, chipsToShekels } from "@/lib/utils";

export default function BankrollManager({
  userId,
  currentBankroll,
  chipsPerShekel,
}: {
  userId: string;
  currentBankroll: number;
  chipsPerShekel: number;
}) {
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  async function handleDeposit() {
    const amount = Number(depositAmount);
    if (!amount || amount <= 0) {
      alert("נא להזין סכום תקין");
      return;
    }

    try {
      setLoading(true);
      await depositToBankroll(userId, amount);
      setDepositAmount("");
      window.location.reload();
    } catch (error: any) {
      alert(error?.message || "שגיאה בהפקדה");
    } finally {
      setLoading(false);
    }
  }

  async function handleWithdraw() {
    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0) {
      alert("נא להזין סכום תקין");
      return;
    }

    if (amount > currentBankroll) {
      alert("אין מספיק זיטונים בקופה");
      return;
    }

    try {
      setLoading(true);
      await withdrawFromBankroll(userId, amount);
      setWithdrawAmount("");
      window.location.reload();
    } catch (error: any) {
      alert(error?.message || "שגיאה במשיכה");
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory() {
    try {
      const h = await getBankrollHistory(userId);
      setHistory(h);
      setShowHistory(true);
    } catch (error: any) {
      alert(error?.message || "שגיאה בטעינת היסטוריה");
    }
  }

  return (
    <div className="glass-card p-6 rounded-2xl space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-purple-500/20 rounded-lg">
          <Wallet className="w-5 h-5 text-purple-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-200">קופה אישית</h2>
      </div>

      {/* Current Balance */}
      <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 p-6 rounded-xl border border-purple-500/30">
        <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">
          יתרה נוכחית
        </div>
        <div className="text-3xl font-bold text-purple-400 font-mono mb-1">
          {formatChips(currentBankroll)}
        </div>
        <div className="text-sm text-slate-500">
          {formatShekels(chipsToShekels(currentBankroll, chipsPerShekel))}
        </div>
      </div>

      {/* Deposit */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-slate-300 font-medium">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          קנה זיטונים
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            min="0"
            step="0.01"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            placeholder="סכום בשקלים"
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
          <button
            onClick={handleDeposit}
            disabled={loading || !depositAmount || Number(depositAmount) <= 0}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "הפקד"}
          </button>
        </div>
        {depositAmount && Number(depositAmount) > 0 && (
          <div className="text-xs text-slate-500">
            תקבל: {formatChips(Number(depositAmount) * chipsPerShekel)} זיטונים
          </div>
        )}
      </div>

      {/* Withdraw */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-slate-300 font-medium">
          <TrendingDown className="w-4 h-4 text-rose-400" />
          משוך כסף
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            min="0"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            placeholder="סכום בזיטונים"
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50"
          />
          <button
            onClick={handleWithdraw}
            disabled={
              loading ||
              !withdrawAmount ||
              Number(withdrawAmount) <= 0 ||
              Number(withdrawAmount) > currentBankroll
            }
            className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "משוך"}
          </button>
        </div>
        {withdrawAmount && Number(withdrawAmount) > 0 && (
          <div className="text-xs text-slate-500">
            תקבל:{" "}
            {formatShekels(
              chipsToShekels(Number(withdrawAmount), chipsPerShekel)
            )}
          </div>
        )}
      </div>

      {/* History */}
      <div>
        <button
          onClick={loadHistory}
          className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg transition flex items-center justify-center gap-2"
        >
          <History className="w-4 h-4" />
          {showHistory ? "הסתר היסטוריה" : "הצג היסטוריה"}
        </button>

        {showHistory && history.length > 0 && (
          <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
            {history
              .slice()
              .reverse()
              .map((transaction: any, index: number) => (
                <div
                  key={index}
                  className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/30"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400">
                      {new Date(transaction.date).toLocaleDateString("he-IL", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        transaction.type === "deposit" ||
                        transaction.type === "game_profit"
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }`}
                    >
                      {transaction.type === "deposit" ||
                      transaction.type === "game_profit"
                        ? "+"
                        : "-"}
                      {transaction.type === "deposit" ||
                      transaction.type === "withdrawal"
                        ? formatShekels(transaction.amount)
                        : formatChips(transaction.amount)}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {transaction.description || transaction.type}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
