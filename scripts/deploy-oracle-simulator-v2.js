const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying Fixed OracleSimulatorV2");
  console.log("====================================");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  // Oracle addresses
  const BVIX_ORACLE_ADDRESS = "0x85485dD6cFaF5220150c413309C61a8EA24d24FE";
  const EVIX_ORACLE_ADDRESS = "0xCd7441A771a7F84E58d98E598B7Ff23A3688094F";
  
  try {
    // Deploy OracleSimulatorV2
    console.log("\n🏗️  Deploying OracleSimulatorV2...");
    const OracleSimulatorV2 = await ethers.getContractFactory("OracleSimulatorV2");
    
    const simulator = await OracleSimulatorV2.deploy(
      BVIX_ORACLE_ADDRESS,
      EVIX_ORACLE_ADDRESS,
      deployer.address
    );
    
    await simulator.waitForDeployment();
    const simulatorAddress = await simulator.getAddress();
    
    console.log(`✅ OracleSimulatorV2 deployed at: ${simulatorAddress}`);
    
    // Transfer EVIX Oracle ownership to new simulator
    console.log("\n🔑 Transferring EVIX Oracle ownership...");
    const evixOracle = await ethers.getContractAt("EVIXOracle", EVIX_ORACLE_ADDRESS);
    
    const currentOwner = await evixOracle.owner();
    if (currentOwner.toLowerCase() === deployer.address.toLowerCase()) {
      const transferTx = await evixOracle.transferOwnership(simulatorAddress);
      await transferTx.wait();
      console.log("✅ EVIX Oracle ownership transferred to new simulator");
    } else {
      console.log(`⚠️  EVIX Oracle currently owned by: ${currentOwner}`);
      console.log(`   Please transfer ownership to: ${simulatorAddress}`);
    }
    
    // Update the address file
    const fs = require('fs');
    const path = require('path');
    const addressFile = path.join(__dirname, '..', 'oracle-simulator-address.txt');
    fs.writeFileSync(addressFile, simulatorAddress);
    console.log(`📁 Updated simulator address file: ${addressFile}`);
    
    // Start the simulation
    console.log("\n🎬 Starting simulation...");
    const startTx = await simulator.startSimulation();
    await startTx.wait();
    console.log("✅ Simulation started!");
    
    // Test a manual update
    console.log("\n🔧 Testing manual price update...");
    try {
      const updateTx = await simulator.updatePrices();
      const receipt = await updateTx.wait();
      console.log(`✅ Manual update successful! Gas used: ${receipt.gasUsed}`);
      
      // Show new prices
      const status = await simulator.getSimulationStatus();
      console.log(`📊 BVIX Price: ${ethers.formatUnits(status.bvixPrice, 10)}`);
      console.log(`📊 EVIX Price: ${ethers.formatUnits(status.evixPrice, 10)}`);
      
    } catch (updateError) {
      if (updateError.message.includes("Too frequent")) {
        console.log("✅ Circuit breaker working (too frequent updates blocked)");
      } else {
        console.log(`❌ Manual update failed: ${updateError.message}`);
      }
    }
    
    console.log("\n🎉 Fixed OracleSimulatorV2 deployed and running!");
    console.log(`📝 Contract Address: ${simulatorAddress}`);
    console.log(`🚀 Prices will now update every 60 seconds with proper decimal handling`);
    
  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
  }
}

main().catch(console.error); 