"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Building2, Check, Edit2 } from "lucide-react";

export default function ClubNameEditor({
  clubId,
  currentName,
}: {
  clubId: string;
  currentName?: string;
}) {
  const [clubName, setClubName] = useState<string>(currentName || "");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (currentName) {
      setClubName(currentName);
    }
  }, [currentName]);

  async function handleSave() {
    if (!clubName.trim()) {
      setError("נא להזין שם מועדון");
      return;
    }

    if (clubName.trim() === currentName) {
      setIsEditing(false);
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch("/api/update-club-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clubName: clubName.trim() }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        setIsEditing(false);
        setTimeout(() => {
          setSuccess(false);
          router.refresh();
        }, 1000);
      } else {
        setError(result.error || "שגיאה בעדכון");
      }
    } catch (error) {
      setError("שגיאה בעדכון שם המועדון");
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    setClubName(currentName || "");
    setIsEditing(false);
    setError("");
  }

  return (
    <div className="glass-card p-6 rounded-2xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-emerald-500/20 rounded-lg">
          <Building2 className="w-5 h-5 text-emerald-500" />
        </div>
        <div className="flex-1">
          {isEditing ? (
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={clubName}
                onChange={(e) => {
                  setClubName(e.target.value);
                  setError("");
                  setSuccess(false);
                }}
                className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none transition text-right"
                placeholder="שם המועדון"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSave();
                  } else if (e.key === "Escape") {
                    handleCancel();
                  }
                }}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-900 rounded-lg font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : success ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    "שמור"
                  )}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-bold transition disabled:opacity-50"
                >
                  ביטול
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-200 text-right flex-1">
                {clubName || "קלאב"}
              </h2>
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-emerald-400 rounded-lg transition"
                title="ערוך שם מועדון"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="text-rose-500 text-sm text-right bg-rose-500/10 p-2 rounded border border-rose-500/50 mt-2">
          {error}
        </div>
      )}

      {success && (
        <div className="text-emerald-500 text-sm text-right bg-emerald-500/10 p-2 rounded border border-emerald-500/50 flex items-center gap-2 justify-end mt-2">
          <Check className="w-4 h-4" />
          שם המועדון עודכן בהצלחה
        </div>
      )}
    </div>
  );
}
