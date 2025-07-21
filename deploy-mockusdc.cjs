const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying MockUSDC to Sepolia with account:", deployer.address);

  // Deploy MockUSDC
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy(deployer.address);
  await mockUSDC.waitForDeployment();
  const mockUSDCAddress = await mockUSDC.getAddress();
  
  console.log("✅ MockUSDC deployed to:", mockUSDCAddress);
  
  // Test the faucet
  const faucetTx = await mockUSDC.faucet();
  await faucetTx.wait();
  console.log("✅ Faucet tested successfully");
  
  console.log("\n=== MOCKUSDC DEPLOYMENT SUCCESSFUL ===");
  console.log("Address:", mockUSDCAddress);
  console.log("\nYou can now update the web3.ts file with this address.");
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("❌ Deployment failed:", error.message);
    process.exit(1);
  }); 