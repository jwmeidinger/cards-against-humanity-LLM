import React, { useState } from 'react';
import { Submission } from '../types/game';

interface SubmissionsProps {
  submissions: Submission[];
  onWinnerSelect: (playerId: string) => void;
  canSelectWinner: boolean;
}

const Submissions: React.FC<SubmissionsProps> = ({ submissions, onWinnerSelect, canSelectWinner }) => {
  const [selectedSubmissionIndex, setSelectedSubmissionIndex] = useState<number | null>(null);

  const handleCardClick = (index: number) => {
    setSelectedSubmissionIndex(index);
  };

  const handleWinnerSelectClick = () => {
    if (selectedSubmissionIndex !== null) {
      const selectedSubmission = submissions[selectedSubmissionIndex];
      onWinnerSelect(selectedSubmission.playerId);
    }
  };

  return (
    <div className="submissions">
      <h3 className="submissions-title">Submissions:</h3>
      <div className="submission-cards">
        {submissions.map((submission, index) => (
          <div
            key={index}
            className={`submission-card ${selectedSubmissionIndex === index ? 'selected' : ''}`}
            onClick={() => handleCardClick(index)}
          >
            <p>{submission.card}</p>
          </div>
        ))}
      </div>
      {canSelectWinner && (
        <button
          className="button select-winner-button"
          onClick={handleWinnerSelectClick}
          disabled={selectedSubmissionIndex === null}
        >
          Select as Winner
        </button>
      )}
    </div>
  );
};

export default Submissions;
