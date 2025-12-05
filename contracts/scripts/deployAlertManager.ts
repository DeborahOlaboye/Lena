import { ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // Get the MetricsAggregator address
  const metricsAggregator = await deployments.get("MetricsAggregator");

  console.log("Deploying AlertManager...");
  const alertManager = await deploy("AlertManager", {
    from: deployer,
    args: [metricsAggregator.address],
    log: true,
    waitConfirmations: 1,
  });

  console.log(`AlertManager deployed at: ${alertManager.address}`);

  // Set the AlertManager in MetricsAggregator
  console.log("Configuring AlertManager in MetricsAggregator...");
  const metricsAggregatorContract = await ethers.getContractAt(
    "MetricsAggregator",
    metricsAggregator.address
  );
  
  const tx = await metricsAggregatorContract.setAlertManager(alertManager.address);
  await tx.wait();
  console.log("AlertManager configured in MetricsAggregator");
};

export default func;
func.tags = ["AlertManager"];
