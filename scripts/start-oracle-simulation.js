const { ethers } = require("hardhat");

/**
 * Oracle Simulation Script for Sprint 2.1
 * Manages automated price updates for BVIX and EVIX with realistic volatility
 */

// Current deployed oracle addresses
const BVIX_ORACLE_ADDRESS = "0x85485dD6cFaF5220150c413309C61a8EA24d24FE";
const EVIX_ORACLE_ADDRESS = "0xBd6E9809B9608eCAc3610cA65327735CC3c08104";

// RPC for Base Sepolia
const BASE_SEPOLIA_RPC = 'https://sepolia.base.org';

let oracleSimulator;
let simulationInterval;
let isRunning = false;

async function main() {
  console.log("🚀 Starting Oracle Simulation System - Sprint 2.1");
  console.log("===============================================");
  
  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");
  
  try {
    // Check if OracleSimulator is already deployed
    let simulatorAddress = await getExistingSimulatorAddress();
    
    if (!simulatorAddress) {
      console.log("\n📝 Deploying OracleSimulator contract...");
      simulatorAddress = await deployOracleSimulator(deployer);
    } else {
      console.log(`\n✅ Using existing OracleSimulator at: ${simulatorAddress}`);
    }
    
    // Connect to the simulator
    oracleSimulator = await ethers.getContractAt("OracleSimulator", simulatorAddress);
    
    // Display current status
    await displayCurrentStatus();
    
    // Check if we should start the simulation
    const { active } = await oracleSimulator.getSimulationStatus();
    
    if (!active) {
      console.log("\n🎬 Starting price simulation...");
      await oracleSimulator.startSimulation();
      console.log("✅ Simulation started!");
    } else {
      console.log("\n✅ Simulation already active");
    }
    
    // Start the automated price update loop
    console.log("\n🔄 Starting automated price updates every 60 seconds...");
    await startAutomatedUpdates();
    
  } catch (error) {
    console.error("❌ Error in main:", error);
    process.exit(1);
  }
}

async function deployOracleSimulator(deployer) {
  const OracleSimulator = await ethers.getContractFactory("OracleSimulator");
  
  const simulator = await OracleSimulator.deploy(
    BVIX_ORACLE_ADDRESS,
    EVIX_ORACLE_ADDRESS,
    deployer.address
  );
  
  await simulator.waitForDeployment();
  const simulatorAddress = await simulator.getAddress();
  
  console.log("✅ OracleSimulator deployed at:", simulatorAddress);
  
  // Save the address for future use
  await saveSimulatorAddress(simulatorAddress);
  
  return simulatorAddress;
}

async function startAutomatedUpdates() {
  isRunning = true;
  
  // Initial update
  await performPriceUpdate();
  
  // Set up interval for every 60 seconds
  simulationInterval = setInterval(async () => {
    if (isRunning) {
      await performPriceUpdate();
    }
  }, 60 * 1000); // 60 seconds
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log("\n🛑 Shutting down simulation...");
    isRunning = false;
    clearInterval(simulationInterval);
    process.exit(0);
  });
  
  console.log("✅ Automated updates started. Press Ctrl+C to stop.");
  console.log("📊 Price updates will occur every 60 seconds with max 1% movement");
}

async function performPriceUpdate() {
  try {
    const status = await oracleSimulator.getSimulationStatus();
    const currentTime = Math.floor(Date.now() / 1000);
    
    if (currentTime < status.nextUpdateTime) {
      const timeToWait = Number(status.nextUpdateTime) - currentTime;
      console.log(`⏰ Next update in ${timeToWait} seconds...`);
      return;
    }
    
    console.log(`\n🔄 Updating prices at ${new Date().toLocaleTimeString()}...`);
    
    // Get prices before update
    const bvixPriceBefore = Number(ethers.formatUnits(status.bvixPrice, 8));
    const evixPriceBefore = Number(ethers.formatUnits(status.evixPrice, 8));
    
    console.log(`📊 Before: BVIX $${bvixPriceBefore.toFixed(2)}, EVIX $${evixPriceBefore.toFixed(2)}`);
    
    // Perform the update
    const tx = await oracleSimulator.updatePrices();
    const receipt = await tx.wait();
    
    // Get prices after update
    const newStatus = await oracleSimulator.getSimulationStatus();
    const bvixPriceAfter = Number(ethers.formatUnits(newStatus.bvixPrice, 8));
    const evixPriceAfter = Number(ethers.formatUnits(newStatus.evixPrice, 8));
    
    // Calculate percentage changes
    const bvixChange = ((bvixPriceAfter - bvixPriceBefore) / bvixPriceBefore * 100);
    const evixChange = ((evixPriceAfter - evixPriceBefore) / evixPriceBefore * 100);
    
    console.log(`📈 After:  BVIX $${bvixPriceAfter.toFixed(2)} (${bvixChange > 0 ? '+' : ''}${bvixChange.toFixed(2)}%)`);
    console.log(`📈 After:  EVIX $${evixPriceAfter.toFixed(2)} (${evixChange > 0 ? '+' : ''}${evixChange.toFixed(2)}%)`);
    console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);
    
    // Show CR impact message
    console.log(`💡 Collateral ratios will update automatically based on new prices`);
    
  } catch (error) {
    console.error("❌ Error updating prices:", error.message);
    
    // If it's a "too frequent" error, that's expected
    if (error.message.includes("Too frequent")) {
      console.log("⏰ Waiting for next update window...");
    }
  }
}

