const { ethers } = require("hardhat");

async function main() {
  console.log("=== FIXING BVIX TOKEN OWNERSHIP ===");
  
  const BVIX_ADDRESS = "0xEA3d08a5A5bC48Fc984F0F773826693B7480bF48";
  const NEW_MINT_REDEEM = "0x685FEc86F539a1C0e9aEEf02894D5D90bfC48098";
  
  console.log("BVIX Token:", BVIX_ADDRESS);
  console.log("MintRedeemV2:", NEW_MINT_REDEEM);
  
  // Get signer (deployer)
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  
  // Get BVIX contract
  const bvixToken = await ethers.getContractAt("BVIXToken", BVIX_ADDRESS);
  
  // Check current owner
  const currentOwner = await bvixToken.owner();
  console.log("Current BVIX owner:", currentOwner);
  
  // We need to find who owns the BVIX token and transfer it
  // First, let's check if deployer is the owner
  if (currentOwner === deployer.address) {
    console.log("✅ Deployer is the owner, transferring to MintRedeemV2...");
    
    const transferTx = await bvixToken.transferOwnership(NEW_MINT_REDEEM);
    await transferTx.wait();
    
    console.log("✅ Ownership transferred!");
    console.log("Transaction hash:", transferTx.hash);
    
    // Verify the transfer
    const newOwner = await bvixToken.owner();
    console.log("New BVIX owner:", newOwner);
    
    if (newOwner === NEW_MINT_REDEEM) {
      console.log("🎉 SUCCESS! MintRedeemV2 now owns BVIX token");
    } else {
      console.log("❌ Transfer failed");
    }
  } else {
    console.log("❌ Deployer is not the current owner of BVIX");
    console.log("Need to check who the current owner is and how to transfer");
    
    // Check if current owner is one of the old contracts
    const OLD_MINT_REDEEM = "0x44e3be6F86BF7d31E8eC4eaAE8e5B1C0e8F6F6BB";
    if (currentOwner === OLD_MINT_REDEEM) {
      console.log("Current owner is old MintRedeem contract");
      console.log("This might be from a previous deployment");
    }
  }
}

main().catch(console.error);