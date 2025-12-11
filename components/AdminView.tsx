"use client";

import { useState } from "react";
import CreateUserForm from "./admin/CreateUserForm";
import CreateGameForm from "./admin/CreateGameForm";
import ActiveGameDashboard from "./admin/ActiveGameDashboard";
import {
  UserPlus,
  Users,
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
  TrendingDown,
  MoreVertical,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { formatChips, chipsToShekels, formatShekels } from "@/lib/utils";
import { withdrawFromBankroll } from "@/app/actions";

export default function AdminView({
  users,
  activeGame,
  clubId,
  club,
}: {
  users: any[];
  activeGame: any;
  clubId: string;
  club?: any;
}) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const router = useRouter();

  async function handleWithdraw() {
    if (!selectedUser) return;

    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0) {
      setErrorMessage("נא להזין סכום תקין");
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    const bankroll = selectedUser.bankroll || 0;
    if (amount > bankroll) {
      setErrorMessage(
        `אין מספיק זיטונים בקופה. יתרה: ${formatChips(bankroll)}`
      );
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    try {
      setWithdrawLoading(true);
      await withdrawFromBankroll(selectedUser._id, amount);
      setSuccessMessage(
        `נמשכו ${formatChips(amount)} זיטונים בהצלחה עבור ${selectedUser.name}`
      );
      setShowWithdrawModal(false);
      setSelectedUser(null);
      setWithdrawAmount("");
      setTimeout(() => {
        setSuccessMessage(null);
        router.refresh();
      }, 2000);
    } catch (error: any) {
      setErrorMessage(error?.message || "שגיאה במשיכה");
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setWithdrawLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* אינדיקטור מוד נוכחי - במוד קופה משותפת */}
      {club?.gameMode === "shared_bankroll" && (
        <div className="glass-card p-3 rounded-xl border border-purple-500/50 bg-purple-500/10">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-purple-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm font-bold text-purple-400">
              מצב קופה משותפת פעיל
            </span>
            <span className="text-xs text-slate-500">
              - שחקנים יכולים להיכנס רק עד יתרת הקופה
            </span>
          </div>
        </div>
      )}

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="glass-card p-4 rounded-xl border border-emerald-500/50 bg-emerald-500/10 animate-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
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
        <div className="glass-card p-4 rounded-xl border border-rose-500/50 bg-rose-500/10 animate-in slide-in-from-top-2">
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

      {/* Game Area - Takes precedence */}
      <div className="w-full animate-[fade-in_0.5s_ease-out]">
        {activeGame ? (
          <ActiveGameDashboard game={activeGame} users={users} club={club} />
        ) : (
          <>
            {/* Always show option to create new game */}
            <div className="mb-6 text-right">
              <h2 className="text-2xl font-bold text-slate-200 mb-2">
                אין משחק פעיל
              </h2>
              <p className="text-slate-400">בחר שחקנים ופתח שולחן חדש</p>
            </div>
            <CreateGameForm users={users} clubId={clubId} club={club} />
          </>
        )}
      </div>

      {/* User Management */}
      <div className="border-t border-slate-800/50 pt-8">
        <section className="glass-card p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <Users className="w-5 h-5 text-amber-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-200 text-right">
              ניהול שחקנים
            </h2>
          </div>

          <CreateUserForm clubId={clubId} />

          <div className="mt-6">
            <h3 className="text-sm font-medium text-slate-500 mb-3 uppercase tracking-wider">
              רשימת שחקנים
            </h3>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {users.map((u: any) => (
                <div
                  key={u._id}
                  className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:bg-slate-800 transition group"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar name={u.name} imageUrl={u.avatarUrl} size="sm" />
                    <div className="flex-1">
                      <span className="font-medium text-slate-300 block">
                        {u.name}
                      </span>
                      {club?.gameMode === "shared_bankroll" && (
                        <span className="text-xs text-slate-500">
                          קופה: {formatChips(u.bankroll || 0)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span
                        className={`font-bold block ${
                          u.globalBalance >= 0
                            ? "text-emerald-400"
                            : "text-rose-400"
                        }`}
                      >
                        {u.globalBalance.toLocaleString()} ₪
                      </span>
                      {club?.gameMode === "shared_bankroll" && (
                        <span className="text-xs text-purple-400">
                          {formatShekels(chipsToShekels(u.bankroll || 0))}
                        </span>
                      )}
                    </div>
                    {club?.gameMode === "shared_bankroll" &&
                      (u.bankroll || 0) > 0 && (
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setShowWithdrawModal(true);
                            setWithdrawAmount("");
                          }}
                          className="p-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition opacity-0 group-hover:opacity-100"
                          title="משיכת כסף"
                        >
                          <TrendingDown className="w-4 h-4" />
                        </button>
                      )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Withdraw Modal */}
      {showWithdrawModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card p-6 rounded-2xl max-w-md w-full border border-purple-500/30">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-200 text-right">
                משיכת כסף - {selectedUser.name}
              </h3>
              <button
                onClick={() => {
                  setShowWithdrawModal(false);
                  setSelectedUser(null);
                  setWithdrawAmount("");
                }}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-purple-500/10 p-4 rounded-lg border border-purple-500/30">
                <div className="text-xs text-slate-400 mb-1">יתרה נוכחית</div>
                <div className="text-2xl font-bold text-purple-400 font-mono">
                  {formatChips(selectedUser.bankroll || 0)}
                </div>
                <div className="text-sm text-slate-500 mt-1">
                  {formatShekels(
                    chipsToShekels(
                      selectedUser.bankroll || 0,
                      club?.chipsPerShekel || 100
                    )
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2 text-right">
                  סכום משיכה (בזיטונים)
                </label>
                <input
                  type="number"
                  min="0"
                  max={selectedUser.bankroll || 0}
                  step="1000"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="לדוגמה: 5000"
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-right"
                />
                {withdrawAmount && Number(withdrawAmount) > 0 && (
                  <div className="text-xs text-slate-500 mt-2 text-right">
                    בשקלים:{" "}
                    <span className="font-mono text-purple-400">
                      {formatShekels(
                        chipsToShekels(
                          Number(withdrawAmount),
                          club?.chipsPerShekel || 100
                        )
                      )}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowWithdrawModal(false);
                    setSelectedUser(null);
                    setWithdrawAmount("");
                  }}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-medium transition"
                >
                  ביטול
                </button>
                <button
                  onClick={handleWithdraw}
                  disabled={
                    withdrawLoading ||
                    !withdrawAmount ||
                    Number(withdrawAmount) <= 0 ||
                    Number(withdrawAmount) > (selectedUser.bankroll || 0)
                  }
                  className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {withdrawLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <TrendingDown className="w-4 h-4" />
                      משוך
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
