const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying MockUSDC to Sepolia...");
  
  try {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);
    console.log("Balance:", ethers.formatEther(await deployer.getBalance()), "ETH");

    // Deploy MockUSDC
    console.log("\n1. Deploying MockUSDC...");
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUSDC = await MockUSDC.deploy(deployer.address);
    await mockUSDC.waitForDeployment();
    const mockUSDCAddress = await mockUSDC.getAddress();
    console.log("✅ MockUSDC deployed to:", mockUSDCAddress);

    // Test faucet
    console.log("\n2. Testing faucet...");
    const faucetTx = await mockUSDC.faucet();
    await faucetTx.wait();
    console.log("✅ Faucet works!");

    // Check balance
    const balance = await mockUSDC.balanceOf(deployer.address);
    console.log("✅ Balance after faucet:", ethers.formatUnits(balance, 6), "USDC");

    console.log("\n🎉 MockUSDC deployment successful!");
    console.log("Address:", mockUSDCAddress);

  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    throw error;
  }
}

main()
  .then(() => {
    console.log("Script completed successfully");
    process.exit(0);
  })
  .catch(error => {
    console.error("Script failed:", error);
    process.exit(1);
  }); 