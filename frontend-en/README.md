# XLayer Slot - English Version

A blockchain-based slot machine game built for the XLayer network.

## Features

- 🎰 Classic 3-reel slot machine gameplay
- 🔗 Web3 wallet integration (MetaMask)
- 💰 XLC token betting system
- 📊 Real-time payout calculations
- 📈 Game history tracking
- 🎨 Modern, responsive UI with animations

## Symbols & Payouts

| Symbol | Multiplier |
|--------|------------|
| 🍒     | 2.0x       |
| 🍋     | 3.0x       |
| 🍊     | 5.0x       |
| 🔔     | 8.0x       |
| ⭐     | 10.0x      |
| 💎     | 15.0x      |
| 🎯     | 25.0x      |
| 💰     | 100.0x     |

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MetaMask browser extension

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd xlayerslot/frontend-en
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### Building for Production

```bash
npm run build
```

This builds the app for production to the `build` folder.

## How to Play

1. **Connect Wallet**: Click "Connect Wallet" to connect your MetaMask wallet
2. **Select Bet**: Choose your bet amount from the available options (30,000 - 1,000,000 XLC)
3. **Spin**: Click the "Spin" button to play
4. **Win**: Match 3 identical symbols to win according to the payout table

## Game Rules

- Minimum bet: 30,000 XLC
- Maximum bet: 1,000,000 XLC
- Win condition: 3 matching symbols in a row
- Payout: Bet amount × symbol multiplier

## Technology Stack

- React 18
- Web3.js
- Tailwind CSS
- Modern ES6+ JavaScript

## License

This project is licensed under the MIT License.
