import React, { useState, useEffect, useRef } from 'react';
import { Submission } from '../types/game';

interface SubmissionsProps {
  submissions: Submission[];
  onWinnerSelect: (playerId: string) => void;
  canSelectWinner: boolean;
}

const Submissions: React.FC<SubmissionsProps> = ({ submissions, onWinnerSelect, canSelectWinner }) => {
  const [selectedSubmissionIndex, setSelectedSubmissionIndex] = useState<number | null>(null);

  // Use a ref to store the shuffled submissions to persist between renders
  const shuffledSubmissionsRef = useRef<Submission[]>([]);

  // Use a ref to keep track of whether submissions have been shuffled
  const hasShuffled = useRef<boolean>(false);

  useEffect(() => {
    // Only shuffle submissions once or when new submissions are received
    if (!hasShuffled.current || shuffledSubmissionsRef.current.length !== submissions.length) {
      // Create a shallow copy of the submissions array
      const submissionsCopy = [...submissions];
      // Shuffle the submissionsCopy array
      for (let i = submissionsCopy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [submissionsCopy[i], submissionsCopy[j]] = [submissionsCopy[j], submissionsCopy[i]];
      }
      // Update the ref with the shuffled submissions
      shuffledSubmissionsRef.current = submissionsCopy;
      hasShuffled.current = true;
    }
  }, [submissions]);

  const handleCardClick = (index: number) => {
    setSelectedSubmissionIndex(index);
  };

  const handleWinnerSelectClick = () => {
    if (selectedSubmissionIndex !== null) {
      const selectedSubmission = shuffledSubmissionsRef.current[selectedSubmissionIndex];
      onWinnerSelect(selectedSubmission.playerId);
    }
  };

  return (
    <div className="submissions">
      <h3 className="submissions-title">Submissions:</h3>
      <div className="submission-cards">
        {shuffledSubmissionsRef.current.map((submission, index) => (
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
