const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 Simple Oracle Price Fix...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Using deployer:", deployer.address);
  
  const ORACLE_ADDRESS = "0x85485dD6cFaF5220150c413309C61a8EA24d24FE";
  
  try {
    // Get the contract
    const oracle = await ethers.getContractAt("MockOracle", ORACLE_ADDRESS, deployer);
    
    // Check current price
    const currentPrice = await oracle.getPrice();
    console.log("Current price (raw):", currentPrice.toString());
    
    // Set reasonable price: $42.15 with proper decimals
    // MockOracle just stores the value as-is, so we need to determine what format to use
    const correctPrice = ethers.parseUnits("42.15", 8); // Try 8 decimals first
    console.log("Setting price (8 decimals):", correctPrice.toString());
    
    const tx = await oracle.updatePrice(correctPrice);
    console.log("Transaction sent:", tx.hash);
    
    await tx.wait();
    console.log("✅ Transaction confirmed");
    
    // Verify
    const newPrice = await oracle.getPrice();
    console.log("New price (raw):", newPrice.toString());
    console.log("New price (8 decimals):", ethers.formatUnits(newPrice, 8));
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

main().catch(console.error); 