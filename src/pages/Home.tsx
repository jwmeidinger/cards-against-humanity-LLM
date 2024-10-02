import React, { useContext, useState } from 'react';
import { GameContext } from '../context/GameContext';
import { useNavigate } from 'react-router-dom';
import { generatePlayerId } from '../utils/idGenerator';
import { Player } from '../types/game';
import '../css/home.css';

const Home: React.FC = () => {
  const { setGameState, player, setPlayer } = useContext(GameContext)!;
  const navigate = useNavigate();
  const [name, setName] = useState<string>('');
  const [gameCodeInput, setGameCodeInput] = useState<string>('');
  const [nameError, setNameError] = useState<string>('');

  const validateName = (): boolean => {
    if (!name.trim()) {
      setNameError('Please enter a name');
      return false;
    }
    setNameError('');
    return true;
  };

  const handleCreateGame = async () => {
    if (!validateName()) return;

    const playerId = generatePlayerId();

    const newPlayer: Player = {
      id: playerId,
      name: name.trim(),
      isHost: true,
      score: 0,
      hand: [],
    };

    try {
      const response = await fetch('/.netlify/functions/createGame', {
        method: 'POST',
        body: JSON.stringify({ player: newPlayer }),
      });

      const data = await response.json();

      if (response.ok) {
        setPlayer(newPlayer);
        setGameState(data.gameState);
        localStorage.setItem('gameCode', data.gameState.gameCode);
        localStorage.setItem('player', JSON.stringify(newPlayer));
        navigate('/lobby');
      } else {
        console.error('Error creating game:', data.error);
      }
    } catch (error) {
      console.error('Network error creating game:', error);
    }
  };

  const handleJoinGame = async () => {
    const playerId = generatePlayerId();
    if (!validateName()) return;

    const newPlayer: Player = {
      id: playerId,
      name: name || 'Player',
      isHost: false,
      score: 0,
      hand: [],
    };

    try {
      const response = await fetch('/.netlify/functions/joinGame', {
        method: 'POST',
        body: JSON.stringify({ gameCode: gameCodeInput.toUpperCase(), player: newPlayer }),
      });

      const data = await response.json();

      if (response.ok) {
        setPlayer(newPlayer);
        setGameState(data.gameState);
        localStorage.setItem('gameCode', data.gameState.gameCode);
        localStorage.setItem('player', JSON.stringify(newPlayer));
        navigate('/lobby');
      } else {
        console.error('Error joining game:', data.error);
        alert(`Error joining game: ${data.error}`);
      }
    } catch (error) {
      console.error('Network error joining game:', error);
      alert('Network error joining game.');
    }
  };

  return (
    <div className="home-container">
      <h1 className="home-title">Welcome to AI Cards Against Humanity</h1>
      <p className="home-subtitle">Unleash your wit in the AI-driven party game!</p>

      <div className="home-section">
        <h2 className="home-section-title">Create a New Game</h2>
        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          className="home-input-field"
          onChange={(e) => setName(e.target.value)}
        />
        {nameError && <p className="error-message">{nameError}</p>}
        <button className="home-button button" onClick={handleCreateGame}>
          Create Game
        </button>
      </div>

      <div className="home-section">
        <h2 className="home-section-title">Join an Existing Lobby</h2>
        <input
          type="text"
          placeholder="Enter Game Code"
          value={gameCodeInput}
          className="home-input-field"
          onChange={(e) => setGameCodeInput(e.target.value)}
        />
        {gameCodeInput.trim() && name.trim() && (
          <button className="home-button button" onClick={handleJoinGame}>
            Join Game
          </button>
        )}
      </div>

      <div className="home-rules-section">
        <h2 className="home-rules-title">Game Rules</h2>
        <ul className="home-rules-list">
          <li>Each round, a black card with a prompt is displayed.</li>
          <li>Players submit their funniest white card to complete the prompt.</li>
          <li>The judge selects the best submission, awarding a point to the winner.</li>
          <li>The first player to reach the winner count wins the game.</li>
          <li>New cards are generated every game.</li>
          <li>If you add a bot player the name will be used to pick cards!</li>
          <li>Relax, have fun, and let your creativity shine!</li>
        </ul>
      </div>
      <div className="home-socials-section">
        <h2 className="home-socials-title">Socials</h2>
        <ul className="home-socials-list">
          <li>Follow me on <a className="social-link" href="https://x.com/J0rdanMeidinger" target="_blank" rel="noopener noreferrer">X.com</a> for updates!</li>
          <li>Connect with me on <a className="social-link" href="https://www.linkedin.com/in/jwmeidinger/" target="_blank" rel="noopener noreferrer">LinkedIn</a>.</li>
          <li>Check out the project on <a className="social-link" href="https://github.com/jwmeidinger" target="_blank" rel="noopener noreferrer">GitHub</a>.</li>
          <li>Don't sue me and check out the <a className="social-link" href="https://www.cardsagainsthumanity.com/" target="_blank" rel="noopener noreferrer">Card Game OGs</a>.</li>
        </ul>
      </div>
    </div>
  );
};

export default Home;
