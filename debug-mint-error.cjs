const { ethers } = require("hardhat");

async function main() {
  const NEW_MINT_REDEEM = "0x685FEc86F539a1C0e9aEEf02894D5D90bfC48098";
  const MOCK_USDC_ADDRESS = "0x79640e0f510a7c6d59737442649d9600C84b035f";
  const BVIX_ADDRESS = "0xEA3d08a5A5bC48Fc984F0F773826693B7480bF48";
  const ORACLE_ADDRESS = "0x85485dD6cFaF5220150c413309C61a8EA24d24FE";
  
  const [user] = await ethers.getSigners();
  console.log("=== DEBUGGING MINT ERROR ===");
  console.log("User address:", user.address);
  console.log("Expected user address: 0xe18d3B075A241379D77fffE01eD1317ddA0e8bac");
  
  // Check if addresses match
  if (user.address.toLowerCase() !== "0xe18d3B075A241379D77fffE01eD1317ddA0e8bac".toLowerCase()) {
    console.log("❌ ADDRESS MISMATCH - This is the issue!");
    console.log("Hardhat is using a different address than your MetaMask");
    console.log("You need to use your MetaMask address for testing");
    return;
  }
  
  const usdcContract = await ethers.getContractAt("MockUSDC", MOCK_USDC_ADDRESS);
  const mintRedeem = await ethers.getContractAt("MintRedeemV2", NEW_MINT_REDEEM);
  
  // Check balances
  const userBalance = await usdcContract.balanceOf(user.address);
  const vaultBalance = await usdcContract.balanceOf(NEW_MINT_REDEEM);
  
  console.log("\n=== BALANCE CHECK ===");
  console.log("User USDC balance:", ethers.formatUnits(userBalance, 6));
  console.log("Vault USDC balance:", ethers.formatUnits(vaultBalance, 6));
  
  // Test mint with 100 USDC
  const mintAmount = ethers.parseUnits("100", 6);
  console.log("\n=== TESTING MINT CALL ===");
  
  // Check allowance first
  const allowance = await usdcContract.allowance(user.address, NEW_MINT_REDEEM);
  console.log("Current allowance:", ethers.formatUnits(allowance, 6));
  
  if (allowance < mintAmount) {
    console.log("Need to approve first...");
    try {
      const approveTx = await usdcContract.approve(NEW_MINT_REDEEM, mintAmount);
      await approveTx.wait();
      console.log("✅ Approved");
    } catch (error) {
      console.log("❌ Approval failed:", error.message);
      return;
    }
  }
  
  // Try to mint
  try {
    console.log("Attempting mint...");
    const result = await mintRedeem.mint.staticCall(mintAmount);
    console.log("✅ Static call successful, would mint:", ethers.formatEther(result));
    
    // If static call works, try actual mint
    const mintTx = await mintRedeem.mint(mintAmount);
    await mintTx.wait();
    console.log("✅ MINT SUCCESSFUL!");
    
  } catch (error) {
    console.log("❌ Mint failed:", error.message);
    
    // Detailed error analysis
    if (error.message.includes("execution reverted")) {
      console.log("\n=== REVERT ANALYSIS ===");
      console.log("This is a contract revert. Common causes:");
      console.log("1. Insufficient balance");
      console.log("2. Insufficient allowance");
      console.log("3. Collateral ratio violation");
      console.log("4. Contract bug");
      
      // Check each possibility
      if (userBalance < mintAmount) {
        console.log("❌ Insufficient balance");
      } else {
        console.log("✅ Balance sufficient");
      }
      
      const newAllowance = await usdcContract.allowance(user.address, NEW_MINT_REDEEM);
      if (newAllowance < mintAmount) {
        console.log("❌ Insufficient allowance");
      } else {
        console.log("✅ Allowance sufficient");
      }
    }
  }
}

main().catch(console.error);