const { ethers } = require("hardhat");

async function testRPC(url, name) {
    console.log(`\n🔍 测试 ${name}: ${url}`);
    
    try {
        const provider = new ethers.JsonRpcProvider(url);
        
        // 测试基本连接
        const network = await provider.getNetwork();
        console.log(`✅ 连接成功 - Chain ID: ${network.chainId}`);
        
        // 测试获取最新区块
        const blockNumber = await provider.getBlockNumber();
        console.log(`✅ 最新区块: ${blockNumber}`);
        
        // 测试 Gas 价格
        const feeData = await provider.getFeeData();
        console.log(`✅ Gas 价格: ${ethers.formatUnits(feeData.gasPrice, 'gwei')} Gwei`);
        
        return true;
    } catch (error) {
        console.log(`❌ 连接失败: ${error.message}`);
        return false;
    }
}

async function main() {
    console.log("🌐 测试 X Layer RPC 节点...");
    
    const rpcUrls = [
        { name: "OKX 官方 RPC", url: "https://xlayerrpc.okx.com" },
        { name: "X Layer 官方 RPC", url: "https://rpc.xlayer.tech" },
        { name: "备用 RPC 1", url: "https://xlayer.rpc.thirdweb.com" },
        { name: "备用 RPC 2", url: "https://endpoints.omniatech.io/v1/xlayer/mainnet/public" }
    ];
    
    const workingRPCs = [];
    
    for (const rpc of rpcUrls) {
        const isWorking = await testRPC(rpc.url, rpc.name);
        if (isWorking) {
            workingRPCs.push(rpc);
        }
    }
    
    console.log(`\n📊 测试结果:`);
    console.log(`可用 RPC 节点: ${workingRPCs.length}/${rpcUrls.length}`);
    
    if (workingRPCs.length > 0) {
        console.log(`\n✅ 推荐使用:`);
        workingRPCs.forEach((rpc, index) => {
            console.log(`${index + 1}. ${rpc.name}: ${rpc.url}`);
        });
        
        console.log(`\n💡 更新 .env 文件:`);
        console.log(`XLAYER_RPC_URL=${workingRPCs[0].url}`);
    } else {
        console.log(`\n❌ 所有 RPC 节点都无法连接`);
        console.log(`💡 可能的解决方案:`);
        console.log(`1. 检查网络连接`);
        console.log(`2. 稍后重试`);
        console.log(`3. 使用 VPN`);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ 测试失败:", error);
        process.exit(1);
    });
