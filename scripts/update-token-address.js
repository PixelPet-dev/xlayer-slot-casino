const { Web3 } = require('web3');
require('dotenv').config();

async function main() {
  console.log("🔄 更新游戏合约中的代币地址...");

  // 连接到 X Layer 网络
  const rpcUrl = process.env.XLAYER_RPC_URL || 'https://rpc.xlayer.tech';
  console.log("🌐 使用 RPC:", rpcUrl);
  const web3 = new Web3(rpcUrl);
  console.log("✅ Web3 连接成功");

  // 合约地址和 ABI
  const contractAddress = process.env.CONTRACT_ADDRESS || '0xF6637254Cceb1484Db01B57f90DdB0B6094e4407';
  const newTokenAddress = '0x798095d5BF06edeF0aEB82c10DCDa5a92f58834E'; // XLuckyCoin (XLC)
  
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
  console.log("🎯 游戏合约地址:", contractAddress);
  console.log("🪙 新代币地址:", newTokenAddress);

  try {
    // 获取当前代币地址
    console.log("\n📊 当前代币配置:");
    const currentToken = await contract.methods.currentToken().call();
    console.log("当前代币地址:", currentToken);
    
    if (currentToken.toLowerCase() === newTokenAddress.toLowerCase()) {
      console.log("✅ 代币地址已经是最新的，无需更新");
      return;
    }

    // 估算 Gas
    const gasEstimate = await contract.methods.updateTokenContract(newTokenAddress).estimateGas({
      from: account.address
    });

    console.log(`\n⛽ 预估 Gas: ${gasEstimate}`);

    // 获取 Gas 价格
    const gasPrice = await web3.eth.getGasPrice();
    console.log(`💰 Gas 价格: ${web3.utils.fromWei(gasPrice.toString(), 'gwei')} Gwei`);

    // 发送交易
    console.log("\n🚀 发送交易...");
    const tx = await contract.methods.updateTokenContract(newTokenAddress).send({
      from: account.address,
      gas: Math.floor(Number(gasEstimate) * 1.2), // 增加20%的Gas缓冲
      gasPrice: gasPrice.toString()
    });
    
    console.log("✅ 交易成功!");
    console.log("📋 交易哈希:", tx.transactionHash);
    console.log("🔗 查看交易:", `https://www.oklink.com/xlayer/tx/${tx.transactionHash}`);
    
    // 验证更新
    console.log("\n🔍 验证更新后的配置:");
    const updatedToken = await contract.methods.currentToken().call();
    console.log("更新后代币地址:", updatedToken);
    
    if (updatedToken.toLowerCase() === newTokenAddress.toLowerCase()) {
      console.log("✅ 代币地址更新成功!");
    } else {
      console.log("❌ 代币地址更新失败");
    }

    // 获取代币信息
    console.log("\n🪙 新代币信息:");
    try {
      const tokenArtifact = require('../artifacts/contracts/XLuckyCoin.sol/XLuckyCoin.json');
      const tokenContract = new web3.eth.Contract(tokenArtifact.abi, newTokenAddress);
      
      const name = await tokenContract.methods.name().call();
      const symbol = await tokenContract.methods.symbol().call();
      const decimals = await tokenContract.methods.decimals().call();
      const totalSupply = await tokenContract.methods.totalSupply().call();
      
      console.log("- 名称:", name);
      console.log("- 符号:", symbol);
      console.log("- 小数位:", decimals.toString());
      console.log("- 总供应量:", web3.utils.fromWei(totalSupply.toString(), 'ether'), symbol);
    } catch (error) {
      console.log("⚠️ 无法获取代币详细信息:", error.message);
    }
    
  } catch (error) {
    console.error("❌ 更新失败:", error.message);
    
    if (error.message.includes('revert')) {
      console.log("💡 可能的原因:");
      console.log("  - 当前账户不是合约所有者");
      console.log("  - 代币地址无效");
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
