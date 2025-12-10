import { getGameById, getPlayerSession, getClubSession } from "@/app/actions";
import RequestBuyInPage from "@/components/RequestBuyInPage";
import ClubLoginScreen from "@/components/ClubLoginScreen";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RequestBuyInRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const clubId = await getClubSession();

  // If no club session, show login screen
  if (!clubId) {
    return (
      <div className="min-h-screen flex items-start justify-center pt-8 px-4">
        <ClubLoginScreen />
      </div>
    );
  }

  const [game, currentUser] = await Promise.all([
    getGameById(id),
    getPlayerSession(),
  ]);

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-slate-400 mb-4">משחק לא נמצא</p>
          <Link
            href="/"
            className="text-amber-400 hover:text-amber-300 underline"
          >
            חזור לדף הבית
          </Link>
        </div>
      </div>
    );
  }

  // Check if game belongs to current club
  const gameClubId = game.clubId?.toString() || game.clubId;
  if (gameClubId && gameClubId !== clubId) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-slate-400 mb-4">המשחק לא שייך למועדון שלך</p>
          <Link
            href="/"
            className="text-amber-400 hover:text-amber-300 underline"
          >
            חזור לדף הבית
          </Link>
        </div>
      </div>
    );
  }

  if (!game.isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-slate-400 mb-4">המשחק כבר הסתיים</p>
          <Link
            href={`/game/${game._id}`}
            className="text-amber-400 hover:text-amber-300 underline"
          >
            צפה בתוצאות
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 px-4 pt-4 max-w-md mx-auto relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[20%] right-[-20%] w-[60%] h-[60%] bg-emerald-600/10 rounded-full blur-[100px] animate-pulse-slow"></div>
      </div>

      <header className="flex items-center gap-4 mb-8 relative z-10">
        <Link
          href={`/game/${game._id}`}
          className="p-3 bg-slate-800/50 rounded-full hover:bg-slate-700 transition border border-slate-700 backdrop-blur-md group"
        >
          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-400">
            בקשה לכניסה נוספת
          </h1>
          <p className="text-xs text-slate-500">בחר סכום כניסה</p>
        </div>
      </header>

      <RequestBuyInPage game={game} currentUser={currentUser} />
    </div>
  );
}
