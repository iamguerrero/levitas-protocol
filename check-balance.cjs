const { ethers } = require("hardhat");

async function main() {
  const MOCK_USDC_ADDRESS = "0x79640e0f510a7c6d59737442649d9600C84b035f";
  const [user] = await ethers.getSigners();
  
  console.log("=== BALANCE CHECK ===");
  console.log("User address:", user.address);
  console.log("Network: Base Sepolia");
  console.log("USDC contract:", MOCK_USDC_ADDRESS);
  
  const usdcContract = await ethers.getContractAt("MockUSDC", MOCK_USDC_ADDRESS);
  
  // Get balance
  const balance = await usdcContract.balanceOf(user.address);
  console.log("USDC balance:", ethers.formatUnits(balance, 6));
  
  // Try to get some test USDC
  console.log("\n=== TRYING TO GET TEST USDC ===");
  try {
    const mintAmount = ethers.parseUnits("1000", 6);
    const mintTx = await usdcContract.mint(user.address, mintAmount);
    await mintTx.wait();
    
    const newBalance = await usdcContract.balanceOf(user.address);
    console.log("✅ Successfully got test USDC!");
    console.log("New balance:", ethers.formatUnits(newBalance, 6));
  } catch (error) {
    console.log("❌ Failed to get test USDC:", error.message);
    console.log("You'll need to get USDC from other sources:");
    console.log("- QuickNode Faucet: https://faucet.quicknode.com/base/sepolia");
    console.log("- Alchemy Faucet: https://www.alchemy.com/faucets/base-sepolia");
    console.log("- Search for 'Base Sepolia USDC faucet'");
  }
}

main().catch(console.error);