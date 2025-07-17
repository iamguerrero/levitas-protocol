const { ethers } = require("hardhat");

async function main() {
  console.log("=== COMPLETING DEPLOYMENT ===");
  
  // New addresses from the deployment
  const NEW_BVIX_ADDRESS = "0x75298e29fE21a5dcEFBe96988DdA957d421dc55C";
  const NEW_MINT_REDEEM_ADDRESS = "0xAec6c459354D31031Ef7f77bE974eeE39BD60382";
  
  console.log("New BVIX Token:", NEW_BVIX_ADDRESS);
  console.log("New MintRedeemV2:", NEW_MINT_REDEEM_ADDRESS);
  
  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  
  // Get contracts
  const bvixToken = await ethers.getContractAt("BVIXToken", NEW_BVIX_ADDRESS);
  const mintRedeem = await ethers.getContractAt("MintRedeemV2", NEW_MINT_REDEEM_ADDRESS);
  
  // Check current ownership
  const bvixOwner = await bvixToken.owner();
  const mintRedeemOwner = await mintRedeem.owner();
  
  console.log("Current BVIX owner:", bvixOwner);
  console.log("Current MintRedeemV2 owner:", mintRedeemOwner);
  
  // If deployer owns BVIX, transfer to MintRedeemV2
  if (bvixOwner === deployer.address) {
    console.log("Transferring BVIX ownership to MintRedeemV2...");
    
    const transferTx = await bvixToken.transferOwnership(NEW_MINT_REDEEM_ADDRESS);
    await transferTx.wait();
    
    console.log("✅ BVIX ownership transferred!");
    
    // Verify final ownership
    const finalOwner = await bvixToken.owner();
    console.log("Final BVIX owner:", finalOwner);
    
    if (finalOwner === NEW_MINT_REDEEM_ADDRESS) {
      console.log("🎉 OWNERSHIP SETUP COMPLETE!");
    }
  }
  
  // Test the mint function
  console.log("\n=== TESTING MINT FUNCTION ===");
  
  const MOCK_USDC_ADDRESS = "0x79640e0f510a7c6d59737442649d9600C84b035f";
  const USER_ADDRESS = "0xe18d3B075A241379D77fffE01eD1317ddA0e8bac";
  
  const usdcContract = await ethers.getContractAt("MockUSDC", MOCK_USDC_ADDRESS);
  
  // Check user's USDC balance
  const userBalance = await usdcContract.balanceOf(USER_ADDRESS);
  console.log("User USDC balance:", ethers.formatUnits(userBalance, 6));
  
  // Test with 100 USDC
  const testAmount = ethers.parseUnits("100", 6);
  
  console.log("Testing mint with 100 USDC...");
  
  try {
    // This should now work since MintRedeemV2 owns the BVIX token
    const result = await mintRedeem.mint.staticCall(testAmount);
    console.log("✅ MINT TEST SUCCESSFUL!");
    console.log("Would mint:", ethers.formatEther(result), "BVIX");
    
  } catch (error) {
    console.log("❌ Mint test failed:", error.message);
  }
  
  console.log("\n=== FINAL ADDRESSES TO UPDATE IN FRONTEND ===");
  console.log("BVIX_ADDRESS:", NEW_BVIX_ADDRESS);
  console.log("MINT_REDEEM_ADDRESS:", NEW_MINT_REDEEM_ADDRESS);
  console.log("MOCK_USDC_ADDRESS:", MOCK_USDC_ADDRESS);
  console.log("ORACLE_ADDRESS: 0x85485dD6cFaF5220150c413309C61a8EA24d24FE");
}

main().catch(console.error);