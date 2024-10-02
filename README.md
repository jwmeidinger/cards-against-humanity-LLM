# AI Cards Against Humanity

Welcome to AI Cards Against Humanity, an AI-driven party game that combines the classic Cards Against Humanity gameplay with the power of artificial intelligence!

## Table of Contents

- [AI Cards Against Humanity](#ai-cards-against-humanity)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Getting Started](#getting-started)
  - [How to Play](#how-to-play)
  - [Game Rules](#game-rules)
  - [Technical Details](#technical-details)
  - [Configuration Options](#configuration-options)
  - [Contributing](#contributing)
  - [Connect with Us](#connect-with-us)

## Features

- Create and join game lobbies
- AI-generated cards for endless variety
- Customizable game settings
- Support for bot players
- Multiple AI providers and models

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Create/Update .env to have `FAUNA_SECRET` and if using groq update that key as well.
4. Start the development server: `netlify dev`
5. Open your browser and navigate to `http://localhost:3000`

## How to Play

1. On the home page, enter your name and either create a new game or join an existing one using a game code.
2. In the lobby, the host can configure game settings and add bot players.
3. Once the game starts, take turns being the judge and selecting the funniest card combinations.
4. The first player to reach the winner count wins the game!

## Game Rules

- Each round, a black card with a prompt is displayed.
- Players submit their funniest white card to complete the prompt.
- The judge selects the best submission, awarding a point to the winner.
- The first player to reach the winner count wins the game.
- New cards are generated every game.
- If you add a bot player, the name will be used to pick cards!
- Relax, have fun, and let your creativity shine!

## Technical Details

- Built with React and TypeScript
- Uses React Router for navigation
- Implements a GameContext for state management
- Utilizes Netlify Functions for server-side operations

## Configuration Options

The host can configure the following game settings:

- Theme (Random, Technology, Movies, Sports, Science)
- Max Rounds
- Winner Count
- AI Provider (Groq, OpenAI, Anthropic)
- AI Model (varies by provider)
- API Key (for non-Groq providers)

## Contributing

We welcome contributions to improve AI Cards Against Humanity! Please feel free to submit issues or pull requests.

## Connect with Us

- Follow me on [X.com](https://x.com/J0rdanMeidinger) for other projects!
- Connect on [LinkedIn](https://www.linkedin.com/in/jwmeidinger/) for hiring.
- Check out the other dumb projects on [GitHub](https://github.com/jwmeidinger)
- Don't sue us and check out the [Card Game OGs](https://www.cardsagainsthumanity.com/)

---

Enjoy playing AI Cards Against Humanity! Remember, it's all in good fun!
