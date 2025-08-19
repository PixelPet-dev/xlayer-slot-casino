const hre = require("hardhat");
const { Web3 } = require('web3');
require('dotenv').config();

async function main() {
  console.log("🎮 更新游戏配置...");

  // 连接到 X Layer 网络
  console.log("🔗 连接到 X Layer 网络...");
  const rpcUrl = process.env.XLAYER_RPC_URL || 'https://rpc.xlayer.tech';
  console.log("🌐 使用 RPC:", rpcUrl);
  const web3 = new Web3(rpcUrl);
  console.log("✅ Web3 连接成功");
  
  // 合约地址和 ABI
  const contractAddress = process.env.CONTRACT_ADDRESS || '0x7415e413f49f0AE94D741b8d9D3cBAA362EF1099';
  const contractArtifact = require('../artifacts/contracts/LotteryGame.sol/LotteryGame.json');
  const LOTTERY_GAME_ABI = contractArtifact.abi;
  
  // 创建合约实例
  const contract = new web3.eth.Contract(LOTTERY_GAME_ABI, contractAddress);
  
  // 私钥（请确保这是合约所有者的私钥）
  console.log("🔑 读取私钥...");
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error("❌ 请设置 PRIVATE_KEY 环境变量");
    return;
  }
  console.log("✅ 私钥已读取");

  console.log("👤 创建账户...");
  const account = web3.eth.accounts.privateKeyToAccount(privateKey);
  web3.eth.accounts.wallet.add(account);

  console.log("📝 使用账户:", account.address);
  
  // 新的游戏配置
  const newConfig = {
    minBet: web3.utils.toWei('30000', 'ether'),      // 最小下注: 30,000 XLC
    maxBet: web3.utils.toWei('1000000', 'ether'),    // 最大下注: 1,000,000 XLC
    houseFeePercentage: 500,                         // 平台费用: 5% (500/10000)
    isActive: true                                   // 游戏激活状态
  };
  
  console.log("🎯 新的游戏配置:");
  console.log(`  最小下注: ${web3.utils.fromWei(newConfig.minBet, 'ether')} tokens`);
  console.log(`  最大下注: ${web3.utils.fromWei(newConfig.maxBet, 'ether')} tokens`);
  console.log(`  平台费用: ${newConfig.houseFeePercentage / 100}%`);
  console.log(`  游戏状态: ${newConfig.isActive ? '激活' : '暂停'}`);
  
  try {
    // 获取当前配置
    console.log("\n📊 当前游戏配置:");
    const currentConfig = await contract.methods.gameConfig().call();
    console.log(`  最小下注: ${web3.utils.fromWei(currentConfig.minBet.toString(), 'ether')} tokens`);
    console.log(`  最大下注: ${web3.utils.fromWei(currentConfig.maxBet.toString(), 'ether')} tokens`);
    console.log(`  平台费用: ${Number(currentConfig.houseFeePercentage) / 100}%`);
    console.log(`  游戏状态: ${currentConfig.isActive ? '激活' : '暂停'}`);
    
    // 估算 Gas
    const gasEstimate = await contract.methods.updateGameConfig(
      newConfig.minBet,
      newConfig.maxBet,
      newConfig.houseFeePercentage,
      newConfig.isActive
    ).estimateGas({
      from: account.address
    });

    console.log(`\n⛽ 预估 Gas: ${gasEstimate}`);

    // 获取 Gas 价格
    const gasPrice = await web3.eth.getGasPrice();
    console.log(`💰 Gas 价格: ${web3.utils.fromWei(gasPrice.toString(), 'gwei')} Gwei`);

    // 发送交易
    console.log("\n🚀 发送交易...");
    const tx = await contract.methods.updateGameConfig(
      newConfig.minBet,
      newConfig.maxBet,
      newConfig.houseFeePercentage,
      newConfig.isActive
    ).send({
      from: account.address,
      gas: Math.floor(Number(gasEstimate) * 1.2), // 增加20%的Gas缓冲
      gasPrice: gasPrice.toString()
    });
    
    console.log("✅ 交易成功!");
    console.log("📋 交易哈希:", tx.transactionHash);
    console.log("🔗 查看交易:", `https://www.oklink.com/xlayer/tx/${tx.transactionHash}`);
    
    // 验证更新
    console.log("\n🔍 验证更新后的配置:");
    const updatedConfig = await contract.methods.gameConfig().call();
    console.log(`  最小下注: ${web3.utils.fromWei(updatedConfig.minBet.toString(), 'ether')} tokens`);
    console.log(`  最大下注: ${web3.utils.fromWei(updatedConfig.maxBet.toString(), 'ether')} tokens`);
    console.log(`  平台费用: ${Number(updatedConfig.houseFeePercentage) / 100}%`);
    console.log(`  游戏状态: ${updatedConfig.isActive ? '激活' : '暂停'}`);
    
  } catch (error) {
    console.error("❌ 更新失败:", error.message);
    
    if (error.message.includes('revert')) {
      console.log("💡 可能的原因:");
      console.log("  - 当前账户不是合约所有者");
      console.log("  - 最小下注必须大于0");
      console.log("  - 最大下注必须大于等于最小下注");
      console.log("  - 平台费用不能超过20%");
      console.log("  - 网络连接问题");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
