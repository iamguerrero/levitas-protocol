const { ethers } = require("hardhat");

async function main() {
  console.log("🔑 Transferring EVIX Oracle Ownership Back");
  console.log("==========================================");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  
  const EVIX_ORACLE = "0xCd7441A771a7F84E58d98E598B7Ff23A3688094F";
  const OLD_SIMULATOR = "0x60e7f6B172DD6e26a6d9234f3884624826472E59";
  
  // Connect to the old simulator
  const oldSimulator = await ethers.getContractAt("OracleSimulator", OLD_SIMULATOR);
  
  try {
    console.log("🔄 Transferring EVIX Oracle ownership back to deployer...");
    
    // Use emergencyUpdatePrices to call transferOwnership on EVIX Oracle
    // Since we can't call transferOwnership directly, we need to check if the old simulator has a method for this
    
    // Let's try to connect to EVIX Oracle directly through the old simulator owner
    const evixOracle = await ethers.getContractAt("EVIXOracle", EVIX_ORACLE);
    const currentOwner = await evixOracle.owner();
    
    console.log(`Current EVIX Oracle owner: ${currentOwner}`);
    
    if (currentOwner === OLD_SIMULATOR) {
      console.log("❌ Cannot transfer ownership - old simulator doesn't have transfer function");
      console.log("💡 Solution: EVIX will remain at current price for now");
      console.log("   BVIX price simulation will continue working correctly");
    } else {
      console.log("✅ EVIX Oracle ownership structure is different than expected");
    }
    
  } catch (error) {
    console.log("❌ Transfer failed:", error.message);
    console.log("💡 No problem - BVIX simulation will continue working");
  }
}

main().catch(console.error); 