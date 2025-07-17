const { ethers } = require("hardhat");

async function main() {
  console.log("=== DEPLOYING NEW BVIX TOKEN ===");
  
  const NEW_MINT_REDEEM = "0x685FEc86F539a1C0e9aEEf02894D5D90bfC48098";
  
  console.log("New MintRedeemV2 contract:", NEW_MINT_REDEEM);
  
  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  
  // Deploy new BVIX token with MintRedeemV2 as owner
  console.log("Deploying new BVIX token...");
  
  const BVIXToken = await ethers.getContractFactory("BVIXToken");
  const newBvixToken = await BVIXToken.deploy(NEW_MINT_REDEEM);
  
  await newBvixToken.waitForDeployment();
  const newBvixAddress = await newBvixToken.getAddress();
  
  console.log("✅ New BVIX token deployed at:", newBvixAddress);
  
  // Verify ownership
  const owner = await newBvixToken.owner();
  console.log("New BVIX owner:", owner);
  
  if (owner === NEW_MINT_REDEEM) {
    console.log("🎉 SUCCESS! MintRedeemV2 owns the new BVIX token");
    
    // Now we need to update the MintRedeemV2 contract to use the new BVIX token
    console.log("\n=== UPDATING MINT_REDEEM CONTRACT ===");
    
    const mintRedeem = await ethers.getContractAt("MintRedeemV2", NEW_MINT_REDEEM);
    
    // Check if MintRedeemV2 has a function to update BVIX address
    try {
      const currentBvixAddress = await mintRedeem.bvix();
      console.log("Current BVIX in MintRedeem:", currentBvixAddress);
      
      // MintRedeemV2 constructor sets the BVIX address, so we need to deploy a new MintRedeemV2
      console.log("Need to deploy new MintRedeemV2 with correct BVIX address");
      
      // Deploy new MintRedeemV2 with the new BVIX token
      const MOCK_USDC_ADDRESS = "0x79640e0f510a7c6d59737442649d9600C84b035f";
      const ORACLE_ADDRESS = "0x85485dD6cFaF5220150c413309C61a8EA24d24FE";
      
      console.log("Deploying new MintRedeemV2...");
      
      const MintRedeemV2 = await ethers.getContractFactory("MintRedeemV2");
      const newMintRedeem = await MintRedeemV2.deploy(
        MOCK_USDC_ADDRESS,
        newBvixAddress,
        ORACLE_ADDRESS,
        deployer.address
      );
      
      await newMintRedeem.waitForDeployment();
      const newMintRedeemAddress = await newMintRedeem.getAddress();
      
      console.log("✅ New MintRedeemV2 deployed at:", newMintRedeemAddress);
      
      // Transfer BVIX ownership to new MintRedeemV2
      console.log("Transferring BVIX ownership to new MintRedeemV2...");
      
      const transferTx = await newBvixToken.transferOwnership(newMintRedeemAddress);
      await transferTx.wait();
      
      console.log("✅ BVIX ownership transferred!");
      
      // Verify final ownership
      const finalOwner = await newBvixToken.owner();
      console.log("Final BVIX owner:", finalOwner);
      
      if (finalOwner === newMintRedeemAddress) {
        console.log("🎉 COMPLETE SUCCESS!");
        console.log("\n=== NEW CONTRACT ADDRESSES ===");
        console.log("New BVIX Token:", newBvixAddress);
        console.log("New MintRedeemV2:", newMintRedeemAddress);
        console.log("\nUpdate these addresses in the frontend!");
      }
      
    } catch (error) {
      console.log("Error updating MintRedeem:", error.message);
    }
    
  } else {
    console.log("❌ Ownership setup failed");
  }
}

main().catch(console.error);