"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Check, Plus, X } from "lucide-react";

export default function AdminEmailSettings({
  clubId,
  currentEmail,
}: {
  clubId: string;
  currentEmail?: string;
}) {
  // פיצול המיילים הקיימים למערך
  const parseEmails = (emailString?: string): string[] => {
    if (!emailString) return [];
    return emailString
      .split(",")
      .map((e) => e.trim())
      .filter((e) => e.length > 0);
  };

  const [emails, setEmails] = useState<string[]>(parseEmails(currentEmail));
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (currentEmail !== undefined) {
      setEmails(parseEmails(currentEmail));
    }
  }, [currentEmail]);

  function handleAddEmail() {
    setEmails([...emails, ""]);
  }

  function handleRemoveEmail(index: number) {
    setEmails(emails.filter((_, i) => i !== index));
    setError("");
    setSuccess(false);
  }

  function handleEmailChange(index: number, value: string) {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
    setError("");
    setSuccess(false);
  }

  async function handleSave() {
    // בדיקת תקינות כתובת המייל
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // הסרת מיילים ריקים
    const validEmails = emails.map((e) => e.trim()).filter((e) => e.length > 0);

    // בדיקה שכל מייל תקין
    for (const emailAddr of validEmails) {
      if (!emailRegex.test(emailAddr)) {
        setError(`כתובת מייל לא תקינה: ${emailAddr}`);
        return;
      }
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      // שליחה כמערך מופרד בפסיקים
      const emailString = validEmails.length > 0 ? validEmails.join(",") : null;

      const response = await fetch("/api/update-admin-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminEmail: emailString }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          router.refresh();
        }, 1000);
      } else {
        setError(result.error || "שגיאה בעדכון");
      }
    } catch (error) {
      setError("שגיאה בעדכון כתובת המייל");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-card p-6 rounded-2xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <Mail className="w-5 h-5 text-blue-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-200 text-right">
            כתובת מייל של מנהל
          </h3>
          <p className="text-xs text-slate-400 text-right mt-1">
            המייל שיקבל עדכונים על בקשות כניסה חדשות. ניתן להזין מספר מיילים
            מופרדים בפסיקים
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-slate-400 text-right">
              כתובות מייל
            </label>
            <button
              onClick={handleAddEmail}
              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition border border-blue-500/30"
            >
              <Plus className="w-3 h-3" />
              הוסף מייל
            </button>
          </div>

          <div className="space-y-2">
            {emails.map((email, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => handleEmailChange(index, e.target.value)}
                  className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition text-right"
                  placeholder="example@email.com"
                />
                {emails.length > 1 && (
                  <button
                    onClick={() => handleRemoveEmail(index)}
                    className="px-3 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-lg transition border border-rose-500/30 flex items-center justify-center"
                    title="הסר מייל"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}

            {emails.length === 0 && (
              <div className="text-center py-4 text-slate-500 text-sm">
                אין מיילים מוגדרים. לחץ על "הוסף מייל" כדי להוסיף.
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-3">
            <button
              onClick={handleSave}
              disabled={
                loading ||
                emails.join(",") === (currentEmail || "") ||
                emails.every((e) => !e.trim())
              }
              className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  שומר...
                </>
              ) : success ? (
                <>
                  <Check className="w-4 h-4" />
                  נשמר
                </>
              ) : (
                "שמור"
              )}
            </button>
          </div>

          <p className="text-xs text-slate-500 mt-2 text-right">
            ניתן להוסיף מספר מיילים שיקבלו עדכונים על בקשות כניסה חדשות
          </p>
        </div>

        {error && (
          <div className="text-rose-500 text-sm text-right bg-rose-500/10 p-2 rounded border border-rose-500/50">
            {error}
          </div>
        )}

        {success && (
          <div className="text-emerald-500 text-sm text-right bg-emerald-500/10 p-2 rounded border border-emerald-500/50 flex items-center gap-2 justify-end">
            <Check className="w-4 h-4" />
            כתובת המייל עודכנה בהצלחה
          </div>
        )}
      </div>
    </div>
  );
}
