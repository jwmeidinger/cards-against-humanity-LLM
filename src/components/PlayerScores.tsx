import React from 'react';
import { Player } from '../types/game';

interface PlayerScoresProps {
  players: Player[];
}

const PlayerScores: React.FC<PlayerScoresProps> = ({ players }) => {
  return (
    <div className="player-scores">
      <h3 className="player-scores-title">Leaderboard:</h3>
      <ul className="player-scores-list">
        {players
          .sort((a, b) => b.score - a.score)
          .map((player, index) => (
            <li key={player.id} className={`player-score-item ${index < 3 ? `rank-${index + 1}` : ''}`}>
              <span className="player-name">{player.name}</span>
              <span className="player-score">{player.score} point(s)</span>
            </li>
          ))}
      </ul>
    </div>
  );
};

export default PlayerScores;
