"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { approveDepositRequest } from "@/app/actions";
import {
  Loader2,
  CheckCircle,
  X,
  Clock,
  Wallet,
  TrendingUp,
} from "lucide-react";
import { formatChips, formatShekels, chipsToShekels } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";

export default function PendingDepositRequests({
  requests,
  chipsPerShekel,
}: {
  requests: any[];
  chipsPerShekel: number;
}) {
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  async function handleApprove(requestId: string, userName: string) {
    try {
      setLoading((prev) => ({ ...prev, [requestId]: true }));
      setErrorMessage(null);
      await approveDepositRequest(requestId);
      setSuccessMessage(`הטעינה של ${userName} אושרה בהצלחה!`);
      setTimeout(() => {
        setSuccessMessage(null);
        router.refresh();
      }, 2000);
    } catch (error: any) {
      setErrorMessage(error?.message || "שגיאה באישור הבקשה");
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setLoading((prev) => ({ ...prev, [requestId]: false }));
    }
  }

  return (
    <div className="glass-card p-6 rounded-2xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-purple-500/20 rounded-lg">
          <Clock className="w-5 h-5 text-purple-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-200 text-right">
          בקשות ממתינות לטעינת כסף
        </h2>
      </div>

      {successMessage && (
        <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm text-right">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-sm text-right">
          {errorMessage}
        </div>
      )}

      <div className="space-y-3">
        {requests.map((request: any) => {
          const user = request.userId;
          const userName = user?.name || "שחקן לא ידוע";
          const amountInShekels = request.amountInShekels;
          const amountInChips = amountInShekels * chipsPerShekel;
          const requestDate = new Date(request.createdAt).toLocaleString(
            "he-IL"
          );

          return (
            <div
              key={request._id}
              className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50"
            >
              <div className="flex items-center gap-4 mb-3">
                <Avatar name={userName} imageUrl={user?.avatarUrl} size="md" />
                <div className="flex-1 text-right">
                  <p className="text-lg font-bold text-slate-200">{userName}</p>
                  <p className="text-xs text-slate-400">{requestDate}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-3">
                <div className="text-right">
                  <p className="text-sm text-slate-400">סכום מבוקש</p>
                  <p className="text-xl font-bold text-purple-400">
                    ₪{amountInShekels.toLocaleString("he-IL")}
                  </p>
                  <p className="text-xs text-slate-500">
                    ({formatChips(amountInChips)} זיטונים)
                  </p>
                </div>
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-400" />
                </div>
              </div>

              <button
                onClick={() => handleApprove(request._id, userName)}
                disabled={loading[request._id]}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading[request._id] ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    אשר טעינה
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
