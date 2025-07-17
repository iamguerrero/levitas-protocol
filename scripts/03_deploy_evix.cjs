const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying EVIX with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  const EVIX = await ethers.getContractFactory("EVIXToken");
  const evix = await EVIX.deploy(deployer.address);
  await evix.waitForDeployment();

  const evixAddress = await evix.getAddress();
  console.log("EVIX deployed to:", evixAddress);
  console.log("EVIX owner:", await evix.owner());

  // Log deployment details for README
  console.log("\n--- For README ---");
  console.log(`| EVIX Token | ${evixAddress} | ERC20 token for Ethereum volatility |`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});