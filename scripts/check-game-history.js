const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 检查游戏记录和合约状态...\n");

  // 连接到 X Layer 主网
  const provider = new ethers.JsonRpcProvider("https://rpc.xlayer.tech");
  
  // 合约地址
  const contractAddress = "0xF6637254Cceb1484Db01B57f90DdB0B6094e4407";
  
  // 加载合约 ABI
  const LotteryGame = await ethers.getContractFactory("LotteryGame");
  const contract = LotteryGame.attach(contractAddress).connect(provider);

  try {
    // 1. 检查合约基本信息
    console.log("📋 合约基本信息:");
    console.log(`合约地址: ${contractAddress}`);
    
    const gameConfig = await contract.gameConfig();
    console.log(`游戏状态: ${gameConfig.isActive ? '激活' : '未激活'}`);
    console.log(`最小下注: ${ethers.formatEther(gameConfig.minBet.toString())} XLC`);
    console.log(`最大下注: ${ethers.formatEther(gameConfig.maxBet.toString())} XLC`);
    console.log(`手续费: ${Number(gameConfig.houseFeePercentage) / 100}%`);
    
    const totalUsers = await contract.totalUsers();
    console.log(`注册用户数: ${totalUsers.toString()}`);

    const totalGameRecords = await contract.totalGameRecords();
    console.log(`游戏记录总数: ${totalGameRecords.toString()}\n`);

    // 2. 检查代币合约
    const currentToken = await contract.currentToken();
    console.log("💰 代币信息:");
    console.log(`代币合约地址: ${currentToken}`);
    
    // 3. 查询游戏事件
    console.log("🎮 查询游戏事件...");
    
    // 获取当前区块号
    const currentBlock = await provider.getBlockNumber();
    console.log(`当前区块号: ${currentBlock}`);
    
    // 查询最近100个区块的事件（X Layer 限制）
    const fromBlock = Math.max(0, currentBlock - 100);
    console.log(`查询区块范围: ${fromBlock} - ${currentBlock}`);
    
    // 查询 GamePlayed 事件
    const gamePlayedFilter = contract.filters.GamePlayed();
    const gamePlayedEvents = await contract.queryFilter(gamePlayedFilter, fromBlock, currentBlock);
    
    console.log(`找到 GamePlayed 事件: ${gamePlayedEvents.length} 个`);
    
    if (gamePlayedEvents.length > 0) {
      console.log("\n📊 最近的游戏记录:");
      gamePlayedEvents.slice(-5).forEach((event, index) => {
        const args = event.args;
        console.log(`\n游戏 ${index + 1}:`);
        console.log(`  玩家: ${args.player}`);
        console.log(`  游戏ID: ${args.gameId.toString()}`);
        console.log(`  符号: [${args.symbols.join(', ')}]`);
        console.log(`  下注金额: ${ethers.formatEther(args.betAmount.toString())} XLC`);
        console.log(`  中奖金额: ${ethers.formatEther(args.winAmount.toString())} XLC`);
        console.log(`  区块号: ${event.blockNumber}`);
        console.log(`  交易哈希: ${event.transactionHash}`);
      });
    } else {
      console.log("❌ 没有找到任何游戏记录");
      console.log("可能的原因:");
      console.log("1. 还没有人玩过游戏");
      console.log("2. 游戏记录在更早的区块中");
      console.log("3. 合约刚刚部署，还没有游戏活动");
    }

    // 4. 查询用户注册事件
    console.log("\n👥 查询用户注册事件...");
    const userRegisteredFilter = contract.filters.UserRegistered();
    const userRegisteredEvents = await contract.queryFilter(userRegisteredFilter, fromBlock, currentBlock);
    
    console.log(`找到 UserRegistered 事件: ${userRegisteredEvents.length} 个`);
    
    if (userRegisteredEvents.length > 0) {
      console.log("\n最近注册的用户:");
      userRegisteredEvents.slice(-3).forEach((event, index) => {
        const args = event.args;
        console.log(`  ${index + 1}. ${args.user} - ${args.nickname}`);
      });
    }

    // 5. 检查合约余额
    console.log("\n💰 合约余额:");
    const contractBalance = await provider.getBalance(contractAddress);
    console.log(`OKB 余额: ${ethers.formatEther(contractBalance)} OKB`);

  } catch (error) {
    console.error("❌ 检查过程中出现错误:", error.message);
    console.error("详细错误:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
