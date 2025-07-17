const { ethers } = require("hardhat");

async function main() {
  const METAMASK_ADDRESS = "0xe18d3B075A241379D77fffE01eD1317ddA0e8bac";
  const MOCK_USDC_ADDRESS = "0x79640e0f510a7c6d59737442649d9600C84b035f";
  const NEW_MINT_REDEEM = "0x685FEc86F539a1C0e9aEEf02894D5D90bfC48098";
  
  console.log("=== CHECKING METAMASK ADDRESS ===");
  console.log("MetaMask address:", METAMASK_ADDRESS);
  console.log("USDC contract:", MOCK_USDC_ADDRESS);
  
  const provider = ethers.provider;
  const usdcContract = await ethers.getContractAt("MockUSDC", MOCK_USDC_ADDRESS);
  const mintRedeem = await ethers.getContractAt("MintRedeemV2", NEW_MINT_REDEEM);
  
  // Check MetaMask address balance
  const balance = await usdcContract.balanceOf(METAMASK_ADDRESS);
  console.log("USDC balance:", ethers.formatUnits(balance, 6));
  
  // Check allowance
  const allowance = await usdcContract.allowance(METAMASK_ADDRESS, NEW_MINT_REDEEM);
  console.log("Allowance:", ethers.formatUnits(allowance, 6));
  
  // Test mint simulation
  const mintAmount = ethers.parseUnits("100", 6);
  console.log("\n=== TESTING MINT SIMULATION ===");
  
  try {
    // We can't execute the mint because we don't have the private key
    // But we can simulate what would happen
    
    if (balance < mintAmount) {
      console.log("❌ Would fail: Insufficient balance");
      console.log("Balance:", ethers.formatUnits(balance, 6));
      console.log("Required:", ethers.formatUnits(mintAmount, 6));
    } else {
      console.log("✅ Balance sufficient:", ethers.formatUnits(balance, 6));
    }
    
    if (allowance < mintAmount) {
      console.log("❌ Would fail: Insufficient allowance");
      console.log("Allowance:", ethers.formatUnits(allowance, 6));
      console.log("Required:", ethers.formatUnits(mintAmount, 6));
    } else {
      console.log("✅ Allowance sufficient:", ethers.formatUnits(allowance, 6));
    }
    
    // Check if we can simulate the mint call
    console.log("\n=== STATIC CALL SIMULATION ===");
    try {
      // This won't work because we need to call from the actual address
      // But let's check what the error would be
      const result = await mintRedeem.mint.staticCall(mintAmount);
      console.log("Static call result:", ethers.formatEther(result));
    } catch (error) {
      console.log("Static call failed:", error.message);
      console.log("This is expected since we're not calling from the correct address");
    }
    
  } catch (error) {
    console.log("Error:", error.message);
  }
  
  console.log("\n=== CONCLUSION ===");
  console.log("The issue is likely in the frontend's Web3 integration.");
  console.log("MetaMask should be signing with your address, not Hardhat's.");
  console.log("Check the browser console for Web3 errors.");
}

main().catch(console.error);