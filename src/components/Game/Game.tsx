import React from 'react';
import { useGameLogic } from './useGameLogic';
import BlackCard from '../BlackCard';
import PlayerHand from '../PlayerHand';
import Submissions from '../Submissions';
import PlayerScores from '../PlayerScores';
import PreviousRoundResults from '../PreviousRoundResults';
import Timer from './Timer';
import '../../css/game.css';

const Game: React.FC = () => {
  const {
    gameState,
    currentRound,
    isJudge,
    currentPlayer,
    previousRound,
    timeLeft,
    hasPlayerSubmitted,
    selectedCardIndex,
    setSelectedCardIndex,
    handleCardSubmitClick,
    handleWinnerSelect,
    getPlayerNameById,
  } = useGameLogic();

  if (!currentRound) {
    return <p>Loading game data...</p>;
  }

  return (
    <div className="game-container">
      <h2 className="game-title">Round {currentRound.roundNumber}</h2>
      <BlackCard card={currentRound.blackCard} />

      <p className="game-judge">Current Card Czar : <span className='czar'>{getPlayerNameById(currentRound.judgeId)}</span></p>

      <Timer timeLeft={timeLeft} />

      {isJudge ? (
        <>
          {currentRound.phase === 'judging' ? (
            <Submissions
              submissions={currentRound.submissions}
              onWinnerSelect={handleWinnerSelect}
              canSelectWinner={true}
            />
          ) : (
            <p className="game-instruction">You are the Card Czar (Judge) - Waiting for submissions...</p>
          )}
        </>
      ) : (
        <>
          {hasPlayerSubmitted ? (
            <>
              <p className="game-instruction">
                You have submitted your card. Waiting for the Card Czar to select a winner...
              </p>
              {currentRound.phase === 'judging' && (
                <p className="game-instruction">The Card Czar is selecting a winner...</p>
              )}
            </>
          ) : (
            <>
              <PlayerHand
                hand={currentPlayer?.hand || []}
                selectedCardIndex={selectedCardIndex}
                onSelectCard={setSelectedCardIndex}
              />
              <button
                className="game-submit-button button"
                onClick={handleCardSubmitClick}
                disabled={selectedCardIndex === null}
              >
                Submit Card
              </button>
            </>
          )}
        </>
      )}

      <PlayerScores players={gameState.players} />

      {previousRound && (
        <PreviousRoundResults round={previousRound} players={gameState.players} />
      )}
    </div>
  );
};

export default Game;
