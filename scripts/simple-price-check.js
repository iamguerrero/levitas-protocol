const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Simple Price Check");
  
  // Oracle addresses
  const BVIX_ORACLE = "0x85485dD6cFaF5220150c413309C61a8EA24d24FE";
  const EVIX_ORACLE = "0xCd7441A771a7F84E58d98E598B7Ff23A3688094F";
  const SIMULATOR = "0x60e7f6B172DD6e26a6d9234f3884624826472E59";
  
  const [deployer] = await ethers.getSigners();
  console.log("Account:", deployer.address);
  
  // Check BVIX price
  const bvix = await ethers.getContractAt("MockOracle", BVIX_ORACLE);
  const bvixPrice = await bvix.getPrice();
  console.log("BVIX raw:", bvixPrice.toString());
  console.log("BVIX formatted (8 dec):", ethers.formatUnits(bvixPrice, 8));
  
  // Check EVIX price  
  const evix = await ethers.getContractAt("EVIXOracle", EVIX_ORACLE);
  const evixPrice = await evix.getPrice();
  const evixOwner = await evix.owner();
  console.log("EVIX raw:", evixPrice.toString());
  console.log("EVIX formatted (8 dec):", ethers.formatUnits(evixPrice, 8));
  console.log("EVIX owner:", evixOwner);
  
  // Check simulator
  const sim = await ethers.getContractAt("OracleSimulator", SIMULATOR);
  const status = await sim.getSimulationStatus();
  console.log("Simulation active:", status.active);
  console.log("Last update:", new Date(Number(status.lastUpdate) * 1000).toLocaleString());
  
  // Try manual update
  console.log("\nTrying manual update...");
  try {
    const tx = await sim.updatePrices();
    await tx.wait();
    console.log("✅ Update successful!");
    
    const newBvix = await bvix.getPrice();
    const newEvix = await evix.getPrice();
    console.log("New BVIX:", ethers.formatUnits(newBvix, 8));
    console.log("New EVIX:", ethers.formatUnits(newEvix, 8));
    
  } catch (error) {
    console.log("❌ Update failed:", error.message);
  }
}

main().catch(console.error); 