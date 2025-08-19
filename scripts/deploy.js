const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
    console.log("🚀 开始部署 BONK Games 抽奖合约到 X Layer 主网...");
    
    // 获取部署者账户
    const [deployer] = await ethers.getSigners();
    console.log("📝 部署者地址:", deployer.address);
    console.log("💰 部署者余额:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "OKB");
    
    // 部署配置
    const config = {
        // 初始代币合约地址 (可以是任意ERC20代币，后续可更换)
        initialTokenContract: process.env.INITIAL_TOKEN_CONTRACT || "0x0000000000000000000000000000000000000000",
        minBet: process.env.MIN_BET_AMOUNT || ethers.parseEther("1"),
        maxBet: process.env.MAX_BET_AMOUNT || ethers.parseEther("1000"),
        houseFeePercentage: process.env.HOUSE_FEE_PERCENTAGE || 500, // 5%
        quickBetOptions: (process.env.QUICK_BET_OPTIONS || "1,5,10,50,100").split(",").map(x => ethers.parseEther(x.trim()))
    };
    
    console.log("\n📋 部署配置:");
    console.log("- 初始代币合约:", config.initialTokenContract);
    console.log("- 最小下注:", ethers.formatEther(config.minBet), "tokens");
    console.log("- 最大下注:", ethers.formatEther(config.maxBet), "tokens");
    console.log("- 平台费率:", config.houseFeePercentage / 100, "%");
    console.log("- 快捷下注选项:", config.quickBetOptions.map(x => ethers.formatEther(x)).join(", "), "tokens");
    
    // 如果没有设置代币合约地址，提示用户
    if (config.initialTokenContract === "0x0000000000000000000000000000000000000000") {
        console.log("\n⚠️  警告: 未设置初始代币合约地址");
        console.log("   部署后需要通过 updateTokenContract 函数设置代币合约");
    }
    
    // 部署抽奖合约
    console.log("\n🎰 部署抽奖游戏合约...");
    const LotteryGame = await ethers.getContractFactory("LotteryGame");
    const lotteryGame = await LotteryGame.deploy(
        config.initialTokenContract,
        "0x78C30Bc014b6d67FA6fb27FF8cd6e23Ae69c1626"  // 最高权限管理员地址
    );
    
    await lotteryGame.waitForDeployment();
    const contractAddress = await lotteryGame.getAddress();
    console.log("✅ 抽奖合约部署成功:", contractAddress);
    
    // 配置合约参数
    console.log("\n⚙️ 配置合约参数...");
    
    // 更新游戏配置
    console.log("- 更新游戏配置...");
    await lotteryGame.updateGameConfig(
        config.minBet,
        config.maxBet,
        config.houseFeePercentage,
        true // 激活游戏
    );
    
    // 更新快捷下注选项
    console.log("- 更新快捷下注选项...");
    await lotteryGame.updateQuickBetOptions(config.quickBetOptions);
    
    // 验证部署
    console.log("\n🔍 验证合约部署...");
    const gameConfig = await lotteryGame.gameConfig();
    const quickBetOptions = await lotteryGame.getQuickBetOptions();
    const payoutRates = await lotteryGame.getAllPayoutRates();
    const currentToken = await lotteryGame.currentToken();
    
    console.log("- 当前代币合约:", currentToken);
    console.log("- 最小下注:", ethers.formatEther(gameConfig[0]), "tokens");
    console.log("- 最大下注:", ethers.formatEther(gameConfig[1]), "tokens");
    console.log("- 平台费率:", gameConfig[2].toString() / 100, "%");
    console.log("- 游戏状态:", gameConfig[3] ? "激活" : "暂停");
    console.log("- 快捷下注选项:", quickBetOptions.map(x => ethers.formatEther(x)).join(", "));
    console.log("- 赔率配置:");
    const symbolNames = ["Cherry", "Lemon", "Orange", "Plum", "Bell", "Bar", "Seven", "Jackpot"];
    payoutRates.forEach((rate, index) => {
        console.log(`  ${symbolNames[index]}: ${rate.toString() / 100}x`);
    });
    
    // 测试基本功能
    console.log("\n🧪 测试基本功能...");
    
    // 测试用户注册
    console.log("- 测试用户注册...");
    await lotteryGame.registerUser("TestUser");
    const userInfo = await lotteryGame.users(deployer.address);
    console.log("  ✓ 用户注册成功:", userInfo[1]); // nickname
    
    // 测试模拟抽奖
    console.log("- 测试模拟抽奖...");
    const simulationResult = await lotteryGame.simulateLottery(12345);
    console.log("  ✓ 模拟结果:", simulationResult.map(s => symbolNames[Number(s)]));
    
    // 输出部署摘要
    console.log("\n🎉 部署完成! 合约信息:");
    console.log("=====================================");
    console.log("合约地址:", contractAddress);
    console.log("网络: X Layer 主网");
    console.log("链ID: 196");
    console.log("部署者:", deployer.address);
    console.log("当前代币:", currentToken);
    console.log("=====================================");
    
    // 保存部署信息
    const deploymentInfo = {
        network: {
            name: "X Layer Mainnet",
            chainId: 196,
            rpcUrl: "https://rpc.xlayer.tech",
            explorer: "https://www.oklink.com/xlayer"
        },
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        contract: {
            address: contractAddress,
            name: "LotteryGame",
            currentToken: currentToken,
            gameConfig: {
                minBet: ethers.formatEther(gameConfig[0]),
                maxBet: ethers.formatEther(gameConfig[1]),
                houseFeePercentage: gameConfig[2].toString(),
                isActive: gameConfig[3]
            },
            quickBetOptions: quickBetOptions.map(x => ethers.formatEther(x)),
            payoutRates: payoutRates.map((rate, index) => ({
                symbol: symbolNames[index],
                multiplier: rate.toString() / 100
            }))
        },
        features: [
            "代币切换支持",
            "用户注册系统",
            "抽奖游戏",
            "奖励累计",
            "快捷下注",
            "管理员功能"
        ]
    };
    
    const fs = require('fs');
    const path = require('path');
    
    // 确保 deployments 目录存在
    const deploymentsDir = path.join(__dirname, '..', 'deployments');
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    // 保存部署信息
    const deploymentFile = path.join(deploymentsDir, `deployment-xlayer-mainnet.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log("📄 部署信息已保存到:", deploymentFile);
    
    // 生成前端配置
    const frontendConfig = {
        contractAddress: contractAddress,
        chainId: 196,
        rpcUrl: "https://rpc.xlayer.tech",
        explorer: "https://www.oklink.com/xlayer",
        currentToken: currentToken,
        features: deploymentInfo.features,
        gameConfig: deploymentInfo.contract.gameConfig,
        quickBetOptions: deploymentInfo.contract.quickBetOptions,
        payoutRates: deploymentInfo.contract.payoutRates
    };
    
    const frontendConfigFile = path.join(deploymentsDir, 'frontend-config.json');
    fs.writeFileSync(frontendConfigFile, JSON.stringify(frontendConfig, null, 2));
    console.log("📄 前端配置已保存到:", frontendConfigFile);
    
    console.log("\n✨ 抽奖合约部署完成!");
    console.log("🔗 请在区块浏览器中验证合约: https://www.oklink.com/xlayer");
    console.log("📖 合约功能:");
    deploymentInfo.features.forEach(feature => {
        console.log(`   • ${feature}`);
    });
    
    console.log("\n📝 下一步操作:");
    console.log("1. 设置代币合约: updateTokenContract(tokenAddress)");
    console.log("2. 向合约存入代币作为奖励池: depositTokens(amount)");
    console.log("3. 部署前端应用");
    console.log("4. 开始游戏!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ 部署失败:", error);
        process.exit(1);
    });
