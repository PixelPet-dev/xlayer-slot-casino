const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
    console.log("🔍 测试网络连接和配置...");
    
    try {
        // 测试环境变量
        console.log("\n1️⃣ 检查环境变量...");
        const privateKey = process.env.PRIVATE_KEY;
        if (!privateKey) {
            console.error("❌ PRIVATE_KEY 环境变量未设置");
            return;
        }
        
        console.log("✅ PRIVATE_KEY 已设置");
        console.log(`📝 私钥长度: ${privateKey.length} 字符`);
        
        // 检查私钥格式
        if (privateKey.startsWith('0x')) {
            console.error("❌ 私钥不应包含 '0x' 前缀");
            console.log("💡 请在 .env 文件中移除 '0x' 前缀");
            return;
        }
        
        if (privateKey.length !== 64) {
            console.error("❌ 私钥长度应为64个字符");
            return;
        }
        
        console.log("✅ 私钥格式正确");
        
        // 测试网络连接
        console.log("\n2️⃣ 测试网络连接...");
        const provider = ethers.provider;
        const network = await provider.getNetwork();
        console.log(`✅ 连接到网络: ${network.name} (Chain ID: ${network.chainId})`);
        
        // 测试获取签名者
        console.log("\n3️⃣ 测试签名者...");
        const [deployer] = await ethers.getSigners();
        
        if (!deployer) {
            console.error("❌ 无法获取签名者");
            return;
        }
        
        console.log(`✅ 签名者地址: ${deployer.address}`);
        
        // 检查余额
        console.log("\n4️⃣ 检查余额...");
        const balance = await provider.getBalance(deployer.address);
        const balanceInOKB = ethers.formatEther(balance);
        console.log(`💰 账户余额: ${balanceInOKB} OKB`);
        
        if (parseFloat(balanceInOKB) < 0.01) {
            console.warn("⚠️ 余额可能不足以支付 Gas 费用");
            console.log("💡 建议至少有 0.01 OKB 用于部署");
        } else {
            console.log("✅ 余额充足");
        }
        
        // 测试 Gas 价格
        console.log("\n5️⃣ 检查 Gas 价格...");
        const gasPrice = await provider.getFeeData();
        console.log(`⛽ Gas 价格: ${ethers.formatUnits(gasPrice.gasPrice, 'gwei')} Gwei`);
        
        console.log("\n🎉 所有检查通过！可以开始部署了。");
        
    } catch (error) {
        console.error("❌ 测试失败:", error.message);
        
        if (error.message.includes("could not detect network")) {
            console.log("\n💡 网络连接问题解决方案:");
            console.log("1. 检查网络配置是否正确");
            console.log("2. 确认 RPC URL 可访问: https://rpc.xlayer.tech");
            console.log("3. 检查防火墙设置");
        }
        
        if (error.message.includes("invalid private key")) {
            console.log("\n💡 私钥问题解决方案:");
            console.log("1. 确保私钥不包含 '0x' 前缀");
            console.log("2. 确保私钥长度为64个字符");
            console.log("3. 确保私钥只包含十六进制字符 (0-9, a-f)");
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ 脚本执行失败:", error);
        process.exit(1);
    });
