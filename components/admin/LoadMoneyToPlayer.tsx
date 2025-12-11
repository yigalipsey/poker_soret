"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { depositToBankroll } from "@/app/actions";
import { Loader2, Wallet, TrendingUp, CheckCircle, X } from "lucide-react";
import { formatChips, formatShekels, chipsToShekels } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";

export default function LoadMoneyToPlayer({
  users,
  clubId,
  chipsPerShekel,
}: {
  users: any[];
  clubId: string;
  chipsPerShekel: number;
}) {
  const router = useRouter();
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [depositAmount, setDepositAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedUser = users.find((u) => u._id === selectedUserId);

  async function handleDeposit() {
    if (!selectedUserId) {
      setErrorMessage("נא לבחור שחקן");
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    const amount = Number(depositAmount);
    if (!amount || amount <= 0) {
      setErrorMessage("נא להזין סכום תקין");
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      await depositToBankroll(selectedUserId, amount);
      setDepositAmount("");
      setSuccessMessage(
        `הופקדו ${formatChips(amount * chipsPerShekel)} זיטונים בהצלחה`
      );
      setTimeout(() => {
        setSuccessMessage(null);
        router.refresh();
      }, 2000);
    } catch (error: any) {
      setErrorMessage(error?.message || "שגיאה בהפקדה");
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-card p-6 rounded-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-500/20 rounded-lg">
          <Wallet className="w-5 h-5 text-purple-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-200 text-right">
          טעינת כסף לשחקן
        </h2>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-4 p-4 rounded-xl border border-emerald-500/50 bg-emerald-500/10">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-emerald-400 font-medium">{successMessage}</p>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-400 hover:text-emerald-300 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-4 rounded-xl border border-rose-500/50 bg-rose-500/10">
          <div className="flex items-start gap-3">
            <X className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
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

      <div className="space-y-4">
        {/* Player Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2 text-right">
            בחר שחקן
          </label>
          <select
            value={selectedUserId}
            onChange={(e) => {
              setSelectedUserId(e.target.value);
              setDepositAmount("");
              setErrorMessage(null);
            }}
            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-right"
          >
            <option value="">בחר שחקן...</option>
            {users.map((user) => (
              <option key={user._id} value={user._id}>
                {user.name} - יתרה: {formatChips(user.bankroll || 0)}
              </option>
            ))}
          </select>
        </div>

        {/* Selected User Info */}
        {selectedUser && (
          <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
            <div className="flex items-center gap-3 mb-3">
              <Avatar
                name={selectedUser.name}
                imageUrl={selectedUser.avatarUrl}
                size="md"
              />
              <div className="flex-1 text-right">
                <div className="font-bold text-slate-200">
                  {selectedUser.name}
                </div>
                <div className="text-sm text-slate-400">
                  יתרה נוכחית:{" "}
                  <span className="font-mono text-purple-400">
                    {formatChips(selectedUser.bankroll || 0)}
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  {formatShekels(
                    chipsToShekels(selectedUser.bankroll || 0, chipsPerShekel)
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Deposit Amount */}
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2 text-right">
            סכום הפקדה (בשקלים)
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              step="0.01"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="לדוגמה: 100"
              className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-right"
            />
            <button
              onClick={handleDeposit}
              disabled={
                loading ||
                !selectedUserId ||
                !depositAmount ||
                Number(depositAmount) <= 0
              }
              className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <TrendingUp className="w-4 h-4" />
                  טען
                </>
              )}
            </button>
          </div>
          {depositAmount && Number(depositAmount) > 0 && (
            <div className="text-xs text-slate-500 mt-2 text-right">
              השחקן יקבל:{" "}
              <span className="font-mono text-purple-400">
                {formatChips(Number(depositAmount) * chipsPerShekel)}
              </span>{" "}
              זיטונים
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

