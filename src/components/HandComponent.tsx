// src/components/HandComponent.tsx

import React from 'react';

interface HandProps {
  hand: string[];
  onSelectCard: (card: string) => void;
  selectedCard: string | null;
}

const HandComponent: React.FC<HandProps> = ({ hand, onSelectCard, selectedCard }) => {
  return (
    <div>
      <h3>Your Hand</h3>
      <ul style={{ listStyleType: 'none', padding: 0 }}>
        {hand.map((card) => (
          <li
            key={card}
            style={{
              border: selectedCard === card ? '2px solid blue' : '1px solid gray',
              padding: '10px',
              margin: '5px',
              cursor: 'pointer',
            }}
            onClick={() => onSelectCard(card)}
          >
            {card}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default HandComponent;
