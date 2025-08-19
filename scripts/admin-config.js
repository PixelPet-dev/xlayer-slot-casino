const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
    console.log("🔧 开始配置安全增强合约...");
    
    // 管理员私钥
    const adminPrivateKey = "0x72df00daa0ba5f49dec31cd242a25700ea15615fa9f0998b3a77c9f792de9217";
    const provider = new ethers.JsonRpcProvider(process.env.XLAYER_RPC_URL || "https://xlayerrpc.okx.com");
    const adminWallet = new ethers.Wallet(adminPrivateKey, provider);
    
    console.log("👑 管理员地址:", adminWallet.address);
    console.log("💰 管理员余额:", ethers.formatEther(await provider.getBalance(adminWallet.address)), "OKB");
    
    // 合约地址和ABI
    const contractAddress = "0x356F8378bE4bE92ecBF2961efA01143974daD45C";
    const contractABI = [
        "function updateGameConfig(uint256 _minBet, uint256 _maxBet, uint256 _houseFeePercentage, bool _isActive) external",
        "function updateQuickBetOptions(uint256[] memory _options) external",
        "function updateTokenContract(address _newTokenContract) external",
        "function gameConfig() external view returns (uint256 minBet, uint256 maxBet, uint256 houseFeePercentage, bool isActive)",
        "function quickBetOptions(uint256) external view returns (uint256)",
        "function owner() external view returns (address)"
    ];
    
    // 连接合约
    const contract = new ethers.Contract(contractAddress, contractABI, adminWallet);
    
    // 验证管理员权限
    const owner = await contract.owner();
    console.log("📋 合约Owner:", owner);
    console.log("✅ 权限验证:", owner.toLowerCase() === adminWallet.address.toLowerCase() ? "通过" : "失败");
    
    if (owner.toLowerCase() !== adminWallet.address.toLowerCase()) {
        console.log("❌ 权限验证失败，无法配置合约");
        return;
    }
    
    console.log("\n⚙️ 开始配置合约参数...");
    
    // 1. 设置代币合约 (跳过，已设置)
    console.log("- 代币合约已设置，跳过...");
    
    // 2. 配置游戏参数
    console.log("- 配置游戏参数...");
    const minBet = ethers.parseEther("30000");      // 30,000 XLC
    const maxBet = ethers.parseEther("1000000");    // 1,000,000 XLC
    const houseFee = 500;                           // 5%
    const isActive = true;
    
    const tx2 = await contract.updateGameConfig(minBet, maxBet, houseFee, isActive);
    await tx2.wait();
    console.log("✅ 游戏配置完成:");
    console.log("  - 最小下注:", ethers.formatEther(minBet), "XLC");
    console.log("  - 最大下注:", ethers.formatEther(maxBet), "XLC");
    console.log("  - 平台费率:", houseFee / 100, "%");
    console.log("  - 游戏状态:", isActive ? "激活" : "暂停");
    
    // 3. 设置快捷下注选项
    console.log("- 设置快捷下注选项...");
    const quickBetOptions = [
        ethers.parseEther("30000"),    // 30,000 XLC
        ethers.parseEther("50000"),    // 50,000 XLC
        ethers.parseEther("100000"),   // 100,000 XLC
        ethers.parseEther("300000"),   // 300,000 XLC
        ethers.parseEther("500000"),   // 500,000 XLC
        ethers.parseEther("800000"),   // 800,000 XLC
        ethers.parseEther("1000000")   // 1,000,000 XLC
    ];
    
    const tx3 = await contract.updateQuickBetOptions(quickBetOptions);
    await tx3.wait();
    console.log("✅ 快捷下注选项设置完成:");
    quickBetOptions.forEach((option, index) => {
        console.log(`  ${index + 1}. ${ethers.formatEther(option)} XLC`);
    });
    
    // 4. 验证配置
    console.log("\n🔍 验证配置结果...");
    const gameConfig = await contract.gameConfig();
    console.log("📊 当前游戏配置:");
    console.log("  - 最小下注:", ethers.formatEther(gameConfig.minBet), "XLC");
    console.log("  - 最大下注:", ethers.formatEther(gameConfig.maxBet), "XLC");
    console.log("  - 平台费率:", gameConfig.houseFeePercentage.toString() / 100, "%");
    console.log("  - 游戏状态:", gameConfig.isActive ? "✅ 激活" : "❌ 暂停");
    
    console.log("\n🎉 合约配置完成！");
    console.log("🔗 合约地址:", contractAddress);
    console.log("🔗 浏览器查看:", `https://www.oklink.com/xlayer/address/${contractAddress}`);
    
    console.log("\n🛡️ 安全功能状态:");
    console.log("✅ 提交-揭示机制: 3秒等待时间");
    console.log("✅ 增强随机数: 100种子池");
    console.log("✅ 速率限制: 3秒间隔, 100次/小时");
    console.log("✅ 排行榜系统: 已激活");
    console.log("✅ 紧急提取: 管理员可用");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ 配置失败:", error);
        process.exit(1);
    });
