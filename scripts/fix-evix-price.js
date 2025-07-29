const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 Fixing EVIX Oracle Price...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);
  
  const EVIX_ORACLE_ADDRESS = '0xBd6E9809B9608eCAc3610cA65327735CC3c08104';
  
  // Connect to EVIX Oracle
  const evixOracle = await ethers.getContractAt("EVIXOracle", EVIX_ORACLE_ADDRESS);
  
  // Check current price
  const currentPrice = await evixOracle.getPrice();
  console.log("Current EVIX price:", ethers.formatUnits(currentPrice, 8));
  
  // Set correct price: $37.98 with 8 decimals
  const correctPrice = ethers.parseUnits("37.98", 8);
  console.log("Setting EVIX price to:", ethers.formatUnits(correctPrice, 8));
  
  try {
    const tx = await evixOracle.updatePrice(correctPrice);
    await tx.wait();
    
    console.log("✅ EVIX price updated successfully!");
    
    // Verify
    const newPrice = await evixOracle.getPrice();
    console.log("New EVIX price:", ethers.formatUnits(newPrice, 8));
    
  } catch (error) {
    console.error("❌ Error updating EVIX price:", error.message);
    
    // Check ownership
    const owner = await evixOracle.owner();
    console.log("EVIX Oracle owner:", owner);
    console.log("Our address:", deployer.address);
    
    if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
      console.log("⚠️  You don't own this oracle. Owner needs to run this script.");
    }
  }
}

main().catch((error) => {
  console.error("💥 Error:", error);
  process.exitCode = 1;
}); 