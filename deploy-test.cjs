const { ethers } = require("hardhat");

async function main() {
  console.log("Testing Sepolia deployment...");
  
  try {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);
    console.log("Balance:", ethers.formatEther(await deployer.getBalance()), "ETH");

    // Deploy MockUSDC
    console.log("Deploying MockUSDC...");
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUSDC = await MockUSDC.deploy(deployer.address);
    await mockUSDC.waitForDeployment();
    const mockUSDCAddress = await mockUSDC.getAddress();
    console.log("✅ MockUSDC deployed to:", mockUSDCAddress);

    // Test faucet
    console.log("Testing faucet...");
    const faucetTx = await mockUSDC.faucet();
    await faucetTx.wait();
    console.log("✅ Faucet works!");

    console.log("\n🎉 SUCCESS! MockUSDC is working on Sepolia!");
    console.log("Address:", mockUSDCAddress);
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  }); 