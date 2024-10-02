import React from 'react';
import { Round, Player } from '../types/game';

interface PreviousRoundResultsProps {
  round: Round;
  players: Player[];
}

const PreviousRoundResults: React.FC<PreviousRoundResultsProps> = ({ round, players }) => {
  const judge = players.find((p) => p.id === round.judgeId);
  return (
    <div className="previous-round-results">
      <h3 className="previous-round-title">Previous Round Results:</h3>
      <p className='czar'>
        <strong>Previous Czar :</strong> {judge?.name}
      </p>
      <div className="previous-black-card-container">
        <div className="black-card small">
          <p>{round.blackCard}</p>
        </div>
      </div>
      <div className="previous-submissions">
        {round.submissions.map((submission) => {
          const player = players.find((p) => p.id === submission.playerId);
          const isWinner = submission.playerId === round.winnerId;
          return (
            <div key={submission.playerId} className={`previous-submission ${isWinner ? 'winner' : ''}`}>
              <p className="submission-player-name">{player?.name || 'Unknown'}</p>
              <p className="submission-card-text">{submission.card}</p>
              {isWinner && <span className="winner-label">(Winner)</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PreviousRoundResults;