async function displayCurrentStatus() {
  console.log("\n📊 Current Oracle Status:");
  console.log("========================");
  
  try {
    const status = await oracleSimulator.getSimulationStatus();
    const bvixPrice = Number(ethers.formatUnits(status.bvixPrice, 8));
    const evixPrice = Number(ethers.formatUnits(status.evixPrice, 8));
    
    console.log(`BVIX Price: $${bvixPrice.toFixed(2)}`);
    console.log(`EVIX Price: $${evixPrice.toFixed(2)}`);
    console.log(`Simulation Active: ${status.active}`);
    console.log(`Last Update: ${new Date(Number(status.lastUpdate) * 1000).toLocaleString()}`);
    console.log(`Next Update: ${new Date(Number(status.nextUpdateTime) * 1000).toLocaleString()}`);
    
    // Get additional parameters
    const bvixMean = await oracleSimulator.bvixMeanPrice();
    const evixMean = await oracleSimulator.evixMeanPrice();
    const bvixVol = await oracleSimulator.bvixVolatility();
    const evixVol = await oracleSimulator.evixVolatility();
    
    console.log(`\n⚙️  Simulation Parameters:`);
    console.log(`BVIX Mean Target: $${Number(ethers.formatUnits(bvixMean, 8)).toFixed(2)}`);
    console.log(`EVIX Mean Target: $${Number(ethers.formatUnits(evixMean, 8)).toFixed(2)}`);
    console.log(`BVIX Volatility: ${Number(bvixVol) / 100}%`);
    console.log(`EVIX Volatility: ${Number(evixVol) / 100}%`);
    console.log(`Max Movement: 1.00% per minute`);
    
  } catch (error) {
    console.error("❌ Error getting status:", error.message);
  }
}

async function getExistingSimulatorAddress() {
  // Check if there's a saved address file
  const fs = require('fs');
  const path = require('path');
  const addressFile = path.join(__dirname, '..', 'oracle-simulator-address.txt');
  
  try {
    if (fs.existsSync(addressFile)) {
      const address = fs.readFileSync(addressFile, 'utf8').trim();
      
      // Verify the contract exists at this address
      const code = await ethers.provider.getCode(address);
      if (code !== '0x') {
        return address;
      }
    }
  } catch (error) {
    // File doesn't exist or address is invalid
  }
  
  return null;
}

async function saveSimulatorAddress(address) {
  const fs = require('fs');
  const path = require('path');
  const addressFile = path.join(__dirname, '..', 'oracle-simulator-address.txt');
  
  try {
    fs.writeFileSync(addressFile, address);
    console.log(`📁 Simulator address saved to: ${addressFile}`);
  } catch (error) {
    console.warn("⚠️  Could not save simulator address:", error.message);
  }
}

// Helper function to manually update prices (for testing)
async function manualPriceUpdate() {
  if (!oracleSimulator) {
    console.error("❌ Simulator not initialized");
    return;
  }
  
  try {
    console.log("🔧 Performing manual price update...");
    await performPriceUpdate();
  } catch (error) {
    console.error("❌ Manual update failed:", error.message);
  }
}

// Export functions for testing
module.exports = {
  main,
  manualPriceUpdate,
  displayCurrentStatus
};

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error("💥 Fatal error:", error);
    process.exitCode = 1;
  });
} 