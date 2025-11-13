import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("Starting deployment to Somnia network...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "STT\n");

  // Get network information
  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name);
  console.log("Chain ID:", network.chainId.toString(), "\n");

  const deployments: any = {
    network: network.name,
    chainId: network.chainId.toString(),
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    contracts: {},
  };

  try {
    // 1. Deploy AnalyticsRegistry
    console.log("1. Deploying AnalyticsRegistry...");
    const AnalyticsRegistry = await ethers.getContractFactory("AnalyticsRegistry");
    const analyticsRegistry = await AnalyticsRegistry.deploy();
    await analyticsRegistry.waitForDeployment();
    const registryAddress = await analyticsRegistry.getAddress();
    console.log("✓ AnalyticsRegistry deployed to:", registryAddress);
    console.log("  Transaction hash:", analyticsRegistry.deploymentTransaction()?.hash, "\n");

    deployments.contracts.AnalyticsRegistry = {
      address: registryAddress,
      txHash: analyticsRegistry.deploymentTransaction()?.hash,
    };

    // 2. Deploy EventLogger
    console.log("2. Deploying EventLogger...");
    const EventLogger = await ethers.getContractFactory("EventLogger");
    const eventLogger = await EventLogger.deploy(registryAddress);
    await eventLogger.waitForDeployment();
    const eventLoggerAddress = await eventLogger.getAddress();
    console.log("✓ EventLogger deployed to:", eventLoggerAddress);
    console.log("  Transaction hash:", eventLogger.deploymentTransaction()?.hash, "\n");

    deployments.contracts.EventLogger = {
      address: eventLoggerAddress,
      txHash: eventLogger.deploymentTransaction()?.hash,
    };

    // 3. Deploy SessionManager
    console.log("3. Deploying SessionManager...");
    const SessionManager = await ethers.getContractFactory("SessionManager");
    const sessionManager = await SessionManager.deploy(registryAddress);
    await sessionManager.waitForDeployment();
    const sessionManagerAddress = await sessionManager.getAddress();
    console.log("✓ SessionManager deployed to:", sessionManagerAddress);
    console.log("  Transaction hash:", sessionManager.deploymentTransaction()?.hash, "\n");

    deployments.contracts.SessionManager = {
      address: sessionManagerAddress,
      txHash: sessionManager.deploymentTransaction()?.hash,
    };

    // 4. Deploy MetricsAggregator
    console.log("4. Deploying MetricsAggregator...");
    const MetricsAggregator = await ethers.getContractFactory("MetricsAggregator");
    const metricsAggregator = await MetricsAggregator.deploy(registryAddress);
    await metricsAggregator.waitForDeployment();
    const metricsAggregatorAddress = await metricsAggregator.getAddress();
    console.log("✓ MetricsAggregator deployed to:", metricsAggregatorAddress);
    console.log("  Transaction hash:", metricsAggregator.deploymentTransaction()?.hash, "\n");

    deployments.contracts.MetricsAggregator = {
      address: metricsAggregatorAddress,
      txHash: metricsAggregator.deploymentTransaction()?.hash,
    };

    // 5. Deploy SimpleSwap
    console.log("5. Deploying SimpleSwap...");
    const SimpleSwap = await ethers.getContractFactory("SimpleSwap");

    // First, we need to register the dApp to get a dAppId
    console.log("  Registering SimpleSwap dApp in AnalyticsRegistry...");
    const registerTx = await analyticsRegistry.registerDApp(
      "SimpleSwap Demo DEX",
      "DeFi",
      [deployer.address] // Temporary address, will update after deployment
    );
    const registerReceipt = await registerTx.wait();

    // Extract dAppId from event
    const dAppId = 1; // First dApp will have ID 1
    console.log("  ✓ SimpleSwap dApp registered with ID:", dAppId, "\n");

    const simpleSwap = await SimpleSwap.deploy(eventLoggerAddress, dAppId);
    await simpleSwap.waitForDeployment();
    const simpleSwapAddress = await simpleSwap.getAddress();
    console.log("✓ SimpleSwap deployed to:", simpleSwapAddress);
    console.log("  Transaction hash:", simpleSwap.deploymentTransaction()?.hash, "\n");

    deployments.contracts.SimpleSwap = {
      address: simpleSwapAddress,
      txHash: simpleSwap.deploymentTransaction()?.hash,
      dAppId: dAppId,
    };

    // 6. Update dApp registration with actual SimpleSwap address
    console.log("6. Updating SimpleSwap dApp registration with contract address...");
    const updateTx = await analyticsRegistry.updateDApp(
      dAppId,
      "SimpleSwap Demo DEX",
      "DeFi",
      [simpleSwapAddress]
    );
    await updateTx.wait();
    console.log("✓ SimpleSwap dApp updated in registry\n");

    // Save deployment information to file
    const deploymentsDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const filename = `deployment-${network.chainId}-${Date.now()}.json`;
    const filepath = path.join(deploymentsDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(deployments, null, 2));

    // Also save as latest deployment
    const latestPath = path.join(deploymentsDir, `deployment-${network.chainId}-latest.json`);
    fs.writeFileSync(latestPath, JSON.stringify(deployments, null, 2));

    console.log("=".repeat(70));
    console.log("DEPLOYMENT COMPLETE");
    console.log("=".repeat(70));
    console.log("\nDeployment information saved to:");
    console.log(" -", filepath);
    console.log(" -", latestPath);
    console.log("\n📋 Contract Addresses:");
    console.log("  AnalyticsRegistry:", registryAddress);
    console.log("  EventLogger:      ", eventLoggerAddress);
    console.log("  SessionManager:   ", sessionManagerAddress);
    console.log("  MetricsAggregator:", metricsAggregatorAddress);
    console.log("  SimpleSwap:       ", simpleSwapAddress);
    console.log("\n🎯 SimpleSwap dApp ID:", dAppId);

    if (network.chainId === 50311n) {
      console.log("\n🔍 Verify contracts on Somnia Explorer:");
      console.log("  https://explorer-test.somnia.network/address/" + registryAddress);
      console.log("  https://explorer-test.somnia.network/address/" + eventLoggerAddress);
      console.log("  https://explorer-test.somnia.network/address/" + sessionManagerAddress);
      console.log("  https://explorer-test.somnia.network/address/" + metricsAggregatorAddress);
      console.log("  https://explorer-test.somnia.network/address/" + simpleSwapAddress);
    }

    console.log("\n✅ All contracts deployed successfully!");
    console.log("=".repeat(70), "\n");
  } catch (error) {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  }
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
