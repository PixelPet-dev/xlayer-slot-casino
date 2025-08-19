const hre = require("hardhat");
const { Web3 } = require('web3');
require('dotenv').config();

async function main() {
  console.log("🎮 更新快捷下注选项...");

  // 连接到 X Layer 网络
  const web3 = new Web3('https://rpc.xlayer.tech');
  
  // 合约地址和 ABI
  const contractAddress = process.env.CONTRACT_ADDRESS || '0xF6637254Cceb1484Db01B57f90DdB0B6094e4407';
  const contractArtifact = require('../artifacts/contracts/LotteryGame.sol/LotteryGame.json');
  const LOTTERY_GAME_ABI = contractArtifact.abi;
  
  // 创建合约实例
  const contract = new web3.eth.Contract(LOTTERY_GAME_ABI, contractAddress);
  
  // 私钥（请确保这是合约所有者的私钥）
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error("❌ 请设置 PRIVATE_KEY 环境变量");
    return;
  }
  
  const account = web3.eth.accounts.privateKeyToAccount(privateKey);
  web3.eth.accounts.wallet.add(account);
  
  console.log("📝 使用账户:", account.address);
  
  // 新的下注选项（以 wei 为单位，18位小数）
  // 当前: [50000, 100000, 300000, 500000, 800000, 1000000] tokens
  // 新设置: [30000, 50000, 100000, 300000, 500000, 800000, 1000000] tokens
  const newBetOptions = [
    web3.utils.toWei('30000', 'ether'),    // 30,000 tokens
    web3.utils.toWei('50000', 'ether'),    // 50,000 tokens
    web3.utils.toWei('100000', 'ether'),   // 100,000 tokens
    web3.utils.toWei('300000', 'ether'),   // 300,000 tokens
    web3.utils.toWei('500000', 'ether'),   // 500,000 tokens
    web3.utils.toWei('800000', 'ether'),   // 800,000 tokens
    web3.utils.toWei('1000000', 'ether'),  // 1,000,000 tokens
  ];
  
  console.log("🎯 新的下注选项:");
  newBetOptions.forEach((option, index) => {
    console.log(`  ${index + 1}. ${web3.utils.fromWei(option, 'ether')} tokens`);
  });
  
  try {
    // 获取当前选项
    console.log("\n📊 当前下注选项:");
    const currentOptions = await contract.methods.getQuickBetOptions().call();
    currentOptions.forEach((option, index) => {
      console.log(`  ${index + 1}. ${web3.utils.fromWei(option.toString(), 'ether')} tokens`);
    });
    
    // 估算 Gas
    const gasEstimate = await contract.methods.updateQuickBetOptions(newBetOptions).estimateGas({
      from: account.address
    });
    
    console.log(`\n⛽ 预估 Gas: ${gasEstimate}`);
    
    // 获取 Gas 价格
    const gasPrice = await web3.eth.getGasPrice();
    console.log(`💰 Gas 价格: ${web3.utils.fromWei(gasPrice.toString(), 'gwei')} Gwei`);

    // 发送交易
    console.log("\n🚀 发送交易...");
    const tx = await contract.methods.updateQuickBetOptions(newBetOptions).send({
      from: account.address,
      gas: Math.floor(Number(gasEstimate) * 1.2), // 增加20%的Gas缓冲
      gasPrice: gasPrice.toString()
    });
    
    console.log("✅ 交易成功!");
    console.log("📋 交易哈希:", tx.transactionHash);
    console.log("🔗 查看交易:", `https://www.oklink.com/xlayer/tx/${tx.transactionHash}`);
    
    // 验证更新
    console.log("\n🔍 验证更新后的选项:");
    const updatedOptions = await contract.methods.getQuickBetOptions().call();
    updatedOptions.forEach((option, index) => {
      console.log(`  ${index + 1}. ${web3.utils.fromWei(option.toString(), 'ether')} tokens`);
    });
    
  } catch (error) {
    console.error("❌ 更新失败:", error.message);
    
    if (error.message.includes('revert')) {
      console.log("💡 可能的原因:");
      console.log("  - 当前账户不是合约所有者");
      console.log("  - 下注选项数组为空");
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
