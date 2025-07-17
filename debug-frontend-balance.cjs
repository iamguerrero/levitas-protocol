const { ethers } = require("hardhat");

async function main() {
  const MOCK_USDC_ADDRESS = "0x79640e0f510a7c6d59737442649d9600C84b035f";
  const [user] = await ethers.getSigners();
  
  console.log("=== FRONTEND BALANCE DEBUG ===");
  console.log("User address:", user.address);
  console.log("USDC contract:", MOCK_USDC_ADDRESS);
  
  const usdcContract = await ethers.getContractAt("MockUSDC", MOCK_USDC_ADDRESS);
  
  // Get raw balance
  const balance = await usdcContract.balanceOf(user.address);
  console.log("Raw balance (wei):", balance.toString());
  console.log("Formatted balance:", ethers.formatUnits(balance, 6));
  
  // Let's also check if there's confusion with contract addresses
  console.log("\n=== CONTRACT INFO ===");
  try {
    const name = await usdcContract.name();
    const symbol = await usdcContract.symbol();
    const decimals = await usdcContract.decimals();
    console.log("Contract name:", name);
    console.log("Contract symbol:", symbol);  
    console.log("Contract decimals:", decimals);
  } catch (error) {
    console.log("Error getting contract info:", error.message);
  }
  
  // Check if the large number could be a different interpretation
  const largeBalance = 999979933.84;
  console.log("\n=== LARGE BALANCE ANALYSIS ===");
  console.log("Frontend shows:", largeBalance);
  console.log("As raw wei (6 decimals):", ethers.parseUnits(largeBalance.toString(), 6).toString());
  console.log("As raw wei (18 decimals):", ethers.parseUnits(largeBalance.toString(), 18).toString());
  
  // Try different formatting
  console.log("\n=== DIFFERENT FORMATTING ===");
  if (balance > 0) {
    console.log("As 18 decimals:", ethers.formatEther(balance));
    console.log("As 8 decimals:", ethers.formatUnits(balance, 8));
    console.log("As 6 decimals:", ethers.formatUnits(balance, 6));
  }
}

main().catch(console.error);