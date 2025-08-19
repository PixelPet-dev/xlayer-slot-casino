require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    "xlayer-mainnet": {
      url: process.env.XLAYER_RPC_URL || "https://xlayerrpc.okx.com",
      chainId: 196,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 20000000000, // 20 gwei
      timeout: 60000, // 60 seconds
    },
    "xlayer-mainnet-backup": {
      url: "https://rpc.xlayer.tech",
      chainId: 196,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 20000000000, // 20 gwei
      timeout: 60000,
    },
  },
  etherscan: {
    apiKey: {
      "xlayer-mainnet": process.env.XLAYER_API_KEY || "abc",
    },
    customChains: [
      {
        network: "xlayer-mainnet", 
        chainId: 196,
        urls: {
          apiURL: "https://www.oklink.com/api/explorer/v1/contract/verify/async/xlayer",
          browserURL: "https://www.oklink.com/xlayer"
        }
      }
    ]
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
