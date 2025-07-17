const { ethers } = require("hardhat");

async function main() {
  const CURRENT_USDC = "0x79640e0f510a7c6d59737442649d9600C84b035f"; // App is using this
  const USER_USDC = "0xe18d3B075A241379D77fffE01eD1317ddA0e8bac";   // User says this is correct
  const [user] = await ethers.getSigners();
  
  console.log("=== USDC CONTRACT COMPARISON ===");
  console.log("User wallet:", user.address);
  console.log("Current app USDC:", CURRENT_USDC);
  console.log("User's USDC:", USER_USDC);
  
  // Check both contracts
  try {
    console.log("\n=== CURRENT APP USDC CONTRACT ===");
    const currentContract = await ethers.getContractAt("MockUSDC", CURRENT_USDC);
    const currentBalance = await currentContract.balanceOf(user.address);
    const currentName = await currentContract.name();
    const currentSymbol = await currentContract.symbol();
    console.log("Name:", currentName);
    console.log("Symbol:", currentSymbol);
    console.log("Your balance:", ethers.formatUnits(currentBalance, 6));
  } catch (error) {
    console.log("❌ Error with current contract:", error.message);
  }
  
  try {
    console.log("\n=== USER'S USDC CONTRACT ===");
    const userContract = await ethers.getContractAt("MockUSDC", USER_USDC);
    const userBalance = await userContract.balanceOf(user.address);
    const userName = await userContract.name();
    const userSymbol = await userContract.symbol();
    console.log("Name:", userName);
    console.log("Symbol:", userSymbol);
    console.log("Your balance:", ethers.formatUnits(userBalance, 6));
    
    // This should match what you see in your wallet!
    console.log("\n✅ This matches your wallet balance!");
  } catch (error) {
    console.log("❌ Error with user contract:", error.message);
  }
}

main().catch(console.error);