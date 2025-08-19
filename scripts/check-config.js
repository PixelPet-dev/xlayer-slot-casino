const { Web3 } = require('web3');
require('dotenv').config();

async function main() {
  console.log("🔍 检查当前合约配置...");

  // 连接到 X Layer 网络
  const rpcUrl = process.env.XLAYER_RPC_URL || 'https://rpc.xlayer.tech';
  const web3 = new Web3(rpcUrl);
  
  // 合约地址和 ABI
  const contractAddress = process.env.CONTRACT_ADDRESS || '0xF6637254Cceb1484Db01B57f90DdB0B6094e4407';
  const contractArtifact = require('../artifacts/contracts/LotteryGame.sol/LotteryGame.json');
  const LOTTERY_GAME_ABI = contractArtifact.abi;
  
  // 创建合约实例
  const contract = new web3.eth.Contract(LOTTERY_GAME_ABI, contractAddress);
  
  try {
    // 获取游戏配置
    console.log("\n📊 当前游戏配置:");
    const gameConfig = await contract.methods.gameConfig().call();
    console.log(`  最小下注: ${web3.utils.fromWei(gameConfig.minBet.toString(), 'ether')} tokens`);
    console.log(`  最大下注: ${web3.utils.fromWei(gameConfig.maxBet.toString(), 'ether')} tokens`);
    console.log(`  平台费用: ${Number(gameConfig.houseFeePercentage) / 100}%`);
    console.log(`  游戏状态: ${gameConfig.isActive ? '激活' : '暂停'}`);
    
    // 获取快捷下注选项
    console.log("\n🎯 当前下注选项:");
    const betOptions = await contract.methods.getQuickBetOptions().call();
    betOptions.forEach((option, index) => {
      console.log(`  ${index + 1}. ${web3.utils.fromWei(option.toString(), 'ether')} tokens`);
    });
    
    // 获取赔率
    console.log("\n💰 当前赔率:");
    const payoutRates = await contract.methods.getAllPayoutRates().call();
    const symbols = ['Cherry', 'Lemon', 'Orange', 'Plum', 'Bell', 'Bar', 'Seven', 'Jackpot'];
    payoutRates.forEach((rate, index) => {
      console.log(`  ${symbols[index]}: ${Number(rate)}%`);
    });

    // 获取当前代币地址
    console.log("\n🪙 当前代币配置:");
    const currentToken = await contract.methods.currentToken().call();
    console.log(`  代币合约地址: ${currentToken}`);
    
  } catch (error) {
    console.error("❌ 检查失败:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
