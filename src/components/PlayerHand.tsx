import React, { useState } from 'react';

interface PlayerHandProps {
  hand: string[];
  selectedCardIndex: number | null;
  onSelectCard: (index: number) => void;
}

const PlayerHand: React.FC<PlayerHandProps> = ({ hand, selectedCardIndex, onSelectCard }) => {
  const [expandedCardIndex, setExpandedCardIndex] = useState<number | null>(null);

  const handleCardClick = (index: number) => {
    if (expandedCardIndex === index) {
      setExpandedCardIndex(null);
    } else {
      setExpandedCardIndex(index);
    }
    onSelectCard(index);
  };

  return (
    <div className="player-hand">
      <h3 className="player-hand-title">Your Hand:</h3>
      <div className="player-hand-cards">
        {hand.map((card, index) => (
          <div
            key={index}
            className={`player-card ${selectedCardIndex === index ? 'selected' : ''} ${
              expandedCardIndex === index ? 'expanded' : ''
            }`}
            onClick={() => handleCardClick(index)}
          >
            <p>{card}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlayerHand;
