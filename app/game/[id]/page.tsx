import { getGameById, getPlayerSession } from "@/app/actions";
import PlayerGameClient from "@/components/PlayerGameClient";
import GameSummary from "@/components/GameSummary";

export const dynamic = 'force-dynamic';

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const [game, currentUser] = await Promise.all([
        getGameById(id),
        getPlayerSession()
    ]);

    if (!game) return <div className="p-8 text-center text-slate-500">המשחק לא נמצא</div>;

    if (!game.isActive) {
        return <GameSummary game={game} />;
    }

    return <PlayerGameClient game={game} currentUser={currentUser} />;
}
