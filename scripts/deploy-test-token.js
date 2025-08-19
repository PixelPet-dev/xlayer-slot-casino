const { ethers } = require("hardhat");

async function main() {
    console.log("🪙 部署测试代币...");
    
    const [deployer] = await ethers.getSigners();
    console.log("📝 部署者地址:", deployer.address);
    
    // 部署测试代币
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const testToken = await MockERC20.deploy(
        "Test BONK Token",
        "XLC",
        ethers.parseEther("1000000"), // 100万代币
        18 // 18位小数
    );
    
    await testToken.waitForDeployment();
    const tokenAddress = await testToken.getAddress();
    
    console.log("✅ 测试代币部署成功:", tokenAddress);
    console.log("📋 代币信息:");
    console.log("- 名称: Test BONK Token");
    console.log("- 符号: XLC");
    console.log("- 总供应量: 1,000,000 XLC");
    console.log("- 小数位: 18");
    
    console.log("\n📝 下一步:");
    console.log(`export TOKEN_CONTRACT_ADDRESS=${tokenAddress}`);
    console.log("然后运行: npm run setup:token");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ 部署失败:", error);
        process.exit(1);
    });
