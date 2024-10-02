// src/components/Game/Timer.tsx

import React from 'react';

interface TimerProps {
  timeLeft: number;
}

const Timer: React.FC<TimerProps> = ({ timeLeft }) => {
  return <p className='game-timer'>Time Left: {timeLeft}s</p>;
};

export default Timer;
