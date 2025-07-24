const { ethers } = require("hardhat");

async function main() {
  console.log("📊 Current Oracle Prices Check");
  console.log("==============================");
  
  const BVIX_ORACLE = "0x85485dD6cFaF5220150c413309C61a8EA24d24FE";
  const EVIX_ORACLE = "0xCd7441A771a7F84E58d98E598B7Ff23A3688094F";
  
  const bvixOracle = await ethers.getContractAt("MockOracle", BVIX_ORACLE);
  const evixOracle = await ethers.getContractAt("EVIXOracle", EVIX_ORACLE);
  
  const bvixPrice = await bvixOracle.getPrice();
  const evixPrice = await evixOracle.getPrice();
  
  console.log(`BVIX: $${ethers.formatUnits(bvixPrice, 8)} (raw: ${bvixPrice.toString()})`);
  console.log(`EVIX: $${ethers.formatUnits(evixPrice, 8)} (raw: ${evixPrice.toString()})`);
  
  console.log("\n🎯 These prices should be updating every 60 seconds!");
  console.log("💡 Refresh your browser to see the updated collateral ratios");
}

main().catch(console.error); 