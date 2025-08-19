const hre = require("hardhat");
const { Web3 } = require('web3');
require('dotenv').config();

async function main() {
  console.log("🪙 部署 XLuckyCoin (XLC) 代币合约...");

  // 获取部署账户
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 部署账户:", deployer.address);

  // 检查账户余额
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 账户余额:", hre.ethers.formatEther(balance), "ETH");

  if (balance < hre.ethers.parseEther("0.01")) {
    console.warn("⚠️  警告: 账户余额较低，可能无法完成部署");
  }

  try {
    // 部署 XLuckyCoin 合约
    console.log("\n🚀 开始部署 XLuckyCoin 合约...");
    
    const XLuckyCoin = await hre.ethers.getContractFactory("XLuckyCoin");
    
    // 部署合约，初始所有者为部署者
    const xluckyCoin = await XLuckyCoin.deploy(deployer.address);
    
    console.log("⏳ 等待合约部署确认...");
    await xluckyCoin.waitForDeployment();

    console.log("✅ XLuckyCoin 合约部署成功!");
    console.log("📋 合约地址:", await xluckyCoin.getAddress());
    console.log("🔗 区块链浏览器:", `https://www.oklink.com/xlayer/address/${await xluckyCoin.getAddress()}`);

    // 验证合约信息
    console.log("\n🔍 验证合约信息...");
    const name = await xluckyCoin.name();
    const symbol = await xluckyCoin.symbol();
    const decimals = await xluckyCoin.decimals();
    const totalSupply = await xluckyCoin.totalSupply();
    const ownerBalance = await xluckyCoin.balanceOf(deployer.address);

    console.log("📊 代币信息:");
    console.log("- 名称:", name);
    console.log("- 符号:", symbol);
    console.log("- 小数位:", decimals.toString());
    console.log("- 总供应量:", hre.ethers.formatEther(totalSupply), "XLC");
    console.log("- 所有者余额:", hre.ethers.formatEther(ownerBalance), "XLC");

    // 保存部署信息
    const contractAddress = await xluckyCoin.getAddress();
    const deploymentInfo = {
      network: hre.network.name,
      contractName: "XLuckyCoin",
      contractAddress: contractAddress,
      deployerAddress: deployer.address,
      deploymentTime: new Date().toISOString(),
      transactionHash: xluckyCoin.deploymentTransaction()?.hash,
      blockNumber: xluckyCoin.deploymentTransaction()?.blockNumber,
      tokenInfo: {
        name: name,
        symbol: symbol,
        decimals: decimals.toString(),
        totalSupply: totalSupply.toString(),
        totalSupplyFormatted: hre.ethers.formatEther(totalSupply) + " XLC"
      }
    };

    // 写入部署记录文件
    const fs = require('fs');
    const path = require('path');
    
    const deploymentsDir = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const deploymentFile = path.join(deploymentsDir, `xluckycoin-${hre.network.name}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    
    console.log("\n📁 部署信息已保存到:", deploymentFile);

    // 如果是主网，等待更多确认
    if (hre.network.name === 'xlayer-mainnet') {
      console.log("\n⏳ 等待更多区块确认...");
      const deployTx = xluckyCoin.deploymentTransaction();
      if (deployTx) {
        await deployTx.wait(5);
        console.log("✅ 已获得 5 个区块确认");
      }
    }

    // 输出使用说明
    console.log("\n📖 使用说明:");
    console.log("1. 代币已部署完成，总量 10 亿枚 XLC");
    console.log("2. 所有代币已分配给部署者地址");
    console.log("3. 可以使用以下功能:");
    console.log("   - 标准 ERC20 转账");
    console.log("   - 批量转账");
    console.log("   - 代币燃烧");
    console.log("   - 合约暂停/恢复");
    console.log("4. 合约地址:", contractAddress);

    // 如果需要，可以立即验证合约
    if (process.env.VERIFY_CONTRACT === 'true') {
      console.log("\n🔍 开始验证合约...");
      try {
        await hre.run("verify:verify", {
          address: contractAddress,
          constructorArguments: [deployer.address],
        });
        console.log("✅ 合约验证成功!");
      } catch (error) {
        console.log("❌ 合约验证失败:", error.message);
        console.log("💡 你可以稍后手动验证合约");
      }
    }

    return {
      contractAddress: contractAddress,
      deploymentInfo: deploymentInfo
    };

  } catch (error) {
    console.error("❌ 部署失败:", error);
    
    if (error.message.includes('insufficient funds')) {
      console.log("💡 解决方案: 请确保账户有足够的 ETH 支付 Gas 费用");
    } else if (error.message.includes('nonce')) {
      console.log("💡 解决方案: 请等待之前的交易确认，或重置账户 nonce");
    } else if (error.message.includes('gas')) {
      console.log("💡 解决方案: 请尝试增加 Gas Limit 或 Gas Price");
    }
    
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main()
    .then((result) => {
      console.log("\n🎉 部署完成!");
      console.log("📋 合约地址:", result.contractAddress);
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 部署过程中发生错误:", error);
      process.exit(1);
    });
}

module.exports = main;
