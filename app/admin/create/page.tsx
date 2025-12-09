"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Lock } from "lucide-react";
import Link from "next/link";

export default function CreateClubPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleCreateClub(formData: FormData) {
    setLoading(true);
    setError("");

    const clubName = formData.get("clubName") as string;
    const managerPassword = formData.get("managerPassword") as string;
    const clubPassword = formData.get("clubPassword") as string;

    if (!clubName || !managerPassword || !clubPassword) {
      setError("נא למלא את כל השדות");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/create-club-with-manager", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clubName: clubName.trim(),
          managerName: "מנהל", // Always "מנהל"
          managerPassword: managerPassword,
          clubPassword: clubPassword,
        }),
      });

      const result = await response.json();

      if (result.success) {
        router.push("/admin");
        router.refresh();
      } else {
        setError(result.error || "שגיאה ביצירת מועדון");
        setLoading(false);
      }
    } catch (error) {
      setError("שגיאה ביצירת מועדון");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-start justify-center pt-8 px-4 pb-24">
      <div className="w-full max-w-md bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-slate-800 rounded-full text-blue-500">
            <Plus size={32} />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-right mb-2 text-slate-200">
          פתיחת מועדון חדש
        </h1>
        <p className="text-right text-slate-400 text-sm mb-8">
          צור מועדון חדש והתחל לנהל משחקים
        </p>

        <form action={handleCreateClub} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1 text-right">
              שם המועדון
            </label>
            <input
              name="clubName"
              type="text"
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition text-right"
              placeholder="הזן שם מועדון"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1 text-right">
              סיסמת מנהל
            </label>
            <input
              name="managerPassword"
              type="password"
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition text-right"
              placeholder="הזן סיסמת מנהל לניהול"
            />
            <p className="text-xs text-slate-500 mt-1 text-right">
              סיסמה זו משמשת לכניסה לדף הניהול
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1 text-right">
              סיסמת מועדון
            </label>
            <input
              name="clubPassword"
              type="password"
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition text-right"
              placeholder="הזן סיסמת מועדון ליוזרים"
            />
            <p className="text-xs text-slate-500 mt-1 text-right">
              סיסמה זו משמשת ליוזרים רגילים להיכנס למועדון
            </p>
          </div>

          {error && (
            <div className="text-rose-500 text-sm text-right bg-rose-500/10 p-2 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold transition flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            dir="rtl"
          >
            {loading ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              <>
                צור מועדון
                <Plus className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-800">
          <p className="text-right text-slate-500 text-sm mb-4">
            כבר יש לך מועדון?
          </p>
          <Link
            href="/admin/login"
            className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-lg font-bold transition flex items-center justify-center gap-2"
            dir="rtl"
          >
            כניסה למועדון
            <Lock className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
