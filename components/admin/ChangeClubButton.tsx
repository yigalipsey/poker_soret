"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

export default function ChangeClubButton() {
  const router = useRouter();

  async function handleChangeClub() {
    const response = await fetch("/api/clear-club-session", {
      method: "POST",
    });
    if (response.ok) {
      router.refresh();
    }
  }

  return (
    <button
      onClick={handleChangeClub}
      className="p-2 bg-slate-800/50 rounded-lg hover:bg-slate-700 transition text-slate-400 hover:text-slate-200 flex items-center gap-2"
    >
      <span className="text-sm">החלף קלאב</span>
      <ArrowRight className="w-4 h-4" />
    </button>
  );
}
