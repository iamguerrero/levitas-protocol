const { ethers } = require("hardhat");

async function main() {
  const NEW_MINT_REDEEM = "0x685FEc86F539a1C0e9aEEf02894D5D90bfC48098";
  
  console.log("=== VERIFYING CONTRACT DEPLOYMENT ===");
  console.log("MintRedeemV2 address:", NEW_MINT_REDEEM);
  
  // Check if contract exists
  const code = await ethers.provider.getCode(NEW_MINT_REDEEM);
  if (code === "0x") {
    console.log("❌ Contract not deployed at this address");
    return;
  }
  
  console.log("✅ Contract exists");
  
  // Try to interact with contract
  const mintRedeem = await ethers.getContractAt("MintRedeemV2", NEW_MINT_REDEEM);
  
  try {
    // Check if we can call basic functions
    console.log("\n=== TESTING CONTRACT FUNCTIONS ===");
    
    // Test getters
    const minCollateralRatio = await mintRedeem.minCollateralRatio();
    console.log("Min collateral ratio:", minCollateralRatio.toString());
    
    const feeRate = await mintRedeem.feeRate();
    console.log("Fee rate:", feeRate.toString());
    
    const usdcToken = await mintRedeem.usdcToken();
    console.log("USDC token address:", usdcToken);
    
    const bvixToken = await mintRedeem.bvixToken();
    console.log("BVIX token address:", bvixToken);
    
    const oracle = await mintRedeem.oracle();
    console.log("Oracle address:", oracle);
    
    console.log("✅ All basic functions working");
    
  } catch (error) {
    console.log("❌ Contract interaction failed:", error.message);
    console.log("This might be an ABI mismatch or contract issue");
  }
  
  console.log("\n=== CONTRACT VERIFICATION COMPLETE ===");
}

main().catch(console.error);