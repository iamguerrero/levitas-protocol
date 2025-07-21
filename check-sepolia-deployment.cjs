const { ethers } = require("hardhat");

async function main() {
  console.log("Checking Sepolia deployment status...");
  
  // Try to deploy a simple contract to see if we can connect
  try {
    const [deployer] = await ethers.getSigners();
    console.log("Connected with account:", deployer.address);
    
    // Deploy a simple MockUSDC to test
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUSDC = await MockUSDC.deploy(deployer.address);
    await mockUSDC.waitForDeployment();
    const mockUSDCAddress = await mockUSDC.getAddress();
    console.log("✅ MockUSDC deployed to:", mockUSDCAddress);
    
    // Test the faucet
    const faucetTx = await mockUSDC.faucet();
    await faucetTx.wait();
    console.log("✅ Faucet tested successfully");
    
    console.log("\n=== SEPOLIA DEPLOYMENT SUCCESSFUL ===");
    console.log("MockUSDC Address:", mockUSDCAddress);
    console.log("\nTo complete the deployment, run the full deployment script:");
    console.log("npx hardhat run deploy-sepolia.cjs --network sepolia");
    
  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  }); 