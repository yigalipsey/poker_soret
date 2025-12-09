"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";

export default function ClubLogoutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    try {
      setLoading(true);

      const response = await fetch("/api/clear-club-session", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        // Wait a bit to ensure cookies are cleared
        await new Promise((resolve) => setTimeout(resolve, 100));
        // Redirect to home page which will show the login screen
        window.location.href = "/";
      } else {
        console.error("Failed to logout");
        // Even if there's an error, try to redirect
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Error logging out from club:", error);
      // Even if there's an error, try to redirect
      window.location.href = "/";
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="flex items-center gap-2 text-sm bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 px-3 py-2 rounded-lg border border-slate-700/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <LogOut className="w-4 h-4" />
      )}
      <span>יציאה ממועדון</span>
    </button>
  );
}
