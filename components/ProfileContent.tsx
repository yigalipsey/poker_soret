"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { playerLogin } from "@/app/actions";
import { Avatar } from "@/components/ui/Avatar";
import {
  User,
  Lock,
  LogOut,
  Building2,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  Wallet,
} from "lucide-react";
import { formatChips, chipsToShekels, formatShekels } from "@/lib/utils";
import { requestDeposit } from "@/app/actions";
import { TrendingUp } from "lucide-react";

export default function ProfileContent({
  currentUser,
  userClubs,
  hasClubSession,
  club,
}: {
  currentUser: any;
  userClubs: any[];
  hasClubSession: boolean;
  club: any;
}) {
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loginName, setLoginName] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositLoading, setDepositLoading] = useState(false);
  const router = useRouter();

  async function handlePlayerLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");

    if (!loginName || !loginPassword) {
      setLoginError("נא למלא את כל השדות");
      setLoginLoading(false);
      return;
    }

    try {
      const res = await playerLogin(loginName, loginPassword);

      if (res.success) {
        router.push("/");
        router.refresh();
      } else {
        setLoginError(res.error || "שגיאה בהתחברות");
        setLoginLoading(false);
      }
    } catch (error) {
      setLoginError("שגיאה בהתחברות");
      setLoginLoading(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!currentUser) {
      setErrorMessage("נא להתחבר תחילה");
      setLoading(false);
      return;
    }

    if (!oldPassword || !newPassword || !confirmPassword) {
      setErrorMessage("נא למלא את כל השדות");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("הסיסמאות החדשות לא תואמות");
      setLoading(false);
      return;
    }

    if (oldPassword !== currentUser.password) {
      setErrorMessage("סיסמה נוכחית שגויה");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser._id,
          newPassword: newPassword,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccessMessage("סיסמה עודכנה בהצלחה");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setShowPasswordForm(false);
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } else {
        setErrorMessage(result.error || "שגיאה בעדכון הסיסמה");
      }
    } catch (error) {
      setErrorMessage("שגיאה בעדכון הסיסמה");
    } finally {
      setLoading(false);
    }
  }

  // אם אין club_session - צריך להיכנס למועדון תחילה
  if (!hasClubSession) {
    return (
      <div className="min-h-screen pb-24 px-4 pt-4 max-w-md mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gradient tracking-tight text-right">
            אזור אישי
          </h1>
          <p className="text-slate-400 text-sm mt-2 text-right">
            ניהול פרטים אישיים והגדרות
          </p>
        </header>

        <div className="glass-card p-8 rounded-2xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-amber-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-200 mb-2">
              נא להיכנס למועדון תחילה
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              כדי לגשת לפרופיל, יש להיכנס למועדון תחילה מהדף הראשי.
            </p>
            <a
              href="/"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition"
            >
              חזור לדף הראשי
            </a>
          </div>
        </div>
      </div>
    );
  }

  // אם אין משתמש מחובר - רק טופס התחברות
  if (!currentUser) {
    return (
      <div className="min-h-screen pb-24 px-4 pt-4 max-w-md mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gradient tracking-tight text-right">
            אזור אישי
          </h1>
          <p className="text-slate-400 text-sm mt-2 text-right">
            ניהול פרטים אישיים והגדרות
          </p>
        </header>

        <div className="glass-card p-8 rounded-2xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-slate-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-200 mb-2">
              אין משתמש מחובר
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              כדי לראות את הפרופיל שלך, יש להתחבר כיוזר (שחקן) מהמועדון הנוכחי.
            </p>
          </div>

          <form onSubmit={handlePlayerLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1 text-right">
                שם שחקן
              </label>
              <input
                type="text"
                value={loginName}
                onChange={(e) => setLoginName(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition text-right"
                placeholder="הזן שם שחקן"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1 text-right">
                סיסמה
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition text-right"
                placeholder="הזן סיסמה"
              />
            </div>

            {loginError && (
              <div className="text-rose-500 text-sm text-center bg-rose-500/10 p-2 rounded">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold transition flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loginLoading ? (
                <Loader2 className="animate-spin w-5 h-5" />
              ) : (
                <>
                  <User className="w-5 h-5" />
                  התחבר כיוזר
                </>
              )}
            </button>
          </form>

          <p className="text-center text-slate-500 text-xs mt-6">
            אין לך סיסמה? פנה למנהל המשחק
          </p>
        </div>
      </div>
    );
  }

  // אם המשתמש הוא מנהל - לא להציג את תוכן הפרופיל
  if (currentUser?.isAdmin) {
    return (
      <div className="min-h-screen pb-24 px-4 pt-4 max-w-md mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gradient tracking-tight text-right">
            אזור אישי
          </h1>
          <p className="text-slate-400 text-sm mt-2 text-right">
            ניהול פרטים אישיים והגדרות
          </p>
        </header>

        <div className="glass-card p-8 rounded-2xl text-center">
          <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-slate-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-200 mb-2">
            אין משתמש מחובר
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            אתה מחובר כמנהל מועדון. כדי לראות את הפרופיל שלך, יש להתחבר כיוזר
            (שחקן).
          </p>
          <p className="text-slate-500 text-xs">
            המנהל הוא רק לניהול המועדון ולא מופיע ברשימת השחקנים.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 px-4 pt-4 max-w-md mx-auto">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gradient tracking-tight text-right">
          אזור אישי
        </h1>
        <p className="text-slate-400 text-sm mt-2 text-right">
          ניהול פרטים אישיים והגדרות
        </p>
      </header>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="glass-card p-4 rounded-xl border border-emerald-500/50 bg-emerald-500/10 animate-in slide-in-from-top-2 mb-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-emerald-400 font-medium">{successMessage}</p>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-400 hover:text-emerald-300 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="glass-card p-4 rounded-xl border border-rose-500/50 bg-rose-500/10 animate-in slide-in-from-top-2 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-rose-400 font-medium">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-rose-300 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* User Info Card */}
      <div className="glass-card p-6 rounded-2xl mb-6">
        <div className="flex items-center gap-4 mb-6">
          <Avatar
            name={currentUser.name}
            imageUrl={currentUser.avatarUrl}
            size="xl"
          />
          <div className="flex-1 text-right">
            <h2 className="text-2xl font-bold text-slate-200">
              {currentUser.name}
            </h2>
            <p className="text-slate-400 text-sm mt-1">שחקן</p>
          </div>
        </div>

        {/* Balance */}
        <div className="pt-4 border-t border-slate-800/50">
          <div className="flex items-center justify-between text-right">
            <div>
              <p className="text-sm text-slate-400">מאזן כולל</p>
              <p
                className={`text-xl font-bold ${
                  (currentUser.globalBalance || 0) >= 0
                    ? "text-emerald-400"
                    : "text-rose-400"
                }`}
              >
                {(currentUser.globalBalance || 0).toLocaleString()} ₪
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* User Clubs */}
      {userClubs && userClubs.length > 0 && (
        <div className="glass-card p-6 rounded-2xl mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Building2 className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-200 text-right">
              המועדונים שלי
            </h3>
          </div>
          <div className="space-y-3">
            {userClubs.map((club: any) => (
              <div
                key={club._id}
                className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50"
              >
                <div className="flex items-center gap-3 text-right">
                  <Building2 className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-lg font-bold text-slate-200">
                      {club.name}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deposit Request Section - רק במוד קופה משותפת */}
      {club?.gameMode === "shared_bankroll" && currentUser && (
        <div className="glass-card p-6 rounded-2xl mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-200 text-right">
              בקשת טעינת כסף לקופה
            </h3>
          </div>
          <p className="text-slate-400 text-sm mb-4 text-right">
            שלח בקשה למנהל להוספת כסף לקופה המשותפת שלך. המנהל יקבל מייל עם
            קישור לאישור הבקשה.
          </p>
          <p className="text-slate-500 text-xs mb-4 text-right">
            למשיכת זיטונים מהקופה למשחק, עבור לדף הראשי.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1 text-right">
                סכום מבוקש (בשקלים)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="לדוגמה: 100"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none transition text-right"
              />
            </div>
            <button
              onClick={async () => {
                const amount = Number(depositAmount);
                if (!amount || amount <= 0) {
                  setErrorMessage("נא להזין סכום תקין");
                  setTimeout(() => setErrorMessage(null), 3000);
                  return;
                }

                try {
                  setDepositLoading(true);
                  setErrorMessage(null);
                  await requestDeposit(amount);
                  setDepositAmount("");
                  setSuccessMessage(
                    `בקשה לטעינת ₪${amount.toLocaleString(
                      "he-IL"
                    )} נשלחה למנהל. תקבל עדכון לאחר אישור הבקשה.`
                  );
                  setTimeout(() => {
                    setSuccessMessage(null);
                    router.refresh();
                  }, 5000);
                } catch (error: any) {
                  setErrorMessage(error?.message || "שגיאה בשליחת הבקשה");
                  setTimeout(() => setErrorMessage(null), 5000);
                } finally {
                  setDepositLoading(false);
                }
              }}
              disabled={
                depositLoading || !depositAmount || Number(depositAmount) <= 0
              }
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {depositLoading ? (
                <Loader2 className="animate-spin w-5 h-5" />
              ) : (
                <>
                  <TrendingUp className="w-5 h-5" />
                  שלח בקשה לטעינה
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Change Password Section */}
      <div className="glass-card p-6 rounded-2xl mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Lock className="w-5 h-5 text-blue-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-200 text-right">
            שינוי סיסמה
          </h3>
        </div>

        {!showPasswordForm ? (
          <button
            onClick={() => setShowPasswordForm(true)}
            className="w-full bg-slate-800/50 hover:bg-slate-800 text-slate-300 py-3 rounded-lg font-medium transition border border-slate-700/50"
          >
            שנה סיסמה
          </button>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1 text-right">
                סיסמה נוכחית
              </label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition text-right"
                placeholder="הזן סיסמה נוכחית"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1 text-right">
                סיסמה חדשה
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition text-right"
                placeholder="הזן סיסמה חדשה"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1 text-right">
                אימות סיסמה חדשה
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition text-right"
                placeholder="הזן שוב את הסיסמה החדשה"
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordForm(false);
                  setOldPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setErrorMessage(null);
                }}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-medium transition"
              >
                ביטול
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="animate-spin w-5 h-5" />
                ) : (
                  "שמור"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
