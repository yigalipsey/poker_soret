"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Building2 } from "lucide-react";

export default function ClubLoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(formData: FormData) {
    setLoading(true);
    setError("");

    const clubName = formData.get("clubName") as string;

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
        }),
      });

      const result = await response.json();

      if (result.success) {
        router.push("/");
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-slate-800 rounded-full text-blue-500">
            <Building2 size={32} />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center mb-8 text-slate-200">
          כניסה למועדון
        </h1>

        <form action={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">
              שם המועדון
            </label>
            <input
              name="clubName"
              type="text"
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="הזן שם מועדון"
            />
          </div>

          {error && (
            <div className="text-rose-500 text-sm text-center bg-rose-500/10 p-2 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold text-lg transition flex justify-center items-center gap-2"
          >
            {loading && <Loader2 className="animate-spin w-5 h-5" />}
            כניסה למועדון
          </button>
        </form>
      </div>
    </div>
  );
}
