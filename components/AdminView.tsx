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
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { formatChips, chipsToShekels, formatShekels } from "@/lib/utils";

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
  const router = useRouter();

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
                  className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:bg-slate-800 transition"
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
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
