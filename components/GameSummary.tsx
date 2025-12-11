import { cn, formatChips, chipsToShekels, formatShekels } from "@/lib/utils";
import {
  ArrowLeft,
  Calendar,
  Coins,
  TrendingDown,
  TrendingUp,
  User,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";

export default function GameSummary({ game }: { game: any }) {
  const totalBuyIn = game.players.reduce(
    (acc: number, p: any) => acc + p.totalApprovedBuyIn,
    0
  );
  const totalCashOut = game.players.reduce(
    (acc: number, p: any) => acc + p.cashOut,
    0
  );

  return (
    <div className="min-h-screen pb-24 pt-4 px-4">
      <header className="flex items-center gap-4 py-6 mb-8">
        <Link
          href="/history"
          className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition"
        >
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-200">סיכום משחק</h1>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Calendar className="w-3 h-3" />
            {new Date(game.date).toLocaleDateString("he-IL", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="glass p-4 rounded-xl">
          <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">
            סך כניסות
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {formatChips(totalBuyIn)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {formatShekels(chipsToShekels(totalBuyIn))}
          </div>
        </div>
        <div className="glass p-4 rounded-xl">
          <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">
            סך יציאות
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono">
            {formatChips(totalCashOut)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {formatShekels(chipsToShekels(totalCashOut))}
          </div>
        </div>
      </div>

      {/* Players Table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right min-w-[500px]">
            <thead className="bg-slate-900/50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-4 font-medium">שחקן</th>
                <th className="p-4 font-medium">רווח/הפסד</th>
                <th className="p-4 font-medium">כניסה</th>
                <th className="p-4 font-medium">יציאה</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {game.players.map((p: any) => (
                <tr
                  key={p.userId._id}
                  className="hover:bg-slate-800/30 transition"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Avatar
                        name={p.userId.name}
                        imageUrl={p.userId.avatarUrl}
                        size="sm"
                      />
                      <span className="font-medium text-slate-200">
                        {p.userId.name}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div
                      className={cn(
                        "font-bold font-mono flex items-center gap-1",
                        p.netProfit > 0
                          ? "text-emerald-400"
                          : p.netProfit < 0
                          ? "text-rose-400"
                          : "text-slate-400"
                      )}
                    >
                      {p.netProfit > 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : p.netProfit < 0 ? (
                        <TrendingDown className="w-3 h-3" />
                      ) : null}
                      {p.netProfit > 0 ? "+" : ""}
                      {formatShekels(chipsToShekels(p.netProfit))}
                      <span className="text-xs text-slate-600 ml-2">
                        ({formatChips(p.netProfit)})
                      </span>
                    </div>
                  </td>
                  <td className="p-4 font-mono text-slate-400">
                    {formatChips(p.totalApprovedBuyIn)}
                    <span className="text-xs text-slate-600 ml-2">
                      ({formatShekels(chipsToShekels(p.totalApprovedBuyIn))})
                    </span>
                  </td>
                  <td className="p-4 font-mono text-slate-400">
                    {formatChips(p.cashOut)}
                    <span className="text-xs text-slate-600 ml-2">
                      ({formatShekels(chipsToShekels(p.cashOut))})
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
