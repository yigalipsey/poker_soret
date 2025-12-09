"use client";
import { useState } from "react";
import { createUser } from "@/app/actions";
import { Loader2, Plus } from "lucide-react";

export default function CreateUserForm({ clubId }: { clubId?: string | null }) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      alert("נא להזין שם שחקן");
      return;
    }
    if (!password.trim()) {
      alert("נא להזין סיסמה");
      return;
    }
    if (!clubId) {
      alert("נא לבחור קלאב תחילה");
      return;
    }
    setLoading(true);
    const user = await createUser(name, false, clubId, password.trim());
    setName("");
    setPassword("");
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="שם שחקן חדש"
        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 outline-none transition"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="סיסמה"
        required
        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 outline-none transition"
      />
      <button
        disabled={loading}
        className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 px-4 py-2 rounded-lg font-bold disabled:opacity-50 transition flex items-center justify-center gap-2"
      >
        {loading ? (
          <Loader2 className="animate-spin w-5 h-5" />
        ) : (
          <>
            <Plus className="w-5 h-5" />
            הוסף שחקן
          </>
        )}
      </button>
    </form>
  );
}
