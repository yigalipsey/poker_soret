"use client";
import { useState } from "react";
import { approveRequest, rejectRequest, endGame } from "@/app/actions";
import {
  Loader2,
  Check,
  X,
  Copy,
  Clock,
  AlertCircle,
  LogOut,
} from "lucide-react";
import { cn, formatChips, chipsToShekels, formatShekels } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";

export default function ActiveGameDashboard({ game }: { game: any }) {
  const [ending, setEnding] = useState(false);
  const [cashOuts, setCashOuts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [buyInAmounts, setBuyInAmounts] = useState<Record<string, number>>({});
  const [showCustomBuyIn, setShowCustomBuyIn] = useState<
    Record<string, boolean>
  >({});
  const [showCustomCashOut, setShowCustomCashOut] = useState<
    Record<string, boolean>
  >({});
  const [isBuyInOpen, setIsBuyInOpen] = useState<Record<string, boolean>>({});
  const [expandedBuyIn, setExpandedBuyIn] = useState<
    Record<string, string | null>
  >({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editingCashOut, setEditingCashOut] = useState<Record<string, boolean>>(
    {}
  );
  const router = useRouter();

  const handleBuyInClick = (userId: string) => {
    setIsBuyInOpen((prev) => ({ ...prev, [userId]: true }));
    // Reset amount for this user when opening
    setBuyInAmounts((prev) => ({ ...prev, [userId]: 0 }));
    setShowCustomBuyIn((prev) => ({ ...prev, [userId]: false }));
  };

  const handleCancelBuyIn = (userId: string) => {
    setIsBuyInOpen((prev) => ({ ...prev, [userId]: false }));
  };

  const chipOptions = [
    { value: 0, label: "0" },
    { value: 20000, label: "20,000" },
    { value: 40000, label: "40,000" },
    { value: 50000, label: "50,000" },
    { value: 60000, label: "60,000" },
    { value: 80000, label: "80,000" },
    { value: 100000, label: "100,000" },
    { value: 150000, label: "150,000" },
    { value: 200000, label: "200,000" },
    { value: "custom", label: "אחר" },
  ];

  // חישוב סך הקופה (כל ה-buyIns)
  const totalChipsInPot = game.players.reduce(
    (sum: number, p: any) => sum + (p.totalApprovedBuyIn || 0),
    0
  );

  // חישוב סך ה-cashOut שהוזן (כולל שחקנים שכבר יצאו)
  const totalCashOut = (() => {
    let sum = 0;
    // שחקנים שכבר יצאו
    game.players.forEach((p: any) => {
      if (p.isCashedOut) {
        sum += p.cashOut || 0;
      }
    });
    // שחקנים שעדיין במשחק - מה שהוזן בטופס
    Object.values(cashOuts).forEach((val: any) => {
      sum += Number(val) || 0;
    });
    return sum;
  })();

  // Pending requests
  const pendingRequests = game.players.flatMap((p: any) =>
    p.buyInRequests
      .filter((r: any) => r.status === "pending")
      .map((r: any) => ({
        ...r,
        playerId: p.userId._id,
        playerName: p.userId.name,
        userId: p.userId._id, // needed for action
      }))
  );

  async function handleEndGame() {
    // בניית cashOuts מלא - שחקנים שלא הוזן להם כלום נחשבים כ-0
    const finalCashOuts: Record<string, number> = { ...cashOuts };

    // חישוב סך ה-cashOut הכולל:
    // 1. שחקנים שכבר יצאו
    // 2. שחקנים שעדיין במשחק - מה שהוזן בטופס (מי שלא הוזן נחשב 0)
    let calculatedTotalCashOut = 0;

    game.players.forEach((p: any) => {
      if (p.isCashedOut) {
        // שחקנים שכבר יצאו
        calculatedTotalCashOut += p.cashOut || 0;
      } else {
        // שחקנים שעדיין במשחק - מה שהוזן בטופס (אם לא הוזן = 0)
        const cashOutValue = finalCashOuts[p.userId._id];
        calculatedTotalCashOut += Number(cashOutValue) || 0;
      }
    });

    // בדיקה שסכום ה-cashOut לא עולה על הקופה (אבל יכול להיות נמוך ממנה)
    if (calculatedTotalCashOut > totalChipsInPot) {
      const playersWithoutCashOut = game.players.filter((p: any) => {
        if (p.isCashedOut) return false;
        const cashOut = finalCashOuts[p.userId._id];
        return cashOut === undefined || cashOut === null;
      });

      let message = `סכום ה-cashOut (${formatChips(
        calculatedTotalCashOut
      )}) עולה על סך הקופה (${formatChips(
        totalChipsInPot
      )}). הפרש: ${formatChips(calculatedTotalCashOut - totalChipsInPot)}`;

      if (playersWithoutCashOut.length > 0) {
        const playerNames = playersWithoutCashOut
          .map((p: any) => p.userId.name)
          .join(", ");
        message += ` (${playerNames} נחשבים כ-0)`;
      }

      setErrorMessage(message);
      // לא נסתיר את ההודעה אוטומטית - המשתמש צריך לתקן את הבעיה
      return;
    }

    // אם הסכום נמוך מהקופה - רק אזהרה אבל לא מונע סיום
    if (calculatedTotalCashOut < totalChipsInPot) {
      const difference = totalChipsInPot - calculatedTotalCashOut;
      console.warn(
        `CashOut (${calculatedTotalCashOut}) is lower than pot (${totalChipsInPot}). Difference: ${difference}`
      );
      // אפשר להמשיך - אולי חלק מהזיטונים אבדו או לא נמכרו
    }

    try {
      setLoading(true);
      await endGame(game._id, finalCashOuts);
      router.refresh(); // עדכון הדף כדי להציג את מסך ההתחשבנות
    } catch (error: any) {
      console.error("Error ending game:", error);
      setErrorMessage(error?.message || "שגיאה בסיום המשחק");
      setTimeout(() => setErrorMessage(null), 10000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {errorMessage && (
        <div className="glass-card p-4 rounded-xl border-2 border-rose-500/70 bg-rose-500/20 animate-in slide-in-from-top-2 shadow-lg shadow-rose-900/30 sticky top-4 z-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-rose-400 font-bold text-lg">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-rose-300 transition p-1"
              aria-label="סגור"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <section className="glass-card p-6 rounded-2xl border-amber-500/30 shadow-lg shadow-amber-900/20 animate-[pulse-slow_3s_infinite]">
          <div className="flex items-center gap-2 mb-4 text-amber-400">
            <AlertCircle className="w-5 h-5" />
            <h2 className="text-xl font-bold">בקשות ממתינות לאישור</h2>
          </div>
          <div className="space-y-3">
            {pendingRequests.map((req: any) => (
              <div
                key={req._id}
                className="flex items-center justify-between bg-slate-900/80 p-4 rounded-xl border border-slate-700/50"
              >
                <div>
                  <span className="font-bold text-lg text-slate-200">
                    {req.playerName}
                  </span>
                  <div className="text-amber-400 font-mono text-xl font-bold mt-1">
                    {formatChips(req.amount)} (
                    {formatShekels(chipsToShekels(req.amount))})
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() =>
                      approveRequest(game._id, req.userId, req._id)
                    }
                    className="p-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/50 rounded-xl transition"
                  >
                    <Check size={24} />
                  </button>
                  <button
                    onClick={() => rejectRequest(game._id, req.userId, req._id)}
                    className="p-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/50 rounded-xl transition"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Active Players */}
      <section className="glass-card p-6 rounded-2xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-xl font-bold text-slate-200">שחקנים פעילים</h2>
          <div className="flex gap-3 items-center w-full sm:w-auto">
            <button
              onClick={() =>
                navigator.clipboard.writeText(
                  `${window.location.origin}/game/${game._id}`
                )
              }
              className="flex items-center gap-2 text-xs bg-slate-800/50 px-3 py-2 rounded-lg text-slate-400 hover:text-white border border-slate-700/50 transition"
            >
              <Copy className="w-3 h-3" />
              העתק קישור
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-800/30 px-3 py-2 rounded-lg border border-slate-800">
              <Clock className="w-3 h-3" />
              {new Date(game.date).toLocaleDateString("he-IL")}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {game.players.map((p: any) => (
            <div
              key={p.userId._id}
              className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4"
            >
              {/* שם השחקן */}
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <Avatar
                    name={p.userId.name}
                    imageUrl={p.userId.avatarUrl}
                    size="md"
                  />
                  <span className="font-medium text-slate-300 text-lg">
                    {p.userId.name}
                  </span>
                  {p.isCashedOut && (
                    <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-1 rounded">
                      יצא
                    </span>
                  )}
                </div>
                {!p.isCashedOut && !isBuyInOpen[p.userId._id] && (
                  <button
                    onClick={() => handleBuyInClick(p.userId._id)}
                    className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/30 transition font-medium text-sm whitespace-nowrap"
                  >
                    + הוסף כניסה
                  </button>
                )}
              </div>

              {/* רשימת כניסות */}
              {!p.isCashedOut && (
                <div className="mb-4">
                  <div className="text-xs text-slate-500 mb-2">כניסות:</div>
                  <div className="flex flex-wrap gap-2">
                    {p.buyInRequests
                      ?.filter((req: any) => req.status === "approved")
                      .map((req: any, idx: number) => {
                        const buyInKey = `${p.userId._id}-${req._id || idx}`;
                        const isExpanded = expandedBuyIn[buyInKey] === buyInKey;
                        const timestamp = new Date(req.timestamp);
                        const timeStr = timestamp.toLocaleTimeString("he-IL", {
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "Asia/Jerusalem",
                        });
                        const isInitial = req.isInitial || false;
                        const addedBy = req.addedBy || "admin";

                        return (
                          <div key={req._id || idx} className="relative">
                            <div
                              onClick={() => {
                                setExpandedBuyIn((prev) => ({
                                  ...prev,
                                  [buyInKey]: isExpanded ? null : buyInKey,
                                }));
                              }}
                              className="bg-emerald-500/20 border border-emerald-500/30 rounded-lg px-3 py-1.5 text-emerald-400 font-mono text-sm cursor-pointer hover:bg-emerald-500/30 transition relative"
                            >
                              {formatChips(req.amount)}
                            </div>
                            {isExpanded && (
                              <div className="absolute top-full right-0 mt-1 z-10 bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs shadow-lg min-w-[200px]">
                                <div className="flex items-center justify-between gap-3 mb-1">
                                  <span className="text-slate-400">שעה:</span>
                                  <span className="text-slate-300 font-medium">
                                    {timeStr}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                  <span className="text-slate-400">סוג:</span>
                                  <div className="flex items-center gap-1 flex-wrap justify-end">
                                    {isInitial && (
                                      <span className="bg-blue-500/30 text-blue-300 px-1.5 py-0.5 rounded text-[10px]">
                                        ראשונית
                                      </span>
                                    )}
                                    <span className="text-slate-300 text-[10px]">
                                      {addedBy === "admin"
                                        ? "👤 מנהל"
                                        : "👤 משתמש"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    {(!p.buyInRequests ||
                      p.buyInRequests.filter(
                        (req: any) => req.status === "approved"
                      ).length === 0) && (
                      <span className="text-slate-500 text-sm">אין כניסות</span>
                    )}
                  </div>
                </div>
              )}

              {/* פעולות */}
              {!p.isCashedOut && (
                <div className="space-y-3">
                  {/* כניסה חדשה - מפושט */}
                  {isBuyInOpen[p.userId._id] && (
                    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700 space-y-3">
                      <div className="text-sm text-slate-400 text-center mb-1">
                        בחר סכום כניסה:
                      </div>
                      <div className="flex gap-2 items-center">
                        <button
                          onClick={() => {
                            const amount = buyInAmounts[p.userId._id] || 0;
                            if (amount > 0) {
                              import("@/app/actions").then((mod) =>
                                mod.adminAddBuyIn(
                                  game._id,
                                  p.userId._id,
                                  amount
                                )
                              );
                              setIsBuyInOpen((prev) => ({
                                ...prev,
                                [p.userId._id]: false,
                              }));
                              router.refresh();
                            }
                          }}
                          disabled={(buyInAmounts[p.userId._id] || 0) === 0}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg shadow-emerald-900/20 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium whitespace-nowrap"
                        >
                          אשר כניסה
                        </button>
                        <select
                          value={
                            showCustomBuyIn[p.userId._id]
                              ? "custom"
                              : buyInAmounts[p.userId._id] || 0
                          }
                          onChange={(e) => {
                            if (e.target.value === "custom") {
                              setShowCustomBuyIn((prev) => ({
                                ...prev,
                                [p.userId._id]: true,
                              }));
                            } else {
                              setShowCustomBuyIn((prev) => ({
                                ...prev,
                                [p.userId._id]: false,
                              }));
                              setBuyInAmounts((prev) => ({
                                ...prev,
                                [p.userId._id]: Number(e.target.value),
                              }));
                            }
                          }}
                          className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
                        >
                          {chipOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleCancelBuyIn(p.userId._id)}
                          className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-4 py-2 rounded-lg transition text-sm font-medium whitespace-nowrap"
                        >
                          ביטול
                        </button>
                      </div>

                      {showCustomBuyIn[p.userId._id] && (
                        <input
                          type="number"
                          min="0"
                          value={buyInAmounts[p.userId._id] || ""}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setBuyInAmounts((prev) => ({
                              ...prev,
                              [p.userId._id]: val,
                            }));
                          }}
                          placeholder="הזן זיטונים"
                          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
                        />
                      )}
                    </div>
                  )}

                  {/* יציאה - רק בסיום משחק */}
                  {ending &&
                    !p.isCashedOut &&
                    (() => {
                      return (
                        <div className="space-y-2 pt-2 border-t border-slate-700/50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-xs text-slate-500">
                              יציאה (זיטונים):
                            </div>
                            {errorMessage &&
                              cashOuts[p.userId._id] !== undefined && (
                                <button
                                  onClick={() => {
                                    setCashOuts((prev) => {
                                      const newState = { ...prev };
                                      delete newState[p.userId._id];
                                      return newState;
                                    });
                                  }}
                                  className="text-xs text-amber-400 hover:text-amber-300 transition"
                                >
                                  ✏️ חישוב מחדש
                                </button>
                              )}
                          </div>
                          <div className="flex gap-2 items-center flex-wrap">
                            <select
                              value={
                                showCustomCashOut[p.userId._id]
                                  ? "custom"
                                  : cashOuts[p.userId._id] ?? ""
                              }
                              onChange={(e) => {
                                if (e.target.value === "custom") {
                                  setShowCustomCashOut((prev) => ({
                                    ...prev,
                                    [p.userId._id]: true,
                                  }));
                                } else {
                                  setShowCustomCashOut((prev) => ({
                                    ...prev,
                                    [p.userId._id]: false,
                                  }));
                                  const value = Number(e.target.value);
                                  if (value > totalChipsInPot) {
                                    setErrorMessage(
                                      `לא ניתן להזין יותר מ-${totalChipsInPot.toLocaleString()} זיטונים (סך הקופה)`
                                    );
                                    setTimeout(
                                      () => setErrorMessage(null),
                                      5000
                                    );
                                    return;
                                  }
                                  setCashOuts({
                                    ...cashOuts,
                                    [p.userId._id]: value,
                                  });
                                }
                              }}
                              className={cn(
                                "flex-1 min-w-[150px] bg-slate-900/50 border rounded-lg px-3 py-2 text-white focus:ring-2 outline-none transition",
                                cashOuts[p.userId._id] === undefined ||
                                  cashOuts[p.userId._id] === null
                                  ? "border-slate-700 focus:ring-amber-500/50"
                                  : (cashOuts[p.userId._id] || 0) >
                                    totalChipsInPot
                                  ? "border-rose-500/50 focus:ring-rose-500/50"
                                  : "border-slate-700 focus:ring-amber-500/50"
                              )}
                            >
                              <option value="">בחר סכום יציאה</option>
                              {chipOptions.map((option) => (
                                <option
                                  key={option.value}
                                  value={option.value}
                                  disabled={
                                    option.value !== "custom" &&
                                    option.value > totalChipsInPot
                                  }
                                >
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            {showCustomCashOut[p.userId._id] && (
                              <input
                                type="number"
                                min="0"
                                max={totalChipsInPot}
                                value={cashOuts[p.userId._id] ?? ""}
                                onChange={(e) => {
                                  const value = Number(e.target.value);
                                  if (value > totalChipsInPot) {
                                    setErrorMessage(
                                      `לא ניתן להזין יותר מ-${totalChipsInPot.toLocaleString()} זיטונים (סך הקופה)`
                                    );
                                    setTimeout(
                                      () => setErrorMessage(null),
                                      5000
                                    );
                                    return;
                                  }
                                  setCashOuts({
                                    ...cashOuts,
                                    [p.userId._id]: value,
                                  });
                                }}
                                className={cn(
                                  "flex-1 min-w-[120px] bg-slate-900/50 border rounded-lg px-3 py-2 text-white focus:ring-2 outline-none transition",
                                  cashOuts[p.userId._id] === undefined ||
                                    cashOuts[p.userId._id] === null
                                    ? "border-slate-700 focus:ring-amber-500/50"
                                    : (cashOuts[p.userId._id] || 0) >
                                      totalChipsInPot
                                    ? "border-rose-500/50 focus:ring-rose-500/50"
                                    : "border-slate-700 focus:ring-amber-500/50"
                                )}
                                placeholder="הזן זיטונים"
                              />
                            )}
                          </div>
                        </div>
                      );
                    })()}
                </div>
              )}

              {/* אם יצא - הצג את סכום היציאה + אפשרות לערוך אם יש שגיאה */}
              {p.isCashedOut && (
                <div className="space-y-2 pt-2 border-t border-slate-700/50">
                  <div className="text-sm text-slate-400">
                    יצא עם{" "}
                    <span className="text-amber-400 font-mono font-bold">
                      {formatChips(p.cashOut)}
                    </span>
                  </div>
                  {errorMessage && !editingCashOut[p.userId._id] && (
                    <button
                      onClick={() => {
                        setEditingCashOut((prev) => ({
                          ...prev,
                          [p.userId._id]: true,
                        }));
                        // הגדר את ה-cashOut הנוכחי לעריכה
                        setCashOuts((prev) => ({
                          ...prev,
                          [p.userId._id]: p.cashOut || 0,
                        }));
                      }}
                      className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 px-3 py-1.5 rounded-lg border border-amber-500/30 transition font-medium text-sm"
                    >
                      ✏️ חישוב יציאה מחדש
                    </button>
                  )}
                  {editingCashOut[p.userId._id] && (
                    <div className="bg-slate-900/50 p-3 rounded-lg border border-amber-500/30 space-y-2">
                      <div className="text-xs text-amber-400 mb-1">
                        עריכת יציאה:
                      </div>
                      <div className="flex gap-2 items-center flex-wrap">
                        <button
                          onClick={async () => {
                            try {
                              const amount =
                                cashOuts[p.userId._id] ?? (p.cashOut || 0);
                              await import("@/app/actions").then((mod) =>
                                mod.cashOutPlayer(
                                  game._id,
                                  p.userId._id,
                                  amount
                                )
                              );
                              setEditingCashOut((prev) => ({
                                ...prev,
                                [p.userId._id]: false,
                              }));
                              router.refresh();
                            } catch (error: any) {
                              setErrorMessage(
                                error?.message || "שגיאה בעדכון יציאה"
                              );
                              setTimeout(() => setErrorMessage(null), 5000);
                            }
                          }}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg shadow-emerald-900/20 transition text-sm font-medium"
                        >
                          שמור
                        </button>
                        <select
                          value={
                            showCustomCashOut[p.userId._id]
                              ? "custom"
                              : cashOuts[p.userId._id] ?? p.cashOut ?? ""
                          }
                          onChange={(e) => {
                            if (e.target.value === "custom") {
                              setShowCustomCashOut((prev) => ({
                                ...prev,
                                [p.userId._id]: true,
                              }));
                            } else {
                              setShowCustomCashOut((prev) => ({
                                ...prev,
                                [p.userId._id]: false,
                              }));
                              const value = Number(e.target.value);
                              if (value > totalChipsInPot) {
                                setErrorMessage(
                                  `לא ניתן להזין יותר מ-${totalChipsInPot.toLocaleString()} זיטונים (סך הקופה)`
                                );
                                setTimeout(() => setErrorMessage(null), 5000);
                                return;
                              }
                              setCashOuts({
                                ...cashOuts,
                                [p.userId._id]: value,
                              });
                            }
                          }}
                          className="flex-1 min-w-[150px] bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
                        >
                          {chipOptions.map((option) => (
                            <option
                              key={option.value}
                              value={option.value}
                              disabled={
                                option.value !== "custom" &&
                                option.value > totalChipsInPot
                              }
                            >
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => {
                            setEditingCashOut((prev) => ({
                              ...prev,
                              [p.userId._id]: false,
                            }));
                            setCashOuts((prev) => {
                              const newState = { ...prev };
                              delete newState[p.userId._id];
                              return newState;
                            });
                          }}
                          className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-4 py-2 rounded-lg transition text-sm font-medium"
                        >
                          ביטול
                        </button>
                      </div>
                      {showCustomCashOut[p.userId._id] && (
                        <input
                          type="number"
                          min="0"
                          max={totalChipsInPot}
                          value={cashOuts[p.userId._id] ?? p.cashOut ?? ""}
                          onChange={(e) => {
                            const value = Number(e.target.value);
                            if (value > totalChipsInPot) {
                              setErrorMessage(
                                `לא ניתן להזין יותר מ-${totalChipsInPot.toLocaleString()} זיטונים (סך הקופה)`
                              );
                              setTimeout(() => setErrorMessage(null), 5000);
                              return;
                            }
                            setCashOuts({
                              ...cashOuts,
                              [p.userId._id]: value,
                            });
                          }}
                          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
                          placeholder="הזן זיטונים"
                        />
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/50">
          {!ending ? (
            <button
              onClick={() => setEnding(true)}
              className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/50 py-4 rounded-xl font-bold transition flex items-center justify-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              סיום משחק
            </button>
          ) : (
            <div className="space-y-4">
              {/* הצגת סך הקופה וסך ה-cashOut */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                    סך הקופה
                  </div>
                  <div className="text-xl font-bold text-emerald-400 font-mono">
                    {formatChips(totalChipsInPot)}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {formatShekels(chipsToShekels(totalChipsInPot))}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                    סך יציאות שהוזנו
                  </div>
                  <div
                    className={cn(
                      "text-xl font-bold font-mono",
                      totalCashOut > totalChipsInPot
                        ? "text-rose-400"
                        : totalCashOut === totalChipsInPot
                        ? "text-emerald-400"
                        : "text-amber-400"
                    )}
                  >
                    {formatChips(totalCashOut)}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {formatShekels(chipsToShekels(totalCashOut))}
                  </div>
                </div>
              </div>

              {/* אזהרה אם סכום ה-cashOut עולה על הקופה */}
              {totalCashOut > totalChipsInPot && (
                <div className="p-4 bg-rose-900/20 border border-rose-500/30 rounded-xl">
                  <p className="text-rose-400 font-bold mb-2 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    סכום ה-cashOut עולה על סך הקופה
                  </p>
                  <p className="text-slate-400 text-sm">
                    סך הקופה: {formatChips(totalChipsInPot)} | סך יציאות:{" "}
                    {formatChips(totalCashOut)} | הפרש:{" "}
                    {formatChips(totalCashOut - totalChipsInPot)}
                  </p>
                </div>
              )}

              {/* בדיקה ויזואלית של שחקנים שחסר להם cashOut - רק אם הסכום לא תואם */}
              {(() => {
                if (totalCashOut === totalChipsInPot) return null;

                const playersWithoutCashOut = game.players.filter((p: any) => {
                  if (p.isCashedOut) return false;
                  const cashOut = cashOuts[p.userId._id];
                  return (
                    cashOut === undefined || cashOut === null
                  );
                });

                if (playersWithoutCashOut.length > 0) {
                  return (
                    <div className="p-4 bg-amber-900/20 border border-amber-500/30 rounded-xl">
                      <p className="text-amber-400 font-bold mb-2 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        חסרים נתונים (נחשבים כ-0)
                      </p>
                      <p className="text-slate-400 text-sm">
                        עבור:{" "}
                        {playersWithoutCashOut
                          .map((p: any) => p.userId.name)
                          .join(", ")}
                      </p>
                    </div>
                  );
                }
                return null;
              })()}

              <div className="flex gap-4">
                <button
                  onClick={() => setEnding(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-4 rounded-xl font-medium transition"
                >
                  ביטול
                </button>
                <button
                  onClick={handleEndGame}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white py-4 rounded-xl font-bold shadow-lg shadow-rose-900/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="animate-spin mx-auto" />
                  ) : (
                    "אשר סיום וחשב תוצאות"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
