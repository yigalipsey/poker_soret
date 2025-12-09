"use client";

import { playerLogin } from "@/app/actions";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, User } from "lucide-react";

export default function PlayerLoginPage() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await playerLogin(name, password);

    if (res.success) {
      router.push("/");
      router.refresh();
    } else {
      setError(res.error || "שגיאה בהתחברות");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md p-8">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-slate-900 rounded-full text-blue-500 ring-1 ring-slate-800">
            <User size={32} />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center mb-2 text-slate-200">
          כניסת שחקן
        </h1>
        <p className="text-center text-slate-400 text-sm mb-8">
          הזן את פרטי ההתחברות שלך
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">
              שם שחקן
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="הזן את שמך"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">
              סיסמה
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="הזן סיסמה"
            />
          </div>

          {error && (
            <div className="text-rose-500 text-sm text-center bg-rose-500/10 p-2 rounded">
              {error}
            </div>
          )}

          <button
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold text-lg transition flex justify-center items-center gap-2"
          >
            {loading && <Loader2 className="animate-spin w-5 h-5" />}
            כניסה
          </button>
        </form>

        <p className="text-center text-slate-500 text-xs mt-6">
          אין לך סיסמה? פנה למנהל המשחק
        </p>
      </div>
    </div>
  );
}
