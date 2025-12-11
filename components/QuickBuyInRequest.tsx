"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function QuickBuyInRequest({
  game,
  currentUser,
}: {
  game: any;
  currentUser: any;
}) {
  const userId = currentUser?._id;
  const player = userId
    ? game.players.find((p: any) => p.userId._id === userId)
    : null;

  // אם המשתמש לא מחובר או לא משתתף במשחק, לא להציג כלום
  if (!currentUser || !player) {
    return null;
  }

  return (
    <Link
      href={`/game/${game._id}/request-buyin`}
      className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-lg transition font-medium text-sm flex items-center justify-center gap-2"
    >
      <Plus className="w-4 h-4" />
      בקשה לכניסה נוספת
    </Link>
  );
}

