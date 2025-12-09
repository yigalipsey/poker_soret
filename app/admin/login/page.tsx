"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Building2 } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLoginToClub(formData: FormData) {
    setLoading(true);
    setError("");

    const clubName = formData.get("clubName") as string;
    const password = formData.get("password") as string;

    try {
      const response = await fetch("/api/login-to-club", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clubName: clubName.trim(),
          password: password,
        }),
      });

      const result = await response.json();

      if (result.success) {
        router.push("/admin");
        router.refresh();
      } else {
        setError(result.error || "שם מועדון או סיסמה שגויים");
        setLoading(false);
      }
    } catch (error) {
      setError("שגיאה בכניסה למועדון");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-start justify-center pt-8 px-4 pb-24">
      <div className="w-full max-w-md bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-slate-800 rounded-full text-amber-500">
            <Lock size={32} />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center mb-2 text-slate-200">
          כניסה לניהול מועדון
        </h1>
        <p className="text-center text-slate-400 text-sm mb-8">
          הזן את שם המועדון וסיסמת המנהל
        </p>

        <form action={handleLoginToClub} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">
              שם המועדון
            </label>
            <input
              name="clubName"
              type="text"
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-amber-500 outline-none transition"
              placeholder="הזן שם מועדון"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">
              סיסמת המנהל
            </label>
            <input
              name="password"
              type="password"
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-amber-500 outline-none transition"
              placeholder="הזן סיסמת מנהל"
            />
            <p className="text-xs text-slate-500 mt-1 text-right">
              סיסמת המנהל שנוצרה בעת יצירת המועדון
            </p>
          </div>

          {error && (
            <div className="text-rose-500 text-sm text-center bg-rose-500/10 p-2 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-lg font-bold transition flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              <>
                <Building2 className="w-5 h-5" />
                כניסה
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-800">
          <p className="text-center text-slate-500 text-sm mb-4">
            אין לך מועדון?
          </p>
          <Link
            href="/admin/create"
            className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-lg font-bold transition flex items-center justify-center gap-2"
          >
            פתח מועדון חדש
          </Link>
        </div>
      </div>
    </div>
  );
}
