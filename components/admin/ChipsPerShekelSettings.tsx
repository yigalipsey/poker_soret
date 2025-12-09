"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Coins, Check } from "lucide-react";

export default function ChipsPerShekelSettings({
  clubId,
  currentValue,
}: {
  clubId: string;
  currentValue?: number;
}) {
  const [chipsPerShekel, setChipsPerShekel] = useState<string>(
    (currentValue || 1000).toString()
  );
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (currentValue) {
      setChipsPerShekel(currentValue.toString());
    }
  }, [currentValue]);

  async function handleSave() {
    const value = parseInt(chipsPerShekel);
    if (!value || value <= 0) {
      setError("נא להזין מספר חיובי");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch("/api/update-club-chips-per-shekel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chipsPerShekel: value }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          router.refresh();
        }, 1000);
      } else {
        setError(result.error || "שגיאה בעדכון");
      }
    } catch (error) {
      setError("שגיאה בעדכון יחס צ'יפים לשקל");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-card p-6 rounded-2xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-amber-500/20 rounded-lg">
          <Coins className="w-5 h-5 text-amber-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-200 text-right">
            יחס צ'יפים לשקל
          </h3>
          <p className="text-xs text-slate-400 text-right mt-1">
            כמה צ'יפים שווים שקל אחד
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1 text-right">
            צ'יפים לשקל
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={chipsPerShekel}
              onChange={(e) => {
                setChipsPerShekel(e.target.value);
                setError("");
                setSuccess(false);
              }}
              min="1"
              className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 outline-none transition text-right"
              placeholder="1000"
            />
            <button
              onClick={handleSave}
              disabled={loading || chipsPerShekel === (currentValue || 1000).toString()}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-lg font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : success ? (
                <Check className="w-4 h-4" />
              ) : (
                "שמור"
              )}
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-1 text-right">
            לדוגמא: {chipsPerShekel ? parseInt(chipsPerShekel) || 1000 : 1000} צ'יפים = 1 ₪
          </p>
        </div>

        {error && (
          <div className="text-rose-500 text-sm text-right bg-rose-500/10 p-2 rounded border border-rose-500/50">
            {error}
          </div>
        )}

        {success && (
          <div className="text-emerald-500 text-sm text-right bg-emerald-500/10 p-2 rounded border border-emerald-500/50 flex items-center gap-2 justify-end">
            <Check className="w-4 h-4" />
            היחס עודכן בהצלחה
          </div>
        )}
      </div>
    </div>
  );
}
