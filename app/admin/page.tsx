import { getClubSession } from "../actions";
import LogoutButton from "@/components/admin/LogoutButton";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Gamepad2,
  Settings,
  Wallet,
  History,
  ArrowLeft,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const clubId = await getClubSession();

  // If no club selected, redirect to login
  if (!clubId) {
    redirect("/admin/login");
  }

  const menuItems = [
    {
      title: "ניהול שחקנים",
      description: "הוסף שחקנים חדשים וצפה ברשימת השחקנים",
      href: "/admin/users",
      icon: Users,
      color: "blue",
    },
    {
      title: "ניהול משחקים",
      description: "צור משחקים חדשים וצפה במשחקים פעילים",
      href: "/admin/games",
      icon: Gamepad2,
      color: "emerald",
    },
    {
      title: "טעינת כסף",
      description: "טען כסף לשחקנים בקופה המשותפת",
      href: "/admin/bankroll",
      icon: Wallet,
      color: "purple",
    },
    {
      title: "הגדרות מועדון",
      description: "ערוך הגדרות מועדון, מוד משחק והגדרות נוספות",
      href: "/admin/settings",
      icon: Settings,
      color: "amber",
    },
  ];

  return (
    <div className="pt-4 pb-24 space-y-8 min-h-screen px-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gradient tracking-tight text-right">
          לוח בקרה - מנהל
        </h1>
        <LogoutButton />
      </div>

      <div className="grid gap-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const colorClasses = {
            blue: "bg-blue-500/20 text-blue-400 border-blue-500/50",
            emerald: "bg-emerald-500/20 text-emerald-400 border-emerald-500/50",
            purple: "bg-purple-500/20 text-purple-400 border-purple-500/50",
            amber: "bg-amber-500/20 text-amber-400 border-amber-500/50",
          };

          return (
            <Link
              key={item.href}
              href={item.href}
              className="glass-card p-6 rounded-2xl hover:bg-slate-800/60 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-xl border ${
                    colorClasses[item.color as keyof typeof colorClasses]
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 text-right">
                  <h3 className="text-xl font-bold text-slate-200 mb-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-400">{item.description}</p>
                </div>
                <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
