const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = hre;

describe("XLuckyCoin - 基础测试", function () {
  let XLuckyCoin;
  let xluckyCoin;
  let owner;
  let addr1;
  let addr2;

  const TOTAL_SUPPLY = ethers.parseEther("1000000000"); // 10亿枚

  beforeEach(async function () {
    // 获取测试账户
    [owner, addr1, addr2] = await ethers.getSigners();

    // 部署合约
    XLuckyCoin = await ethers.getContractFactory("XLuckyCoin");
    xluckyCoin = await XLuckyCoin.deploy(owner.address);
    await xluckyCoin.waitForDeployment();
  });

  describe("部署测试", function () {
    it("应该设置正确的代币信息", async function () {
      expect(await xluckyCoin.name()).to.equal("XLuckyCoin");
      expect(await xluckyCoin.symbol()).to.equal("XLC");
      expect(await xluckyCoin.decimals()).to.equal(18);
      expect(await xluckyCoin.totalSupply()).to.equal(TOTAL_SUPPLY);
    });

    it("应该将所有代币分配给所有者", async function () {
      const ownerBalance = await xluckyCoin.balanceOf(owner.address);
      expect(ownerBalance).to.equal(TOTAL_SUPPLY);
    });

    it("应该设置正确的所有者", async function () {
      expect(await xluckyCoin.owner()).to.equal(owner.address);
    });
  });

  describe("基本转账测试", function () {
    it("应该能够转账代币", async function () {
      const transferAmount = ethers.parseEther("1000");
      
      await xluckyCoin.transfer(addr1.address, transferAmount);
      
      expect(await xluckyCoin.balanceOf(addr1.address)).to.equal(transferAmount);
      expect(await xluckyCoin.balanceOf(owner.address)).to.equal(
        TOTAL_SUPPLY - transferAmount
      );
    });

    it("应该能够授权和转账", async function () {
      const transferAmount = ethers.parseEther("1000");
      
      await xluckyCoin.approve(addr1.address, transferAmount);
      await xluckyCoin.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount);
      
      expect(await xluckyCoin.balanceOf(addr2.address)).to.equal(transferAmount);
    });
  });

  describe("批量转账测试", function () {
    it("应该能够批量转账不同金额", async function () {
      const recipients = [addr1.address, addr2.address];
      const amounts = [
        ethers.parseEther("1000"),
        ethers.parseEther("2000")
      ];
      
      await xluckyCoin.batchTransfer(recipients, amounts);
      
      expect(await xluckyCoin.balanceOf(addr1.address)).to.equal(amounts[0]);
      expect(await xluckyCoin.balanceOf(addr2.address)).to.equal(amounts[1]);
    });

    it("应该能够批量转账相同金额", async function () {
      const recipients = [addr1.address, addr2.address];
      const amount = ethers.parseEther("1000");
      
      await xluckyCoin.batchTransferSameAmount(recipients, amount);
      
      expect(await xluckyCoin.balanceOf(addr1.address)).to.equal(amount);
      expect(await xluckyCoin.balanceOf(addr2.address)).to.equal(amount);
    });
  });

  describe("燃烧功能测试", function () {
    it("应该能够燃烧代币", async function () {
      const burnAmount = ethers.parseEther("1000");
      const initialSupply = await xluckyCoin.totalSupply();
      
      await xluckyCoin.burn(burnAmount);
      
      expect(await xluckyCoin.totalSupply()).to.equal(initialSupply - burnAmount);
      expect(await xluckyCoin.balanceOf(owner.address)).to.equal(
        TOTAL_SUPPLY - burnAmount
      );
    });
  });

  describe("暂停功能测试", function () {
    it("所有者应该能够暂停合约", async function () {
      await xluckyCoin.pause();
      expect(await xluckyCoin.paused()).to.be.true;
    });

    it("暂停时应该阻止转账", async function () {
      await xluckyCoin.pause();
      
      await expect(
        xluckyCoin.transfer(addr1.address, ethers.parseEther("1000"))
      ).to.be.revertedWithCustomError(xluckyCoin, "EnforcedPause");
    });

    it("恢复后应该能够正常转账", async function () {
      await xluckyCoin.pause();
      await xluckyCoin.unpause();
      
      const transferAmount = ethers.parseEther("1000");
      await xluckyCoin.transfer(addr1.address, transferAmount);
      
      expect(await xluckyCoin.balanceOf(addr1.address)).to.equal(transferAmount);
    });
  });

  describe("查询功能测试", function () {
    it("应该返回正确的代币信息", async function () {
      const tokenInfo = await xluckyCoin.getTokenInfo();
      
      expect(tokenInfo.tokenName).to.equal("XLuckyCoin");
      expect(tokenInfo.tokenSymbol).to.equal("XLC");
      expect(tokenInfo.tokenDecimals).to.equal(18);
      expect(tokenInfo.tokenTotalSupply).to.equal(TOTAL_SUPPLY);
      expect(tokenInfo.tokenCirculatingSupply).to.equal(TOTAL_SUPPLY);
    });

    it("应该能够批量查询余额", async function () {
      // 先给一些地址转账
      await xluckyCoin.transfer(addr1.address, ethers.parseEther("1000"));
      await xluckyCoin.transfer(addr2.address, ethers.parseEther("2000"));
      
      const accounts = [owner.address, addr1.address, addr2.address];
      const balances = await xluckyCoin.batchBalanceOf(accounts);
      
      expect(balances[0]).to.equal(await xluckyCoin.balanceOf(owner.address));
      expect(balances[1]).to.equal(ethers.parseEther("1000"));
      expect(balances[2]).to.equal(ethers.parseEther("2000"));
    });
  });

  describe("铸造限制测试", function () {
    it("应该禁用铸造功能", async function () {
      await expect(
        xluckyCoin.mint(addr1.address, ethers.parseEther("1000"))
      ).to.be.revertedWith("Minting is disabled - fixed supply token");
    });
  });
});
