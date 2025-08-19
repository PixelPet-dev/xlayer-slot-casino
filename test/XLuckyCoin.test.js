const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = hre;

describe("XLuckyCoin", function () {
  let XLuckyCoin;
  let xluckyCoin;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  const TOTAL_SUPPLY = ethers.parseEther("1000000000"); // 10亿枚

  beforeEach(async function () {
    // 获取测试账户
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // 部署合约
    XLuckyCoin = await ethers.getContractFactory("XLuckyCoin");
    xluckyCoin = await XLuckyCoin.deploy(owner.address);
    await xluckyCoin.deployed();
  });

  describe("部署", function () {
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

  describe("基本转账", function () {
    it("应该能够转账代币", async function () {
      const transferAmount = ethers.parseEther("1000");

      await xluckyCoin.transfer(addr1.address, transferAmount);

      expect(await xluckyCoin.balanceOf(addr1.address)).to.equal(transferAmount);
      expect(await xluckyCoin.balanceOf(owner.address)).to.equal(
        TOTAL_SUPPLY - transferAmount
      );
    });

    it("应该在余额不足时失败", async function () {
      const transferAmount = TOTAL_SUPPLY + 1n;

      await expect(
        xluckyCoin.transfer(addr1.address, transferAmount)
      ).to.be.revertedWith("ERC20InsufficientBalance");
    });

    it("应该能够授权和转账", async function () {
      const transferAmount = ethers.parseEther("1000");

      await xluckyCoin.approve(addr1.address, transferAmount);
      await xluckyCoin.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount);

      expect(await xluckyCoin.balanceOf(addr2.address)).to.equal(transferAmount);
    });
  });

  describe("批量转账", function () {
    it("应该能够批量转账不同金额", async function () {
      const recipients = [addr1.address, addr2.address];
      const amounts = [
        ethers.utils.parseEther("1000"),
        ethers.utils.parseEther("2000")
      ];
      
      await xluckyCoin.batchTransfer(recipients, amounts);
      
      expect(await xluckyCoin.balanceOf(addr1.address)).to.equal(amounts[0]);
      expect(await xluckyCoin.balanceOf(addr2.address)).to.equal(amounts[1]);
    });

    it("应该能够批量转账相同金额", async function () {
      const recipients = [addr1.address, addr2.address];
      const amount = ethers.utils.parseEther("1000");
      
      await xluckyCoin.batchTransferSameAmount(recipients, amount);
      
      expect(await xluckyCoin.balanceOf(addr1.address)).to.equal(amount);
      expect(await xluckyCoin.balanceOf(addr2.address)).to.equal(amount);
    });

    it("应该在数组长度不匹配时失败", async function () {
      const recipients = [addr1.address, addr2.address];
      const amounts = [ethers.utils.parseEther("1000")]; // 长度不匹配
      
      await expect(
        xluckyCoin.batchTransfer(recipients, amounts)
      ).to.be.revertedWith("Arrays length mismatch");
    });

    it("应该在批量大小超限时失败", async function () {
      const recipients = new Array(201).fill(addr1.address); // 超过 MAX_BATCH_SIZE
      const amounts = new Array(201).fill(ethers.utils.parseEther("1"));
      
      await expect(
        xluckyCoin.batchTransfer(recipients, amounts)
      ).to.be.revertedWith("Batch size too large");
    });
  });

  describe("燃烧功能", function () {
    it("应该能够燃烧代币", async function () {
      const burnAmount = ethers.utils.parseEther("1000");
      const initialSupply = await xluckyCoin.totalSupply();
      
      await xluckyCoin.burn(burnAmount);
      
      expect(await xluckyCoin.totalSupply()).to.equal(initialSupply.sub(burnAmount));
      expect(await xluckyCoin.balanceOf(owner.address)).to.equal(
        TOTAL_SUPPLY.sub(burnAmount)
      );
    });

    it("应该能够燃烧他人授权的代币", async function () {
      const burnAmount = ethers.utils.parseEther("1000");
      
      // 先转一些代币给 addr1
      await xluckyCoin.transfer(addr1.address, burnAmount.mul(2));
      
      // addr1 授权 owner 燃烧代币
      await xluckyCoin.connect(addr1).approve(owner.address, burnAmount);
      
      // owner 燃烧 addr1 的代币
      await xluckyCoin.burnFrom(addr1.address, burnAmount);
      
      expect(await xluckyCoin.balanceOf(addr1.address)).to.equal(burnAmount);
    });
  });

  describe("暂停功能", function () {
    it("所有者应该能够暂停合约", async function () {
      await xluckyCoin.pause();
      expect(await xluckyCoin.paused()).to.be.true;
    });

    it("非所有者不应该能够暂停合约", async function () {
      await expect(
        xluckyCoin.connect(addr1).pause()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("暂停时应该阻止转账", async function () {
      await xluckyCoin.pause();
      
      await expect(
        xluckyCoin.transfer(addr1.address, ethers.utils.parseEther("1000"))
      ).to.be.revertedWith("Pausable: paused");
    });

    it("恢复后应该能够正常转账", async function () {
      await xluckyCoin.pause();
      await xluckyCoin.unpause();
      
      const transferAmount = ethers.utils.parseEther("1000");
      await xluckyCoin.transfer(addr1.address, transferAmount);
      
      expect(await xluckyCoin.balanceOf(addr1.address)).to.equal(transferAmount);
    });
  });

  describe("查询功能", function () {
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
      await xluckyCoin.transfer(addr1.address, ethers.utils.parseEther("1000"));
      await xluckyCoin.transfer(addr2.address, ethers.utils.parseEther("2000"));
      
      const accounts = [owner.address, addr1.address, addr2.address];
      const balances = await xluckyCoin.batchBalanceOf(accounts);
      
      expect(balances[0]).to.equal(await xluckyCoin.balanceOf(owner.address));
      expect(balances[1]).to.equal(ethers.utils.parseEther("1000"));
      expect(balances[2]).to.equal(ethers.utils.parseEther("2000"));
    });
  });

  describe("铸造限制", function () {
    it("应该禁用铸造功能", async function () {
      await expect(
        xluckyCoin.mint(addr1.address, ethers.utils.parseEther("1000"))
      ).to.be.revertedWith("Minting is disabled - fixed supply token");
    });
  });

  describe("紧急提取", function () {
    it("所有者应该能够紧急提取代币", async function () {
      // 这个测试需要另一个 ERC20 代币来模拟误发送的情况
      // 这里我们测试 ETH 提取
      
      // 向合约发送一些 ETH
      await owner.sendTransaction({
        to: xluckyCoin.address,
        value: ethers.utils.parseEther("1")
      });
      
      const initialBalance = await addr1.getBalance();
      
      // 紧急提取 ETH
      await xluckyCoin.emergencyWithdraw(
        ethers.constants.AddressZero, // ETH
        addr1.address,
        ethers.utils.parseEther("1")
      );
      
      const finalBalance = await addr1.getBalance();
      expect(finalBalance.sub(initialBalance)).to.equal(ethers.utils.parseEther("1"));
    });

    it("非所有者不应该能够紧急提取", async function () {
      await expect(
        xluckyCoin.connect(addr1).emergencyWithdraw(
          ethers.constants.AddressZero,
          addr1.address,
          ethers.utils.parseEther("1")
        )
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});
