const { ethers } = require("hardhat");

async function main() {
  const MOCK_USDC_ADDRESS = "0x79640e0f510a7c6d59737442649d9600C84b035f";
  const [user] = await ethers.getSigners();
  
  console.log("=== GETTING TEST USDC FOR PERSONAL WALLET ===");
  console.log("Your wallet:", user.address);
  
  const usdcContract = await ethers.getContractAt("MockUSDC", MOCK_USDC_ADDRESS);
  
  // Check current balance
  const currentBalance = await usdcContract.balanceOf(user.address);
  console.log("Current balance:", ethers.formatUnits(currentBalance, 6), "USDC");
  
  // Try various methods to get test USDC
  console.log("\n=== TRYING TO GET TEST USDC ===");
  
  // Method 1: Direct mint
  try {
    console.log("Trying direct mint...");
    const mintTx = await usdcContract.mint(user.address, ethers.parseUnits("1000", 6));
    await mintTx.wait();
    console.log("✅ Direct mint successful!");
    
    const newBalance = await usdcContract.balanceOf(user.address);
    console.log("New balance:", ethers.formatUnits(newBalance, 6), "USDC");
    return;
  } catch (error) {
    console.log("❌ Direct mint failed:", error.message);
  }
  
  // Method 2: Check if there's a faucet function
  try {
    console.log("Trying faucet function...");
    const faucetTx = await usdcContract.faucet();
    await faucetTx.wait();
    console.log("✅ Faucet successful!");
    
    const newBalance = await usdcContract.balanceOf(user.address);
    console.log("New balance:", ethers.formatUnits(newBalance, 6), "USDC");
    return;
  } catch (error) {
    console.log("❌ Faucet failed:", error.message);
  }
  
  // Method 3: Check if owner can mint
  try {
    console.log("Trying owner mint...");
    const ownerTx = await usdcContract.ownerMint(user.address, ethers.parseUnits("1000", 6));
    await ownerTx.wait();
    console.log("✅ Owner mint successful!");
    
    const newBalance = await usdcContract.balanceOf(user.address);
    console.log("New balance:", ethers.formatUnits(newBalance, 6), "USDC");
    return;
  } catch (error) {
    console.log("❌ Owner mint failed:", error.message);
  }
  
  console.log("\n=== ALL METHODS FAILED ===");
  console.log("You need to get test USDC from external sources:");
  console.log("• https://faucet.quicknode.com/base/sepolia");
  console.log("• https://www.alchemy.com/faucets/base-sepolia");
  console.log("• Search for 'Base Sepolia USDC faucet'");
  console.log("• Or ask someone to send you test USDC");
}

main().catch(console.error);