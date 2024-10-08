import React, { useContext, useEffect } from 'react';
import { GameContext } from '../context/GameContext';
import { useNavigate } from 'react-router-dom';
import '../css/gameover.css'; // Import the CSS file

const GameOver: React.FC = () => {
  const { gameState, setGameState } = useContext(GameContext)!;
  const navigate = useNavigate();

  useEffect(() => {
    // Attempt to load gameState from localStorage if it's not available
    if (!gameState || !gameState.players) {
      const storedGameState = localStorage.getItem('gameState');
      if (storedGameState) {
        setGameState(JSON.parse(storedGameState));
      } else {
        // Redirect to home if no gameState is available
        navigate('/');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  if (!gameState || !gameState.players) {
    // Render a loading indicator or message
    return (
      <div className="game-over-container">
        <h2 className="game-over-title">Game Over!</h2>
        <p>Loading game data...</p>
      </div>
    );
  }

  const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);

  // Determine if there is a winner
  const winner = sortedPlayers[0];
  const hasWinner = winner && winner.score > 0;

  return (
    <div className="game-over-container">
      <h2 className={`game-over-title ${hasWinner ? 'winner-present' : ''}`}>Game Over!</h2>
      <h3 className="game-over-subtitle">Final Scores:</h3>
      <ul className="game-over-scores">
        {sortedPlayers.map((player, index) => (
          <li key={player.id} className={`score-item rank-${index + 1}`}>
            <span className="player-name">{player.name}</span>
            <span className="player-score">{player.score}</span>
          </li>
        ))}
      </ul>
      <div className="game-over-animation">
        
      </div>
      <button className="game-over-button button" onClick={() => navigate('/')}>
        Return to Home
      </button>
    </div>
  );
};

export default GameOver;
