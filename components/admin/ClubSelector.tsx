"use client";

import { useState, useEffect } from "react";
import {
  setClubSession,
  getAllClubs,
  migrateUsersToClubSoret,
} from "@/app/actions";
import { Loader2, Plus, Building2, Check } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ClubSelector({
  currentClubId,
}: {
  currentClubId: string | null;
}) {
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newClubName, setNewClubName] = useState("");
  const [migrating, setMigrating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadClubs();
  }, []);

  async function loadClubs() {
    setLoading(true);
    const allClubs = await getAllClubs();
    setClubs(allClubs || []);
    setLoading(false);
  }

  async function handleCreateClub() {
    if (!newClubName.trim()) return;
    setCreating(true);
    try {
      // Create a manager user for this club automatically
      // We'll use a server action to handle this properly
      const response = await fetch("/api/create-club", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newClubName.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to create club");
      }

      const result = await response.json();
      if (result.success) {
        setNewClubName("");
        await loadClubs();
        router.refresh();
      } else {
        alert(result.error || "שגיאה ביצירת קלאב");
      }
    } catch (error) {
      console.error("Error creating club:", error);
      alert("שגיאה ביצירת קלאב");
    } finally {
      setCreating(false);
    }
  }

  async function handleSelectClub(clubId: string) {
    setLoading(true);
    await setClubSession(clubId);
    router.refresh();
    setLoading(false);
  }

  async function handleMigrate() {
    setMigrating(true);
    try {
      await migrateUsersToClubSoret();
      // Reload clubs list first
      const updatedClubs = await getAllClubs();
      setClubs(updatedClubs || []);
      // Find and select club soret after migration
      const clubSoret = updatedClubs?.find((c) => c.name === "club soret");
      if (clubSoret) {
        await setClubSession(clubSoret._id);
        router.refresh();
      } else {
        alert("כל השחקנים הועברו לקלאב 'club soret'");
        router.refresh();
      }
    } catch (error) {
      console.error("Error migrating:", error);
      alert("שגיאה בהעברת שחקנים");
    } finally {
      setMigrating(false);
    }
  }

  if (loading && clubs.length === 0) {
    return (
      <div className="glass-card p-6 rounded-2xl">
        <Loader2 className="animate-spin mx-auto text-amber-500" />
      </div>
    );
  }

  return (
    <div className="glass-card p-6 rounded-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <Building2 className="w-5 h-5 text-blue-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-200 text-right">
          ניהול קלאב
        </h2>
      </div>

      {currentClubId ? (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/50 rounded-lg">
          <p className="text-emerald-400 text-right font-medium">
            קלאב פעיל:{" "}
            {clubs.find((c) => c._id === currentClubId)?.name || "לא ידוע"}
          </p>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/50 rounded-lg">
          <p className="text-amber-400 text-right font-medium mb-3">
            אין קלאב פעיל. בחר קלאב או צור חדש
          </p>
          <button
            onClick={handleMigrate}
            disabled={migrating}
            className="w-full bg-amber-600 hover:bg-amber-500 text-white py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {migrating ? (
              <Loader2 className="animate-spin mx-auto" />
            ) : (
              "העבר את כל השחקנים לקלאב 'club soret'"
            )}
          </button>
        </div>
      )}

      <div className="space-y-3 mb-6">
        <h3 className="text-sm font-medium text-slate-500 mb-3 uppercase tracking-wider text-right">
          בחר קלאב קיים
        </h3>
        <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
          {clubs.map((club) => (
            <button
              key={club._id}
              onClick={() => handleSelectClub(club._id)}
              disabled={loading || club._id === currentClubId}
              className={`w-full p-3 rounded-lg border transition text-right ${
                club._id === currentClubId
                  ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                  : "bg-slate-800/50 border-slate-700/50 hover:bg-slate-800 text-slate-300"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{club.name}</span>
                {club._id === currentClubId && (
                  <Check className="w-4 h-4 text-emerald-400" />
                )}
              </div>
              {club.managerId && (
                <p className="text-xs text-slate-500 mt-1">
                  מנהל: {club.managerId.name || "לא ידוע"}
                </p>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-slate-800/50 pt-4">
        <h3 className="text-sm font-medium text-slate-500 mb-3 uppercase tracking-wider text-right">
          צור קלאב חדש
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={newClubName}
            onChange={(e) => setNewClubName(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleCreateClub()}
            placeholder="שם הקלאב"
            className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition text-right"
          />
          <button
            onClick={handleCreateClub}
            disabled={creating || !newClubName.trim()}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
          >
            {creating ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                <Plus className="w-4 h-4" />
                צור
              </>
            )}
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2 text-right">
          מי שיוצר קלאב הופך למנהל שלו
        </p>
      </div>
    </div>
  );
}
