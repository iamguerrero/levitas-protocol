const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 Fixing EVIX Oracle and Restarting Full Simulation");
  console.log("=====================================================");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  
  try {
    // Step 1: Deploy new EVIX Oracle with correct price
    console.log("\n🏗️  Step 1: Deploying new EVIX Oracle...");
    
    const EVIXOracle = await ethers.getContractFactory("EVIXOracle");
    const initialEvixPrice = ethers.parseUnits("37.98", 8); // $37.98 with 8 decimals
    
    const newEvixOracle = await EVIXOracle.deploy(
      initialEvixPrice,
      deployer.address // We own it
    );
    
    await newEvixOracle.waitForDeployment();
    const newEvixOracleAddress = await newEvixOracle.getAddress();
    
    console.log(`✅ New EVIX Oracle deployed at: ${newEvixOracleAddress}`);
    console.log(`✅ Initial EVIX price set to: $37.98`);
    
    // Step 2: Update frontend contract addresses
    console.log("\n📝 Step 2: Updating frontend contract addresses...");
    
    const fs = require('fs');
    const path = require('path');
    
    // Read the current web3.ts file
    const web3FilePath = path.join(__dirname, '..', 'client', 'src', 'lib', 'web3.ts');
    let web3Content = fs.readFileSync(web3FilePath, 'utf8');
    
    // Update the EVIX Oracle address
    const oldEvixOraclePattern = /evixOracle: "0x[a-fA-F0-9]{40}"/g;
    const newEvixOraclePattern = `evixOracle: "${newEvixOracleAddress}"`;
    
    web3Content = web3Content.replace(oldEvixOraclePattern, newEvixOraclePattern);
    
    // Write back to file
    fs.writeFileSync(web3FilePath, web3Content);
    console.log(`✅ Updated frontend EVIX Oracle address to: ${newEvixOracleAddress}`);
    
    // Step 3: Stop current simulation
    console.log("\n🛑 Step 3: Stopping current simulation...");
    
    try {
      const { exec } = require('child_process');
      exec('pkill -f "simple-working-simulation"', (error, stdout, stderr) => {
        if (error) {
          console.log("No existing simulation to stop");
        } else {
          console.log("✅ Stopped existing simulation");
        }
      });
    } catch (error) {
      console.log("No existing simulation to stop");
    }
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 4: Start new simulation with both oracles
    console.log("\n🚀 Step 4: Starting new simulation with both oracles...");
    
    const BVIX_ORACLE = "0x85485dD6cFaF5220150c413309C61a8EA24d24FE";
    
    // Connect to oracles
    const bvixOracle = await ethers.getContractAt("MockOracle", BVIX_ORACLE);
    
    // Set initial reasonable prices
    console.log("🎯 Setting initial prices:");
    const initialBvix = ethers.parseUnits("42.15", 8);
    
    await bvixOracle.updatePrice(initialBvix);
    console.log("✅ BVIX set to $42.15");
    
    // EVIX is already set to $37.98 from deployment
    console.log("✅ EVIX set to $37.98");
    
    // Step 5: Start the improved simulation
    console.log("\n🔄 Step 5: Starting improved simulation...");
    
    let updateCount = 0;
    
    async function updateBothPrices() {
      try {
        updateCount++;
        
        // Get current prices
        const currentBvix = await bvixOracle.getPrice();
        const currentEvix = await newEvixOracle.getPrice();
        
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
        
        // Update both oracles
        await bvixOracle.updatePrice(boundedBvix);
        await newEvixOracle.updatePrice(boundedEvix);
        
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
    await updateBothPrices();
    
    // Then update every 60 seconds
    const interval = setInterval(updateBothPrices, 60000);
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log("\n🛑 Stopping simulation...");
      clearInterval(interval);
      console.log("✅ Simulation stopped");
      process.exit(0);
    });
    
    console.log("\n🎉 COMPLETE SETUP FINISHED!");
    console.log("==========================");
    console.log(`✅ New EVIX Oracle: ${newEvixOracleAddress}`);
    console.log(`✅ Both BVIX and EVIX prices updating every 60 seconds`);
    console.log(`✅ Frontend addresses updated`);
    console.log(`💡 Refresh your browser to see live price updates!`);
    console.log(`🔄 Press Ctrl+C to stop simulation`);
    
    // Keep the process alive
    await new Promise(() => {});
    
  } catch (error) {
    console.error("❌ Setup failed:", error.message);
    process.exit(1);
  }
}

main().catch(console.error); 