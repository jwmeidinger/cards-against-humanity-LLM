// src/utils/idGenerator.ts

export const generateGameCode = (): string => {
    return Math.random().toString(36).substr(2, 5).toUpperCase();
  };
  
  export const generatePlayerId = (): string => {
    return Math.random().toString(36).substr(2, 9);
  };
  