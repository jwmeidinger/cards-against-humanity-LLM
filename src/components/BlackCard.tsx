// src/components/BlackCard.tsx

import React from 'react';

interface BlackCardProps {
  card: string;
}

const BlackCard: React.FC<BlackCardProps> = ({ card }) => {
  return (
    <div className="black-card">
      <p>{card}</p>
    </div>
  );
};

export default BlackCard;
