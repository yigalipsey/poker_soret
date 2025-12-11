"use client";
import { useState } from "react";
import { createGame } from "@/app/actions";
import { Loader2, Play, Check } from "lucide-react";
import { cn, formatChips, chipsToShekels, formatShekels } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";

export default function CreateGameForm({
  users,
  clubId,
  club,
}: {
  users: any[];
  clubId?: string | null;
  club?: any;
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
      // במצב קופה משותפת - בדיקה שיש כסף מוטען לפני הוספה
      if (club?.gameMode === "shared_bankroll") {
        const user = users.find((u) => u._id === id);
        const bankroll = user?.bankroll || 0;
        if (bankroll === 0) {
          alert(
            `לא ניתן להוסיף את ${
              user?.name || "השחקן"
            } למשחק במצב קופה משותפת ללא כסף מוטען. נא להטעין כסף לשחקן תחילה.`
          );
          return;
        }
      }
      setSelected((prev) => [...prev, id]);
      setBuyIns((prev) => ({ ...prev, [id]: 0 }));
    }
  };

  const chipOptions = [
    { value: 0, label: "0" },
    { value: 1000, label: "1,000 (₪10)" },
    { value: 2000, label: "2,000 (₪20)" },
    { value: 3000, label: "3,000 (₪30)" },
    { value: 4000, label: "4,000 (₪40)" },
    { value: 5000, label: "5,000 (₪50)" },
    { value: 6000, label: "6,000 (₪60)" },
    { value: 7000, label: "7,000 (₪70)" },
    { value: 8000, label: "8,000 (₪80)" },
    { value: 9000, label: "9,000 (₪90)" },
    { value: 10000, label: "10,000 (₪100)" },
    { value: 12000, label: "12,000 (₪120)" },
    { value: 15000, label: "15,000 (₪150)" },
    { value: 18000, label: "18,000 (₪180)" },
    { value: 20000, label: "20,000 (₪200)" },
    { value: "custom", label: "אחר" },
  ];

  const updateBuyIn = (id: string, value: string) => {
    if (value === "custom") {
      return;
    }
    const numValue = parseInt(value) || 0;
    setBuyIns((prev) => ({ ...prev, [id]: numValue }));
  };

  async function handleCreate() {
    if (selected.length < 2) return;
    if (!clubId) {
      alert("נא לבחור קלאב תחילה");
      return;
    }

    // בדיקה במצב קופה משותפת - וידוא שכל השחקנים יש להם כסף מוטען ושהכניסות תקינות
    if (club?.gameMode === "shared_bankroll") {
      for (const playerId of selected) {
        const user = users.find((u) => u._id === playerId);
        if (!user) continue;

        const bankroll = user.bankroll || 0;
        if (bankroll === 0) {
          alert(
            `לא ניתן ליצור משחק עם ${user.name} - אין כסף מוטען בקופה המשותפת. נא להטעין כסף לשחקן תחילה.`
          );
          setLoading(false);
          return;
        }

        const buyIn = buyIns[playerId] || 0;
        if (buyIn > bankroll) {
          alert(
            `לא ניתן ליצור משחק - הכניסה של ${user.name} (${formatChips(
              buyIn
            )}) גדולה מהיתרה בקופה (${formatChips(bankroll)}).`
          );
          setLoading(false);
          return;
        }
      }
    }

    setLoading(true);
    try {
      await createGame(selected, buyIns, clubId);
      setSelected([]);
      setBuyIns({});
    } catch (error: any) {
      alert(error?.message || "שגיאה ביצירת משחק");
    } finally {
      setLoading(false);
    }
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
                  : club?.gameMode === "shared_bankroll" &&
                    (user.bankroll || 0) === 0
                  ? "bg-rose-500/10 border-rose-500/30 opacity-60"
                  : "bg-slate-800/30 border-slate-700/50"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  onClick={() => toggleUser(user._id)}
                  className={cn(
                    "flex items-center gap-2 flex-1",
                    club?.gameMode === "shared_bankroll" &&
                      (user.bankroll || 0) === 0
                      ? "cursor-not-allowed opacity-60"
                      : "cursor-pointer"
                  )}
                >
                  <Avatar
                    name={user.name}
                    imageUrl={user.avatarUrl}
                    size="sm"
                  />
                  <div className="flex-1">
                    <span
                      className={cn(
                        "font-medium block",
                        isSelected ? "text-amber-400" : "text-slate-400"
                      )}
                    >
                      {user.name}
                    </span>
                    {/* יתרת קופה - רק במוד קופה משותפת */}
                    {club?.gameMode === "shared_bankroll" && (
                      <span className="text-xs">
                        יתרה:{" "}
                        <span
                          className={cn(
                            "font-mono",
                            (user.bankroll || 0) === 0
                              ? "text-rose-400"
                              : "text-purple-400"
                          )}
                        >
                          {formatChips(user.bankroll || 0)}
                        </span>
                        {(user.bankroll || 0) === 0 && (
                          <span className="text-rose-400 text-xs mr-1">
                            {" "}
                            (נדרש טעינה)
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-amber-500" />}
                </div>
              </div>
              {isSelected && (
                <div className="space-y-2">
                  {/* אזהרה אם הכניסה גדולה מהיתרה */}
                  {club?.gameMode === "shared_bankroll" &&
                    buyIn > (user.bankroll || 0) && (
                      <div className="p-2 bg-rose-500/10 border border-rose-500/30 rounded-lg">
                        <p className="text-xs text-rose-400 text-right">
                          ⚠️ הכניסה גדולה מהיתרה! יתרה:{" "}
                          {formatChips(user.bankroll || 0)}, נדרש:{" "}
                          {formatChips(buyIn)}. הכנס עד{" "}
                          {formatChips(user.bankroll || 0)} זיטונים.
                        </p>
                      </div>
                    )}
                  {/* הודעה במצב קופה משותפת על היתרה הזמינה */}
                  {club?.gameMode === "shared_bankroll" && (
                    <div className="p-2 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                      <p className="text-xs text-purple-400 text-right">
                        💰 יתרה זמינה: {formatChips(user.bankroll || 0)} זיטונים
                      </p>
                    </div>
                  )}
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
                          const selectedValue = parseInt(e.target.value) || 0;
                          // במצב קופה משותפת - בדיקה שהערך לא עולה על היתרה
                          if (
                            club?.gameMode === "shared_bankroll" &&
                            selectedValue > (user.bankroll || 0)
                          ) {
                            alert(
                              `לא ניתן להכניס יותר מ-${formatChips(
                                user.bankroll || 0
                              )} זיטונים (יתרה בקופה).`
                            );
                            return;
                          }
                          updateBuyIn(user._id, e.target.value);
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    >
                      {chipOptions.map((option) => {
                        // במצב קופה משותפת - הסתרת אפשרויות שעולות על היתרה
                        if (
                          club?.gameMode === "shared_bankroll" &&
                          typeof option.value === "number" &&
                          option.value > (user.bankroll || 0)
                        ) {
                          return null;
                        }
                        return (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  {showCustomInputs[user._id] && (
                    <div>
                      <input
                        type="number"
                        min="0"
                        value={buyIn ? Math.floor(buyIn / 1000) : ""}
                        onChange={(e) => {
                          const value = Number(e.target.value) || 0;
                          const chipsValue = value * 1000;
                          // במצב קופה משותפת - בדיקה שהערך לא עולה על היתרה
                          if (
                            club?.gameMode === "shared_bankroll" &&
                            chipsValue > (user.bankroll || 0)
                          ) {
                            alert(
                              `לא ניתן להכניס יותר מ-${formatChips(
                                user.bankroll || 0
                              )} זיטונים (יתרה בקופה).`
                            );
                            return;
                          }
                          setBuyIns((prev) => ({
                            ...prev,
                            [user._id]: chipsValue,
                          }));
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                        placeholder="לדוגמה: 54"
                      />
                      {buyIn && buyIn > 0 && (
                        <div className="text-xs text-slate-500 mt-1">
                          = {formatChips(buyIn)} (
                          {formatShekels(chipsToShekels(buyIn))})
                        </div>
                      )}
                      <p className="text-xs text-slate-500 mt-1">
                        הערך יוכפל ב-1,000 אוטומטית (לדוגמה: 54 = 54,000
                        זיטונים)
                      </p>
                    </div>
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
