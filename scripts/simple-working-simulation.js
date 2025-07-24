const { ethers } = require("hardhat");

async function main() {
  console.log("🎯 Simple Working Oracle Simulation");
  console.log("===================================");
  
  const [deployer] = await ethers.getSigners();
  console.log("Account:", deployer.address);
  
  // Oracle addresses
  const BVIX_ORACLE = "0x85485dD6cFaF5220150c413309C61a8EA24d24FE";
  const EVIX_ORACLE = "0xCd7441A771a7F84E58d98E598B7Ff23A3688094F";
  
  // Connect to oracles
  const bvixOracle = await ethers.getContractAt("MockOracle", BVIX_ORACLE);
  const evixOracle = await ethers.getContractAt("EVIXOracle", EVIX_ORACLE);
  
  // Check ownership
  const evixOwner = await evixOracle.owner();
  console.log("EVIX Oracle owner:", evixOwner);
  console.log("Can update EVIX:", evixOwner.toLowerCase() === deployer.address.toLowerCase());
  
  // Set initial reasonable prices
  console.log("\n🎯 Setting initial prices:");
  const initialBvix = ethers.parseUnits("42.15", 8);
  const initialEvix = ethers.parseUnits("37.98", 8);
  
  await bvixOracle.updatePrice(initialBvix);
  console.log("✅ BVIX set to $42.15");
  
  if (evixOwner.toLowerCase() === deployer.address.toLowerCase()) {
    await evixOracle.updatePrice(initialEvix);
    console.log("✅ EVIX set to $37.98");
  }
  
  // Start simulation
  console.log("\n🔄 Starting price simulation (updates every 60 seconds)");
  console.log("Press Ctrl+C to stop\n");
  
  let updateCount = 0;
  
  async function updatePrices() {
    try {
      updateCount++;
      
      // Get current prices
      const currentBvix = await bvixOracle.getPrice();
      const currentEvix = await evixOracle.getPrice();
      
      // Generate small random changes (max 1% per minute)
      const bvixChangePercent = (Math.random() - 0.5) * 2; // -1% to +1%
      const evixChangePercent = (Math.random() - 0.5) * 2; // -1% to +1%
      
      // Calculate new prices
      const bvixMultiplier = 1 + (bvixChangePercent / 100);
      const evixMultiplier = 1 + (evixChangePercent / 100);
      
      const newBvix = BigInt(Math.floor(Number(currentBvix) * bvixMultiplier));
      const newEvix = BigInt(Math.floor(Number(currentEvix) * evixMultiplier));
      
      // Apply bounds (15-150 for BVIX, 20-180 for EVIX)
      const bvixMin = ethers.parseUnits("15", 8);
      const bvixMax = ethers.parseUnits("150", 8);
      const evixMin = ethers.parseUnits("20", 8);
      const evixMax = ethers.parseUnits("180", 8);
      
      const boundedBvix = newBvix < bvixMin ? bvixMin : (newBvix > bvixMax ? bvixMax : newBvix);
      const boundedEvix = newEvix < evixMin ? evixMin : (newEvix > evixMax ? evixMax : newEvix);
      
      // Update prices
      await bvixOracle.updatePrice(boundedBvix);
      
      if (evixOwner.toLowerCase() === deployer.address.toLowerCase()) {
        await evixOracle.updatePrice(boundedEvix);
      }
      
      // Log the update
      const bvixFormatted = ethers.formatUnits(boundedBvix, 8);
      const evixFormatted = ethers.formatUnits(boundedEvix, 8);
      
      console.log(`Update #${updateCount} - ${new Date().toLocaleTimeString()}`);
      console.log(`  BVIX: $${bvixFormatted} (${bvixChangePercent > 0 ? '+' : ''}${bvixChangePercent.toFixed(2)}%)`);
      console.log(`  EVIX: $${evixFormatted} (${evixChangePercent > 0 ? '+' : ''}${evixChangePercent.toFixed(2)}%)`);
      console.log("");
      
    } catch (error) {
      console.log(`❌ Update #${updateCount} failed:`, error.message);
    }
  }
  
  // Start with immediate update
  await updatePrices();
  
  // Then update every 60 seconds
  const interval = setInterval(updatePrices, 60000);
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log("\n🛑 Stopping simulation...");
    clearInterval(interval);
    console.log("✅ Simulation stopped");
    process.exit(0);
  });
  
  // Keep the process alive
  await new Promise(() => {});
}

main().catch((error) => {
  console.error("❌ Simulation failed:", error.message);
  process.exit(1);
}); 