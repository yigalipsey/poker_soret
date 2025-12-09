"use client";
import { useState } from "react";
import { createGame } from "@/app/actions";
import { Loader2, Play, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";

export default function CreateGameForm({
  users,
  clubId,
}: {
  users: any[];
  clubId?: string | null;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [buyIns, setBuyIns] = useState<Record<string, number>>({});
  const [showCustomInputs, setShowCustomInputs] = useState<
    Record<string, boolean>
  >({});
  const [loading, setLoading] = useState(false);

  const toggleUser = (id: string) => {
    if (selected.includes(id)) {
      setSelected((prev) => prev.filter((x) => x !== id));
      setBuyIns((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } else {
      setSelected((prev) => [...prev, id]);
      setBuyIns((prev) => ({ ...prev, [id]: 0 }));
    }
  };

  const chipOptions = [
    { value: 0, label: "0" },
    { value: 10000, label: "10,000 (₪10)" },
    { value: 20000, label: "20,000 (₪20)" },
    { value: 50000, label: "50,000 (₪50)" },
    { value: 100000, label: "100,000 (₪100)" },
    { value: 200000, label: "200,000 (₪200)" },
    { value: 500000, label: "500,000 (₪500)" },
    { value: "custom", label: "אחר" },
  ];

  const updateBuyIn = (id: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setBuyIns((prev) => ({ ...prev, [id]: numValue }));
  };

  async function handleCreate() {
    if (selected.length < 2) return;
    if (!clubId) {
      alert("נא לבחור קלאב תחילה");
      return;
    }
    setLoading(true);
    await createGame(selected, buyIns, clubId);
    setLoading(false);
    setSelected([]);
    setBuyIns({});
  }

  return (
    <section className="glass-card p-6 rounded-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-emerald-500/20 rounded-lg">
          <Play className="w-5 h-5 text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-200">פתיחת משחק חדש</h2>
      </div>

      <div className="mb-6 space-y-4 max-h-96 overflow-y-auto custom-scrollbar pr-2">
        {users.map((user) => {
          const isSelected = selected.includes(user._id);
          const buyIn = buyIns[user._id] || 0;
          return (
            <div
              key={user._id}
              className={cn(
                "p-4 rounded-xl border transition",
                isSelected
                  ? "bg-amber-500/20 border-amber-500/50"
                  : "bg-slate-800/30 border-slate-700/50"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  onClick={() => toggleUser(user._id)}
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  <Avatar
                    name={user.name}
                    imageUrl={user.avatarUrl}
                    size="sm"
                  />
                  <span
                    className={cn(
                      "font-medium",
                      isSelected ? "text-amber-400" : "text-slate-400"
                    )}
                  >
                    {user.name}
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-amber-500" />}
                </div>
              </div>
              {isSelected && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-slate-400 whitespace-nowrap">
                      זיטונים:
                    </label>
                    <select
                      value={showCustomInputs[user._id] ? "custom" : buyIn}
                      onChange={(e) => {
                        if (e.target.value === "custom") {
                          setShowCustomInputs((prev) => ({
                            ...prev,
                            [user._id]: true,
                          }));
                        } else {
                          setShowCustomInputs((prev) => ({
                            ...prev,
                            [user._id]: false,
                          }));
                          updateBuyIn(user._id, e.target.value);
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    >
                      {chipOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {showCustomInputs[user._id] && (
                    <input
                      type="number"
                      min="0"
                      value={buyIn || ""}
                      onChange={(e) => updateBuyIn(user._id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      placeholder="הזן זיטונים"
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
        {users.length === 0 && (
          <p className="text-slate-500 text-center py-4">
            נא להוסיף שחקנים תחילה.
          </p>
        )}
      </div>

      <button
        onClick={handleCreate}
        disabled={loading || selected.length < 2}
        className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/20 transition-all transform active:scale-[0.98]"
      >
        {loading ? (
          <Loader2 className="animate-spin mx-auto" />
        ) : (
          "פתח שולחן והתחל לשחק ♠️"
        )}
      </button>
    </section>
  );
}
