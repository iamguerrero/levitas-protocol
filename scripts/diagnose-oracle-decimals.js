const { ethers } = require("hardhat");

async function main() {
  console.log("🔬 Diagnosing Oracle Decimal Formats");
  console.log("====================================");
  
  // Oracle addresses
  const BVIX_ORACLE = "0x85485dD6cFaF5220150c413309C61a8EA24d24FE";
  const EVIX_ORACLE = "0xCd7441A771a7F84E58d98E598B7Ff23A3688094F";
  
  try {
    // Check BVIX Oracle
    console.log("\n📊 BVIX Oracle Analysis:");
    const bvixOracle = await ethers.getContractAt("MockOracle", BVIX_ORACLE);
    const bvixRaw = await bvixOracle.getPrice();
    
    console.log(`Raw value: ${bvixRaw.toString()}`);
    console.log(`Length: ${bvixRaw.toString().length} digits`);
    
    // Try different decimal formats
    for (let decimals = 6; decimals <= 18; decimals++) {
      const formatted = ethers.formatUnits(bvixRaw, decimals);
      console.log(`${decimals} decimals: $${formatted}`);
      
      // Check if this gives us a reasonable price (~42)
      const numValue = parseFloat(formatted);
      if (numValue >= 40 && numValue <= 50) {
        console.log(`  ✅ REASONABLE: ${numValue} (likely ${decimals} decimals)`);
      }
    }
    
    // Check EVIX Oracle
    console.log("\n📊 EVIX Oracle Analysis:");
    const evixOracle = await ethers.getContractAt("EVIXOracle", EVIX_ORACLE);
    const evixRaw = await evixOracle.getPrice();
    
    console.log(`Raw value: ${evixRaw.toString()}`);
    console.log(`Length: ${evixRaw.toString().length} digits`);
    
    // Try different decimal formats
    for (let decimals = 6; decimals <= 18; decimals++) {
      const formatted = ethers.formatUnits(evixRaw, decimals);
      console.log(`${decimals} decimals: $${formatted}`);
      
      // Check if this gives us a reasonable price (~38)
      const numValue = parseFloat(formatted);
      if (numValue >= 35 && numValue <= 45) {
        console.log(`  ✅ REASONABLE: ${numValue} (likely ${decimals} decimals)`);
      }
    }
    
    // Calculate what decimal format gives us the expected values
    console.log("\n🎯 Expected Values Analysis:");
    console.log("Expected BVIX: ~$42.15");
    console.log("Expected EVIX: ~$37.98");
    
    const bvixExpected = 42.15;
    const evixExpected = 37.98;
    
    // Calculate required decimals
    const bvixDecimals = Math.log10(Number(bvixRaw) / bvixExpected);
    const evixDecimals = Math.log10(Number(evixRaw) / evixExpected);
    
    console.log(`BVIX needs ~${bvixDecimals.toFixed(1)} decimals`);
    console.log(`EVIX needs ~${evixDecimals.toFixed(1)} decimals`);
    
  } catch (error) {
    console.error("❌ Diagnosis failed:", error.message);
  }
}

main().catch(console.error); 