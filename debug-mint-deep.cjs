const { ethers } = require("hardhat");

async function main() {
  console.log("=== DEEP DEBUG OF MINT ISSUE ===");
  
  const V3_ADDRESS = "0xdB78c7D165724428eC8F11713B17F067F9b51Dc3";
  const BVIX_ADDRESS = "0x76c8c8ef73bA010579E47bD1372A55FBA7D55383";
  const MOCK_USDC_ADDRESS = "0x79640e0f510a7c6d59737442649d9600C84b035f";
  const USER_ADDRESS = "0xe18d3B075A241379D77fffE01eD1317ddA0e8bac";
  
  const mintRedeemV3 = await ethers.getContractAt("MintRedeemV3", V3_ADDRESS);
  const bvixToken = await ethers.getContractAt("BVIXToken", BVIX_ADDRESS);
  const usdcContract = await ethers.getContractAt("MockUSDC", MOCK_USDC_ADDRESS);
  
  // Check ownership
  const bvixOwner = await bvixToken.owner();
  console.log("BVIX owner:", bvixOwner);
  console.log("Should be:", V3_ADDRESS);
  
  if (bvixOwner !== V3_ADDRESS) {
    console.log("❌ OWNERSHIP ISSUE - BVIX is not owned by MintRedeemV3");
    return;
  }
  
  // Check supplies and balances
  const vaultBalance = await usdcContract.balanceOf(V3_ADDRESS);
  const bvixSupply = await bvixToken.totalSupply();
  const userBalance = await usdcContract.balanceOf(USER_ADDRESS);
  
  console.log("Vault USDC balance:", ethers.formatUnits(vaultBalance, 6));
  console.log("BVIX total supply:", ethers.formatEther(bvixSupply));
  console.log("User USDC balance:", ethers.formatUnits(userBalance, 6));
  
  // Check if supply is exactly zero
  if (bvixSupply === 0n) {
    console.log("✅ Supply is zero - bootstrap condition should trigger");
  } else {
    console.log("❌ Supply is not zero:", bvixSupply.toString());
  }
  
  // Test the calculation manually
  console.log("\n=== MANUAL CALCULATION ===");
  
  const testAmount = ethers.parseUnits("100", 6);
  const price = await mintRedeemV3.oracle().then(addr => 
    ethers.getContractAt("MockOracle", addr)
  ).then(oracle => oracle.getPrice());
  
  console.log("Test amount:", ethers.formatUnits(testAmount, 6), "USDC");
  console.log("Oracle price:", ethers.formatEther(price), "USD");
  
  // Calculate mint amount
  const mintFee = 30; // 0.30%
  const netAmount = testAmount - ((testAmount * BigInt(mintFee)) / BigInt(10000));
  const bvixToMint = (netAmount * BigInt(1e30)) / price;
  
  console.log("Net amount after fee:", ethers.formatUnits(netAmount, 6), "USDC");
  console.log("BVIX to mint:", ethers.formatEther(bvixToMint));
  
  // Check if this is positive
  if (bvixToMint > 0n) {
    console.log("✅ BVIX to mint is positive");
  } else {
    console.log("❌ BVIX to mint is zero or negative");
  }
  
  // Try the actual mint with detailed error analysis
  console.log("\n=== TESTING ACTUAL MINT ===");
  
  try {
    const result = await mintRedeemV3.mint.staticCall(testAmount);
    console.log("✅ SUCCESS! Would mint:", ethers.formatEther(result), "BVIX");
  } catch (error) {
    console.log("❌ Mint failed:", error.message);
    
    // Check if it's a fee calculation issue
    if (error.message.includes("Mint amount too small")) {
      console.log("Issue: Calculated mint amount is too small");
      console.log("This could be due to fee calculation or precision issues");
    }
    
    // Check if it's an allowance issue
    if (error.message.includes("transfer amount exceeds allowance")) {
      console.log("Issue: User hasn't approved USDC spending");
      
      const allowance = await usdcContract.allowance(USER_ADDRESS, V3_ADDRESS);
      console.log("Current allowance:", ethers.formatUnits(allowance, 6));
    }
    
    // Check if it's a balance issue
    if (error.message.includes("transfer amount exceeds balance")) {
      console.log("Issue: User doesn't have enough USDC");
    }
  }
  
  console.log("\n=== DIRECT APPROACH ===");
  console.log("Let me try a different approach with a larger amount to ensure it's not a precision issue");
  
  const largerAmount = ethers.parseUnits("1000", 6);
  try {
    const result = await mintRedeemV3.mint.staticCall(largerAmount);
    console.log("✅ Larger amount works! Would mint:", ethers.formatEther(result), "BVIX");
  } catch (error) {
    console.log("❌ Larger amount also fails:", error.message);
  }
}

main().catch(console.error);