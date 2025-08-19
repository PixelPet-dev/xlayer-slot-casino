const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
    console.log("🔧 配置抽奖合约的代币设置...");
    
    // 获取部署者账户
    const [deployer] = await ethers.getSigners();
    console.log("📝 操作者地址:", deployer.address);
    
    // 合约地址 (从部署文件中获取或手动输入)
    const LOTTERY_CONTRACT_ADDRESS = process.env.LOTTERY_CONTRACT_ADDRESS || "";
    const TOKEN_CONTRACT_ADDRESS = process.env.TOKEN_CONTRACT_ADDRESS || "";
    
    if (!LOTTERY_CONTRACT_ADDRESS) {
        console.error("❌ 请设置 LOTTERY_CONTRACT_ADDRESS 环境变量");
        process.exit(1);
    }
    
    if (!TOKEN_CONTRACT_ADDRESS) {
        console.error("❌ 请设置 TOKEN_CONTRACT_ADDRESS 环境变量");
        process.exit(1);
    }
    
    console.log("🎰 抽奖合约地址:", LOTTERY_CONTRACT_ADDRESS);
    console.log("🪙 代币合约地址:", TOKEN_CONTRACT_ADDRESS);
    
    // 获取合约实例
    const LotteryGame = await ethers.getContractFactory("LotteryGame");
    const lotteryGame = LotteryGame.attach(LOTTERY_CONTRACT_ADDRESS);
    
    const ERC20 = await ethers.getContractFactory("MockERC20");
    const tokenContract = ERC20.attach(TOKEN_CONTRACT_ADDRESS);
    
    try {
        // 1. 更新代币合约
        console.log("\n1️⃣ 更新代币合约...");
        const currentToken = await lotteryGame.currentToken();
        
        if (currentToken.toLowerCase() !== TOKEN_CONTRACT_ADDRESS.toLowerCase()) {
            const tx1 = await lotteryGame.updateTokenContract(TOKEN_CONTRACT_ADDRESS);
            await tx1.wait();
            console.log("✅ 代币合约已更新");
        } else {
            console.log("ℹ️ 代币合约已经是目标地址");
        }
        
        // 2. 获取代币信息
        console.log("\n2️⃣ 获取代币信息...");
        const tokenName = await tokenContract.name();
        const tokenSymbol = await tokenContract.symbol();
        const tokenDecimals = await tokenContract.decimals();
        
        console.log(`📋 代币信息: ${tokenName} (${tokenSymbol}), ${tokenDecimals} decimals`);
        
        // 3. 向合约存入奖励池代币
        console.log("\n3️⃣ 设置奖励池...");
        const rewardPoolAmount = ethers.parseUnits("10000", tokenDecimals); // 1万代币作为奖励池
        
        // 检查部署者余额
        const deployerBalance = await tokenContract.balanceOf(deployer.address);
        console.log(`💰 部署者余额: ${ethers.formatUnits(deployerBalance, tokenDecimals)} ${tokenSymbol}`);
        
        if (deployerBalance >= rewardPoolAmount) {
            // 授权
            console.log("🔓 授权代币...");
            const approveTx = await tokenContract.approve(LOTTERY_CONTRACT_ADDRESS, rewardPoolAmount);
            await approveTx.wait();
            
            // 存入奖励池
            console.log("💰 存入奖励池...");
            const depositTx = await lotteryGame.depositTokens(rewardPoolAmount);
            await depositTx.wait();
            
            console.log(`✅ 已存入 ${ethers.formatUnits(rewardPoolAmount, tokenDecimals)} ${tokenSymbol} 到奖励池`);
        } else {
            console.log("⚠️ 部署者余额不足，跳过奖励池设置");
        }
        
        // 4. 更新游戏配置
        console.log("\n4️⃣ 更新游戏配置...");
        const minBet = ethers.parseUnits("1", tokenDecimals);
        const maxBet = ethers.parseUnits("1000", tokenDecimals);
        const houseFeePercentage = 500; // 5%
        
        const configTx = await lotteryGame.updateGameConfig(minBet, maxBet, houseFeePercentage, true);
        await configTx.wait();
        console.log("✅ 游戏配置已更新");
        
        // 5. 更新快捷下注选项
        console.log("\n5️⃣ 更新快捷下注选项...");
        const quickBetOptions = [
            ethers.parseUnits("1", tokenDecimals),
            ethers.parseUnits("5", tokenDecimals),
            ethers.parseUnits("10", tokenDecimals),
            ethers.parseUnits("50", tokenDecimals),
            ethers.parseUnits("100", tokenDecimals)
        ];
        
        const optionsTx = await lotteryGame.updateQuickBetOptions(quickBetOptions);
        await optionsTx.wait();
        console.log("✅ 快捷下注选项已更新");
        
        // 6. 验证配置
        console.log("\n6️⃣ 验证最终配置...");
        const finalConfig = await lotteryGame.gameConfig();
        const finalOptions = await lotteryGame.getQuickBetOptions();
        const contractBalance = await tokenContract.balanceOf(LOTTERY_CONTRACT_ADDRESS);
        
        console.log("📊 最终配置:");
        console.log(`- 当前代币: ${await lotteryGame.currentToken()}`);
        console.log(`- 最小下注: ${ethers.formatUnits(finalConfig.minBet, tokenDecimals)} ${tokenSymbol}`);
        console.log(`- 最大下注: ${ethers.formatUnits(finalConfig.maxBet, tokenDecimals)} ${tokenSymbol}`);
        console.log(`- 平台费率: ${Number(finalConfig.houseFeePercentage) / 100}%`);
        console.log(`- 游戏状态: ${finalConfig.isActive ? '激活' : '暂停'}`);
        console.log(`- 合约余额: ${ethers.formatUnits(contractBalance, tokenDecimals)} ${tokenSymbol}`);
        console.log(`- 快捷选项: ${finalOptions.map(opt => ethers.formatUnits(opt, tokenDecimals)).join(', ')} ${tokenSymbol}`);
        
        console.log("\n🎉 代币配置完成!");
        console.log("🚀 现在可以开始游戏了!");
        
    } catch (error) {
        console.error("❌ 配置失败:", error);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ 脚本执行失败:", error);
        process.exit(1);
    });
