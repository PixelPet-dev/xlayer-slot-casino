const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
    console.log("💰 开始向奖池添加代币...");
    
    // 管理员私钥
    const adminPrivateKey = "0x72df00daa0ba5f49dec31cd242a25700ea15615fa9f0998b3a77c9f792de9217";
    const provider = new ethers.JsonRpcProvider(process.env.XLAYER_RPC_URL || "https://xlayerrpc.okx.com");
    const adminWallet = new ethers.Wallet(adminPrivateKey, provider);
    
    console.log("👑 管理员地址:", adminWallet.address);
    console.log("💰 管理员余额:", ethers.formatEther(await provider.getBalance(adminWallet.address)), "OKB");
    
    // 合约地址
    const gameContractAddress = "0x619Dd810e1f5Fb87b221810594fFB0654d9FFF6e";
    const tokenContractAddress = "0xa7046145C871203F5331cE5bB5B4a5dE42cBD80c";
    
    // 代币合约ABI
    const tokenABI = [
        "function transfer(address to, uint256 amount) external returns (bool)",
        "function balanceOf(address account) external view returns (uint256)",
        "function approve(address spender, uint256 amount) external returns (bool)",
        "function allowance(address owner, address spender) external view returns (uint256)"
    ];
    
    // 游戏合约ABI
    const gameABI = [
        "function getContractBalance() external view returns (uint256)",
        "function emergencyWithdraw(uint256 amount) external"
    ];
    
    // 连接合约
    const tokenContract = new ethers.Contract(tokenContractAddress, tokenABI, adminWallet);
    const gameContract = new ethers.Contract(gameContractAddress, gameABI, adminWallet);
    
    try {
        // 检查当前奖池余额
        const currentBalance = await gameContract.getContractBalance();
        console.log("📊 当前奖池余额:", ethers.formatEther(currentBalance), "XLC");
        
        // 检查管理员代币余额
        const adminTokenBalance = await tokenContract.balanceOf(adminWallet.address);
        console.log("💳 管理员XLC余额:", ethers.formatEther(adminTokenBalance), "XLC");
        
        if (adminTokenBalance === 0n) {
            console.log("❌ 管理员没有XLC代币，无法添加到奖池");
            return;
        }
        
        // 询问要添加多少代币
        const addAmount = process.argv[2] || "1000000"; // 默认100万XLC
        const addAmountWei = ethers.parseEther(addAmount);
        
        if (addAmountWei > adminTokenBalance) {
            console.log("❌ 要添加的数量超过管理员余额");
            console.log("   要添加:", ethers.formatEther(addAmountWei), "XLC");
            console.log("   可用余额:", ethers.formatEther(adminTokenBalance), "XLC");
            return;
        }
        
        console.log("💸 准备添加", ethers.formatEther(addAmountWei), "XLC 到奖池");
        
        // 直接转账到游戏合约
        console.log("📤 正在转账到游戏合约...");
        const transferTx = await tokenContract.transfer(gameContractAddress, addAmountWei);
        console.log("⏳ 交易哈希:", transferTx.hash);
        
        // 等待确认
        await transferTx.wait();
        console.log("✅ 转账成功！");
        
        // 检查新的奖池余额
        const newBalance = await gameContract.getContractBalance();
        console.log("📊 新的奖池余额:", ethers.formatEther(newBalance), "XLC");
        console.log("📈 增加了:", ethers.formatEther(newBalance - currentBalance), "XLC");
        
        console.log("\n🎉 奖池充值完成！");
        console.log("🔗 查看交易:", `https://www.oklink.com/xlayer/tx/${transferTx.hash}`);
        
    } catch (error) {
        console.error("❌ 添加奖池失败:", error);
    }
}

// 使用方法：
// node scripts/add-prize-pool.js [数量]
// 例如：node scripts/add-prize-pool.js 500000  (添加50万XLC)

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ 脚本执行失败:", error);
        process.exit(1);
    });
