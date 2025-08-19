import Web3 from 'web3';
import { LOTTERY_GAME_ABI, ERC20_ABI as IMPORTED_ERC20_ABI } from '../contracts/abis.js';

// X Layer 主网配置
export const XLAYER_MAINNET = {
  chainId: '0xC4', // 196 in hex
  chainName: 'X Layer Mainnet',
  nativeCurrency: {
    name: 'OKB',
    symbol: 'OKB',
    decimals: 18,
  },
  rpcUrls: ['https://rpc.xlayer.tech'],
  blockExplorerUrls: ['https://www.oklink.com/xlayer'],
};

// 合约配置 (从部署文件中获取)
export const CONTRACT_CONFIG = {
  address: process.env.REACT_APP_CONTRACT_ADDRESS || '0xF6637254Cceb1484Db01B57f90DdB0B6094e4407',
  abi: LOTTERY_GAME_ABI // 从 abis.js 导入的完整 ABI
};

// 代币合约地址
export const TOKEN_CONTRACT_ADDRESS = process.env.REACT_APP_TOKEN_ADDRESS || '0x798095d5BF06edeF0aEB82c10DCDa5a92f58834E';

// ERC20 代币标准 ABI (使用从 abis.js 导入的完整 ABI)
export const ERC20_ABI = IMPORTED_ERC20_ABI;

// 符号名称映射
export const SYMBOL_NAMES = [
  'Cherry',   // 0
  'Lemon',    // 1
  'Orange',   // 2
  'Plum',     // 3
  'Bell',     // 4
  'Bar',      // 5
  'Seven',    // 6
  'Jackpot'   // 7
];

// 符号表情映射
export const SYMBOL_EMOJIS = {
  Cherry: '🍒',
  Lemon: '🍋',
  Orange: '🍊',
  Plum: '🟣',
  Bell: '🔔',
  Bar: '⭐',
  Seven: '🎯',
  Jackpot: '💎'
};

// Web3 实例
let web3Instance = null;

// 获取 Web3 实例
export const getWeb3 = () => {
  if (!web3Instance) {
    if (window.ethereum) {
      web3Instance = new Web3(window.ethereum);
    } else {
      // 如果没有 MetaMask，使用只读模式
      web3Instance = new Web3(XLAYER_MAINNET.rpcUrls[0]);
    }
  }
  return web3Instance;
};

// 检查是否连接到正确的网络
export const checkNetwork = async () => {
  const web3 = getWeb3();
  const chainId = await web3.eth.getChainId();
  return chainId === 196; // X Layer 主网
};

// 切换到 X Layer 网络
export const switchToXLayer = async () => {
  if (!window.ethereum) {
    throw new Error('请安装 MetaMask 或其他 Web3 钱包');
  }

  try {
    // 尝试切换网络
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: XLAYER_MAINNET.chainId }],
    });
  } catch (switchError) {
    // 如果网络不存在，添加网络
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [XLAYER_MAINNET],
        });
      } catch (addError) {
        throw new Error('添加 X Layer 网络失败');
      }
    } else {
      throw new Error('切换网络失败');
    }
  }
};

// 连接钱包
export const connectWallet = async () => {
  if (!window.ethereum) {
    throw new Error('请安装 MetaMask 或其他 Web3 钱包');
  }

  try {
    // 请求连接钱包
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });

    if (accounts.length === 0) {
      throw new Error('未找到钱包账户');
    }

    // 检查网络
    const isCorrectNetwork = await checkNetwork();
    if (!isCorrectNetwork) {
      await switchToXLayer();
    }

    return accounts[0];
  } catch (error) {
    throw new Error(`连接钱包失败: ${error.message}`);
  }
};

// 获取当前账户
export const getCurrentAccount = async () => {
  if (!window.ethereum) return null;

  try {
    const accounts = await window.ethereum.request({
      method: 'eth_accounts',
    });
    return accounts.length > 0 ? accounts[0] : null;
  } catch (error) {
    console.error('获取账户失败:', error);
    return null;
  }
};

// 断开钱包连接
export const disconnectWallet = async () => {
  try {
    // 移除事件监听器
    removeAllListeners();

    // 清除本地存储
    localStorage.removeItem('walletconnect');
    localStorage.removeItem('WALLETCONNECT_DEEPLINK_CHOICE');

    // 如果是 WalletConnect，需要特殊处理
    if (window.ethereum && window.ethereum.isWalletConnect) {
      await window.ethereum.disconnect();
    }

    return true;
  } catch (error) {
    console.error('断开连接失败:', error);
    return false;
  }
};

// 格式化代币数量
export const formatTokenAmount = (amount, decimals = 18, precision = 4) => {
  const web3 = getWeb3();
  const formatted = web3.utils.fromWei(amount.toString(), 'ether');
  return parseFloat(formatted).toFixed(precision);
};

// 格式化代币数量为整数显示
export const formatTokenAmountInteger = (amount, decimals = 18) => {
  const web3 = getWeb3();
  const formatted = web3.utils.fromWei(amount.toString(), 'ether');
  return Math.floor(parseFloat(formatted)).toString();
};

// 解析代币数量
export const parseTokenAmount = (amount, decimals = 18) => {
  const web3 = getWeb3();
  return web3.utils.toWei(amount.toString(), 'ether');
};

// 监听账户变化
export const onAccountsChanged = (callback) => {
  if (window.ethereum) {
    window.ethereum.on('accountsChanged', callback);
  }
};

// 监听网络变化
export const onChainChanged = (callback) => {
  if (window.ethereum) {
    window.ethereum.on('chainChanged', callback);
  }
};

// 移除事件监听
export const removeAllListeners = () => {
  if (window.ethereum) {
    window.ethereum.removeAllListeners('accountsChanged');
    window.ethereum.removeAllListeners('chainChanged');
  }
};

export default {
  getWeb3,
  checkNetwork,
  switchToXLayer,
  connectWallet,
  disconnectWallet,
  getCurrentAccount,
  formatTokenAmount,
  formatTokenAmountInteger,
  parseTokenAmount,
  onAccountsChanged,
  onChainChanged,
  removeAllListeners,
  XLAYER_MAINNET,
  CONTRACT_CONFIG,
  ERC20_ABI,
  SYMBOL_NAMES,
  SYMBOL_EMOJIS
};
