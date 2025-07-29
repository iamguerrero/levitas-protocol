const { ethers } = require("hardhat");

/**
 * Test manual price updates to the oracles
 */

// Oracle addresses
const BVIX_ORACLE_ADDRESS = "0x85485dD6cFaF5220150c413309C61a8EA24d24FE";
const EVIX_ORACLE_ADDRESS = "0xBd6E9809B9608eCAc3610cA65327735CC3c08104";

async function main() {
  console.log("🧪 Testing manual price updates...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);
  
  try {
    // Get current prices
    const bvixOracle = await ethers.getContractAt("MockOracle", BVIX_ORACLE_ADDRESS);
    const evixOracle = await ethers.getContractAt("EVIXOracle", EVIX_ORACLE_ADDRESS);
    
    const currentBvixPrice = await bvixOracle.getPrice();
    const currentEvixPrice = await evixOracle.getPrice();
    
    console.log("Current BVIX Price:", ethers.formatUnits(currentBvixPrice, 8));
    console.log("Current EVIX Price:", ethers.formatUnits(currentEvixPrice, 8));
    
    // Try to update BVIX price
    console.log("\n🔄 Updating BVIX price...");
    const newBvixPrice = ethers.parseUnits("45.00", 8); // $45.00
    const bvixTx = await bvixOracle.updatePrice(newBvixPrice);
    await bvixTx.wait();
    console.log("✅ BVIX price updated!");
    
    // Try to update EVIX price
    console.log("\n🔄 Updating EVIX price...");
    const newEvixPrice = ethers.parseUnits("42.00", 8); // $42.00
    const evixTx = await evixOracle.updatePrice(newEvixPrice);
    await evixTx.wait();
    console.log("✅ EVIX price updated!");
    
    // Check new prices
    const newBvixPriceCheck = await bvixOracle.getPrice();
    const newEvixPriceCheck = await evixOracle.getPrice();
    
    console.log("\n📊 New Prices:");
    console.log("BVIX Price:", ethers.formatUnits(newBvixPriceCheck, 8));
    console.log("EVIX Price:", ethers.formatUnits(newEvixPriceCheck, 8));
    
    console.log("\n✅ Manual price updates successful!");
    
  } catch (error) {
    console.error("❌ Error updating prices:", error.message);
    
    if (error.message.includes("AccessControl")) {
      console.log("💡 The oracles have access control - only authorized accounts can update prices");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 