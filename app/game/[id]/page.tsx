import {
  getGameById,
  getPlayerSession,
  getClubSession,
  getClub,
  getUserPendingJoinRequest,
} from "@/app/actions";
import PlayerGameClient from "@/components/PlayerGameClient";
import GameSummary from "@/components/GameSummary";
import ClubLoginScreen from "@/components/ClubLoginScreen";

export const dynamic = "force-dynamic";

export default async function GamePage({
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

  const [game, currentUser, club] = await Promise.all([
    getGameById(id),
    getPlayerSession(),
    getClub(clubId),
  ]);

  // בדיקה אם יש בקשה ממתינה למשתמש הנוכחי
  const userPendingRequest =
    currentUser && game?.isActive
      ? await getUserPendingJoinRequest(id, currentUser._id)
      : null;

  if (!game)
    return <div className="p-8 text-center text-slate-500">המשחק לא נמצא</div>;

  // Check if game belongs to current club
  const gameClubId = game.clubId?.toString() || game.clubId;
  if (gameClubId && gameClubId !== clubId) {
    return (
      <div className="p-8 text-center text-slate-500">
        המשחק לא שייך למועדון שלך
      </div>
    );
  }

  if (!game.isActive) {
    return <GameSummary game={game} />;
  }

  return (
    <PlayerGameClient
      game={game}
      currentUser={currentUser}
      club={club}
      userPendingRequest={userPendingRequest}
    />
  );
}
