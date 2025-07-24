const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 Fixing Oracle Prices and Starting Simulation");
  console.log("===============================================");
  
  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);
  
  // Oracle addresses
  const BVIX_ORACLE = "0x85485dD6cFaF5220150c413309C61a8EA24d24FE";
  const EVIX_ORACLE = "0xCd7441A771a7F84E58d98E598B7Ff23A3688094F";
  
  try {
    // Step 1: Check current prices
    console.log("\n📊 Current Prices:");
    const bvixOracle = await ethers.getContractAt("MockOracle", BVIX_ORACLE);
    const evixOracle = await ethers.getContractAt("EVIXOracle", EVIX_ORACLE);
    
    const currentBvix = await bvixOracle.getPrice();
    const currentEvix = await evixOracle.getPrice();
    
    console.log(`BVIX Raw: ${currentBvix.toString()}`);
    console.log(`EVIX Raw: ${currentEvix.toString()}`);
    
    // Step 2: Set reasonable prices (using 8 decimal format)
    console.log("\n🎯 Setting Reasonable Prices (8 decimals):");
    
    const reasonableBvixPrice = ethers.parseUnits("42.15", 8); // $42.15
    const reasonableEvixPrice = ethers.parseUnits("37.98", 8); // $37.98
    
    console.log(`Setting BVIX to: ${reasonableBvixPrice.toString()} (42.15 with 8 decimals)`);
    console.log(`Setting EVIX to: ${reasonableEvixPrice.toString()} (37.98 with 8 decimals)`);
    
    // Update BVIX price (no ownership needed)
    const bvixTx = await bvixOracle.updatePrice(reasonableBvixPrice);
    await bvixTx.wait();
    console.log("✅ BVIX price updated");
    
    // Update EVIX price (need ownership)
    const evixOwner = await evixOracle.owner();
    console.log(`EVIX Oracle owner: ${evixOwner}`);
    
    if (evixOwner.toLowerCase() === deployer.address.toLowerCase()) {
      const evixTx = await evixOracle.updatePrice(reasonableEvixPrice);
      await evixTx.wait();
      console.log("✅ EVIX price updated");
    } else {
      console.log("⚠️  Cannot update EVIX - not owner");
    }
    
    // Step 3: Verify new prices
    console.log("\n📋 Verifying New Prices:");
    const newBvix = await bvixOracle.getPrice();
    const newEvix = await evixOracle.getPrice();
    
    console.log(`BVIX: ${ethers.formatUnits(newBvix, 8)} (raw: ${newBvix.toString()})`);
    console.log(`EVIX: ${ethers.formatUnits(newEvix, 8)} (raw: ${newEvix.toString()})`);
    
    // Step 4: Create simple price updater
    console.log("\n🤖 Starting Simple Price Simulation:");
    
    async function updatePrices() {
      try {
        const currentBvixPrice = await bvixOracle.getPrice();
        const currentEvixPrice = await evixOracle.getPrice();
        
        // Apply small random changes (max 1%)
        const bvixChange = (Math.random() - 0.5) * 0.02; // -1% to +1%
        const evixChange = (Math.random() - 0.5) * 0.02; // -1% to +1%
        
        const newBvixPrice = BigInt(Math.floor(Number(currentBvixPrice) * (1 + bvixChange)));
        const newEvixPrice = BigInt(Math.floor(Number(currentEvixPrice) * (1 + evixChange)));
        
        // Update prices
        await bvixOracle.updatePrice(newBvixPrice);
        if (evixOwner.toLowerCase() === deployer.address.toLowerCase()) {
          await evixOracle.updatePrice(newEvixPrice);
        }
        
        console.log(`${new Date().toLocaleTimeString()}: BVIX $${ethers.formatUnits(newBvixPrice, 8)}, EVIX $${ethers.formatUnits(newEvixPrice, 8)}`);
        
      } catch (error) {
        console.log(`❌ Update failed: ${error.message}`);
      }
    }
    
    // Initial update
    console.log("🔄 Starting price updates every 60 seconds...");
    console.log("Press Ctrl+C to stop");
    
    // Update every 60 seconds
    const interval = setInterval(updatePrices, 60000);
    
    // Handle shutdown
    process.on('SIGINT', () => {
      console.log("\n🛑 Stopping price simulation...");
      clearInterval(interval);
      process.exit(0);
    });
    
    // Keep process alive
    await new Promise(() => {});
    
  } catch (error) {
    console.error("❌ Failed:", error.message);
  }
}

main().catch(console.error); 