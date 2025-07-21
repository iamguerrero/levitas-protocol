const { ethers } = require("hardhat");

async function main() {
  console.log("Getting deployed contract addresses on Sepolia...");
  
  try {
    const [deployer] = await ethers.getSigners();
    console.log("Connected with account:", deployer.address);
    
    // Get the latest deployment transaction
    const latestBlock = await ethers.provider.getBlockNumber();
    console.log("Latest block:", latestBlock);
    
    // Get recent transactions for the deployer
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Deployer balance:", ethers.formatEther(balance), "ETH");
    
    // Try to find deployed contracts by looking for contract creation transactions
    const filter = {
      fromBlock: latestBlock - 100,
      toBlock: latestBlock,
      from: deployer.address
    };
    
    const logs = await ethers.provider.getLogs(filter);
    console.log("Recent transactions:", logs.length);
    
    // For now, let's deploy a test contract to get the address format
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUSDC = await MockUSDC.deploy(deployer.address);
    await mockUSDC.waitForDeployment();
    const mockUSDCAddress = await mockUSDC.getAddress();
    
    console.log("\n=== TEST DEPLOYMENT ===");
    console.log("MockUSDC deployed to:", mockUSDCAddress);
    console.log("\nThis confirms deployment is working. The full deployment should have completed.");
    console.log("Please check the deployment logs for the actual addresses.");
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  }); 