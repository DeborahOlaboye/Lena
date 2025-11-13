import { expect } from "chai";
import { ethers } from "hardhat";
import { AnalyticsRegistry, EventLogger } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("EventLogger", function () {
  let analyticsRegistry: AnalyticsRegistry;
  let eventLogger: EventLogger;
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

    // Register a test dApp
    await analyticsRegistry.connect(user1).registerDApp("Test DApp", "DeFi", [user1.address]);
    dAppId = 1;
  });

  describe("Deployment", function () {
    it("Should set the correct registry address", async function () {
      expect(await eventLogger.registry()).to.equal(await analyticsRegistry.getAddress());
    });

    it("Should start with zero events", async function () {
      expect(await eventLogger.getTotalEvents()).to.equal(0);
    });
  });

  describe("Log Event", function () {
    it("Should log an event successfully", async function () {
      const eventType = "button_click";
      const eventData = '{"button": "submit", "page": "home"}';

      const tx = await eventLogger.connect(user1).logEvent(dAppId, user1.address, eventType, eventData);
      await tx.wait();

      const event = await eventLogger["getEvent(uint256)"](1);
      expect(event.eventId).to.equal(1);
      expect(event.dAppId).to.equal(dAppId);
      expect(event.user).to.equal(user1.address);
      expect(event.eventType).to.equal(eventType);
      expect(event.eventData).to.equal(eventData);
    });

    it("Should emit EventLogged event", async function () {
      await expect(eventLogger.logEvent(dAppId, user1.address, "click", "{}"))
        .to.emit(eventLogger, "EventLogged")
        .withArgs(1, dAppId, user1.address, "click", await ethers.provider.getBlock("latest").then(b => b!.timestamp + 1));
    });

    it("Should fail for unregistered dApp", async function () {
      await expect(
        eventLogger.logEvent(999, user1.address, "click", "{}")
      ).to.be.revertedWithCustomError(eventLogger, "DAppNotRegistered");
    });

    it("Should fail with empty event type", async function () {
      await expect(
        eventLogger.logEvent(dAppId, user1.address, "", "{}")
      ).to.be.revertedWithCustomError(eventLogger, "InvalidEventType");
    });

    it("Should increment event count", async function () {
      await eventLogger.logEvent(dAppId, user1.address, "event1", "{}");
      expect(await eventLogger.getTotalEvents()).to.equal(1);

      await eventLogger.logEvent(dAppId, user2.address, "event2", "{}");
      expect(await eventLogger.getTotalEvents()).to.equal(2);
    });

    it("Should track events by dApp", async function () {
      await eventLogger.logEvent(dAppId, user1.address, "event1", "{}");
      await eventLogger.logEvent(dAppId, user2.address, "event2", "{}");

      expect(await eventLogger.getDAppEventCount(dAppId)).to.equal(2);
    });

    it("Should track events by user", async function () {
      await eventLogger.logEvent(dAppId, user1.address, "event1", "{}");
      await eventLogger.logEvent(dAppId, user1.address, "event2", "{}");
      await eventLogger.logEvent(dAppId, user2.address, "event3", "{}");

      expect(await eventLogger.getUserEventCount(user1.address)).to.equal(2);
      expect(await eventLogger.getUserEventCount(user2.address)).to.equal(1);
    });
  });

  describe("Log Transaction", function () {
    it("Should log a transaction successfully", async function () {
      const txHash = ethers.keccak256(ethers.toUtf8Bytes("test_tx"));
      const eventData = '{"value": "1000", "status": "success"}';

      await expect(eventLogger.logTransaction(dAppId, user1.address, txHash, eventData))
        .to.emit(eventLogger, "TransactionLogged")
        .withArgs(1, dAppId, user1.address, txHash, await ethers.provider.getBlock("latest").then(b => b!.timestamp + 1));

      const event = await eventLogger["getEvent(uint256)"](1);
      expect(event.eventType).to.equal("transaction");
    });
  });

  describe("Log User Action", function () {
    it("Should log a user action successfully", async function () {
      const action = "Swap Tokens";
      const eventData = '{"tokenA": "ETH", "tokenB": "USDT", "amount": "100"}';

      await expect(eventLogger.logUserAction(dAppId, user1.address, action, eventData))
        .to.emit(eventLogger, "UserActionLogged")
        .withArgs(1, dAppId, user1.address, action, await ethers.provider.getBlock("latest").then(b => b!.timestamp + 1));

      const event = await eventLogger["getEvent(uint256)"](1);
      expect(event.eventType).to.equal("user_action");
    });
  });

  describe("Batch Log Events", function () {
    it("Should batch log events successfully", async function () {
      const users = [user1.address, user2.address, user1.address];
      const eventTypes = ["click", "view", "submit"];
      const eventDataArray = ['{"btn": "1"}', '{"page": "2"}', '{"form": "3"}'];

      const tx = await eventLogger.batchLogEvents(dAppId, users, eventTypes, eventDataArray);
      await tx.wait();

      expect(await eventLogger.getTotalEvents()).to.equal(3);
      expect(await eventLogger.getDAppEventCount(dAppId)).to.equal(3);
    });

    it("Should emit BatchEventsLogged event", async function () {
      const users = [user1.address, user2.address];
      const eventTypes = ["click", "view"];
      const eventDataArray = ['{}', '{}'];

      await expect(eventLogger.batchLogEvents(dAppId, users, eventTypes, eventDataArray))
        .to.emit(eventLogger, "BatchEventsLogged")
        .withArgs(dAppId, 2, await ethers.provider.getBlock("latest").then(b => b!.timestamp + 1));
    });

    it("Should fail for unregistered dApp", async function () {
      await expect(
        eventLogger.batchLogEvents(999, [user1.address], ["click"], ["{}"])
      ).to.be.revertedWithCustomError(eventLogger, "DAppNotRegistered");
    });

    it("Should fail with mismatched array lengths", async function () {
      await expect(
        eventLogger.batchLogEvents(dAppId, [user1.address], ["click", "view"], ["{}"])
      ).to.be.revertedWithCustomError(eventLogger, "NoEventsToLog");
    });

    it("Should fail with empty arrays", async function () {
      await expect(
        eventLogger.batchLogEvents(dAppId, [], [], [])
      ).to.be.revertedWithCustomError(eventLogger, "NoEventsToLog");
    });
  });

  describe("Query Functions", function () {
    beforeEach(async function () {
      // Log multiple events
      await eventLogger.logEvent(dAppId, user1.address, "event1", "{}");
      await eventLogger.logEvent(dAppId, user2.address, "event2", "{}");
      await eventLogger.logEvent(dAppId, user1.address, "event3", "{}");
    });

    it("Should get events by dApp", async function () {
      const events = await eventLogger.getEventsByDApp(dAppId, 0);
      expect(events.length).to.equal(3);
    });

    it("Should get events by dApp with limit", async function () {
      const events = await eventLogger.getEventsByDApp(dAppId, 2);
      expect(events.length).to.equal(2);
      expect(events[0]).to.equal(2); // Most recent
      expect(events[1]).to.equal(3);
    });

    it("Should get events by user", async function () {
      const events = await eventLogger.getEventsByUser(user1.address, 0);
      expect(events.length).to.equal(2);
    });

    it("Should get events by user with limit", async function () {
      const events = await eventLogger.getEventsByUser(user1.address, 1);
      expect(events.length).to.equal(1);
      expect(events[0]).to.equal(3); // Most recent
    });

    it("Should get multiple events by IDs", async function () {
      const events = await eventLogger.getEvents([1, 3]);
      expect(events.length).to.equal(2);
      expect(events[0].eventId).to.equal(1);
      expect(events[1].eventId).to.equal(3);
    });
  });
});
