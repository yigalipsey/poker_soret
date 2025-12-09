"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Loader2, Check } from "lucide-react";

export default function ClubSwitcher({
  currentClubId,
  userClubs,
}: {
  currentClubId: string | null;
  userClubs: any[];
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  async function handleSwitchClub(clubId: string) {
    if (clubId === currentClubId) return;

    setLoading(clubId);
    try {
      const response = await fetch("/api/set-club-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clubId }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Error switching club:", error);
    } finally {
      setLoading(null);
    }
  }

  if (!userClubs || userClubs.length <= 1) {
    return null; // אין צורך להציג אם יש רק מועדון אחד או פחות
  }

  return (
    <div className="glass-card p-4 rounded-xl mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Building2 className="w-4 h-4 text-blue-500" />
        <h3 className="text-sm font-bold text-slate-300 text-right">
          החלף מועדון
        </h3>
      </div>
      <div className="space-y-2">
        {userClubs.map((club: any) => {
          const clubIdStr = club._id?.toString() || club._id;
          const currentClubIdStr = currentClubId?.toString() || currentClubId;
          const isActive = clubIdStr === currentClubIdStr;
          const isLoading = loading === clubIdStr;

          return (
            <button
              key={clubIdStr}
              onClick={() => handleSwitchClub(clubIdStr)}
              disabled={isActive || isLoading}
              className={`w-full p-3 rounded-lg transition flex items-center justify-between text-right ${
                isActive
                  ? "bg-blue-500/20 border border-blue-500/50"
                  : "bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex items-center gap-2">
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                ) : isActive ? (
                  <Check className="w-4 h-4 text-blue-500" />
                ) : (
                  <Building2 className="w-4 h-4 text-slate-400" />
                )}
                <span
                  className={`font-medium ${
                    isActive ? "text-blue-400" : "text-slate-300"
                  }`}
                >
                  {club.name}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
