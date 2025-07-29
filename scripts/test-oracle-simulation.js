const { ethers } = require("hardhat");

/**
 * Test Script for Oracle Simulation System
 * Verifies compatibility and basic functionality before full deployment
 */

// Current deployed oracle addresses
const BVIX_ORACLE_ADDRESS = "0x85485dD6cFaF5220150c413309C61a8EA24d24FE";
const EVIX_ORACLE_ADDRESS = "0xCd7441A771a7F84E58d98E598B7Ff23A3688094F";

async function main() {
  console.log("🧪 Testing Oracle Simulation System");
  console.log("===================================");
  
  const [deployer] = await ethers.getSigners();
  console.log("Testing with account:", deployer.address);
  
  try {
    // Step 1: Verify oracle contracts exist and are accessible
    await verifyOracleAccess();
    
    // Step 2: Deploy OracleSimulator for testing
    const simulatorAddress = await deployTestSimulator(deployer);
    
    // Step 3: Test basic functionality
    await testBasicFunctionality(simulatorAddress);
    
    // Step 4: Test price update mechanism
    await testPriceUpdates(simulatorAddress);
    
    console.log("\n✅ All tests passed! Oracle Simulation System is ready.");
    console.log(`📝 OracleSimulator deployed at: ${simulatorAddress}`);
    console.log("\n🚀 Ready to run: node scripts/start-oracle-simulation.js");
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
}

async function verifyOracleAccess() {
  console.log("\n🔍 Step 1: Verifying Oracle Access");
  
  try {
    // Test BVIX Oracle
    const bvixOracle = await ethers.getContractAt([
      "function getPrice() external view returns (uint256)",
      "function updatePrice(uint256 _newPrice) external"
    ], BVIX_ORACLE_ADDRESS);
    
    const bvixPrice = await bvixOracle.getPrice();
    console.log(`✅ BVIX Oracle: $${ethers.formatUnits(bvixPrice, 8)}`);
    
    // Test EVIX Oracle
    const evixOracle = await ethers.getContractAt([
      "function getPrice() external view returns (int256)",
      "function updatePrice(int256 _newPrice) external",
      "function owner() external view returns (address)"
    ], EVIX_ORACLE_ADDRESS);
    
    const evixPrice = await evixOracle.getPrice();
    const evixOwner = await evixOracle.owner();
    console.log(`✅ EVIX Oracle: $${ethers.formatUnits(evixPrice, 8)}`);
    console.log(`📋 EVIX Owner: ${evixOwner}`);
    
    return { bvixPrice, evixPrice, evixOwner };
    
  } catch (error) {
    throw new Error(`Oracle access failed: ${error.message}`);
  }
}

async function deployTestSimulator(deployer) {
  console.log("\n🏗️  Step 2: Deploying Test OracleSimulator");
  
  try {
    const OracleSimulator = await ethers.getContractFactory("OracleSimulator");
    
    const simulator = await OracleSimulator.deploy(
      BVIX_ORACLE_ADDRESS,
      EVIX_ORACLE_ADDRESS,
      deployer.address
    );
    
    await simulator.waitForDeployment();
    const simulatorAddress = await simulator.getAddress();
    
    console.log(`✅ OracleSimulator deployed at: ${simulatorAddress}`);
    return simulatorAddress;
    
  } catch (error) {
    throw new Error(`Deployment failed: ${error.message}`);
  }
}

async function testBasicFunctionality(simulatorAddress) {
  console.log("\n⚙️  Step 3: Testing Basic Functionality");
  
  try {
    const simulator = await ethers.getContractAt("OracleSimulator", simulatorAddress);
    
    // Test status retrieval
    const status = await simulator.getSimulationStatus();
    console.log(`✅ Simulation Active: ${status.active}`);
    console.log(`✅ BVIX Price: $${ethers.formatUnits(status.bvixPrice, 8)}`);
    console.log(`✅ EVIX Price: $${ethers.formatUnits(status.evixPrice, 8)}`);
    
    // Test parameter access
    const bvixMean = await simulator.bvixMeanPrice();
    const evixMean = await simulator.evixMeanPrice();
    console.log(`✅ BVIX Mean Target: $${ethers.formatUnits(bvixMean, 8)}`);
    console.log(`✅ EVIX Mean Target: $${ethers.formatUnits(evixMean, 8)}`);
    
  } catch (error) {
    throw new Error(`Basic functionality test failed: ${error.message}`);
  }
}

async function testPriceUpdates(simulatorAddress) {
  console.log("\n🔄 Step 4: Testing Price Update Mechanism");
  
  try {
    const [deployer] = await ethers.getSigners();
    const simulator = await ethers.getContractAt("OracleSimulator", simulatorAddress);
    
    // Check if we need to transfer EVIX Oracle ownership
    const evixOracle = await ethers.getContractAt([
      "function owner() external view returns (address)",
      "function transferOwnership(address newOwner) external"
    ], EVIX_ORACLE_ADDRESS);
    
    const currentOwner = await evixOracle.owner();
    
    if (currentOwner.toLowerCase() !== simulatorAddress.toLowerCase()) {
      console.log("🔑 Transferring EVIX Oracle ownership to simulator...");
      
      if (currentOwner.toLowerCase() === deployer.address.toLowerCase()) {
        // We own it, transfer to simulator
        const transferTx = await evixOracle.transferOwnership(simulatorAddress);
        await transferTx.wait();
        console.log("✅ EVIX Oracle ownership transferred to simulator");
      } else {
        console.log(`⚠️  EVIX Oracle owned by ${currentOwner}, manual transfer needed`);
        console.log(`   Run: evixOracle.transferOwnership("${simulatorAddress}")`);
      }
    } else {
      console.log("✅ EVIX Oracle already owned by simulator");
    }
    
    // Start simulation
    console.log("🎬 Starting simulation...");
    const startTx = await simulator.startSimulation();
    await startTx.wait();
    console.log("✅ Simulation started");
    
    // Test manual price update
    console.log("🔧 Testing manual price update...");
    try {
      const updateTx = await simulator.updatePrices();
      const receipt = await updateTx.wait();
      console.log(`✅ Price update successful! Gas used: ${receipt.gasUsed}`);
      
      // Check new prices
      const newStatus = await simulator.getSimulationStatus();
      console.log(`📈 New BVIX Price: $${ethers.formatUnits(newStatus.bvixPrice, 8)}`);
      console.log(`📈 New EVIX Price: $${ethers.formatUnits(newStatus.evixPrice, 8)}`);
      
    } catch (updateError) {
      if (updateError.message.includes("Too frequent")) {
        console.log("✅ Circuit breaker working (too frequent updates blocked)");
      } else {
        throw updateError;
      }
    }
    
  } catch (error) {
    throw new Error(`Price update test failed: ${error.message}`);
  }
}

// Additional utility function to check current CR impact
async function checkCollateralRatioImpact() {
  console.log("\n📊 Checking Collateral Ratio Impact");
  
  try {
    // You can add CR checking logic here if needed
    console.log("💡 Note: CR calculations will update automatically when prices change");
    console.log("   - BVIX positions will reflect new BVIX oracle prices");
    console.log("   - EVIX positions will reflect new EVIX oracle prices");
    
  } catch (error) {
    console.warn("⚠️  Could not check CR impact:", error.message);
  }
}

module.exports = {
  main,
  verifyOracleAccess,
  testPriceUpdates
};

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error("💥 Test failed:", error);
    process.exitCode = 1;
  });
} 