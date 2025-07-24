const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Debug: Checking Oracle Prices Directly");
  console.log("=========================================");
  
  // Oracle addresses
  const BVIX_ORACLE_ADDRESS = "0x85485dD6cFaF5220150c413309C61a8EA24d24FE";
  const EVIX_ORACLE_ADDRESS = "0xCd7441A771a7F84E58d98E598B7Ff23A3688094F";
  const SIMULATOR_ADDRESS = "0x60e7f6B172DD6e26a6d9234f3884624826472E59";
  
  try {
    // Check BVIX Oracle directly
    console.log("\n📊 BVIX Oracle:");
    const bvixOracle = await ethers.getContractAt([
      "function getPrice() external view returns (uint256)",
      "function updatePrice(uint256 _newPrice) external"
    ], BVIX_ORACLE_ADDRESS);
    
    const bvixPrice = await bvixOracle.getPrice();
    console.log(`Raw Price: ${bvixPrice.toString()}`);
    console.log(`Formatted (8 decimals): $${ethers.formatUnits(bvixPrice, 8)}`);
    console.log(`Formatted (18 decimals): $${ethers.formatEther(bvixPrice)}`);
    
    // Check EVIX Oracle directly
    console.log("\n📊 EVIX Oracle:");
    const evixOracle = await ethers.getContractAt([
      "function getPrice() external view returns (int256)",
      "function updatePrice(int256 _newPrice) external",
      "function owner() external view returns (address)"
    ], EVIX_ORACLE_ADDRESS);
    
    const evixPrice = await evixOracle.getPrice();
    const evixOwner = await evixOracle.owner();
    console.log(`Raw Price: ${evixPrice.toString()}`);
    console.log(`Formatted (8 decimals): $${ethers.formatUnits(evixPrice, 8)}`);
    console.log(`Formatted (18 decimals): $${ethers.formatEther(evixPrice)}`);
    console.log(`Owner: ${evixOwner}`);
    
    // Check if simulator owns EVIX oracle
    console.log(`Simulator owns EVIX Oracle: ${evixOwner.toLowerCase() === SIMULATOR_ADDRESS.toLowerCase()}`);
    
    // Check OracleSimulator status
    console.log("\n🤖 OracleSimulator Status:");
    const simulator = await ethers.getContractAt("OracleSimulator", SIMULATOR_ADDRESS);
    
    const status = await simulator.getSimulationStatus();
    console.log(`Simulation Active: ${status.active}`);
    console.log(`Last Update: ${new Date(Number(status.lastUpdate) * 1000).toLocaleString()}`);
    console.log(`Next Update: ${new Date(Number(status.nextUpdateTime) * 1000).toLocaleString()}`);
    
    const currentTime = Math.floor(Date.now() / 1000);
    const timeToNext = Number(status.nextUpdateTime) - currentTime;
    console.log(`Time to next update: ${timeToNext} seconds`);
    
    if (timeToNext <= 0) {
      console.log("\n🔄 Ready for update! Attempting manual price update...");
      try {
        const updateTx = await simulator.updatePrices();
        console.log(`Transaction hash: ${updateTx.hash}`);
        const receipt = await updateTx.wait();
        console.log(`✅ Update successful! Gas used: ${receipt.gasUsed}`);
        
        // Check new prices
        const newBvixPrice = await bvixOracle.getPrice();
        const newEvixPrice = await evixOracle.getPrice();
        console.log(`New BVIX: $${ethers.formatUnits(newBvixPrice, 8)}`);
        console.log(`New EVIX: $${ethers.formatUnits(newEvixPrice, 8)}`);
        
      } catch (updateError) {
        console.log(`❌ Update failed: ${updateError.message}`);
      }
    }
    
  } catch (error) {
    console.error("❌ Debug failed:", error.message);
  }
}

main().catch(console.error); 