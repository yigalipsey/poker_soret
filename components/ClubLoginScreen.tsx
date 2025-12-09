"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Building2, Plus, LogIn, Eye } from "lucide-react";
import Link from "next/link";

export default function ClubLoginScreen({
  loginOnly = false,
}: {
  loginOnly?: boolean;
}) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"select" | "login" | "create">(
    loginOnly ? "login" : "select"
  );
  const router = useRouter();

  async function handleLogin(formData: FormData) {
    setLoading(true);
    setError("");

    const clubName = formData.get("clubName") as string;
    const password = formData.get("password") as string;

    if (!clubName || !clubName.trim()) {
      setError("נא להזין שם מועדון");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/login-to-club-by-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clubName: clubName.trim(),
          password: password || "", // אם אין סיסמה (מועדון לדוגמא), שולח ריק
        }),
      });

      const result = await response.json();

      if (result.success) {
        router.refresh();
      } else {
        setError(result.error || "מועדון לא נמצא");
        setLoading(false);
      }
    } catch (error) {
      setError("שגיאה בכניסה למועדון");
      setLoading(false);
    }
  }

  async function handleDemoLogin() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/login-to-club-by-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clubName: "מועדון לדוגמא",
        }),
      });

      const result = await response.json();

      if (result.success) {
        router.refresh();
      } else {
        // If demo club doesn't exist, create it
        const createResponse = await fetch("/api/create-demo-club", {
          method: "POST",
        });
        const createResult = await createResponse.json();

        if (createResult.success) {
          router.refresh();
        } else {
          setError("שגיאה ביצירת מועדון לדוגמא");
          setLoading(false);
        }
      }
    } catch (error) {
      setError("שגיאה בכניסה למועדון לדוגמא");
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl">
      <div className="flex justify-center mb-6">
        <div className="p-4 bg-slate-800 rounded-full text-blue-500">
          <Building2 size={32} />
        </div>
      </div>

      {mode === "select" && !loginOnly && (
        <>
          <h1 className="text-2xl font-bold text-center mb-8 text-slate-200">
            בחר פעולה
          </h1>

          <div className="space-y-4">
            <button
              onClick={() => setMode("login")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-bold text-lg transition flex items-center justify-center gap-3"
            >
              <LogIn className="w-5 h-5" />
              כניסה למועדון
            </button>

            <button
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-lg font-bold text-lg transition flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="animate-spin w-5 h-5" />
              ) : (
                <>
                  <Eye className="w-5 h-5" />
                  צפייה במועדון לדוגמא
                </>
              )}
            </button>

            <Link
              href="/admin/create"
              className="w-full bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-lg font-bold text-lg transition flex items-center justify-center gap-3"
            >
              <Plus className="w-5 h-5" />
              פתח מועדון חדש
            </Link>
          </div>
        </>
      )}

      {mode === "login" && (
        <>
          <h1 className="text-2xl font-bold text-center mb-8 text-slate-200">
            כניסה למועדון
          </h1>

          <p className="text-slate-400 text-center mb-6 text-sm">
            נא להזין את שם המועדון וסיסמת המועדון כדי להמשיך
          </p>

          <form action={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">
                שם המועדון
              </label>
              <input
                name="clubName"
                type="text"
                required
                autoFocus
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="הזן שם מועדון"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">
                סיסמת מועדון
              </label>
              <input
                name="password"
                type="password"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="הזן סיסמת מועדון (אופציונלי למועדון לדוגמא)"
              />
              <p className="text-xs text-slate-500 mt-1">
                למועדון לדוגמא לא נדרשת סיסמה
              </p>
            </div>

            {error && (
              <div className="text-rose-500 text-sm text-center bg-rose-500/10 p-2 rounded">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              {!loginOnly && (
                <button
                  type="button"
                  onClick={() => {
                    setMode("select");
                    setError("");
                  }}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-medium transition"
                >
                  ביטול
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className={`${
                  loginOnly ? "w-full" : "flex-1"
                } bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold transition flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading && <Loader2 className="animate-spin w-5 h-5" />}
                כניסה
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
