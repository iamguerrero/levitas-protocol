const { ethers } = require("hardhat");

async function main() {
  console.log("🔄 Transferring BVIX ownership from V4 to V5...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  
  // Contract addresses
  const BVIX_ADDRESS = "0xcA7aC262190a3d126971281c496a521F5dD0f8D0";
  const V4_MINT_REDEEM_ADDRESS = "0x9d12b251f8F6c432b1Ecd6ef722Bf45A8aFdE6A8";
  const V5_MINT_REDEEM_ADDRESS = "0xFe9c81A98F33F15B279DE45ba022302113245D9F";
  
  try {
    // Connect to V4 contract (current owner)
    const V4Contract = await ethers.getContractAt("MintRedeemV4", V4_MINT_REDEEM_ADDRESS);
    
    // Check if V4 contract can transfer ownership
    console.log("Attempting to transfer BVIX ownership from V4 to V5...");
    
    // Get BVIX contract
    const BVIX = await ethers.getContractAt("BVIXToken", BVIX_ADDRESS);
    const currentOwner = await BVIX.owner();
    console.log("Current BVIX owner:", currentOwner);
    
    if (currentOwner.toLowerCase() === V4_MINT_REDEEM_ADDRESS.toLowerCase()) {
      console.log("V4 contract owns BVIX. Attempting transfer...");
      
      // Try calling transferBVIXOwnership if it exists
      try {
        const tx = await V4Contract.transferBVIXOwnership(V5_MINT_REDEEM_ADDRESS);
        await tx.wait();
        console.log("✅ Ownership transferred via V4 contract function!");
      } catch (error) {
        console.log("V4 transferBVIXOwnership failed:", error.message);
        
        // Try direct BVIX transfer if deployer is the owner of V4
        const v4Owner = await V4Contract.owner();
        console.log("V4 contract owner:", v4Owner);
        
        if (v4Owner.toLowerCase() === deployer.address.toLowerCase()) {
          console.log("Deployer owns V4, trying direct BVIX transfer...");
          const bvixTx = await BVIX.transferOwnership(V5_MINT_REDEEM_ADDRESS);
          await bvixTx.wait();
          console.log("✅ Direct BVIX ownership transfer successful!");
        } else {
          console.log("❌ Cannot transfer - deployer doesn't own V4 contract");
        }
      }
    } else {
      console.log("BVIX not owned by V4 contract");
    }
    
    // Verify new ownership
    const newOwner = await BVIX.owner();
    console.log("New BVIX owner:", newOwner);
    console.log("Transfer successful?", newOwner.toLowerCase() === V5_MINT_REDEEM_ADDRESS.toLowerCase());
    
  } catch (error) {
    console.error("❌ Transfer failed:", error.message);
    
    // If all else fails, suggest deploying new BVIX token
    console.log("\n💡 Alternative: Deploy fresh BVIX token owned by V5");
  }
}

main().catch(console.error);