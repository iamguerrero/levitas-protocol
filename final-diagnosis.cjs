const { ethers } = require("hardhat");

async function main() {
  const [user] = await ethers.getSigners();
  
  console.log("=== FINAL DIAGNOSIS ===");
  console.log("User address:", user.address);
  console.log("Network: Base Sepolia");
  
  // Check actual ETH balance
  const ethBalance = await user.provider.getBalance(user.address);
  console.log("ETH balance:", ethers.formatEther(ethBalance));
  
  // Check the app's USDC contract
  const APP_USDC = "0x79640e0f510a7c6d59737442649d9600C84b035f";
  const usdcContract = await ethers.getContractAt("MockUSDC", APP_USDC);
  const usdcBalance = await usdcContract.balanceOf(user.address);
  
  console.log("\n=== APP'S USDC CONTRACT ===");
  console.log("Address:", APP_USDC);
  console.log("Your balance:", ethers.formatUnits(usdcBalance, 6));
  
  // Check if user's wallet might be on different network
  console.log("\n=== NETWORK VERIFICATION ===");
  const network = await user.provider.getNetwork();
  console.log("Current network ID:", network.chainId);
  console.log("Expected: 84532 (Base Sepolia)");
  
  // Summary
  console.log("\n=== SUMMARY ===");
  if (usdcBalance > 0) {
    console.log("✅ You have USDC on the correct contract");
    console.log("The mint should work");
  } else {
    console.log("❌ You have 0 USDC on the app's contract");
    console.log("This explains the mint failure");
    console.log("The UI showing 999M USDC is cached/incorrect data");
  }
}

main().catch(console.error);