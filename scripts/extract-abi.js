const fs = require('fs');
const path = require('path');

async function main() {
    console.log("📋 提取合约 ABI...");
    
    // 读取编译产物
    const lotteryArtifact = require('../artifacts/contracts/LotteryGame.sol/LotteryGame.json');
    const erc20Artifact = require('../artifacts/contracts/MockERC20.sol/MockERC20.json');
    
    // 提取 ABI
    const lotteryABI = lotteryArtifact.abi;
    const erc20ABI = erc20Artifact.abi;
    
    // 创建前端 ABI 文件
    const frontendDir = path.join(__dirname, '..', 'frontend', 'src', 'contracts');
    if (!fs.existsSync(frontendDir)) {
        fs.mkdirSync(frontendDir, { recursive: true });
    }
    
    // 保存 ABI 文件
    const abiExports = {
        LotteryGame: lotteryABI,
        ERC20: erc20ABI
    };
    
    const abiContent = `// 自动生成的合约 ABI
export const LOTTERY_GAME_ABI = ${JSON.stringify(lotteryABI, null, 2)};

export const ERC20_ABI = ${JSON.stringify(erc20ABI, null, 2)};

export default {
    LotteryGame: LOTTERY_GAME_ABI,
    ERC20: ERC20_ABI
};
`;
    
    fs.writeFileSync(path.join(frontendDir, 'abis.js'), abiContent);
    
    console.log("✅ ABI 文件已生成:");
    console.log(`- ${path.join(frontendDir, 'abis.js')}`);
    
    // 生成合约配置文件
    const configContent = `// 合约配置
export const CONTRACT_ADDRESSES = {
    LOTTERY_GAME: "${process.env.LOTTERY_CONTRACT_ADDRESS || ''}",
    TOKEN: "${process.env.TOKEN_CONTRACT_ADDRESS || ''}"
};

export const NETWORK_CONFIG = {
    chainId: 196,
    name: "X Layer Mainnet",
    rpcUrl: "https://xlayerrpc.okx.com",
    blockExplorer: "https://www.oklink.com/xlayer"
};

export default {
    CONTRACT_ADDRESSES,
    NETWORK_CONFIG
};
`;
    
    fs.writeFileSync(path.join(frontendDir, 'config.js'), configContent);
    
    console.log(`- ${path.join(frontendDir, 'config.js')}`);
    
    console.log("\n🎉 ABI 提取完成!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ 提取失败:", error);
        process.exit(1);
    });
