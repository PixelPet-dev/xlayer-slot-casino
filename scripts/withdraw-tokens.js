const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
    console.log("💸 开始从奖池提取代币...");
    
    // 管理员私钥 (合约owner)
    const adminPrivateKey = "0x72df00daa0ba5f49dec31cd242a25700ea15615fa9f0998b3a77c9f792de9217";
    const provider = new ethers.JsonRpcProvider(process.env.XLAYER_RPC_URL || "https://xlayerrpc.okx.com");
    const adminWallet = new ethers.Wallet(adminPrivateKey, provider);
    
    console.log("👑 管理员地址:", adminWallet.address);
    console.log("💰 管理员余额:", ethers.formatEther(await provider.getBalance(adminWallet.address)), "OKB");
    
    // 合约地址
    const gameContractAddress = "0x619Dd810e1f5Fb87b221810594fFB0654d9FFF6e";
    const tokenContractAddress = "0xa7046145C871203F5331cE5bB5B4a5dE42cBD80c";
    
    // 游戏合约ABI
    const gameABI = [
        "function emergencyWithdraw(uint256 amount) external",
        "function owner() external view returns (address)",
        "function currentToken() external view returns (address)"
    ];
    
    // 代币合约ABI
    const tokenABI = [
        "function balanceOf(address account) external view returns (uint256)"
    ];
    
    // 连接合约
    const gameContract = new ethers.Contract(gameContractAddress, gameABI, adminWallet);
    const tokenContract = new ethers.Contract(tokenContractAddress, tokenABI, adminWallet);
    
    try {
        // 验证owner权限
        const contractOwner = await gameContract.owner();
        console.log("📋 合约Owner:", contractOwner);
        console.log("✅ 权限验证:", contractOwner.toLowerCase() === adminWallet.address.toLowerCase() ? "通过" : "失败");
        
        if (contractOwner.toLowerCase() !== adminWallet.address.toLowerCase()) {
            console.log("❌ 权限验证失败，无法提取代币");
            return;
        }
        
        // 检查当前奖池余额
        const contractBalance = await tokenContract.balanceOf(gameContractAddress);
        console.log("📊 当前奖池余额:", ethers.formatEther(contractBalance), "XLC");
        
        if (contractBalance === 0n) {
            console.log("❌ 奖池余额为0，无法提取");
            return;
        }
        
        // 检查管理员当前代币余额
        const adminTokenBalance = await tokenContract.balanceOf(adminWallet.address);
        console.log("💳 管理员当前XLC余额:", ethers.formatEther(adminTokenBalance), "XLC");
        
        // 获取要提取的数量
        const withdrawAmount = process.argv[2] || "all"; // 默认提取全部
        let withdrawAmountWei;
        
        if (withdrawAmount === "all") {
            withdrawAmountWei = contractBalance;
            console.log("💸 准备提取全部代币:", ethers.formatEther(withdrawAmountWei), "XLC");
        } else {
            withdrawAmountWei = ethers.parseEther(withdrawAmount);
            console.log("💸 准备提取:", ethers.formatEther(withdrawAmountWei), "XLC");
            
            if (withdrawAmountWei > contractBalance) {
                console.log("❌ 要提取的数量超过奖池余额");
                console.log("   要提取:", ethers.formatEther(withdrawAmountWei), "XLC");
                console.log("   可用余额:", ethers.formatEther(contractBalance), "XLC");
                return;
            }
        }
        
        // 执行提取
        console.log("📤 正在执行紧急提取...");
        const withdrawTx = await gameContract.emergencyWithdraw(withdrawAmountWei);
        console.log("⏳ 交易哈希:", withdrawTx.hash);
        
        // 等待确认
        await withdrawTx.wait();
        console.log("✅ 提取成功！");
        
        // 检查提取后的余额
        const newContractBalance = await tokenContract.balanceOf(gameContractAddress);
        const newAdminBalance = await tokenContract.balanceOf(adminWallet.address);
        
        console.log("\n📊 提取后状态:");
        console.log("   奖池余额:", ethers.formatEther(newContractBalance), "XLC");
        console.log("   管理员余额:", ethers.formatEther(newAdminBalance), "XLC");
        console.log("   提取数量:", ethers.formatEther(withdrawAmountWei), "XLC");
        
        console.log("\n🎉 代币提取完成！");
        console.log("🔗 查看交易:", `https://www.oklink.com/xlayer/tx/${withdrawTx.hash}`);
        
    } catch (error) {
        console.error("❌ 提取失败:", error);
        
        if (error.message.includes("Insufficient balance")) {
            console.log("💡 提示: 奖池余额不足，请检查要提取的数量");
        } else if (error.message.includes("Ownable: caller is not the owner")) {
            console.log("💡 提示: 只有合约owner可以执行紧急提取");
        }
    }
}

// 使用方法：
// node scripts/withdraw-tokens.js [数量]
// 例如：
// node scripts/withdraw-tokens.js all        (提取全部)
// node scripts/withdraw-tokens.js 500000     (提取50万XLC)
// node scripts/withdraw-tokens.js 1000000    (提取100万XLC)

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ 脚本执行失败:", error);
        process.exit(1);
    });
