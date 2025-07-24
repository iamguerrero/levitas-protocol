const { ethers } = require("hardhat");

/**
 * Status Check Script for Oracle Simulation System
 * Monitors the current state of price simulation
 */

// Oracle addresses
const BVIX_ORACLE_ADDRESS = "0x85485dD6cFaF5220150c413309C61a8EA24d24FE";
const EVIX_ORACLE_ADDRESS = "0xCd7441A771a7F84E58d98E598B7Ff23A3688094F";

async function main() {
  console.log("📊 Oracle Simulation Status Check");
  console.log("==================================");
  
  try {
    // Read simulator address
    const fs = require('fs');
    const path = require('path');
    const addressFile = path.join(__dirname, '..', 'oracle-simulator-address.txt');
    
    if (!fs.existsSync(addressFile)) {
      console.log("❌ No simulator address found. Run the simulation first.");
      return;
    }
    
    const simulatorAddress = fs.readFileSync(addressFile, 'utf8').trim();
    console.log(`🔗 Simulator Address: ${simulatorAddress}`);
    
    // Connect to simulator
    const simulator = await ethers.getContractAt("OracleSimulator", simulatorAddress);
    
    // Get simulation status
    const status = await simulator.getSimulationStatus();
    const currentTime = Math.floor(Date.now() / 1000);
    
    console.log("\n📈 Current Prices:");
    console.log(`BVIX: $${ethers.formatUnits(status.bvixPrice, 8)}`);
    console.log(`EVIX: $${ethers.formatUnits(status.evixPrice, 8)}`);
    
    console.log("\n⚙️  Simulation Status:");
    console.log(`Active: ${status.active}`);
    console.log(`Last Update: ${new Date(Number(status.lastUpdate) * 1000).toLocaleString()}`);
    console.log(`Next Update: ${new Date(Number(status.nextUpdateTime) * 1000).toLocaleString()}`);
    
    const timeToNext = Number(status.nextUpdateTime) - currentTime;
    if (timeToNext > 0) {
      console.log(`Time to Next Update: ${timeToNext} seconds`);
    } else {
      console.log(`⏰ Ready for next update!`);
    }
    
    // Get parameters
    const bvixMean = await simulator.bvixMeanPrice();
    const evixMean = await simulator.evixMeanPrice();
    const bvixVol = await simulator.bvixVolatility();
    const evixVol = await simulator.evixVolatility();
    const meanReversion = await simulator.meanReversionStrength();
    
    console.log("\n🎛️  Simulation Parameters:");
    console.log(`BVIX Mean Target: $${ethers.formatUnits(bvixMean, 8)}`);
    console.log(`EVIX Mean Target: $${ethers.formatUnits(evixMean, 8)}`);
    console.log(`BVIX Volatility: ${Number(bvixVol) / 100}%`);
    console.log(`EVIX Volatility: ${Number(evixVol) / 100}%`);
    console.log(`Mean Reversion: ${Number(meanReversion) / 100}%`);
    console.log(`Max Movement: 1.00% per minute`);
    
    // Check oracle ownership
    console.log("\n🔐 Oracle Ownership:");
    
    // BVIX Oracle (no ownership)
    console.log(`BVIX Oracle: Public (no ownership required)`);
    
    // EVIX Oracle (has ownership)
    const evixOracle = await ethers.getContractAt([
      "function owner() external view returns (address)"
    ], EVIX_ORACLE_ADDRESS);
    
    const evixOwner = await evixOracle.owner();
    console.log(`EVIX Oracle Owner: ${evixOwner}`);
    
    if (evixOwner.toLowerCase() === simulatorAddress.toLowerCase()) {
      console.log("✅ EVIX Oracle properly owned by simulator");
    } else {
      console.log("⚠️  EVIX Oracle NOT owned by simulator - price updates may fail");
    }
    
    // Price bounds check
    console.log("\n📏 Price Bounds Status:");
    const bvixPrice = Number(ethers.formatUnits(status.bvixPrice, 8));
    const evixPrice = Number(ethers.formatUnits(status.evixPrice, 8));
    
    const BVIX_MIN = 15, BVIX_MAX = 150;
    const EVIX_MIN = 20, EVIX_MAX = 180;
    
    console.log(`BVIX: $${bvixPrice.toFixed(2)} (bounds: $${BVIX_MIN}-$${BVIX_MAX}) ${bvixPrice >= BVIX_MIN && bvixPrice <= BVIX_MAX ? '✅' : '⚠️'}`);
    console.log(`EVIX: $${evixPrice.toFixed(2)} (bounds: $${EVIX_MIN}-$${EVIX_MAX}) ${evixPrice >= EVIX_MIN && evixPrice <= EVIX_MAX ? '✅' : '⚠️'}`);
    
    console.log("\n💡 Impact on System:");
    console.log("• Collateral ratios will update automatically based on new prices");
    console.log("• BVIX positions reflect current BVIX oracle price");
    console.log("• EVIX positions reflect current EVIX oracle price");
    console.log("• No changes needed to MintRedeem contracts");
    
    console.log("\n🎉 Sprint 2.1 Oracle Simulation System is running!");
    
  } catch (error) {
    console.error("❌ Status check failed:", error.message);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main }; 