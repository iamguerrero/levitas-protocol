const { ethers } = require("hardhat");

/**
 * Fix OracleSimulator to use correct EVIX oracle address
 */

// Correct oracle addresses
const BVIX_ORACLE_ADDRESS = "0x85485dD6cFaF5220150c413309C61a8EA24d24FE";
const EVIX_ORACLE_ADDRESS = "0xBd6E9809B9608eCAc3610cA65327735CC3c08104"; // Correct address

async function main() {
  console.log("🔧 Fixing OracleSimulator...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);
  
  try {
    // Deploy a new OracleSimulator with correct addresses
    console.log("\n📝 Deploying new OracleSimulator with correct addresses...");
    
    const OracleSimulator = await ethers.getContractFactory("OracleSimulator");
    const simulator = await OracleSimulator.deploy(
      BVIX_ORACLE_ADDRESS,
      EVIX_ORACLE_ADDRESS,
      deployer.address
    );
    
    await simulator.waitForDeployment();
    const simulatorAddress = await simulator.getAddress();
    
    console.log("✅ New OracleSimulator deployed at:", simulatorAddress);
    
    // Save the new address
    const fs = require('fs');
    const path = require('path');
    const addressFile = path.join(__dirname, '..', 'oracle-simulator-address.txt');
    fs.writeFileSync(addressFile, simulatorAddress);
    console.log("📁 New simulator address saved to:", addressFile);
    
    // Test the new simulator
    console.log("\n🧪 Testing new simulator...");
    const status = await simulator.getSimulationStatus();
    const bvixPrice = Number(ethers.formatUnits(status.bvixPrice, 8));
    const evixPrice = Number(ethers.formatUnits(status.evixPrice, 8));
    
    console.log("✅ BVIX Price:", bvixPrice);
    console.log("✅ EVIX Price:", evixPrice);
    
    if (evixPrice > 1000) {
      console.log("❌ EVIX price still seems wrong");
    } else {
      console.log("✅ EVIX price looks correct!");
    }
    
    console.log("\n🎬 Starting simulation...");
    await simulator.startSimulation();
    console.log("✅ Simulation started!");
    
    console.log("\n🔄 Testing price update...");
    await simulator.updatePrices();
    console.log("✅ Price update successful!");
    
    const newStatus = await simulator.getSimulationStatus();
    const newBvixPrice = Number(ethers.formatUnits(newStatus.bvixPrice, 8));
    const newEvixPrice = Number(ethers.formatUnits(newStatus.evixPrice, 8));
    
    console.log("📈 New BVIX Price:", newBvixPrice);
    console.log("📈 New EVIX Price:", newEvixPrice);
    
    console.log("\n✅ OracleSimulator fixed and working!");
    
  } catch (error) {
    console.error("❌ Error fixing OracleSimulator:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 