import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Inline translations to avoid import issues
const resources = {
  en: {
    translation: {
      "welcome": "Welcome to X Layer Slot Game",
      "subtitle": "Experience the thrill of blockchain gaming",
      "connectWallet": "Connect Wallet",
      "disconnect": "Disconnect",
      "balance": "Balance",
      "spin": "SPIN",
      "autoSpin": "AUTO SPIN",
      "maxBet": "MAX BET",
      "bet": "Bet",
      "win": "Win",
      "totalWin": "Total Win",
      "gameHistory": "Game History",
      "round": "Round",
      "result": "Result",
      "amount": "Amount",
      "time": "Time",
      "connecting": "Connecting...",
      "connected": "Connected",
      "spinning": "Spinning...",
      "congratulations": "Congratulations!",
      "youWon": "You won",
      "tryAgain": "Try again!",
      "insufficientBalance": "Insufficient balance",
      "transactionFailed": "Transaction failed",
      "walletNotConnected": "Please connect your wallet first",
      "networkError": "Network error, please try again",
      "loading": "Loading...",
      "error": "Error",
      "success": "Success",
      "cancel": "Cancel",
      "confirm": "Confirm",
      "close": "Close"
    }
  },
  zh: {
    translation: {
      "welcome": "欢迎来到 X Layer 老虎机游戏",
      "subtitle": "体验区块链游戏的刺激",
      "connectWallet": "连接钱包",
      "disconnect": "断开连接",
      "balance": "余额",
      "spin": "旋转",
      "autoSpin": "自动旋转",
      "maxBet": "最大下注",
      "bet": "下注",
      "win": "赢得",
      "totalWin": "总赢得",
      "gameHistory": "游戏历史",
      "round": "轮次",
      "result": "结果",
      "amount": "金额",
      "time": "时间",
      "connecting": "连接中...",
      "connected": "已连接",
      "spinning": "旋转中...",
      "congratulations": "恭喜！",
      "youWon": "您赢得了",
      "tryAgain": "再试一次！",
      "insufficientBalance": "余额不足",
      "transactionFailed": "交易失败",
      "walletNotConnected": "请先连接您的钱包",
      "networkError": "网络错误，请重试",
      "loading": "加载中...",
      "error": "错误",
      "success": "成功",
      "cancel": "取消",
      "confirm": "确认",
      "close": "关闭"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false,
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    }
  });

export default i18n;
