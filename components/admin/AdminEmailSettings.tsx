"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Check } from "lucide-react";

export default function AdminEmailSettings({
  clubId,
  currentEmail,
}: {
  clubId: string;
  currentEmail?: string;
}) {
  const [email, setEmail] = useState<string>(currentEmail || "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (currentEmail !== undefined) {
      setEmail(currentEmail || "");
    }
  }, [currentEmail]);

  async function handleSave() {
    // בדיקת תקינות כתובת המייל
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      setError("כתובת מייל לא תקינה");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch("/api/update-admin-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminEmail: email || null }),
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
      setError("שגיאה בעדכון כתובת המייל");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-card p-6 rounded-2xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <Mail className="w-5 h-5 text-blue-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-200 text-right">
            כתובת מייל של מנהל
          </h3>
          <p className="text-xs text-slate-400 text-right mt-1">
            המייל שיקבל עדכונים על בקשות כניסה חדשות
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1 text-right">
            כתובת מייל
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
                setSuccess(false);
              }}
              className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition text-right"
              placeholder="example@email.com"
            />
            <button
              onClick={handleSave}
              disabled={loading || email === (currentEmail || "")}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
            השאר ריק כדי להסיר את כתובת המייל
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
            כתובת המייל עודכנה בהצלחה
          </div>
        )}
      </div>
    </div>
  );
}
