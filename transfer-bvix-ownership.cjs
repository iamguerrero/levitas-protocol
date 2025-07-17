const { ethers } = require("hardhat");

async function main() {
  console.log("=== TRANSFERRING BVIX OWNERSHIP ===");
  
  const OLD_CONTRACT = "0x1f3FB11995F1650D469649C476defB753766b2A0";
  const BVIX_ADDRESS = "0xEA3d08a5A5bC48Fc984F0F773826693B7480bF48";
  const NEW_MINT_REDEEM = "0x685FEc86F539a1C0e9aEEf02894D5D90bfC48098";
  const USER_ADDRESS = "0xe18d3B075A241379D77fffE01eD1317ddA0e8bac";
  
  console.log("Old contract (current BVIX owner):", OLD_CONTRACT);
  console.log("BVIX Token:", BVIX_ADDRESS);
  console.log("New MintRedeemV2 contract:", NEW_MINT_REDEEM);
  console.log("User address (old contract owner):", USER_ADDRESS);
  
  // Get BVIX contract
  const bvixToken = await ethers.getContractAt("BVIXToken", BVIX_ADDRESS);
  
  // Verify current ownership
  const currentBvixOwner = await bvixToken.owner();
  console.log("Current BVIX owner:", currentBvixOwner);
  
  if (currentBvixOwner !== OLD_CONTRACT) {
    console.log("❌ BVIX owner doesn't match expected old contract");
    return;
  }
  
  // We need to impersonate the user's address to execute the transfer
  // This simulates what would happen if the user called this function
  await ethers.provider.send("hardhat_impersonateAccount", [USER_ADDRESS]);
  const userSigner = await ethers.getSigner(USER_ADDRESS);
  
  // Connect to the old contract as the user
  const oldContract = await ethers.getContractAt("MintRedeem", OLD_CONTRACT);
  const oldContractWithUser = oldContract.connect(userSigner);
  
  // Verify the user owns the old contract
  const oldContractOwner = await oldContract.owner();
  console.log("Old contract owner:", oldContractOwner);
  
  if (oldContractOwner !== USER_ADDRESS) {
    console.log("❌ User doesn't own the old contract");
    return;
  }
  
  console.log("✅ User owns the old contract");
  
  // Now we need to transfer BVIX ownership
  // The old contract owns the BVIX token, so we need to call transferOwnership on BVIX
  // from the old contract's address
  
  console.log("Attempting to transfer BVIX ownership...");
  
  try {
    // Method 1: Check if the old contract has a function to transfer BVIX ownership
    console.log("Checking old contract functions...");
    
    // Let's try calling transferOwnership on the BVIX token
    // We need to call this as the old contract (which owns BVIX)
    
    // First, let's see if we can call transferOwnership directly on BVIX
    // from the old contract's context
    
    // Since the old contract owns BVIX, we need to execute the transfer
    // This depends on how the old contract was designed
    
    // For now, let's use a more direct approach
    console.log("Using direct transfer approach...");
    
    // We'll need to send a transaction that calls transferOwnership on BVIX
    // from the old contract's address
    
    // This is complex in a simulation, so let's create the transaction data
    const transferCalldata = bvixToken.interface.encodeFunctionData("transferOwnership", [NEW_MINT_REDEEM]);
    
    console.log("Transfer calldata:", transferCalldata);
    console.log("Target (BVIX):", BVIX_ADDRESS);
    
    // The user would need to call this transaction from their wallet
    // targeting the old contract, which then calls BVIX.transferOwnership
    
    console.log("\n=== INSTRUCTIONS FOR USER ===");
    console.log("The user needs to:");
    console.log("1. Connect to the old contract at:", OLD_CONTRACT);
    console.log("2. Call a function that transfers BVIX ownership");
    console.log("3. Or deploy a new BVIX token with proper ownership");
    
    console.log("\n=== SIMPLER SOLUTION ===");
    console.log("Deploy a new BVIX token with MintRedeemV2 as owner");
    
  } catch (error) {
    console.log("Transfer failed:", error.message);
  }
  
  console.log("\n=== RECOMMENDATION ===");
  console.log("The fastest solution is to deploy a new BVIX token");
  console.log("with the new MintRedeemV2 contract as the owner");
}

main().catch(console.error);