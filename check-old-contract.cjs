const { ethers } = require("hardhat");

async function main() {
  console.log("=== INVESTIGATING OLD CONTRACT ===");
  
  const OLD_OWNER = "0x1f3FB11995F1650D469649C476defB753766b2A0";
  const BVIX_ADDRESS = "0xEA3d08a5A5bC48Fc984F0F773826693B7480bF48";
  const NEW_MINT_REDEEM = "0x685FEc86F539a1C0e9aEEf02894D5D90bfC48098";
  
  console.log("Investigating:", OLD_OWNER);
  
  // Check if there's code at this address
  const code = await ethers.provider.getCode(OLD_OWNER);
  if (code === "0x") {
    console.log("❌ No contract code at this address - it's an EOA");
    return;
  }
  
  console.log("✅ Contract exists at this address");
  
  // Try to interact with it as an old MintRedeem contract
  try {
    const oldContract = await ethers.getContractAt("MintRedeem", OLD_OWNER);
    const owner = await oldContract.owner();
    console.log("Old contract owner:", owner);
    
    // Get deployer
    const [deployer] = await ethers.getSigners();
    console.log("Deployer address:", deployer.address);
    
    if (owner === deployer.address) {
      console.log("✅ Deployer owns the old contract!");
      console.log("We can transfer BVIX ownership through the old contract");
      
      // Get BVIX contract
      const bvixToken = await ethers.getContractAt("BVIXToken", BVIX_ADDRESS);
      
      // Connect old contract with deployer signer to transfer BVIX ownership
      const oldContractWithSigner = oldContract.connect(deployer);
      
      // Try to transfer ownership (this depends on if old contract has this function)
      console.log("Attempting to transfer BVIX ownership...");
      
      // We need to call transferOwnership on the BVIX token from the old contract
      // This might need to be done through the old contract's interface
      
      // Let's try a direct approach - have the old contract transfer ownership
      try {
        // This assumes the old contract has some admin function or we can use it to transfer
        const bvixWithOldContract = bvixToken.connect(deployer);
        
        // The old contract is the owner, so we need to call from that context
        // This is tricky because we need to execute from the old contract's context
        
        console.log("Direct transfer approach...");
        
        // Since the old contract owns BVIX, we need to deploy a new BVIX 
        // or find a way to transfer ownership
        
        console.log("❌ This is complex - we need to deploy a new BVIX token");
        console.log("The old contract owns the current BVIX token");
        
      } catch (error) {
        console.log("Direct transfer failed:", error.message);
      }
      
    } else {
      console.log("❌ Deployer doesn't own the old contract");
    }
    
  } catch (error) {
    console.log("Failed to interact as MintRedeem:", error.message);
    
    // Try as MintRedeemV2
    try {
      const oldContract = await ethers.getContractAt("MintRedeemV2", OLD_OWNER);
      const owner = await oldContract.owner();
      console.log("Old MintRedeemV2 owner:", owner);
    } catch (error2) {
      console.log("Failed to interact as MintRedeemV2:", error2.message);
    }
  }
  
  console.log("\n=== SOLUTION ===");
  console.log("The easiest solution is to:");
  console.log("1. Deploy a new BVIX token");
  console.log("2. Set the new MintRedeemV2 as owner");
  console.log("3. Update the frontend to use the new BVIX token");
}

main().catch(console.error);