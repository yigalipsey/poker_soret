import { getGameById } from "@/app/actions";
import SettlementView from "@/components/admin/SettlementView";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import LogoutButton from "@/components/admin/LogoutButton";

export const dynamic = "force-dynamic";

export default async function AdminGamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const game = await getGameById(id);

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">המשחק לא נמצא</p>
          <Link
            href="/admin"
            className="text-amber-400 hover:text-amber-300 transition"
          >
            חזרה לדשבורד המנהל
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 space-y-8 min-h-screen">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="p-3 bg-slate-800/50 rounded-full hover:bg-slate-700 transition border border-slate-700 backdrop-blur-md group"
          >
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gradient tracking-tight">
              סיכום משחק
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {new Date(game.date).toLocaleDateString("he-IL", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
        <LogoutButton />
      </div>

      <SettlementView game={game} />
    </div>
  );
}
