const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("🚀 Deploying MockUSDC to Sepolia...");
  
  try {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);
    console.log("Balance:", ethers.formatEther(await deployer.getBalance()), "ETH");

    // Deploy MockUSDC
    console.log("Deploying MockUSDC...");
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUSDC = await MockUSDC.deploy(deployer.address);
    console.log("Transaction sent, waiting for deployment...");
    await mockUSDC.waitForDeployment();
    const mockUSDCAddress = await mockUSDC.getAddress();
    console.log("✅ MockUSDC deployed to:", mockUSDCAddress);

    // Test faucet
    console.log("Testing faucet...");
    const faucetTx = await mockUSDC.faucet();
    await faucetTx.wait();
    console.log("✅ Faucet works!");

    // Save address
    const addresses = {
      mockUsdc: mockUSDCAddress
    };
    
    fs.writeFileSync('mockusdc-address.json', JSON.stringify(addresses, null, 2));
    console.log("Address saved to: mockusdc-address.json");
    console.log("MockUSDC Address:", mockUSDCAddress);

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