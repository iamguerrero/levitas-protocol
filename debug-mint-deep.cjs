const { ethers } = require("hardhat");

async function main() {
  const NEW_MINT_REDEEM = "0x685FEc86F539a1C0e9aEEf02894D5D90bfC48098";
  const MOCK_USDC_ADDRESS = "0x79640e0f510a7c6d59737442649d9600C84b035f";
  const BVIX_ADDRESS = "0xEA3d08a5A5bC48Fc984F0F773826693B7480bF48";
  const ORACLE_ADDRESS = "0x85485dD6cFaF5220150c413309C61a8EA24d24FE";
  
  const [user] = await ethers.getSigners();
  console.log("=== DEEP DEBUG: Contract Call Analysis ===");
  console.log("User address:", user.address);

  const usdcContract = await ethers.getContractAt("MockUSDC", MOCK_USDC_ADDRESS);
  const mintRedeem = await ethers.getContractAt("MintRedeemV2", NEW_MINT_REDEEM);
  const bvixContract = await ethers.getContractAt("BVIXToken", BVIX_ADDRESS);
  const oracleContract = await ethers.getContractAt("MockOracle", ORACLE_ADDRESS);
  
  // Check all balances and states
  const userBalance = await usdcContract.balanceOf(user.address);
  const vaultBalance = await usdcContract.balanceOf(NEW_MINT_REDEEM);
  const bvixSupply = await bvixContract.totalSupply();
  const oraclePrice = await oracleContract.getPrice();
  const allowance = await usdcContract.allowance(user.address, NEW_MINT_REDEEM);
  
  console.log("\n=== CURRENT STATE ===");
  console.log("User USDC balance:", ethers.formatUnits(userBalance, 6));
  console.log("Vault USDC balance:", ethers.formatUnits(vaultBalance, 6));
  console.log("BVIX supply:", ethers.formatEther(bvixSupply));
  console.log("Oracle price:", ethers.formatEther(oraclePrice));
  console.log("Current allowance:", ethers.formatUnits(allowance, 6));
  
  // Test amount
  const mintAmount = ethers.parseUnits("100", 6);
  console.log("\n=== TESTING MINT: 100 USDC ===");
  
  // Check if we have enough balance
  if (userBalance < mintAmount) {
    console.log("❌ Insufficient balance - but user says they have millions!");
    return;
  }
  
  // Try to simulate the mint first
  console.log("\n=== SIMULATING MINT ===");
  try {
    const result = await mintRedeem.mint.staticCall(mintAmount);
    console.log("✅ Static call successful, would mint:", ethers.formatEther(result));
  } catch (error) {
    console.log("❌ Static call failed:", error.message);
    
    // Check if it's a revert with reason
    if (error.message.includes("execution reverted")) {
      console.log("This is a contract revert - checking specific reasons...");
      
      // Check collateral ratio calculation
      const liability = Number(ethers.formatEther(bvixSupply)) * Number(ethers.formatEther(oraclePrice));
      const currentCR = Number(ethers.formatUnits(vaultBalance, 6)) / liability;
      const afterVault = Number(ethers.formatUnits(vaultBalance, 6)) + 100;
      const afterSupply = Number(ethers.formatEther(bvixSupply)) + (99.7 / Number(ethers.formatEther(oraclePrice)));
      const afterCR = afterVault / (afterSupply * Number(ethers.formatEther(oraclePrice)));
      
      console.log("Current CR:", (currentCR * 100).toFixed(1) + "%");
      console.log("After mint CR:", (afterCR * 100).toFixed(1) + "%");
      console.log("Min CR required: 120%");
      
      if (afterCR < 1.2) {
        console.log("❌ Would violate collateral ratio!");
      } else {
        console.log("✅ Collateral ratio looks fine");
      }
    }
  }
  
  // Try to get the actual revert reason
  console.log("\n=== CHECKING REVERT REASON ===");
  try {
    const tx = await mintRedeem.mint.populateTransaction(mintAmount);
    const result = await user.call(tx);
    console.log("Call result:", result);
  } catch (error) {
    console.log("Error details:", error);
  }
}

main().catch(console.error);