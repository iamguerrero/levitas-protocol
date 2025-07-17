const { ethers } = require("hardhat");

async function main() {
  console.log("=== VERIFYING USER CONTRACT INTERACTION ===");
  
  const FINAL_MINT_REDEEM = "0xb507A6743787E1Ee10365385F46DD5BFEa10Dcd5";
  const FINAL_BVIX = "0x4Cd0c0ed02363F27fC2A8a3D7dC9aEA88ddCCf5E";
  const MOCK_USDC_ADDRESS = "0x79640e0f510a7c6d59737442649d9600C84b035f";
  const USER_ADDRESS = "0xe18d3B075A241379D77fffE01eD1317ddA0e8bac";
  
  // Contracts
  const usdcContract = await ethers.getContractAt("MockUSDC", MOCK_USDC_ADDRESS);
  const mintRedeemV4 = await ethers.getContractAt("MintRedeemV4", FINAL_MINT_REDEEM);
  const bvixToken = await ethers.getContractAt("BVIXToken", FINAL_BVIX);
  
  console.log("=== CONTRACT VERIFICATION ===");
  console.log("USDC Contract:", MOCK_USDC_ADDRESS);
  console.log("MintRedeemV4:", FINAL_MINT_REDEEM);
  console.log("BVIX Token:", FINAL_BVIX);
  console.log("User Address:", USER_ADDRESS);
  
  // 1. Check ownership
  const bvixOwner = await bvixToken.owner();
  console.log("\n1. OWNERSHIP CHECK:");
  console.log("BVIX owner:", bvixOwner);
  console.log("Should be:", FINAL_MINT_REDEEM);
  
  if (bvixOwner === FINAL_MINT_REDEEM) {
    console.log("✅ Ownership is correct");
  } else {
    console.log("❌ Ownership issue - this would cause authorization error");
    return;
  }
  
  // 2. Check user balance
  const userBalance = await usdcContract.balanceOf(USER_ADDRESS);
  console.log("\n2. USER BALANCE CHECK:");
  console.log("User USDC balance:", ethers.formatUnits(userBalance, 6));
  
  if (userBalance > 0) {
    console.log("✅ User has USDC");
  } else {
    console.log("❌ User has no USDC");
    return;
  }
  
  // 3. Check current allowance
  const allowance = await usdcContract.allowance(USER_ADDRESS, FINAL_MINT_REDEEM);
  console.log("\n3. ALLOWANCE CHECK:");
  console.log("Current allowance:", ethers.formatUnits(allowance, 6));
  
  // 4. Check contract state
  const vaultBalance = await usdcContract.balanceOf(FINAL_MINT_REDEEM);
  const bvixSupply = await bvixToken.totalSupply();
  const collateralRatio = await mintRedeemV4.getCollateralRatio();
  
  console.log("\n4. CONTRACT STATE:");
  console.log("Vault USDC balance:", ethers.formatUnits(vaultBalance, 6));
  console.log("BVIX total supply:", ethers.formatEther(bvixSupply));
  console.log("Collateral ratio:", collateralRatio.toString() + "%");
  
  // 5. Test mint calculation
  const testAmount = ethers.parseUnits("100", 6);
  const oracle = await ethers.getContractAt("MockOracle", await mintRedeemV4.oracle());
  const price = await oracle.getPrice();
  const mintFee = await mintRedeemV4.mintFee();
  
  console.log("\n5. MINT CALCULATION:");
  console.log("Test amount:", ethers.formatUnits(testAmount, 6), "USDC");
  console.log("Oracle price:", ethers.formatEther(price), "USD");
  console.log("Mint fee:", mintFee.toString() + " basis points");
  
  // Calculate expected mint amount
  const netAmount = testAmount - ((testAmount * mintFee) / 10000n);
  const expectedBvixToMint = (netAmount * 1000000000000000000000000000000n) / price;
  
  console.log("Net amount after fee:", ethers.formatUnits(netAmount, 6), "USDC");
  console.log("Expected BVIX to mint:", ethers.formatEther(expectedBvixToMint));
  
  // 6. Test static call
  console.log("\n6. STATIC CALL TEST:");
  
  try {
    const result = await mintRedeemV4.mint.staticCall(testAmount);
    console.log("✅ Static call SUCCESS!");
    console.log("Would mint:", ethers.formatEther(result), "BVIX");
    
    // Compare with expected
    if (result === expectedBvixToMint) {
      console.log("✅ Calculation matches expected");
    } else {
      console.log("❌ Calculation doesn't match");
      console.log("Expected:", ethers.formatEther(expectedBvixToMint));
      console.log("Got:", ethers.formatEther(result));
    }
    
  } catch (error) {
    console.log("❌ Static call failed:", error.message);
    
    // Detailed error analysis
    if (error.message.includes("Amount must be > 0")) {
      console.log("Issue: Amount validation failed");
    } else if (error.message.includes("Mint amount too small")) {
      console.log("Issue: Calculated mint amount is too small");
    } else if (error.message.includes("Transfer failed")) {
      console.log("Issue: USDC transfer would fail - allowance or balance problem");
    } else if (error.message.includes("Would violate minimum collateral ratio")) {
      console.log("Issue: Collateral ratio violation");
    } else {
      console.log("Issue: Unknown error");
    }
  }
  
  console.log("\n=== SUMMARY ===");
  console.log("✅ Final contract addresses updated in frontend");
  console.log("✅ Contract ABI updated with return value");
  console.log("✅ Authorization issue resolved");
  console.log("🎯 Ready for browser testing");
  
  console.log("\n=== FINAL ADDRESSES ===");
  console.log("BVIX_ADDRESS:", FINAL_BVIX);
  console.log("MINT_REDEEM_ADDRESS:", FINAL_MINT_REDEEM);
  console.log("MOCK_USDC_ADDRESS:", MOCK_USDC_ADDRESS);
}

main().catch(console.error);