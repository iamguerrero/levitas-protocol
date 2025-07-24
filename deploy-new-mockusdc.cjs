const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying new MockUSDC...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy(deployer.address);
  await mockUSDC.waitForDeployment();
  const mockUSDCAddress = await mockUSDC.getAddress();
  console.log("✅ New MockUSDC deployed to:", mockUSDCAddress);

  // Test faucet
  console.log("\n🧪 Testing faucet...");
  const faucetTx = await mockUSDC.faucet();
  await faucetTx.wait();
  console.log("✅ Faucet successful");

  const balance = await mockUSDC.balanceOf(deployer.address);
  console.log("Balance after faucet:", ethers.formatUnits(balance, 6));

  // Save address
  const fs = require('fs');
  fs.writeFileSync('new-mockusdc-address.json', JSON.stringify({ mockUsdc: mockUSDCAddress }, null, 2));
  console.log("Address saved to new-mockusdc-address.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 