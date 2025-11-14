const { ethers } = require("hardhat");

async function main() {
  const eventLoggerAddress = "0xd23329263c344a1d1AFC3140E2F5d1F0AA5d60D9";
  const metricsAggregatorAddress = "0x23cDAec75B1C3E5d26db4675EcB3c9042a780A0E";

  const EventLogger = await ethers.getContractAt("EventLogger", eventLoggerAddress);
  const MetricsAggregator = await ethers.getContractAt("MetricsAggregator", metricsAggregatorAddress);

  console.log("Checking analytics data...\n");

  try {
    const events = await EventLogger.getEventsByDApp(1, 50);
    console.log("Events for dAppId 1:", events.length);

    if (events.length > 0) {
      console.log("\nLatest events:");
      for (let i = 0; i < Math.min(5, events.length); i++) {
        const event = events[i];
        console.log("- Event", event.eventId.toString() + ":", event.eventType, "by", event.user);
      }
    } else {
      console.log("No events found. You need to perform transactions first.");
    }
  } catch (error) {
    console.error("Error fetching events:", error.message);
  }

  try {
    const metrics = await MetricsAggregator.getCurrentMetrics();
    console.log("\nCurrent Metrics:");
    console.log("- Active Users:", metrics.activeUsers.toString());
    console.log("- Total Transactions:", metrics.totalTransactions.toString());
    console.log("- Successful Transactions:", metrics.successfulTransactions.toString());
    console.log("- Failed Transactions:", metrics.failedTransactions.toString());
    console.log("- Total Gas Used:", metrics.totalGasUsed.toString());
    console.log("- Unique Users:", metrics.uniqueUsers.toString());

    if (metrics.totalTransactions.toString() === "0") {
      console.log("\nNo transactions recorded yet!");
    }
  } catch (error) {
    console.error("Error fetching metrics:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
