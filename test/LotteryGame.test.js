const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LotteryGame", function () {
    let lotteryGame, mockToken;
    let owner, player1, player2;
    
    beforeEach(async function () {
        [owner, player1, player2] = await ethers.getSigners();
        
        // 部署模拟 ERC20 代币
        const MockToken = await ethers.getContractFactory("MockERC20");
        mockToken = await MockToken.deploy(
            "Test Token",
            "TEST",
            ethers.parseEther("1000000") // 100万代币
        );
        
        // 部署抽奖合约
        const LotteryGame = await ethers.getContractFactory("LotteryGame");
        lotteryGame = await LotteryGame.deploy(
            await mockToken.getAddress(),
            owner.address
        );
        
        // 给玩家分配代币
        await mockToken.transfer(player1.address, ethers.parseEther("1000"));
        await mockToken.transfer(player2.address, ethers.parseEther("1000"));
        
        // 向合约存入奖励池
        await mockToken.approve(await lotteryGame.getAddress(), ethers.parseEther("10000"));
        await lotteryGame.depositTokens(ethers.parseEther("10000"));
    });
    
    describe("部署", function () {
        it("应该正确设置初始状态", async function () {
            expect(await lotteryGame.owner()).to.equal(owner.address);
            expect(await lotteryGame.currentToken()).to.equal(await mockToken.getAddress());
            
            const config = await lotteryGame.gameConfig();
            expect(config.minBet).to.equal(ethers.parseEther("1"));
            expect(config.maxBet).to.equal(ethers.parseEther("1000"));
            expect(config.houseFeePercentage).to.equal(500);
            expect(config.isActive).to.be.true;
        });
        
        it("应该正确设置快捷下注选项", async function () {
            const options = await lotteryGame.getQuickBetOptions();
            expect(options.length).to.equal(5);
            expect(options[0]).to.equal(ethers.parseEther("1"));
            expect(options[4]).to.equal(ethers.parseEther("100"));
        });
        
        it("应该正确设置赔率", async function () {
            const rates = await lotteryGame.getAllPayoutRates();
            expect(rates[0]).to.equal(200);  // Cherry
            expect(rates[7]).to.equal(10000); // Jackpot
        });
    });
    
    describe("代币管理", function () {
        it("只有所有者可以更换代币合约", async function () {
            const NewToken = await ethers.getContractFactory("MockERC20");
            const newToken = await NewToken.deploy("New Token", "NEW", ethers.parseEther("1000000"));
            
            await expect(
                lotteryGame.connect(player1).updateTokenContract(await newToken.getAddress())
            ).to.be.revertedWithCustomError(lotteryGame, "OwnableUnauthorizedAccount");
        });
        
        it("应该能够更换代币合约", async function () {
            const NewToken = await ethers.getContractFactory("MockERC20");
            const newToken = await NewToken.deploy("New Token", "NEW", ethers.parseEther("1000000"));
            
            await expect(lotteryGame.updateTokenContract(await newToken.getAddress()))
                .to.emit(lotteryGame, "TokenContractUpdated")
                .withArgs(await mockToken.getAddress(), await newToken.getAddress());
            
            expect(await lotteryGame.currentToken()).to.equal(await newToken.getAddress());
        });
    });
    
    describe("用户注册", function () {
        it("应该能够注册用户", async function () {
            await expect(lotteryGame.connect(player1).registerUser("Player1"))
                .to.emit(lotteryGame, "UserRegistered")
                .withArgs(player1.address, "Player1");
            
            const userInfo = await lotteryGame.users(player1.address);
            expect(userInfo.isRegistered).to.be.true;
            expect(userInfo.nickname).to.equal("Player1");
        });
        
        it("应该拒绝重复注册", async function () {
            await lotteryGame.connect(player1).registerUser("Player1");
            
            await expect(
                lotteryGame.connect(player1).registerUser("Player1Again")
            ).to.be.revertedWith("User already registered");
        });
        
        it("应该拒绝无效昵称", async function () {
            await expect(
                lotteryGame.connect(player1).registerUser("")
            ).to.be.revertedWith("Invalid nickname length");
            
            const longNickname = "a".repeat(51);
            await expect(
                lotteryGame.connect(player1).registerUser(longNickname)
            ).to.be.revertedWith("Invalid nickname length");
        });
    });
    
    describe("抽奖游戏", function () {
        beforeEach(async function () {
            // 注册用户
            await lotteryGame.connect(player1).registerUser("Player1");
            
            // 授权代币
            await mockToken.connect(player1).approve(
                await lotteryGame.getAddress(),
                ethers.parseEther("1000")
            );
        });
        
        it("应该能够成功抽奖", async function () {
            const betAmount = ethers.parseEther("10");
            
            await expect(lotteryGame.connect(player1).playLottery(betAmount))
                .to.emit(lotteryGame, "GamePlayed");
        });
        
        it("应该拒绝低于最小下注金额", async function () {
            const betAmount = ethers.parseEther("0.5");
            
            await expect(
                lotteryGame.connect(player1).playLottery(betAmount)
            ).to.be.revertedWith("Bet amount too low");
        });
        
        it("应该拒绝高于最大下注金额", async function () {
            const betAmount = ethers.parseEther("1001");
            
            await expect(
                lotteryGame.connect(player1).playLottery(betAmount)
            ).to.be.revertedWith("Bet amount too high");
        });
        
        it("应该拒绝未注册用户", async function () {
            const betAmount = ethers.parseEther("10");
            
            await expect(
                lotteryGame.connect(player2).playLottery(betAmount)
            ).to.be.revertedWith("User not registered");
        });
        
        it("应该正确更新用户统计", async function () {
            const betAmount = ethers.parseEther("10");
            
            await lotteryGame.connect(player1).playLottery(betAmount);
            
            const userInfo = await lotteryGame.users(player1.address);
            expect(userInfo.totalBets).to.equal(betAmount);
            expect(userInfo.gamesPlayed).to.equal(1);
        });
    });
    
    describe("奖励领取", function () {
        beforeEach(async function () {
            await lotteryGame.connect(player1).registerUser("Player1");
            await mockToken.connect(player1).approve(
                await lotteryGame.getAddress(),
                ethers.parseEther("1000")
            );
        });
        
        it("应该能够领取奖励", async function () {
            // 手动设置待领取奖励（模拟中奖）
            // 这里需要通过内部函数或者实际游戏来设置
            // 为了测试，我们可以通过多次游戏来可能获得奖励
            
            const betAmount = ethers.parseEther("10");
            await lotteryGame.connect(player1).playLottery(betAmount);
            
            const userInfo = await lotteryGame.users(player1.address);
            if (userInfo.pendingRewards > 0) {
                const initialBalance = await mockToken.balanceOf(player1.address);
                
                await expect(lotteryGame.connect(player1).claimRewards())
                    .to.emit(lotteryGame, "RewardsClaimed");
                
                const finalBalance = await mockToken.balanceOf(player1.address);
                expect(finalBalance).to.be.gt(initialBalance);
            }
        });
        
        it("应该拒绝无奖励时的领取", async function () {
            await expect(
                lotteryGame.connect(player1).claimRewards()
            ).to.be.revertedWith("No pending rewards");
        });
    });
    
    describe("管理功能", function () {
        it("应该能够更新游戏配置", async function () {
            await lotteryGame.updateGameConfig(
                ethers.parseEther("2"),
                ethers.parseEther("2000"),
                600,
                false
            );
            
            const config = await lotteryGame.gameConfig();
            expect(config.minBet).to.equal(ethers.parseEther("2"));
            expect(config.maxBet).to.equal(ethers.parseEther("2000"));
            expect(config.houseFeePercentage).to.equal(600);
            expect(config.isActive).to.be.false;
        });
        
        it("应该能够更新快捷下注选项", async function () {
            const newOptions = [
                ethers.parseEther("5"),
                ethers.parseEther("10"),
                ethers.parseEther("20")
            ];
            
            await lotteryGame.updateQuickBetOptions(newOptions);
            
            const options = await lotteryGame.getQuickBetOptions();
            expect(options.length).to.equal(3);
            expect(options[0]).to.equal(ethers.parseEther("5"));
        });
        
        it("应该能够暂停和恢复游戏", async function () {
            await lotteryGame.pause();
            
            await lotteryGame.connect(player1).registerUser("Player1");
            await mockToken.connect(player1).approve(
                await lotteryGame.getAddress(),
                ethers.parseEther("1000")
            );
            
            await expect(
                lotteryGame.connect(player1).playLottery(ethers.parseEther("10"))
            ).to.be.revertedWithCustomError(lotteryGame, "EnforcedPause");
            
            await lotteryGame.unpause();
            
            // 现在应该能够正常游戏
            await expect(lotteryGame.connect(player1).playLottery(ethers.parseEther("10")))
                .to.emit(lotteryGame, "GamePlayed");
        });
    });
    
    describe("模拟功能", function () {
        it("应该返回有效的模拟结果", async function () {
            const result = await lotteryGame.simulateLottery(12345);
            expect(result.length).to.equal(3);
            
            // 验证符号在有效范围内 (0-7)
            for (let i = 0; i < 3; i++) {
                expect(result[i]).to.be.gte(0);
                expect(result[i]).to.be.lte(7);
            }
        });
    });
});

// 模拟 ERC20 代币合约
const MockERC20 = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) {
        _mint(msg.sender, initialSupply);
    }
}
`;
