# 🎰 XLayer Slot - Blockchain Casino Game

A professional blockchain-based slot machine game built on XLayer network with complete audio system and real-time prize pool display.

![XLayer Slot](https://img.shields.io/badge/XLayer-Slot-orange?style=for-the-badge)
![Blockchain](https://img.shields.io/badge/Blockchain-Casino-blue?style=for-the-badge)
![Audio](https://img.shields.io/badge/Audio-System-green?style=for-the-badge)

## ✨ Features

### 🎮 Core Game Features
- **Blockchain-based Slot Machine** - Provably fair gaming on XLayer
- **XLuckyCoin (XLC) Integration** - Native token for betting and rewards
- **Real-time Prize Pool** - Live display of contract balance
- **User Registration System** - Nickname-based player profiles
- **Game History Tracking** - Complete transaction history
- **Responsive Design** - Works on desktop and mobile

### 🎵 Professional Audio System
- **Background Music (BGM)** - Auto-play with user controls
- **Sound Effects** - Win/lose audio with smart BGM management
- **Audio Controls** - Play/pause, volume slider, mute button
- **Fallback System** - Generated audio if files are missing
- **Smart Audio Logic** - BGM pauses during effects, auto-resumes

### 🎨 User Interface
- **OKX Theme Design** - Professional dark theme
- **Logo Integration** - Custom branding
- **Real-time Updates** - Live balance and prize pool
- **Intuitive Controls** - Easy-to-use interface
- **Status Indicators** - Clear game state feedback

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- Git
- OKX Wallet or MetaMask

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-username/xlayer-slot.git
cd xlayer-slot
```

2. **Install dependencies**
```bash
npm install
cd frontend-en
npm install
```

3. **Start the game**
```bash
cd frontend-en
npm start
```

4. **Open in browser**
```
http://localhost:3000/xlayerslot
```

## 🎵 Audio Setup

### Required Audio Files
Place these files in `frontend-en/public/audio/`:

- `bgm.mp3` - Background music (1-3 minutes, loopable)
- `win.mp3` - Win sound effect (2-5 seconds)
- `lose.mp3` - Lose sound effect (1-3 seconds)

### Audio Sources
- **BGM**: [Yie Ar Kung-Fu NES](https://downloads.khinsider.com/game-soundtracks/album/yie-ar-kung-fu-nes)
- **Sound Effects**: [Freesound.org](https://freesound.org)

### Audio Features
- **Auto-play BGM** - Starts automatically when page loads
- **Smart Pausing** - BGM pauses during win/lose effects
- **Volume Control** - 0-100% adjustable volume
- **Mute Function** - One-click audio disable
- **Fallback Audio** - Generated sounds if files missing

## 🔧 Smart Contracts

### Deployed Contracts (XLayer Mainnet)
- **LotteryGame**: `0x...` - Main game logic
- **XLuckyCoin**: `0x...` - Game token (XLC)

### Contract Features
- **Provably Fair** - Transparent random number generation
- **Configurable Payouts** - Adjustable win multipliers
- **Platform Fees** - Sustainable tokenomics
- **Reward System** - Player incentives

## 🎮 How to Play

1. **Connect Wallet** - Use OKX Wallet or MetaMask
2. **Register** - Create your player profile
3. **Get Tokens** - Acquire XLC tokens
4. **Place Bet** - Choose your bet amount
5. **Spin** - Click the spin button
6. **Win Prizes** - Collect your winnings!

### Winning Combinations
- 🍒🍒🍒 - 1.5x payout
- 🍋🍋🍋 - 2x payout  
- 🍊🍊🍊 - 3x payout
- 🍇🍇🍇 - 5x payout
- 🔔🔔🔔 - 8x payout
- 💰💰💰 - 12x payout
- 🎯🎯🎯 - 25x payout
- 💎💎💎 - 50x payout

## 📱 User Interface

### Main Components
- **Header** - Logo and title
- **Game Board** - Slot reels and spin button
- **User Panel** - Balance, rewards, controls
- **Audio Panel** - Music and sound controls
- **Prize Pool** - Real-time contract balance

### Audio Controls
- **Play/Pause** - BGM control
- **Volume Slider** - 0-100% adjustment
- **Mute Button** - Quick audio disable
- **Status Display** - Current audio state

## 🛠️ Development

### Project Structure
```
xlayer-slot/
├── contracts/          # Smart contracts
├── scripts/            # Deployment scripts
├── frontend-en/        # React frontend
├── deployments/        # Contract addresses
└── test/              # Contract tests
```

### Key Technologies
- **Frontend**: React, Web3.js, Tailwind CSS
- **Blockchain**: Solidity, Hardhat, XLayer
- **Audio**: Web Audio API, HTML5 Audio
- **Styling**: Tailwind CSS, OKX Theme

### Environment Setup
1. Copy `.env.example` to `.env`
2. Configure RPC endpoints
3. Set contract addresses
4. Add private keys (for deployment)

## 🎯 Game Mechanics

### Betting System
- **Minimum Bet**: 30,000 XLC
- **Maximum Bet**: 3,000,000 XLC
- **Platform Fee**: 15% of winnings
- **Prize Pool**: 85% goes to winners

### Audio Logic
1. **Game Start** → BGM plays continuously
2. **Spin Button** → Optional spin sound
3. **Result Display** → BGM pauses
4. **Win/Lose Sound** → Plays appropriate effect
5. **Effect Ends** → BGM auto-resumes

## 📊 Statistics

### Real-time Data
- **Prize Pool Balance** - Live contract token balance
- **User Balance** - Current XLC holdings
- **Pending Rewards** - Unclaimed winnings
- **Game History** - Recent play results

## 🔐 Security

### Smart Contract Security
- **Audited Code** - Thoroughly tested contracts
- **Transparent Logic** - Open source verification
- **Fair Random** - Blockchain-based randomness
- **No Admin Keys** - Decentralized operation

## 🌐 Deployment

### GitHub Deployment
```bash
# Run the deployment script
deploy-to-github.bat

# Or manually:
git add .
git commit -m "Deploy XLayer Slot"
git push origin main
```

### Production Deployment
1. Build the frontend: `npm run build`
2. Deploy to hosting service
3. Configure domain and SSL
4. Update contract addresses

## 📞 Support

### Documentation
- **Audio Setup**: `AUDIO-FILES-GUIDE.md`
- **BGM Guide**: `BGM-SETUP.md`
- **Contract Docs**: `/contracts/README.md`

### Community
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Updates**: Follow repository

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎉 Acknowledgments

- **XLayer Network** - Blockchain infrastructure
- **OKX** - Wallet integration and design inspiration
- **Yie Ar Kung-Fu** - Classic BGM inspiration
- **React Community** - Frontend framework

---

**🎰 Ready to play? Connect your wallet and start spinning! 🎰**
