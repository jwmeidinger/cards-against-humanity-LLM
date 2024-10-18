import React, { useContext, useEffect, useState } from 'react';
import { GameContext } from '../context/GameContext';
import { useNavigate } from 'react-router-dom';
import { Player, GameState } from '../types/game';
import { generatePlayerId } from '../utils/idGenerator';
import { getGameState, updateGameState, startGame } from '../utils/api';
import '../css/lobby.css'; // Import the CSS file

const Lobby: React.FC = () => {
  const { gameState, setGameState, player, setPlayer } = useContext(GameContext)!;
  const navigate = useNavigate();
  const [copySuccess, setCopySuccess] = useState<string>('');
  const isHost = player?.isHost;

  const [botNameInput, setBotNameInput] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<string>('Random');

  // State for provider and model selection
  const [selectedProvider, setSelectedProvider] = useState<string>('groq');
  const [selectedModel, setSelectedModel] = useState<string>('llama-3.1-8b-instant');

  // State for API Key (only stored locally)
  const [apiKey, setApiKey] = useState<string>('');

  // Flag to prevent race conditions during updates
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const [startGameError, setStartGameError] = useState('');

  const [isStartingGame, setIsStartingGame] = useState<boolean>(false);

  const themes = [
    'Random',
    'Technology',
    'Movies',
    'Sports',
    'Science',
  ];

  // Define available providers and their respective models
  const providers = [
    { name: 'Groq (Free! Until cost is high)', value: 'groq', models: ['llama-3.1-8b-instant'] },
    { name: 'OpenAI (Worst one because of "Rules")', value: 'openai', models: ['gpt-3.5-turbo', 'gpt-4'] },
    { name: 'Anthropic', value: 'anthropic', models: ['claude-3-5-sonnet-20240620', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-instant-1.2'] },
  ];

  // Load initial data from local storage and fetch game state if necessary
  useEffect(() => {
    const storedGameCode = localStorage.getItem('gameCode');
    const storedPlayer = localStorage.getItem('player');
    const storedApiKey = localStorage.getItem('apiKey');

    if (!gameState?.gameCode && storedGameCode) {
      fetchGameState(storedGameCode);
    }

    if (!player && storedPlayer) {
      setPlayer(JSON.parse(storedPlayer));
    }

    // Load API key from localStorage
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Periodically fetch game state every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (gameState?.gameCode && !isUpdating) {
        fetchGameState(gameState.gameCode);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [gameState?.gameCode, isUpdating]);

  // Navigate to game page if game status is 'in_progress' and player has a hand
  useEffect(() => {
    if (gameState?.gameStatus === 'in_progress') {
      const currentPlayer = gameState.players.find((p) => p.id === player?.id);
      if (currentPlayer && currentPlayer.hand.length > 0) {
        navigate('/game');
      }
    }
  }, [gameState, player, navigate]);

  // Handle player removal and reset game state if necessary
  useEffect(() => {
    if (player && gameState?.players?.length > 0) {
      const playerExists = gameState.players.some((p) => p.id === player.id);
      if (!playerExists) {
        alert('You have been removed from the game.');
        localStorage.removeItem('gameCode');
        localStorage.removeItem('player');
        localStorage.removeItem('apiKey'); // Remove API key from local storage
        setPlayer(null);
        setGameState({
          gameCode: '',
          players: [],
          currentRound: 0,
          rounds: [],
          blackCards: [],
          whiteCards: [],
          gameStatus: 'lobby',
          maxRounds: 10,
          winnerCount: 5,
          theme: 'Random',
          whiteCardTimeLimit: 60,
          blackCardTimeLimit: 60,
          provider: 'groq',
          model: 'llama-3.1-8b-instant',
        });
        navigate('/');
      }
    }
  }, [gameState, player, navigate, setGameState, setPlayer]);

  // Fetch the latest game state from the server
  const fetchGameState = async (gameCode: string) => {
    if (isUpdating) return; // Prevent fetching if an update is in progress

    const latestGameState = await getGameState(gameCode);
    if (latestGameState) {
      setGameState(latestGameState);
      setSelectedProvider(latestGameState.provider);
      setSelectedModel(latestGameState.model);
      // Note: apiKey is NOT part of GameState, so no need to set it from server
    } else {
      alert('The game has been closed.');
      localStorage.removeItem('gameCode');
      localStorage.removeItem('player');
      localStorage.removeItem('apiKey'); // Remove API key from local storage
      setPlayer(null);
      setGameState({
        gameCode: '',
        players: [],
        currentRound: 0,
        rounds: [],
        blackCards: [],
        whiteCards: [],
        gameStatus: 'lobby',
        maxRounds: 10,
        winnerCount: 5,
        theme: 'Random',
        whiteCardTimeLimit: 60,
        blackCardTimeLimit: 60,
        provider: 'groq',
        model: 'llama-3.1-8b-instant',
      });
      navigate('/');
    }
  };

  // Add a bot to the game
  const handleAddBot = async () => {
    if ((gameState?.players?.length ?? 0) >= 8) return;

    const botName = botNameInput.trim();
    if (!botName) return;

    const botId = generatePlayerId();

    const botPlayer: Player = {
      id: botId,
      name: botName,
      isHost: false,
      score: 0,
      hand: [],
      isBot: true,
    };

    const updatedPlayers = [...gameState.players, botPlayer];
    const updatedGameState = { ...gameState, players: updatedPlayers };

    const latestGameState = await updateGameState(gameState.gameCode, updatedGameState);

    if (latestGameState) {
      setGameState(latestGameState);
      setBotNameInput('');
    } else {
      console.error('Failed to update game state on server.');
    }
  };

  // Remove a player from the game (host only)
  const handleRemovePlayer = async (playerId: string) => {
    if (!isHost) return;

    const updatedPlayers = gameState.players.filter((p) => p.id !== playerId);
    const updatedGameState = { ...gameState, players: updatedPlayers };

    const latestGameState = await updateGameState(gameState.gameCode, updatedGameState);

    if (latestGameState) {
      setGameState(latestGameState);
    } else {
      console.error('Failed to update game state on server.');
    }
  };

  // Start the game (host only)
  const handleStartGame = async () => {
    setStartGameError('');
    setIsStartingGame(true);
    try {
      const updatedGameState: Partial<GameState> = { 
        ...gameState, 
        theme: selectedTheme,
        provider: selectedProvider,
        model: selectedModel,
        // Note: apiKey is NOT included in GameState
      };
      setGameState(updatedGameState as GameState);
      console.log('Starting game with settings:', updatedGameState);

      const latestGameState = await updateGameState(gameState.gameCode, updatedGameState as GameState);
      console.log('Updated game state on server:', latestGameState);

      if (latestGameState) {
        const startedGameState = await startGame(gameState.gameCode);
        console.log('Started game state:', startedGameState);
        if (startedGameState) {
          setGameState(startedGameState);
          navigate('/game');
        } else {
          console.error('Failed to start the game.');
          setStartGameError('Failed to start the game. Please try again or check your API key.');
        }
      } else {
        console.error('Failed to update game state on server.');
        setStartGameError('Failed to update game state. Please try again.');
      }
    } catch (error) {
      console.error('Error in handleStartGame:', error);
      setStartGameError('An error occurred while starting the game. Please try again or check your API key.');
    } finally {
      setIsStartingGame(false);
    }
  };

  // Copy game code to clipboard
  const copyGameCode = () => {
    navigator.clipboard.writeText(gameState.gameCode).then(
      () => setCopySuccess('Game code copied!'),
      () => setCopySuccess('Failed to copy game code')
    );
  };

  // Save gameCode, player, and apiKey to localStorage whenever they change
  useEffect(() => {
    if (gameState?.gameCode) {
      localStorage.setItem('gameCode', gameState.gameCode);
    }
    if (player) {
      localStorage.setItem('player', JSON.stringify(player));
    }
    if (apiKey) {
      localStorage.setItem('apiKey', apiKey);
    }
  }, [gameState?.gameCode, player, apiKey]);

  // Define the type for settings to enhance type safety
  type GameSettings = Partial<Omit<GameState, 'apiKey'>>; // Exclude apiKey

  // Handle updating game settings (provider, model, theme, etc.)
  const handleSettingChange = async (updatedSettings: GameSettings) => {
    console.log('Updating settings:', updatedSettings);
    setIsUpdating(true);
    const updatedGameState = { ...gameState, ...updatedSettings };
    setGameState(updatedGameState as GameState);

    try {
      const latestGameState = await updateGameState(gameState.gameCode, updatedGameState as GameState);
      console.log('Received latestGameState from server:', latestGameState);

      if (latestGameState) {
        setGameState(latestGameState);
        setSelectedProvider(latestGameState.provider);
        setSelectedModel(latestGameState.model);
        // apiKey remains unchanged in GameState
      } else {
        console.error('Failed to update game state on server.');
      }
    } catch (error) {
      console.error('Error updating game state:', error);
    }
    setIsUpdating(false);
  };

  // Handle provider selection change
  const handleProviderChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvider = e.target.value;
    const provider = providers.find(p => p.value === newProvider);

    if (!provider) {
      console.error('Selected provider is invalid.');
      return;
    }

    const newModel = provider.models[0];

    setSelectedProvider(newProvider);
    setSelectedModel(newModel);

    // Update both provider and model in the game state simultaneously
    await handleSettingChange({ provider: newProvider, model: newModel });
  };

  // Handle model selection change
  const handleModelChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = e.target.value;
    setSelectedModel(newModel);
    await handleSettingChange({ model: newModel });
  };

  // Handle API Key input change (only stored locally)
  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newKey = e.target.value;
    setApiKey(newKey);
    localStorage.setItem('apiKey', newKey);
    // Note: apiKey is NOT sent to the server
  };

  // Determine if the game can be started
  const canStartGame = (gameState?.players?.length ?? 0) >= 3 && 
    ((selectedProvider === 'groq') || (selectedProvider !== 'groq' && apiKey.trim() !== ''));

  return (
    <div className="lobby-container">
      <h2 className="lobby-title">Lobby - Game Code: {gameState?.gameCode}</h2>
      <button className="lobby-copy-button button" onClick={copyGameCode}>Copy Game Code</button>
      {copySuccess && <p className="lobby-copy-success">{copySuccess}</p>}
      <div className="lobby-players-list">
        <h3 className="lobby-players-title">Players:</h3>
        <ul>
          {gameState?.players?.map((p) => (
            <li key={p.id} className="lobby-player-item">
              <span>
                {p.name} {p.isHost ? '- HOST' : ''} {p.isBot ? '- BOT' : ''}
              </span>
              {isHost && !p.isHost && (
                <button className="lobby-remove-button button" onClick={() => handleRemovePlayer(p.id)}>Remove</button>
              )}
            </li>
          ))}
        </ul>
      </div>
      {isHost && (
        <>
          <div className="lobby-settings-section">
            <div className="lobby-bot-section">
              <div className="lobby-input-group">
                <label className="label">
                  Bot Name: (Name will be used to pick card)
                </label>
                <input
                  type="text"
                  value={botNameInput}
                  className="lobby-input-field"
                  placeholder="Ex. Elon Musk"
                  onChange={(e) => setBotNameInput(e.target.value)}
                />
              </div>
              <button className="lobby-add-bot-button button" onClick={handleAddBot} disabled={!botNameInput.trim()}>
                Add Bot
              </button>
            </div>
            <div className="lobby-setting-item">
              <div className="lobby-input-group">
                <label className="label">
                  Theme:
                </label>
                <select
                  value={selectedTheme}
                  className="lobby-select-field"
                  onChange={(e) => setSelectedTheme(e.target.value)}
                >
                  {themes.map((theme) => (
                    <option key={theme} value={theme}>
                      {theme}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="lobby-setting-item">
              <div className="lobby-input-group">
                <label className="label">
                  Max Rounds:
                </label>
                <input
                  type="number"
                  value={gameState?.maxRounds ?? 10}
                  className="lobby-input-field"
                  onChange={(e) =>
                    handleSettingChange({ maxRounds: parseInt(e.target.value) || 10 })
                  }
                />
              </div>
            </div>
            <div className="lobby-setting-item">
              <div className="lobby-input-group">
                <label className="label">
                  Winner Count:
                </label>
                <input
                  type="number"
                  value={gameState?.winnerCount ?? 5}
                  className="lobby-input-field"
                  onChange={(e) =>
                    handleSettingChange({ winnerCount: parseInt(e.target.value) || 5 })
                  }
                />
              </div>
            </div>
            <div className="lobby-setting-item">
              <div className="lobby-input-group">
                <label className="label">
                  Provider:
                </label>
                <select value={selectedProvider} className="lobby-select-field" onChange={handleProviderChange}>
                  {providers.map((provider) => (
                    <option key={provider.value} value={provider.value}>
                      {provider.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="lobby-setting-item">
              <div className="lobby-input-group">
                <label className="label">
                  Model:
                </label>
                <select value={selectedModel} className="lobby-select-field" onChange={handleModelChange}>
                  {providers
                    .find((p) => p.value === selectedProvider)
                    ?.models.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            {selectedProvider !== 'groq' && (
              <div className="lobby-setting-item">
                <div className="lobby-input-group">
                  <label className="label">
                    API Key:
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    className="lobby-input-field"
                    onChange={handleApiKeyChange}
                    placeholder="Enter your API key"
                  />
                </div>
              </div>
            )}
          </div>
          <p className="lobby-note">
            Note: Your API key is stored locally in your browser and is not saved on our servers.
            Please ensure you have the correct key for the selected provider.
          </p>
          {/* Updated the button to disable when starting */}
          <button
            className="lobby-start-game-button"
            onClick={handleStartGame}
            disabled={!canStartGame || isStartingGame}
          >
            {isStartingGame ? 'Starting...' : 'Start Game'}
          </button>
          {!canStartGame && (
            <p className="lobby-warning">You need at least 3 players/bots and a valid API key if not using Groq to start the game.</p>
          )}
          {startGameError && <p className="lobby-error-message">{startGameError}</p>}
          {/* NEW: Display loading indicator when starting the game */}
          {isStartingGame && (
            <div className="loading-indicator">
              <p>Starting the game, please wait...</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Lobby;
