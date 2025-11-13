import { expect } from "chai";
import { ethers } from "hardhat";
import { AnalyticsRegistry } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("AnalyticsRegistry", function () {
  let analyticsRegistry: AnalyticsRegistry;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const AnalyticsRegistry = await ethers.getContractFactory("AnalyticsRegistry");
    analyticsRegistry = await AnalyticsRegistry.deploy();
    await analyticsRegistry.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await analyticsRegistry.owner()).to.equal(owner.address);
    });

    it("Should start with zero dApps", async function () {
      expect(await analyticsRegistry.getTotalDApps()).to.equal(0);
    });
  });

  describe("Register dApp", function () {
    it("Should register a dApp successfully", async function () {
      const name = "Test DApp";
      const category = "DeFi";
      const contractAddresses = [user1.address, user2.address];

      const tx = await analyticsRegistry.connect(user1).registerDApp(name, category, contractAddresses);
      await tx.wait();

      const dAppId = 1;
      const dAppInfo = await analyticsRegistry.getDAppInfo(dAppId);

      expect(dAppInfo.owner).to.equal(user1.address);
      expect(dAppInfo.name).to.equal(name);
      expect(dAppInfo.category).to.equal(category);
      expect(dAppInfo.contractAddresses).to.deep.equal(contractAddresses);
      expect(dAppInfo.isActive).to.be.true;
    });

    it("Should emit DAppRegistered event", async function () {
      const name = "Test DApp";
      const category = "DeFi";
      const contractAddresses = [user1.address];

      await expect(analyticsRegistry.connect(user1).registerDApp(name, category, contractAddresses))
        .to.emit(analyticsRegistry, "DAppRegistered")
        .withArgs(1, user1.address, name, category, await ethers.provider.getBlock("latest").then(b => b!.timestamp + 1));
    });

    it("Should fail with invalid name (too short)", async function () {
      await expect(
        analyticsRegistry.registerDApp("ab", "DeFi", [user1.address])
      ).to.be.revertedWithCustomError(analyticsRegistry, "InvalidName");
    });

    it("Should fail with invalid name (too long)", async function () {
      const longName = "a".repeat(51);
      await expect(
        analyticsRegistry.registerDApp(longName, "DeFi", [user1.address])
      ).to.be.revertedWithCustomError(analyticsRegistry, "InvalidName");
    });

    it("Should fail with empty category", async function () {
      await expect(
        analyticsRegistry.registerDApp("Test DApp", "", [user1.address])
      ).to.be.revertedWithCustomError(analyticsRegistry, "InvalidCategory");
    });

    it("Should fail with no contract addresses", async function () {
      await expect(
        analyticsRegistry.registerDApp("Test DApp", "DeFi", [])
      ).to.be.revertedWithCustomError(analyticsRegistry, "NoContractAddresses");
    });

    it("Should fail with too many contract addresses", async function () {
      const addresses = Array(11).fill(user1.address);
      await expect(
        analyticsRegistry.registerDApp("Test DApp", "DeFi", addresses)
      ).to.be.revertedWithCustomError(analyticsRegistry, "NoContractAddresses");
    });

    it("Should increment dApp count", async function () {
      await analyticsRegistry.registerDApp("DApp 1", "DeFi", [user1.address]);
      expect(await analyticsRegistry.getTotalDApps()).to.equal(1);

      await analyticsRegistry.registerDApp("DApp 2", "NFT", [user2.address]);
      expect(await analyticsRegistry.getTotalDApps()).to.equal(2);
    });

    it("Should track dApps by owner", async function () {
      await analyticsRegistry.connect(user1).registerDApp("DApp 1", "DeFi", [user1.address]);
      await analyticsRegistry.connect(user1).registerDApp("DApp 2", "NFT", [user1.address]);
      await analyticsRegistry.connect(user2).registerDApp("DApp 3", "Gaming", [user2.address]);

      const user1DApps = await analyticsRegistry.getDAppsByOwner(user1.address);
      const user2DApps = await analyticsRegistry.getDAppsByOwner(user2.address);

      expect(user1DApps.length).to.equal(2);
      expect(user2DApps.length).to.equal(1);
      expect(user1DApps[0]).to.equal(1);
      expect(user1DApps[1]).to.equal(2);
      expect(user2DApps[0]).to.equal(3);
    });
  });

  describe("Update dApp", function () {
    beforeEach(async function () {
      await analyticsRegistry.connect(user1).registerDApp("Original DApp", "DeFi", [user1.address]);
    });

    it("Should update dApp info successfully", async function () {
      const newName = "Updated DApp";
      const newCategory = "NFT";
      const newAddresses = [user2.address];

      await analyticsRegistry.connect(user1).updateDApp(1, newName, newCategory, newAddresses);

      const dAppInfo = await analyticsRegistry.getDAppInfo(1);
      expect(dAppInfo.name).to.equal(newName);
      expect(dAppInfo.category).to.equal(newCategory);
      expect(dAppInfo.contractAddresses).to.deep.equal(newAddresses);
    });

    it("Should emit DAppUpdated event", async function () {
      await expect(analyticsRegistry.connect(user1).updateDApp(1, "New Name", "Gaming", [user2.address]))
        .to.emit(analyticsRegistry, "DAppUpdated")
        .withArgs(1, "New Name", "Gaming", await ethers.provider.getBlock("latest").then(b => b!.timestamp + 1));
    });

    it("Should fail if not owner", async function () {
      await expect(
        analyticsRegistry.connect(user2).updateDApp(1, "New Name", "Gaming", [user2.address])
      ).to.be.revertedWithCustomError(analyticsRegistry, "UnauthorizedAccess");
    });

    it("Should fail for non-existent dApp", async function () {
      await expect(
        analyticsRegistry.connect(user1).updateDApp(999, "Name", "Category", [user1.address])
      ).to.be.revertedWithCustomError(analyticsRegistry, "DAppNotFound");
    });
  });

  describe("Deactivate dApp", function () {
    beforeEach(async function () {
      await analyticsRegistry.connect(user1).registerDApp("Test DApp", "DeFi", [user1.address]);
    });

    it("Should deactivate dApp successfully", async function () {
      await analyticsRegistry.connect(user1).deactivateDApp(1);

      const dAppInfo = await analyticsRegistry.getDAppInfo(1);
      expect(dAppInfo.isActive).to.be.false;
    });

    it("Should emit DAppDeactivated event", async function () {
      await expect(analyticsRegistry.connect(user1).deactivateDApp(1))
        .to.emit(analyticsRegistry, "DAppDeactivated")
        .withArgs(1, await ethers.provider.getBlock("latest").then(b => b!.timestamp + 1));
    });

    it("Should fail if not owner", async function () {
      await expect(
        analyticsRegistry.connect(user2).deactivateDApp(1)
      ).to.be.revertedWithCustomError(analyticsRegistry, "UnauthorizedAccess");
    });

    it("Should not be registered after deactivation", async function () {
      await analyticsRegistry.connect(user1).deactivateDApp(1);
      expect(await analyticsRegistry.isDAppRegistered(1)).to.be.false;
    });
  });

  describe("Query functions", function () {
    beforeEach(async function () {
      await analyticsRegistry.connect(user1).registerDApp("DApp 1", "DeFi", [user1.address]);
      await analyticsRegistry.connect(user2).registerDApp("DApp 2", "NFT", [user2.address]);
    });

    it("Should get all registered dApps", async function () {
      const allDApps = await analyticsRegistry.getAllRegisteredDApps();
      expect(allDApps.length).to.equal(2);
      expect(allDApps[0]).to.equal(1);
      expect(allDApps[1]).to.equal(2);
    });

    it("Should check if dApp is registered", async function () {
      expect(await analyticsRegistry.isDAppRegistered(1)).to.be.true;
      expect(await analyticsRegistry.isDAppRegistered(999)).to.be.false;
    });

    it("Should check if address is dApp owner", async function () {
      expect(await analyticsRegistry.isDAppOwner(user1.address, 1)).to.be.true;
      expect(await analyticsRegistry.isDAppOwner(user2.address, 1)).to.be.false;
      expect(await analyticsRegistry.isDAppOwner(user1.address, 2)).to.be.false;
    });

    it("Should return false for non-existent dApp ownership", async function () {
      expect(await analyticsRegistry.isDAppOwner(user1.address, 999)).to.be.false;
    });
  });
});
