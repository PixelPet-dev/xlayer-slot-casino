import React, { useState, useEffect, useRef } from 'react';
import Web3 from 'web3';
import AudioManager, { useAudioManager, setAudioManagerInstance } from './components/AudioManager';

// XLayer Network Configuration - 使用单一官方RPC
const XLAYER_CONFIG = {
  chainId: '0xC4', // 196 in hex
  chainName: 'X Layer Mainnet',
  nativeCurrency: {
    name: 'OKB',
    symbol: 'OKB',
    decimals: 18,
  },
  rpcUrls: ['https://rpc.xlayer.tech'], // 使用官方RPC，避免多节点选择
  blockExplorerUrls: ['https://www.oklink.com/xlayer'],
};

// Contract Configuration - Updated with new security features and leaderboards
const CONTRACT_CONFIG = {
  address: '0x7415e413f49f0AE94D741b8d9D3cBAA362EF1099', // ✅ New contract with security fixes and leaderboards
  tokenAddress: '0x798095d5BF06edeF0aEB82c10DCDa5a92f58834E',
  abi: [
    {
      "inputs": [{"internalType": "uint256", "name": "betAmount", "type": "uint256"}],
      "name": "playLottery",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "string", "name": "nickname", "type": "string"}],
      "name": "registerUser",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "claimRewards",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "address", "name": "", "type": "address"}],
      "name": "users",
      "outputs": [
        {"internalType": "bool", "name": "isRegistered", "type": "bool"},
        {"internalType": "string", "name": "nickname", "type": "string"},
        {"internalType": "uint256", "name": "registrationTime", "type": "uint256"},
        {"internalType": "uint256", "name": "totalBets", "type": "uint256"},
        {"internalType": "uint256", "name": "totalWins", "type": "uint256"},
        {"internalType": "uint256", "name": "gamesPlayed", "type": "uint256"},
        {"internalType": "uint256", "name": "pendingRewards", "type": "uint256"}
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "currentToken",
      "outputs": [{"internalType": "contract IERC20", "name": "", "type": "address"}],
      "stateMutability": "view",
      "type": "function"
    },
    // 🏆 New Leaderboard Functions
    {
      "inputs": [
        {"internalType": "uint256", "name": "start", "type": "uint256"},
        {"internalType": "uint256", "name": "count", "type": "uint256"}
      ],
      "name": "getBettorLeaderboard",
      "outputs": [
        {"internalType": "address[]", "name": "players", "type": "address[]"},
        {"internalType": "string[]", "name": "nicknames", "type": "string[]"},
        {"internalType": "uint256[]", "name": "totalBets", "type": "uint256[]"},
        {"internalType": "uint256[]", "name": "ranks", "type": "uint256[]"}
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {"internalType": "uint256", "name": "start", "type": "uint256"},
        {"internalType": "uint256", "name": "count", "type": "uint256"}
      ],
      "name": "getWinnerLeaderboard",
      "outputs": [
        {"internalType": "address[]", "name": "players", "type": "address[]"},
        {"internalType": "string[]", "name": "nicknames", "type": "string[]"},
        {"internalType": "uint256[]", "name": "totalWins", "type": "uint256[]"},
        {"internalType": "uint256[]", "name": "ranks", "type": "uint256[]"}
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "address", "name": "player", "type": "address"}],
      "name": "getUserRankings",
      "outputs": [
        {"internalType": "uint256", "name": "bettorRank", "type": "uint256"},
        {"internalType": "uint256", "name": "winnerRank", "type": "uint256"},
        {"internalType": "uint256", "name": "totalBets", "type": "uint256"},
        {"internalType": "uint256", "name": "totalWins", "type": "uint256"}
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getLeaderboardStats",
      "outputs": [
        {"internalType": "uint256", "name": "totalBettors", "type": "uint256"},
        {"internalType": "uint256", "name": "totalWinners", "type": "uint256"},
        {"internalType": "uint256", "name": "maxBettorCount", "type": "uint256"},
        {"internalType": "uint256", "name": "maxWinnerCount", "type": "uint256"}
      ],
      "stateMutability": "view",
      "type": "function"
    },
    // 🛡️ Security Functions
    {
      "inputs": [{"internalType": "address", "name": "_newTokenContract", "type": "address"}],
      "name": "updateTokenContract",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "emergencyMode",
      "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
      "stateMutability": "view",
      "type": "function"
    }
  ],
  tokenAbi: [
    {
      "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
      "name": "balanceOf",
      "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "address", "name": "spender", "type": "address"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}],
      "name": "approve",
      "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "address", "name": "owner", "type": "address"}, {"internalType": "address", "name": "spender", "type": "address"}],
      "name": "allowance",
      "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    }
  ]
};

// Slot symbols with emojis (mapped to contract symbols)
const SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '🔔', '💰', '🎯', '💎'];

// Payout table (from contract)
// 平衡赔率配置 (已更新到合约)
const PAYOUTS = {
  '🍒': 1.5,   // Cherry - 最常见，小奖
  '🍋': 2.0,   // Lemon - 常见
  '🍊': 3.0,   // Orange - 中等
  '🍇': 5.0,   // Plum - 中等偏高
  '🔔': 8.0,   // Bell - 较高
  '💰': 12.0,  // Bar - 高
  '🎯': 20.0,  // Seven - 稀有
  '💎': 50.0   // Jackpot - 超稀有大奖
};

// Bet amounts in tokens (1 token = 10^18 wei)
// Updated to match contract configuration: 30K, 50K, 100K, 300K, 500K, 800K, 1M
const BET_AMOUNTS = [30000, 50000, 100000, 300000, 500000, 800000, 1000000];

