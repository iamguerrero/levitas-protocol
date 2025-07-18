const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying MockUSDC with public faucet function...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  // Deploy MockUSDC with faucet
  console.log("\n📄 Deploying MockUSDC with faucet...");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy(deployer.address);
  await mockUSDC.waitForDeployment();
  const mockUSDCAddress = await mockUSDC.getAddress();
  console.log("✅ MockUSDC with faucet deployed to:", mockUSDCAddress);
  
  // Test the faucet function
  console.log("\n🧪 Testing faucet function...");
  const faucetTx = await mockUSDC.faucet();
  await faucetTx.wait();
  
  const balance = await mockUSDC.balanceOf(deployer.address);
  console.log("Balance after faucet:", ethers.formatUnits(balance, 6), "USDC");
  
  console.log("\n🎯 NEW MOCKUSDC ADDRESS:");
  console.log("MOCK_USDC_ADDRESS =", mockUSDCAddress);
  console.log("\nUsers can now call the 'faucet()' function to get 10,000 test USDC!");
}

main().catch(console.error);