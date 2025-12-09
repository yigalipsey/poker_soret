"use client";

import { useState } from "react";
import { logoutAdmin } from "@/app/actions";
import { useRouter } from "next/navigation";
import { LogOut, Loader2, AlertCircle, X } from "lucide-react";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  async function handleLogout() {
    try {
      setLoading(true);
      await logoutAdmin();
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Error logging out:", error);
      setErrorMessage("שגיאה בהתנתקות");
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      {errorMessage && (
        <div className="absolute bottom-full right-0 mb-2 p-3 rounded-lg border border-rose-500/50 bg-rose-500/10 z-10 min-w-[200px]">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-rose-400 text-sm font-medium">
                {errorMessage}
              </p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-rose-300 transition"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
      <button
        onClick={handleLogout}
        disabled={loading}
        className="flex items-center gap-2 text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg border border-slate-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <LogOut className="w-4 h-4" />
        )}
        <span>התנתק</span>
      </button>
    </div>
  );
}