function App() {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState('');
  const [tokenBalance, setTokenBalance] = useState('0');
  const [betAmount, setBetAmount] = useState(30000);
  const [slots, setSlots] = useState(['🍒', '🍒', '🍒']);
  const [isSpinning, setIsSpinning] = useState(false);
  const [gameHistory, setGameHistory] = useState([]);
  const [showPayouts, setShowPayouts] = useState(false);
  const [contract, setContract] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [nickname, setNickname] = useState('');
  const [pendingRewards, setPendingRewards] = useState('0');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [gameResult, setGameResult] = useState(null);
  const [contractBalance, setContractBalance] = useState('0'); // 合约奖池余额

  // 🏆 排行榜相关状态
  const [bettorLeaderboard, setBettorLeaderboard] = useState([]);
  const [winnerLeaderboard, setWinnerLeaderboard] = useState([]);
  const [userRankings, setUserRankings] = useState(null);
  const [leaderboardStats, setLeaderboardStats] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [activeLeaderboardTab, setActiveLeaderboardTab] = useState('bettors'); // 'bettors' or 'winners'

  // 音频相关状态
  const [isBgmPlaying, setIsBgmPlaying] = useState(true); // 默认开启BGM
  const audioManagerRef = useRef(null);
  const { playSpinSound, playWinSound, playLoseSound } = useAudioManager();

  // 初始化音频管理器实例
  useEffect(() => {
    if (audioManagerRef.current) {
      setAudioManagerInstance(audioManagerRef.current);
    }
  }, []);

  // Disconnect wallet
  const disconnectWallet = async () => {
    try {
      // Clear all state
      setAccount('');
      setWeb3(null);
      setContract(null);
      setTokenContract(null);
      setUserInfo(null);
      setIsRegistered(false);
      setTokenBalance('0');
      setPendingRewards('0');
      setConnectionError('');
      setIsConnecting(false);

      console.log('Wallet disconnected successfully');
    } catch (error) {
      console.error('Error during disconnect:', error);
    }
  };

  // Setup event listeners for MetaMask
  useEffect(() => {
    const initWallet = async () => {
      if (!window.ethereum) return;

      try {
        const web3Instance = new Web3(window.ethereum);
        const accounts = await web3Instance.eth.getAccounts();

        if (accounts.length === 0) {
          return; // No accounts connected
        }

        // Check if we're on XLayer network
        const chainId = await web3Instance.eth.getChainId();
        const chainIdNumber = Number(chainId);
        console.log('Checking network, chainId:', chainIdNumber, 'type:', typeof chainId);
        if (chainIdNumber !== 196) {
          console.log('Wrong network, current chainId:', chainIdNumber);
          return;
        }

        setWeb3(web3Instance);
        setAccount(accounts[0]);

        // Initialize contracts
        const gameContract = new web3Instance.eth.Contract(CONTRACT_CONFIG.abi, CONTRACT_CONFIG.address);
        const token = new web3Instance.eth.Contract(CONTRACT_CONFIG.tokenAbi, CONTRACT_CONFIG.tokenAddress);

        setContract(gameContract);
        setTokenContract(token);

        // Load user data and contract balance
        await loadUserData(accounts[0], gameContract, token);
        await loadContractBalance(gameContract, token);

        // Load leaderboard data
        await loadLeaderboardData();

      } catch (error) {
        console.error('Failed to initialize wallet:', error);
      }
    };

    if (window.ethereum) {
      // Listen for account changes
      const handleAccountsChanged = (accounts) => {
        console.log('Accounts changed:', accounts);
        if (accounts.length === 0) {
          // User disconnected
          setAccount('');
          setWeb3(null);
          setContract(null);
          setTokenContract(null);
          setUserInfo(null);
          setIsRegistered(false);
          setTokenBalance('0');
          setPendingRewards('0');
        } else {
          // Account changed, reinitialize
          initWallet();
        }
      };

      // Listen for network changes
      const handleChainChanged = (chainId) => {
        console.log('Chain changed to:', chainId);
        // Reload the page to reset state properly
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      // Try to initialize on load if already connected
      initWallet();

      // Cleanup
      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, []);

  // Add XLayer network to MetaMask with automatic RPC selection
  const addXLayerNetwork = async () => {
    try {
      // First try to switch to existing network
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: XLAYER_CONFIG.chainId }],
        });
        console.log('Switched to existing XLayer network');
        return;
      } catch (switchError) {
        // If network doesn't exist, add it
        console.log('Network not found, adding new network...');
      }

      // Add the network
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [XLAYER_CONFIG],
      });
      console.log('XLayer network added successfully');
    } catch (error) {
      console.error('Failed to add XLayer network:', error);
      throw error;
    }
  };

  // Initialize wallet connection
  const initializeWallet = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask to play this game!');
      return;
    }

    try {
      const web3Instance = new Web3(window.ethereum);
      const accounts = await web3Instance.eth.getAccounts();

      if (accounts.length === 0) {
        return; // No accounts connected
      }

      // Check if we're on XLayer network
      const chainId = await web3Instance.eth.getChainId();
      if (chainId !== 196) {
        console.log('Wrong network, current chainId:', chainId);
        return;
      }

      setWeb3(web3Instance);
      setAccount(accounts[0]);

      // Initialize contracts
      const gameContract = new web3Instance.eth.Contract(CONTRACT_CONFIG.abi, CONTRACT_CONFIG.address);
      const token = new web3Instance.eth.Contract(CONTRACT_CONFIG.tokenAbi, CONTRACT_CONFIG.tokenAddress);

      setContract(gameContract);
      setTokenContract(token);

      // Load user data and contract balance
      await loadUserData(accounts[0], gameContract, token);
      await loadContractBalance(gameContract, token);

    } catch (error) {
      console.error('Failed to initialize wallet:', error);
    }
  };

  // Connect wallet and setup contracts
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask to play this game!');
      return;
    }

    setIsConnecting(true);
    setConnectionError('');

    try {
      console.log('Requesting account access...');

      // Clear any existing state first
      setAccount('');
      setWeb3(null);
      setContract(null);
      setTokenContract(null);

      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      console.log('Accounts received:', accounts);

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const web3Instance = new Web3(window.ethereum);
      const chainId = await web3Instance.eth.getChainId();
      const chainIdNumber = Number(chainId);
      console.log('Current chain ID:', chainIdNumber);

      // Check if we're on XLayer network
      if (chainIdNumber !== 196) {
        console.log('Wrong network, adding XLayer...');
        try {
          await addXLayerNetwork();
          console.log('XLayer network added, waiting for switch...');

          // Show user-friendly message about RPC selection
          setConnectionError('If you see "Choose RPC" dialog, please select: https://rpc.xlayer.tech');

          // After adding network, wait a bit and try to initialize
          setTimeout(async () => {
            try {
              setConnectionError(''); // Clear the message
              await connectWallet(); // Retry connection
            } catch (error) {
              console.error('Retry connection failed:', error);
              setConnectionError('Connection failed. Please try again or manually switch to XLayer network.');
            }
          }, 3000); // Give more time for user to select RPC
        } catch (error) {
          console.error('Failed to add XLayer network:', error);
          setConnectionError('Please manually switch to XLayer network. If you see RPC options, choose: https://rpc.xlayer.tech');
        }
        setIsConnecting(false);
        return;
      }

      // If already on correct network, initialize immediately
      console.log('On correct network, initializing...');

      setWeb3(web3Instance);
      setAccount(accounts[0]);

      // Initialize contracts
      const gameContract = new web3Instance.eth.Contract(CONTRACT_CONFIG.abi, CONTRACT_CONFIG.address);
      const token = new web3Instance.eth.Contract(CONTRACT_CONFIG.tokenAbi, CONTRACT_CONFIG.tokenAddress);

      setContract(gameContract);
      setTokenContract(token);

      // Load user data and contract balance
      await loadUserData(accounts[0], gameContract, token);
      await loadContractBalance(gameContract, token);

      console.log('Wallet connected successfully');

    } catch (error) {
      console.error('Failed to connect wallet:', error);
      if (error.code === 4001) {
        setConnectionError('Connection rejected by user');
      } else {
        setConnectionError('Failed to connect wallet. Please try again.');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  // Load user data from blockchain
  const loadUserData = async (userAddress, gameContract, token) => {
    try {
      console.log('📊 Loading user data for:', userAddress);

      // Get token balance
      const tokenBal = await token.methods.balanceOf(userAddress).call();
      const balance = Web3.utils.fromWei(tokenBal, 'ether');
      setTokenBalance(balance);
      console.log('💰 Token balance:', balance);

      // Get user info from contract with retry mechanism
      let user;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          user = await gameContract.methods.users(userAddress).call();
          break;
        } catch (error) {
          retryCount++;
          console.log(`⚠️ Retry ${retryCount}/${maxRetries} loading user data:`, error.message);
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
          } else {
            throw error;
          }
        }
      }

      setUserInfo(user);
      setIsRegistered(user.isRegistered);
      const rewards = Web3.utils.fromWei(user.pendingRewards, 'ether');
      setPendingRewards(rewards);

      console.log('👤 User registered:', user.isRegistered);
      console.log('🎁 Pending rewards:', rewards);
      console.log('🎮 Games played:', user.gamesPlayed);

      // Skip auto-registration for now - let user register manually when needed

    } catch (error) {
      console.error('❌ Failed to load user data:', error);
      // Set default values on error
      setTokenBalance('0');
      setIsRegistered(false);
      setPendingRewards('0');
    }
  };

  // 🏆 Load leaderboard data
  const loadLeaderboardData = async () => {
    if (!contract || !account) return;

    try {
      console.log('Loading leaderboard data...');

      // Load bettor leaderboard (top 10)
      const bettorData = await contract.methods.getBettorLeaderboard(0, 10).call();
      const formattedBettors = bettorData.players.map((player, index) => ({
        address: player,
        nickname: bettorData.nicknames[index],
        totalBets: Web3.utils.fromWei(bettorData.totalBets[index], 'ether'),
        rank: bettorData.ranks[index]
      }));
      setBettorLeaderboard(formattedBettors);

      // Load winner leaderboard (top 10)
      const winnerData = await contract.methods.getWinnerLeaderboard(0, 10).call();
      const formattedWinners = winnerData.players.map((player, index) => ({
        address: player,
        nickname: winnerData.nicknames[index],
        totalWins: Web3.utils.fromWei(winnerData.totalWins[index], 'ether'),
        rank: winnerData.ranks[index]
      }));
      setWinnerLeaderboard(formattedWinners);

      // Load user rankings
      const userRanks = await contract.methods.getUserRankings(account).call();
      setUserRankings({
        bettorRank: userRanks.bettorRank,
        winnerRank: userRanks.winnerRank,
        totalBets: Web3.utils.fromWei(userRanks.totalBets, 'ether'),
        totalWins: Web3.utils.fromWei(userRanks.totalWins, 'ether')
      });

      // Load leaderboard stats
      const stats = await contract.methods.getLeaderboardStats().call();
      setLeaderboardStats({
        totalBettors: stats.totalBettors,
        totalWinners: stats.totalWinners,
        maxBettorCount: stats.maxBettorCount,
        maxWinnerCount: stats.maxWinnerCount
      });

      console.log('Leaderboard data loaded successfully');

    } catch (error) {
      console.error('Failed to load leaderboard data:', error);
    }
  };

  // Load contract balance (奖池余额)
  const loadContractBalance = async (gameContract, token) => {
    try {
      // 获取合约地址
      const contractAddress = gameContract.options.address;
      console.log('Getting contract balance for:', contractAddress);

      // 获取合约的代币余额
      const balance = await token.methods.balanceOf(contractAddress).call();
      const balanceInEther = Web3.utils.fromWei(balance, 'ether');
      setContractBalance(balanceInEther);
      console.log('Contract balance (奖池):', balanceInEther, 'XLC');
    } catch (error) {
      console.error('Error loading contract balance:', error);
      setContractBalance('0');
    }
  };

  // Auto-register user with wallet address nickname
  const autoRegisterUser = async (userAddress, gameContract, token) => {
    try {
      // Check if user has enough ETH for gas
      const balance = await web3.eth.getBalance(userAddress);
      const balanceEth = Web3.utils.fromWei(balance, 'ether');

      if (parseFloat(balanceEth) < 0.001) {
        console.log('Insufficient ETH for gas, skipping auto-registration');
        setIsRegistered(false);
        return;
      }

      // Generate nickname from wallet address (e.g., "Player_3dCA")
      const shortAddress = userAddress.slice(-6);
      const autoNickname = `Player_${shortAddress}`;

      console.log('Auto-registering with nickname:', autoNickname);

      const gasPrice = await web3.eth.getGasPrice();

      // Set a timeout for the registration transaction
      const registrationPromise = gameContract.methods.registerUser(autoNickname).send({
        from: userAddress,
        gasPrice: gasPrice
      });

      // Wait max 10 seconds for registration
      await Promise.race([
        registrationPromise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Registration timeout')), 10000)
        )
      ]);

      console.log('Auto-registration successful!');

      // Reload user data after registration
      await loadUserData(userAddress, gameContract, token);
      await loadContractBalance(gameContract, token);

    } catch (error) {
      console.error('Auto-registration failed:', error);
      // If auto-registration fails, allow user to continue without registration
      setIsRegistered(false);
      console.log('User can continue without registration - will register when needed');
    }
  };

  // Register user
  const registerUser = async (skipNickname = false) => {
    const finalNickname = skipNickname ? `Player_${account.slice(-6)}` : nickname.trim();

    if (!skipNickname && !nickname.trim()) {
      alert('Please enter a nickname');
      return;
    }

    setIsRegistering(true);

    try {
      console.log('🎮 Starting registration for:', finalNickname);

      const gasPrice = await web3.eth.getGasPrice();

      // Send registration transaction
      const tx = await contract.methods.registerUser(finalNickname).send({
        from: account,
        gasPrice: gasPrice
      });

      console.log('✅ Registration transaction successful:', tx.transactionHash);

      // Wait a moment for blockchain to update
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Reload user data to get updated registration status
      await loadUserData(account, contract, tokenContract);
      await loadContractBalance(contract, tokenContract);

      // Load leaderboard data
      await loadLeaderboardData();

      // Double-check registration status
      const user = await contract.methods.users(account).call();
      if (user.isRegistered) {
        setIsRegistered(true);
        setShowRegister(false);
        console.log('✅ Registration confirmed on blockchain');

        if (skipNickname) {
          console.log('Auto-registered with nickname:', finalNickname);
        } else {
          alert('Registration successful! Welcome to XLayer Slot!');
        }
      } else {
        throw new Error('Registration not confirmed on blockchain');
      }

    } catch (error) {
      console.error('❌ Registration failed:', error);

      // Reset registration state on failure
      setIsRegistered(false);

      if (error.message.includes('User already registered')) {
        // User is already registered, just update the state
        setIsRegistered(true);
        setShowRegister(false);
        await loadUserData(account, contract, tokenContract);
        console.log('✅ User was already registered');
      } else {
        alert('Registration failed. Please try again.');
      }
    } finally {
      setIsRegistering(false);
    }
  };

  // Quick register with auto-generated nickname
  const quickRegister = () => {
    registerUser(true);
  };

  // Approve tokens for contract
  const approveTokens = async (amount) => {
    try {
      const amountWei = Web3.utils.toWei(amount.toString(), 'ether');

      // Get gas price for XLayer network (doesn't support EIP-1559)
      const gasPrice = await web3.eth.getGasPrice();

      await tokenContract.methods.approve(CONTRACT_CONFIG.address, amountWei).send({
        from: account,
        gasPrice: gasPrice
      });
      return true;
    } catch (error) {
      console.error('Token approval failed:', error);
      return false;
    }
  };

  // Check token allowance
  const checkAllowance = async (amount) => {
    try {
      const amountWei = Web3.utils.toWei(amount.toString(), 'ether');
      const allowance = await tokenContract.methods.allowance(account, CONTRACT_CONFIG.address).call();
      // Convert to numbers for comparison (safe for reasonable token amounts)
      return parseFloat(Web3.utils.fromWei(allowance, 'ether')) >= amount;
    } catch (error) {
      console.error('Failed to check allowance:', error);
      return false;
    }
  };

  // Spin the slots (real blockchain transaction)
  const spin = async () => {
    if (isSpinning) return;
    if (!isRegistered) {
      alert('Please register first to play the game!');
      return;
    }

    const betAmountFloat = parseFloat(betAmount);
    if (parseFloat(tokenBalance) < betAmountFloat) {
      alert('Insufficient token balance!');
      return;
    }

    setIsSpinning(true);

    // 播放转轮音效
    playSpinSound();

    try {
      // Check and approve tokens if needed
      const hasAllowance = await checkAllowance(betAmountFloat);
      if (!hasAllowance) {
        const approved = await approveTokens(betAmountFloat * 10); // Approve 10x for multiple games
        if (!approved) {
          setIsSpinning(false);
          return;
        }
      }

      // Start spinning animation
      const spinInterval = setInterval(() => {
        setSlots([
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
        ]);
      }, 100);

      // Play lottery on blockchain
      const betAmountWei = Web3.utils.toWei(betAmountFloat.toString(), 'ether');
      const gasPrice = await web3.eth.getGasPrice();

      console.log('Sending lottery transaction...');
      const tx = await contract.methods.playLottery(betAmountWei).send({
        from: account,
        gasPrice: gasPrice
      });

      console.log('Transaction completed:', tx);
      clearInterval(spinInterval);

      // Get transaction receipt to access events with retry mechanism
      let receipt = null;
      let retryCount = 0;
      const maxRetries = 10;

      while (!receipt && retryCount < maxRetries) {
        try {
          console.log(`Attempting to get receipt, try ${retryCount + 1}/${maxRetries}`);
          receipt = await web3.eth.getTransactionReceipt(tx.transactionHash);
          if (receipt) {
            console.log('Transaction receipt obtained:', receipt);
            break;
          }
        } catch (receiptError) {
          console.log(`Receipt attempt ${retryCount + 1} failed:`, receiptError.message);
        }

        // Wait 2 seconds before retry
        await new Promise(resolve => setTimeout(resolve, 2000));
        retryCount++;
      }

      if (!receipt) {
        console.log('Could not get transaction receipt after retries, using transaction hash only');
      }

      // Parse game result from transaction events
      let gameResult = null;

      // Method 1: Try to get events from receipt
      if (receipt && receipt.logs && receipt.logs.length > 0) {
        try {
          console.log('Parsing events from receipt logs...');

          // Decode the GamePlayed event
          const gamePlayedEventSignature = web3.utils.keccak256('GamePlayed(address,uint256,uint8[3],uint256,uint256,address)');
          const gamePlayedLog = receipt.logs.find(log => log.topics && log.topics[0] === gamePlayedEventSignature);

          if (gamePlayedLog) {
            console.log('Found GamePlayed event in logs');

            try {
              // Decode the event data
              const decoded = web3.eth.abi.decodeLog([
                { type: 'address', name: 'player', indexed: true },
                { type: 'uint256', name: 'gameId', indexed: true },
                { type: 'uint8[3]', name: 'symbols' },
                { type: 'uint256', name: 'betAmount' },
                { type: 'uint256', name: 'winAmount' },
                { type: 'address', name: 'tokenContract' }
              ], gamePlayedLog.data, gamePlayedLog.topics.slice(1));

              console.log('Decoded event data:', decoded);

              const symbols = decoded.symbols.map(symbolIndex => SYMBOLS[parseInt(symbolIndex)]);
              const winAmount = Web3.utils.fromWei(decoded.winAmount, 'ether');

              setSlots(symbols);

              gameResult = {
                id: Date.now(),
                bet: betAmountFloat,
                result: symbols,
                win: parseFloat(winAmount),
                timestamp: new Date().toLocaleTimeString(),
                txHash: tx.transactionHash,
                isWin: parseFloat(winAmount) > 0
              };

              console.log('Game result from receipt:', gameResult);

            } catch (decodeError) {
              console.error('Error decoding event data:', decodeError);
            }
          } else {
            console.log('GamePlayed event not found in receipt logs');
          }
        } catch (receiptParseError) {
          console.error('Error parsing receipt logs:', receiptParseError);
        }
      }

      // Method 2: Fallback - query recent events
      if (!gameResult) {
        console.log('Fallback: querying recent events...');
        try {
          const currentBlock = await web3.eth.getBlockNumber();
          const events = await contract.getPastEvents('GamePlayed', {
            filter: { player: account },
            fromBlock: Number(currentBlock) - 5,
            toBlock: 'latest'
          });

          console.log('Recent events found:', events.length);

          if (events.length > 0) {
            const latestEvent = events[events.length - 1];
            const symbols = latestEvent.returnValues.symbols.map(symbolIndex => SYMBOLS[parseInt(symbolIndex)]);
            const winAmount = Web3.utils.fromWei(latestEvent.returnValues.winAmount, 'ether');

            setSlots(symbols);

            gameResult = {
              id: Date.now(),
              bet: betAmountFloat,
              result: symbols,
              win: parseFloat(winAmount),
              timestamp: new Date().toLocaleTimeString(),
              txHash: tx.transactionHash,
              isWin: parseFloat(winAmount) > 0
            };

            console.log('Game result from events:', gameResult);
          }
        } catch (eventError) {
          console.error('Error querying events:', eventError);
        }
      }

      // Show result or create fallback
      if (gameResult) {
        // Add to history and show result
        setGameHistory(prev => [gameResult, ...prev.slice(0, 9)]);
        setGameResult(gameResult);
        setShowResult(true);

        // 播放对应的音效
        console.log('🎮 游戏结果:', { isWin: gameResult.isWin, win: gameResult.win, bet: gameResult.bet });
        if (gameResult.isWin) {
          // 中奖音效 (暂停BGM，播放win.mp3)
          console.log('🎉 调用中奖音效');
          playWinSound();
        } else {
          // 未中奖音效 (暂停BGM，播放lose.mp3)
          console.log('😔 调用未中奖音效');
          playLoseSound();
        }
      } else {
        // Fallback: show a generic result
        console.log('No event data found, showing generic result');
        const randomSymbols = [
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
        ];
        setSlots(randomSymbols);

        // Create a fallback result
        const fallbackResult = {
          id: Date.now(),
          bet: betAmountFloat,
          result: randomSymbols,
          win: 0,
          timestamp: new Date().toLocaleTimeString(),
          txHash: tx.transactionHash,
          isWin: false
        };

        setGameHistory(prev => [fallbackResult, ...prev.slice(0, 9)]);
        setGameResult(fallbackResult);
        setShowResult(true);
      }

      // Reload user data and contract balance
      await loadUserData(account, contract, tokenContract);
      await loadContractBalance(contract, tokenContract);

      // Reload leaderboard data
      await loadLeaderboardData();

    } catch (error) {
      console.error('Game failed:', error);
      alert('Game failed. Please try again.');
    } finally {
      setIsSpinning(false);
    }
  };

  // Claim rewards
  const claimRewards = async () => {
    if (parseFloat(pendingRewards) <= 0) {
      alert('No rewards to claim');
      return;
    }

    try {
      const gasPrice = await web3.eth.getGasPrice();
      await contract.methods.claimRewards().send({
        from: account,
        gasPrice: gasPrice
      });
      await loadUserData(account, contract, tokenContract);
      await loadContractBalance(contract, tokenContract);
      alert('Rewards claimed successfully!');
    } catch (error) {
      console.error('Failed to claim rewards:', error);
      alert('Failed to claim rewards. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-okx-black text-okx-white">
      {/* 音频管理器 */}
      <AudioManager
        ref={audioManagerRef}
        isPlaying={isBgmPlaying}
        onToggle={() => setIsBgmPlaying(!isBgmPlaying)}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold mb-2 text-okx-white flex items-center justify-center gap-4">
            <img
              src={`${process.env.PUBLIC_URL}/audio/logo.png`}
              alt="XLayer Slot Logo"
              className="w-16 h-16 object-contain"
            />
            XLayer Slot
          </h1>
          <p className="text-xl text-okx-muted">Blockchain Casino Game</p>
          {account && (
            <div className="mt-4 flex flex-col items-center space-y-2">
              <div className="bg-green-500/20 border border-green-500/50 rounded-full px-4 py-2 flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-400 font-medium">Connected to XLayer</span>
              </div>

              {/* 🎵 BGM Control Button */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsBgmPlaying(!isBgmPlaying)}
                  className="flex items-center space-x-2 bg-okx-dark/50 hover:bg-okx-dark/70 rounded-lg px-3 py-2 border border-okx-border transition-colors"
                >
                  <span className="text-lg">{isBgmPlaying ? '🎵' : '🔇'}</span>
                  <span className="text-xs text-okx-muted">
                    BGM {isBgmPlaying ? 'ON' : 'OFF'}
                  </span>
                </button>
              </div>

              <div className="flex items-center space-x-3 bg-okx-dark/50 rounded-lg px-4 py-2 border border-okx-border">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-okx-muted">Wallet:</span>
                  <span className="text-sm text-okx-text font-mono">{account.slice(0, 6)}...{account.slice(-4)}</span>
                </div>
                <button
                  onClick={disconnectWallet}
                  className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 px-2 py-1 rounded border border-red-500/30 transition-colors"
                >
                  Disconnect
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Main Game Area */}
        <div className="max-w-md mx-auto">
          {/* Wallet Connection */}
          {!account ? (
            <div className="bg-okx-dark rounded-2xl p-6 mb-6 border border-okx-border">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold mb-2 text-okx-white">Connect to XLayer Network</h3>
                <p className="text-sm text-okx-muted">Connect your MetaMask wallet to start playing</p>

                {/* RPC Selection Tip */}
                <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-xs text-yellow-400 mb-2">💡 <strong>Tip:</strong> If you see "Choose RPC" dialog:</p>
                  <p className="text-xs text-yellow-300">Select <strong>https://rpc.xlayer.tech</strong> for best performance</p>
                </div>
              </div>

              {connectionError && (
                <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                  <p className="text-sm text-red-400">{connectionError}</p>
                </div>
              )}

              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className={`w-full font-bold py-4 px-6 rounded-xl transition-all duration-300 transform ${
                  isConnecting
                    ? 'bg-okx-light-gray text-okx-muted cursor-not-allowed'
                    : 'bg-okx-white hover:bg-okx-text text-okx-black hover:scale-105'
                }`}
              >
                {isConnecting ? '🔄 Connecting...' : '🔗 Connect Wallet'}
              </button>
            </div>
          ) : !isRegistered ? (
            <div className="bg-okx-dark rounded-2xl p-6 mb-6 border border-okx-border">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold mb-2 text-okx-white">Register to Play</h3>
                <p className="text-sm text-okx-muted">Create your player profile to start playing</p>
              </div>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Enter your nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full px-4 py-3 bg-okx-gray border border-okx-border rounded-lg text-okx-white placeholder-okx-muted focus:outline-none focus:border-okx-white"
                  maxLength={50}
                />
              </div>
              <button
                onClick={registerUser}
                disabled={!nickname.trim() || isRegistering}
                className={`w-full py-3 px-6 rounded-xl font-bold transition-all duration-300 ${
                  nickname.trim() && !isRegistering
                    ? 'bg-okx-white hover:bg-okx-text text-okx-black'
                    : 'bg-okx-light-gray text-okx-muted cursor-not-allowed'
                }`}
              >
                {isRegistering ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-okx-black border-t-transparent rounded-full animate-spin"></div>
                    <span>Registering...</span>
                  </div>
                ) : (
                  '🎮 Register & Play'
                )}
              </button>
            </div>
          ) : (
            <>
              {/* Slot Machine */}
              <div className="bg-okx-dark rounded-2xl p-6 mb-6 border border-okx-border">
                <div className="bg-okx-gray rounded-xl p-4 mb-4 border border-okx-border">
                  <div className="flex justify-center space-x-4">
                    {slots.map((symbol, index) => (
                      <div
                        key={index}
                        className={`w-20 h-20 bg-okx-black rounded-lg flex items-center justify-center text-4xl border-2 border-okx-border ${
                          isSpinning ? 'slot-spinning' : ''
                        }`}
                      >
                        {symbol}
                      </div>
                    ))}
                  </div>
                  <div className="text-center mt-4">
                    <div className="text-sm text-okx-muted">Reel 1 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Reel 2 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Reel 3</div>
                  </div>
                </div>

                {/* Balance Display */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-okx-text">Token Balance:</span>
                    <span className="text-xl font-bold text-okx-white">{parseFloat(tokenBalance).toFixed(2)} XLC</span>
                  </div>
                  {parseFloat(pendingRewards) > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-okx-text">Pending Rewards:</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-okx-white">{parseFloat(pendingRewards).toFixed(2)} XLC</span>
                        <button
                          onClick={claimRewards}
                          className="text-xs bg-okx-white hover:bg-okx-text text-okx-black px-2 py-1 rounded transition-colors"
                        >
                          Claim
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="text-white pt-2 border-t border-okx-border">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-2xl">🏆</span>
                      <span className="text-xl font-bold">Prize Pool: {contractBalance} XLC</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 🏆 Leaderboard Button */}
              <div className="bg-okx-dark rounded-2xl p-4 mb-6 border border-okx-border">
                <button
                  onClick={() => setShowLeaderboard(true)}
                  className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105"
                >
                  <span className="text-xl">🏆</span>
                  <span>View Leaderboards</span>
                  {userRankings && (userRankings.bettorRank > 0 || userRankings.winnerRank > 0) && (
                    <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
                      Your Ranks: #{userRankings.bettorRank || 'N/A'} | #{userRankings.winnerRank || 'N/A'}
                    </span>
                  )}
                </button>
              </div>

              {/* Betting Controls */}
              <div className="bg-okx-dark rounded-2xl p-6 mb-6 border border-okx-border">
                <h3 className="text-lg font-semibold mb-4 text-okx-white">Bet Amount (XLC)</h3>
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-okx-muted mb-2">
                    <span>Min: {BET_AMOUNTS[0]} XLC</span>
                    <span>Max: {BET_AMOUNTS[BET_AMOUNTS.length - 1]} XLC</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  {BET_AMOUNTS.map(amount => (
                    <button
                      key={amount}
                      onClick={() => setBetAmount(amount)}
                      className={`py-2 px-4 rounded-lg font-semibold transition-all duration-200 text-sm ${
                        betAmount === amount
                          ? 'bg-okx-white text-okx-black'
                          : 'bg-okx-gray text-okx-white hover:bg-okx-light-gray border border-okx-border'
                      }`}
                    >
                      {amount >= 1000000 ? `${(amount / 1000000).toFixed(1)}M` :
                       amount >= 1000 ? `${(amount / 1000)}K` : amount}
                    </button>
                  ))}
                </div>

                <button
                  onClick={spin}
                  disabled={isSpinning || parseFloat(tokenBalance) < betAmount}
                  className={`w-full py-4 px-6 rounded-xl font-bold text-xl transition-all duration-300 transform ${
                    isSpinning || parseFloat(tokenBalance) < betAmount
                      ? 'bg-okx-light-gray text-okx-muted cursor-not-allowed'
                      : 'bg-okx-white hover:bg-okx-text text-okx-black hover:scale-105'
                  }`}
                >
                  {isSpinning ? 'Spinning...' :
                   `Spin (${betAmount >= 1000000 ? `${(betAmount / 1000000).toFixed(1)}M` :
                            betAmount >= 1000 ? `${(betAmount / 1000)}K` : betAmount} XLC)`}
                </button>
              </div>

              {/* Payout Table */}
              <div className="bg-okx-dark rounded-2xl p-6 mb-6 border border-okx-border">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-okx-white">Payout Table</h3>
                  <button
                    onClick={() => setShowPayouts(!showPayouts)}
                    className="text-okx-white hover:text-okx-text transition-colors"
                  >
                    {showPayouts ? '▼' : '▶'}
                  </button>
                </div>

                {showPayouts && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(PAYOUTS).map(([symbol, multiplier]) => (
                        <div key={symbol} className="bg-okx-gray rounded-lg p-3 flex items-center justify-between border border-okx-border">
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl">{symbol}</span>
                          </div>
                          <span className="text-okx-white font-semibold">{multiplier}x</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-okx-muted mt-4">
                      * Match 3 identical symbols to win. Payout = bet × multiplier
                    </p>
                  </div>
                )}
              </div>

              {/* Game History */}
              <div className="bg-okx-dark rounded-2xl p-6 border border-okx-border">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold flex items-center text-okx-white">
                    🎲 Game History
                  </h3>
                  <button
                    onClick={() => setGameHistory([])}
                    className="text-sm bg-okx-gray hover:bg-okx-light-gray text-okx-white px-3 py-1 rounded-lg transition-colors border border-okx-border"
                  >
                    Clear
                  </button>
                </div>

                {gameHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">🎲</div>
                    <p className="text-okx-text">No game history</p>
                    <p className="text-sm text-okx-muted">Start playing to see your results!</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {gameHistory.map((game) => (
                      <div key={game.id} className="bg-okx-gray rounded-lg p-3 border border-okx-border">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <div className="flex space-x-1">
                              {game.result.map((symbol, index) => (
                                <span key={index} className="text-lg">{symbol}</span>
                              ))}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-okx-muted">Bet: {game.bet} XLC</div>
                            {game.win > 0 ? (
                              <div className="text-okx-white font-semibold">+{game.win} XLC</div>
                            ) : (
                              <div className="text-okx-muted">-{game.bet} XLC</div>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-xs text-okx-muted mt-1">
                          <span>{game.timestamp}</span>
                          {game.txHash && (
                            <a
                              href={`https://www.oklink.com/xlayer/tx/${game.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-okx-white hover:text-okx-text"
                            >
                              View TX
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>



      {/* Game Result Modal */}
      {showResult && gameResult && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="relative bg-black border-2 border-yellow-400 p-8 rounded-3xl max-w-md w-full mx-4 shadow-2xl">
            {/* Close button */}
            <button
              onClick={() => setShowResult(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 text-2xl font-bold"
            >
              ×
            </button>

            {/* Celebration icon and title */}
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">
                {gameResult.isWin ? '🎉' : '🎰'}
              </div>
              <h2 className="text-2xl font-bold text-yellow-300 mb-2">
                {gameResult.isWin ? 'Congratulations!' : 'Game Result'}
              </h2>
            </div>

            {/* Slot results */}
            <div className="flex justify-center gap-4 mb-6">
              {gameResult.result.map((symbol, index) => (
                <div key={index} className="relative">
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-lg flex items-center justify-center text-3xl border-2 border-yellow-400">
                    {symbol}
                  </div>
                  {gameResult.isWin && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                      <span className="text-black text-sm font-bold">✓</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Game details */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-white text-sm font-medium">Bet Amount:</span>
                <span className="text-white font-bold text-lg">
                  {gameResult.bet >= 1000000 ? `${(gameResult.bet / 1000000).toFixed(1)}M` :
                   gameResult.bet >= 1000 ? `${(gameResult.bet / 1000)}K` : gameResult.bet} XLC
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-white text-sm font-medium">Win Amount:</span>
                <span className={`font-bold text-lg ${gameResult.isWin ? 'text-green-400' : 'text-white'}`}>
                  {gameResult.win > 0 ?
                    `${gameResult.win >= 1000000 ? `${(gameResult.win / 1000000).toFixed(1)}M` :
                      gameResult.win >= 1000 ? `${(gameResult.win / 1000)}K` : gameResult.win} XLC` :
                    '0 XLC'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-white text-sm font-medium">Net Profit:</span>
                <span className={`font-bold text-lg ${gameResult.win > gameResult.bet ? 'text-green-400' : 'text-red-400'}`}>
                  {(gameResult.win - gameResult.bet) >= 0 ? '+' : ''}{(gameResult.win - gameResult.bet).toFixed(0)} XLC
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowResult(false)}
                className="flex-1 py-3 px-6 rounded-xl bg-gray-600 hover:bg-gray-700 text-white font-semibold transition-colors"
              >
                Continue Game
              </button>
              <button
                onClick={() => {
                  setShowResult(false);
                  // Could add share functionality here
                }}
                className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold transition-colors flex items-center justify-center gap-2"
              >
                Share Result 🚀
              </button>
            </div>

            {/* Lucky message */}
            <div className="text-center mt-4">
              <p className="text-green-400 text-sm flex items-center justify-center gap-2">
                🍀 {gameResult.isWin ? 'Lucky you! Keep playing!' : 'Better luck next time!'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 🏆 Leaderboard Modal */}
      {showLeaderboard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-okx-dark rounded-2xl border border-okx-border max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-okx-border">
              <h2 className="text-2xl font-bold text-okx-white flex items-center gap-2">
                🏆 Leaderboards
              </h2>
              <button
                onClick={() => setShowLeaderboard(false)}
                className="text-okx-muted hover:text-okx-white text-2xl"
              >
                ×
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-okx-border">
              <button
                onClick={() => setActiveLeaderboardTab('bettors')}
                className={`flex-1 py-3 px-4 text-center transition-colors ${
                  activeLeaderboardTab === 'bettors'
                    ? 'bg-okx-white text-okx-black font-semibold'
                    : 'text-okx-muted hover:text-okx-white'
                }`}
              >
                💰 Top Bettors
              </button>
              <button
                onClick={() => setActiveLeaderboardTab('winners')}
                className={`flex-1 py-3 px-4 text-center transition-colors ${
                  activeLeaderboardTab === 'winners'
                    ? 'bg-okx-white text-okx-black font-semibold'
                    : 'text-okx-muted hover:text-okx-white'
                }`}
              >
                🎯 Top Winners
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* User's Ranking */}
              {userRankings && (
                <div className="bg-okx-gray rounded-xl p-4 mb-6 border border-okx-border">
                  <h3 className="text-lg font-semibold text-okx-white mb-3">Your Rankings</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-400">
                        #{userRankings.bettorRank || 'N/A'}
                      </div>
                      <div className="text-sm text-okx-muted">Bettor Rank</div>
                      <div className="text-sm text-okx-white">{parseFloat(userRankings.totalBets).toFixed(2)} XLC</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">
                        #{userRankings.winnerRank || 'N/A'}
                      </div>
                      <div className="text-sm text-okx-muted">Winner Rank</div>
                      <div className="text-sm text-okx-white">{parseFloat(userRankings.totalWins).toFixed(2)} XLC</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Leaderboard Table */}
              <div className="space-y-3">
                {activeLeaderboardTab === 'bettors' ? (
                  <>
                    <h3 className="text-lg font-semibold text-okx-white mb-4">Top Bettors (Total Bets)</h3>
                    {bettorLeaderboard.length > 0 ? (
                      bettorLeaderboard.map((player, index) => (
                        <div
                          key={player.address}
                          className={`flex items-center justify-between p-4 rounded-xl border ${
                            player.address.toLowerCase() === account?.toLowerCase()
                              ? 'bg-yellow-500/10 border-yellow-500/30'
                              : 'bg-okx-gray border-okx-border'
                          }`}
                        >
                          <div className="flex items-center space-x-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              index === 0 ? 'bg-yellow-500 text-black' :
                              index === 1 ? 'bg-gray-400 text-black' :
                              index === 2 ? 'bg-orange-600 text-white' :
                              'bg-okx-light-gray text-okx-white'
                            }`}>
                              {player.rank}
                            </div>
                            <div>
                              <div className="font-semibold text-okx-white">{player.nickname}</div>
                              <div className="text-xs text-okx-muted">{player.address.slice(0, 6)}...{player.address.slice(-4)}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-okx-white">{parseFloat(player.totalBets).toFixed(2)} XLC</div>
                            <div className="text-xs text-okx-muted">Total Bets</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-okx-muted py-8">No bettor data available</div>
                    )}
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold text-okx-white mb-4">Top Winners (Total Wins)</h3>
                    {winnerLeaderboard.length > 0 ? (
                      winnerLeaderboard.map((player, index) => (
                        <div
                          key={player.address}
                          className={`flex items-center justify-between p-4 rounded-xl border ${
                            player.address.toLowerCase() === account?.toLowerCase()
                              ? 'bg-green-500/10 border-green-500/30'
                              : 'bg-okx-gray border-okx-border'
                          }`}
                        >
                          <div className="flex items-center space-x-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              index === 0 ? 'bg-yellow-500 text-black' :
                              index === 1 ? 'bg-gray-400 text-black' :
                              index === 2 ? 'bg-orange-600 text-white' :
                              'bg-okx-light-gray text-okx-white'
                            }`}>
                              {player.rank}
                            </div>
                            <div>
                              <div className="font-semibold text-okx-white">{player.nickname}</div>
                              <div className="text-xs text-okx-muted">{player.address.slice(0, 6)}...{player.address.slice(-4)}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-okx-white">{parseFloat(player.totalWins).toFixed(2)} XLC</div>
                            <div className="text-xs text-okx-muted">Total Wins</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-okx-muted py-8">No winner data available</div>
                    )}
                  </>
                )}
              </div>

              {/* Stats */}
              {leaderboardStats && (
                <div className="mt-6 pt-6 border-t border-okx-border">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-okx-white">{leaderboardStats.totalBettors}</div>
                      <div className="text-sm text-okx-muted">Total Bettors</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-okx-white">{leaderboardStats.totalWinners}</div>
                      <div className="text-sm text-okx-muted">Total Winners</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-okx-border">
              <button
                onClick={() => loadLeaderboardData()}
                className="w-full py-3 px-4 bg-okx-white hover:bg-okx-text text-okx-black font-semibold rounded-xl transition-colors"
              >
                🔄 Refresh Leaderboards
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
