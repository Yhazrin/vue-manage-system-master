import { Player } from "@/types";
import PlayerCard from "./PlayerCard";

interface PlayerListProps {
  players: Player[];
}

export default function PlayerList({ players }: PlayerListProps) {
  return (

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {players.map((player) => (
        <PlayerCard 
          key={`player-${player.id}`} 
          player={player} 
          className="transform transition-all duration-300"
        />
      ))}
    </div>

  );
}