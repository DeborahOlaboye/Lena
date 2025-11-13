import { expect } from "chai";
import { ethers } from "hardhat";
import { AnalyticsRegistry, EventLogger, SimpleSwap } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("SimpleSwap", function () {
  let analyticsRegistry: AnalyticsRegistry;
  let eventLogger: EventLogger;
  let simpleSwap: SimpleSwap;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let dAppId: number;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy AnalyticsRegistry
    const AnalyticsRegistry = await ethers.getContractFactory("AnalyticsRegistry");
    analyticsRegistry = await AnalyticsRegistry.deploy();
    await analyticsRegistry.waitForDeployment();

    // Deploy EventLogger
    const EventLogger = await ethers.getContractFactory("EventLogger");
    eventLogger = await EventLogger.deploy(await analyticsRegistry.getAddress());
    await eventLogger.waitForDeployment();

    // Register dApp
    await analyticsRegistry.connect(owner).registerDApp("SimpleSwap", "DeFi", [owner.address]);
    dAppId = 1;

    // Deploy SimpleSwap
    const SimpleSwap = await ethers.getContractFactory("SimpleSwap");
    simpleSwap = await SimpleSwap.deploy(await eventLogger.getAddress(), dAppId);
    await simpleSwap.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct EventLogger address", async function () {
      expect(await simpleSwap.eventLogger()).to.equal(await eventLogger.getAddress());
    });

    it("Should set the correct dApp ID", async function () {
      expect(await simpleSwap.dAppId()).to.equal(dAppId);
    });

    it("Should start with zero reserves", async function () {
      const [reserveA, reserveB] = await simpleSwap.getReserves();
      expect(reserveA).to.equal(0);
      expect(reserveB).to.equal(0);
    });

    it("Should start with zero total liquidity", async function () {
      expect(await simpleSwap.totalLiquidity()).to.equal(0);
    });
  });

  describe("Add Liquidity", function () {
    it("Should add initial liquidity successfully", async function () {
      const amountA = 1000n;
      const amountB = 1000n;

      const tx = await simpleSwap.connect(user1).addLiquidity(amountA, amountB);
      await tx.wait();

      const [reserveA, reserveB] = await simpleSwap.getReserves();
      expect(reserveA).to.equal(amountA);
      expect(reserveB).to.equal(amountB);
    });

    it("Should emit LiquidityAdded event", async function () {
      const amountA = 1000n;
      const amountB = 1000n;

      await expect(simpleSwap.connect(user1).addLiquidity(amountA, amountB))
        .to.emit(simpleSwap, "LiquidityAdded");
    });

    it("Should calculate correct liquidity shares for first provider", async function () {
      const amountA = 1000n;
      const amountB = 2000n;

      await simpleSwap.connect(user1).addLiquidity(amountA, amountB);

      const shares = await simpleSwap.getLiquidityShares(user1.address);
      // sqrt(1000 * 2000) = sqrt(2000000) ≈ 1414
      expect(shares).to.be.gt(0);
    });

    it("Should maintain ratio for subsequent liquidity", async function () {
      // First provider
      await simpleSwap.connect(user1).addLiquidity(1000n, 2000n);

      // Second provider must maintain ratio
      await simpleSwap.connect(user2).addLiquidity(500n, 1000n);

      const [reserveA, reserveB] = await simpleSwap.getReserves();
      expect(reserveA).to.equal(1500n);
      expect(reserveB).to.equal(3000n);
    });

    it("Should fail with zero amount A", async function () {
      await expect(
        simpleSwap.addLiquidity(0, 1000)
      ).to.be.revertedWithCustomError(simpleSwap, "InvalidAmounts");
    });

    it("Should fail with zero amount B", async function () {
      await expect(
        simpleSwap.addLiquidity(1000, 0)
      ).to.be.revertedWithCustomError(simpleSwap, "InvalidAmounts");
    });

    it("Should log analytics event", async function () {
      await simpleSwap.connect(user1).addLiquidity(1000, 2000);

      expect(await eventLogger.getUserEventCount(user1.address)).to.be.gt(0);
    });
  });

  describe("Remove Liquidity", function () {
    beforeEach(async function () {
      await simpleSwap.connect(user1).addLiquidity(1000n, 2000n);
    });

    it("Should remove liquidity successfully", async function () {
      const shares = await simpleSwap.getLiquidityShares(user1.address);

      await simpleSwap.connect(user1).removeLiquidity(shares / 2n);

      const [reserveA, reserveB] = await simpleSwap.getReserves();
      expect(reserveA).to.equal(500n);
      expect(reserveB).to.equal(1000n);
    });

    it("Should emit LiquidityRemoved event", async function () {
      const shares = await simpleSwap.getLiquidityShares(user1.address);

      await expect(simpleSwap.connect(user1).removeLiquidity(shares))
        .to.emit(simpleSwap, "LiquidityRemoved");
    });

    it("Should fail with insufficient shares", async function () {
      const shares = await simpleSwap.getLiquidityShares(user1.address);

      await expect(
        simpleSwap.connect(user1).removeLiquidity(shares + 1n)
      ).to.be.revertedWithCustomError(simpleSwap, "InsufficientShares");
    });

    it("Should fail with zero liquidity", async function () {
      await expect(
        simpleSwap.connect(user2).removeLiquidity(1)
      ).to.be.revertedWithCustomError(simpleSwap, "InsufficientShares");
    });

    it("Should log analytics event", async function () {
      const shares = await simpleSwap.getLiquidityShares(user1.address);
      await simpleSwap.connect(user1).removeLiquidity(shares);

      expect(await eventLogger.getUserEventCount(user1.address)).to.be.gt(1);
    });
  });

  describe("Swap", function () {
    beforeEach(async function () {
      // Add initial liquidity: 10000 A and 5000 B (ratio 2:1)
      await simpleSwap.connect(user1).addLiquidity(10000n, 5000n);
    });

    it("Should swap A for B successfully", async function () {
      const amountIn = 1000n;
      const expectedOut = await simpleSwap.getAmountOut(amountIn, true);

      await simpleSwap.connect(user2).swap(true, amountIn, expectedOut);

      const [reserveA, reserveB] = await simpleSwap.getReserves();
      expect(reserveA).to.equal(11000n);
      expect(reserveB).to.be.lt(5000n);
    });

    it("Should swap B for A successfully", async function () {
      const amountIn = 500n;
      const expectedOut = await simpleSwap.getAmountOut(amountIn, false);

      await simpleSwap.connect(user2).swap(false, amountIn, expectedOut);

      const [reserveA, reserveB] = await simpleSwap.getReserves();
      expect(reserveB).to.equal(5500n);
      expect(reserveA).to.be.lt(10000n);
    });

    it("Should emit Swap event", async function () {
      const amountIn = 1000n;
      const expectedOut = await simpleSwap.getAmountOut(amountIn, true);

      await expect(simpleSwap.connect(user2).swap(true, amountIn, expectedOut))
        .to.emit(simpleSwap, "Swap");
    });

    it("Should fail with slippage protection", async function () {
      const amountIn = 1000n;
      const expectedOut = await simpleSwap.getAmountOut(amountIn, true);

      await expect(
        simpleSwap.connect(user2).swap(true, amountIn, expectedOut + 1n)
      ).to.be.revertedWithCustomError(simpleSwap, "SlippageExceeded");
    });

    it("Should fail with zero input amount", async function () {
      await expect(
        simpleSwap.swap(true, 0, 0)
      ).to.be.revertedWithCustomError(simpleSwap, "InsufficientAmount");
    });

    it("Should apply 0.3% fee", async function () {
      const amountIn = 1000n;
      const amountOut = await simpleSwap.getAmountOut(amountIn, true);

      // Without fee: ~476
      // With 0.3% fee: ~454
      expect(amountOut).to.be.lt(476n);
      expect(amountOut).to.be.gt(450n);
    });

    it("Should maintain constant product invariant (with fee)", async function () {
      const [reserveABefore, reserveBBefore] = await simpleSwap.getReserves();
      const kBefore = reserveABefore * reserveBBefore;

      const amountIn = 1000n;
      const expectedOut = await simpleSwap.getAmountOut(amountIn, true);
      await simpleSwap.connect(user2).swap(true, amountIn, expectedOut);

      const [reserveAAfter, reserveBAfter] = await simpleSwap.getReserves();
      const kAfter = reserveAAfter * reserveBAfter;

      // k should increase due to fees
      expect(kAfter).to.be.gte(kBefore);
    });

    it("Should log analytics event", async function () {
      const amountIn = 1000n;
      const expectedOut = await simpleSwap.getAmountOut(amountIn, true);

      await simpleSwap.connect(user2).swap(true, amountIn, expectedOut);

      expect(await eventLogger.getUserEventCount(user2.address)).to.be.gt(0);
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await simpleSwap.connect(user1).addLiquidity(10000n, 5000n);
    });

    it("Should calculate amount out correctly", async function () {
      const amountIn = 1000n;
      const amountOut = await simpleSwap.getAmountOut(amountIn, true);

      expect(amountOut).to.be.gt(0);
      expect(amountOut).to.be.lt(500n); // Should be less than simple ratio due to fee
    });

    it("Should return zero for zero reserves", async function () {
      const SimpleSwap = await ethers.getContractFactory("SimpleSwap");
      const emptySwap = await SimpleSwap.deploy(await eventLogger.getAddress(), dAppId);

      expect(await emptySwap.getAmountOut(1000, true)).to.equal(0);
    });

    it("Should calculate exchange rate", async function () {
      const rate = await simpleSwap.getExchangeRate();
      // Rate should be approximately 2 * 1e18 (10000/5000)
      expect(rate).to.be.closeTo(2n * 10n ** 18n, 10n ** 15n);
    });

    it("Should calculate price impact", async function () {
      const amountIn = 1000n;
      const impact = await simpleSwap.getPriceImpact(amountIn, true);

      // Price impact should be positive
      expect(impact).to.be.gt(0);

      // Large swaps should have higher impact
      const largeAmountIn = 5000n;
      const largeImpact = await simpleSwap.getPriceImpact(largeAmountIn, true);
      expect(largeImpact).to.be.gt(impact);
    });
  });
});
