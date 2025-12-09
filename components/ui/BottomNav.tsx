"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, History, Settings, PlayCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface BottomNavProps {
  activeGameId?: string | null;
}

export function BottomNav({ activeGameId }: BottomNavProps) {
  const pathname = usePathname();
  const [showNoGameMessage, setShowNoGameMessage] = useState(false);

  // Don't show on specific routes if needed (e.g. login)
  if (pathname === "/login" || pathname === "/club-login") return null;

  const isActive = (path: string) => pathname === path;

  const handleNoGameClick = () => {
    setShowNoGameMessage(true);
    setTimeout(() => setShowNoGameMessage(false), 3000);
  };

  return (
    <>
      {/* Message overlay for no active game */}
      {showNoGameMessage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
          <div className="glass-card p-8 rounded-2xl max-w-sm mx-4 border border-slate-700/50 shadow-2xl animate-[fade-in_0.3s_ease-out] pointer-events-auto">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <PlayCircle className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-200">
                אין משחק פעיל כרגע
              </h3>
              <p className="text-slate-400 text-sm">
                נא להמתין עד שהמנהל יפתח משחק חדש
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2 bg-gradient-to-t from-slate-950 via-slate-900/95 to-transparent pointer-events-none">
        <nav className="glass-panel mx-auto max-w-md rounded-2xl flex items-center justify-between p-2 pointer-events-auto shadow-2xl shadow-black/50 border border-slate-700/50">
          <Link
            href="/"
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 w-14",
              isActive("/")
                ? "text-amber-400 bg-amber-400/10"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            )}
          >
            <Home className={cn("w-6 h-6", isActive("/") && "fill-current")} />
            <span className="text-[10px] font-medium">בית</span>
          </Link>

          {activeGameId ? (
            <Link
              href={`/game/${activeGameId}`}
              className="relative -mt-8 group"
            >
              <div className="absolute inset-0 bg-rose-500 rounded-full blur opacity-40 group-hover:opacity-60 transition-opacity animate-pulse-slow"></div>
              <div className="bg-gradient-to-br from-rose-500 to-rose-600 p-3 rounded-full text-white shadow-lg shadow-rose-500/30 border border-rose-400/50 relative transform transition-transform group-hover:scale-105 group-active:scale-95">
                <PlayCircle className="w-8 h-8 fill-rose-500/20" />
              </div>
            </Link>
          ) : (
            <button
              onClick={handleNoGameClick}
              className="relative -mt-8 group cursor-pointer"
            >
              <div className="absolute inset-0 bg-slate-600 rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <div className="bg-gradient-to-br from-slate-700 to-slate-800 p-3 rounded-full text-slate-300 shadow-lg shadow-slate-900/20 border border-slate-600 relative transform transition-transform group-hover:scale-105 group-active:scale-95 group-hover:text-slate-200 group-hover:border-slate-500/30">
                <PlayCircle className="w-8 h-8 opacity-70 group-hover:opacity-100" />
              </div>
            </button>
          )}

          <Link
            href="/history"
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 w-14",
              isActive("/history")
                ? "text-amber-400 bg-amber-400/10"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            )}
          >
            <History
              className={cn(
                "w-6 h-6",
                isActive("/history") && "text-amber-400"
              )}
            />
            <span className="text-[10px] font-medium">היסטוריה</span>
          </Link>

          <Link
            href="/profile"
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 w-14",
              isActive("/profile")
                ? "text-amber-400 bg-amber-400/10"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            )}
          >
            <User
              className={cn("w-6 h-6", isActive("/profile") && "fill-current")}
            />
            <span className="text-[10px] font-medium">פרופיל</span>
          </Link>

          <Link
            href="/admin"
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 w-14",
              isActive("/admin")
                ? "text-amber-400 bg-amber-400/10"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            )}
          >
            <Settings
              className={cn(
                "w-6 h-6",
                isActive("/admin") && "animate-spin-slow"
              )}
            />
            <span className="text-[10px] font-medium">ניהול</span>
          </Link>
        </nav>
      </div>
    </>
  );
}
