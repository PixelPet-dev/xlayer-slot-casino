const { Web3 } = require('web3');
require('dotenv').config();

async function main() {
  console.log("🔍 验证代币集成...");

  // 连接到 X Layer 网络
  const rpcUrl = process.env.XLAYER_RPC_URL || 'https://rpc.xlayer.tech';
  const web3 = new Web3(rpcUrl);
  
  // 合约地址
  const gameContractAddress = '0xF6637254Cceb1484Db01B57f90DdB0B6094e4407';
  const tokenContractAddress = '0x798095d5BF06edeF0aEB82c10DCDa5a92f58834E';
  
  // 加载 ABI
  const gameArtifact = require('../artifacts/contracts/LotteryGame.sol/LotteryGame.json');
  const tokenArtifact = require('../artifacts/contracts/XLuckyCoin.sol/XLuckyCoin.json');
  
  // 创建合约实例
  const gameContract = new web3.eth.Contract(gameArtifact.abi, gameContractAddress);
  const tokenContract = new web3.eth.Contract(tokenArtifact.abi, tokenContractAddress);
  
  try {
    console.log("\n🎮 游戏合约信息:");
    console.log("地址:", gameContractAddress);
    
    // 检查游戏合约中的代币地址
    const currentToken = await gameContract.methods.currentToken().call();
    console.log("当前代币地址:", currentToken);
    
    console.log("\n🪙 代币合约信息:");
    console.log("地址:", tokenContractAddress);
    
    // 获取代币基本信息
    const name = await tokenContract.methods.name().call();
    const symbol = await tokenContract.methods.symbol().call();
    const decimals = await tokenContract.methods.decimals().call();
    const totalSupply = await tokenContract.methods.totalSupply().call();
    
    console.log("名称:", name);
    console.log("符号:", symbol);
    console.log("小数位:", decimals.toString());
    console.log("总供应量:", web3.utils.fromWei(totalSupply.toString(), 'ether'), symbol);
    
    // 验证地址匹配
    if (currentToken.toLowerCase() === tokenContractAddress.toLowerCase()) {
      console.log("\n✅ 代币集成验证成功!");
      console.log("游戏合约已正确配置为使用 XLuckyCoin (XLC)");
    } else {
      console.log("\n❌ 代币集成验证失败!");
      console.log("游戏合约中的代币地址与预期不符");
      return;
    }
    
    // 检查游戏配置
    console.log("\n📊 游戏配置:");
    const gameConfig = await gameContract.methods.gameConfig().call();
    console.log("最小下注:", web3.utils.fromWei(gameConfig.minBet.toString(), 'ether'), symbol);
    console.log("最大下注:", web3.utils.fromWei(gameConfig.maxBet.toString(), 'ether'), symbol);
    console.log("平台费用:", Number(gameConfig.houseFeePercentage) / 100, "%");
    console.log("游戏状态:", gameConfig.isActive ? "激活" : "暂停");
    
    // 检查快捷下注选项
    console.log("\n🎯 快捷下注选项:");
    const betOptions = await gameContract.methods.getQuickBetOptions().call();
    betOptions.forEach((option, index) => {
      console.log(`${index + 1}. ${web3.utils.fromWei(option.toString(), 'ether')} ${symbol}`);
    });
    
    // 检查合约代币余额
    console.log("\n💰 合约代币余额:");
    const contractBalance = await tokenContract.methods.balanceOf(gameContractAddress).call();
    console.log("游戏合约余额:", web3.utils.fromWei(contractBalance.toString(), 'ether'), symbol);
    
    if (contractBalance === '0') {
      console.log("⚠️ 警告: 游戏合约中没有代币余额，需要存入代币作为奖励池");
      console.log("💡 建议: 运行存款脚本向合约存入一些 XLC 代币");
    }
    
    console.log("\n🎉 代币集成验证完成!");
    console.log("🔗 游戏合约:", `https://www.oklink.com/xlayer/address/${gameContractAddress}`);
    console.log("🔗 代币合约:", `https://www.oklink.com/xlayer/address/${tokenContractAddress}`);
    
  } catch (error) {
    console.error("❌ 验证失败:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
