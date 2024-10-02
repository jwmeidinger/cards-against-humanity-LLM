// src/App.tsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import Lobby from './pages/Lobby';
import Game from './components/Game/Game';
import Home from './pages/Home';
import GameOver from './pages/GameOver';

const App: React.FC = () => {
  return (
    <GameProvider>
      <Router>
        <Routes>
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/game" element={<Game />} />
          <Route path="/game-over" element={<GameOver />} />
          <Route path="/" element={<Home />} />
        </Routes>
      </Router>
    </GameProvider>
  );
};

export default App;
