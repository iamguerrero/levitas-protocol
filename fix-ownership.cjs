const { ethers } = require("hardhat");

async function main() {
  console.log("=== FIXING OWNERSHIP ISSUE ===");
  
  const NEW_BVIX_ADDRESS = "0x75298e29fE21a5dcEFBe96988DdA957d421dc55C";
  const NEW_MINT_REDEEM_ADDRESS = "0xAec6c459354D31031Ef7f77bE974eeE39BD60382";
  const OLD_MINT_REDEEM_ADDRESS = "0x685FEc86F539a1C0e9aEEf02894D5D90bfC48098";
  
  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  
  // Get BVIX contract
  const bvixToken = await ethers.getContractAt("BVIXToken", NEW_BVIX_ADDRESS);
  
  // Check current owner
  const currentOwner = await bvixToken.owner();
  console.log("Current BVIX owner:", currentOwner);
  console.log("Should be:", NEW_MINT_REDEEM_ADDRESS);
  
  if (currentOwner === OLD_MINT_REDEEM_ADDRESS) {
    console.log("BVIX is owned by old MintRedeem contract");
    
    // Try to get the old contract and transfer ownership
    try {
      const oldContract = await ethers.getContractAt("MintRedeemV2", OLD_MINT_REDEEM_ADDRESS);
      const oldOwner = await oldContract.owner();
      console.log("Old contract owner:", oldOwner);
      
      if (oldOwner === deployer.address) {
        console.log("Deployer owns old contract, can transfer BVIX ownership");
        
        // This won't work directly because the old contract doesn't have a function to transfer BVIX ownership
        // Let's deploy a completely fresh set of contracts
        console.log("Need to deploy fresh contracts with proper ownership");
      }
    } catch (error) {
      console.log("Error accessing old contract:", error.message);
    }
  }
  
  // Deploy completely fresh contracts
  console.log("\n=== DEPLOYING FRESH CONTRACTS ===");
  
  const MOCK_USDC_ADDRESS = "0x79640e0f510a7c6d59737442649d9600C84b035f";
  const ORACLE_ADDRESS = "0x85485dD6cFaF5220150c413309C61a8EA24d24FE";
  
  // Deploy fresh BVIX token
  console.log("Deploying fresh BVIX token...");
  const BVIXToken = await ethers.getContractFactory("BVIXToken");
  const freshBvixToken = await BVIXToken.deploy(deployer.address); // Deploy with deployer as owner
  
  await freshBvixToken.waitForDeployment();
  const freshBvixAddress = await freshBvixToken.getAddress();
  console.log("✅ Fresh BVIX deployed at:", freshBvixAddress);
  
  // Deploy fresh MintRedeemV2
  console.log("Deploying fresh MintRedeemV2...");
  const MintRedeemV2 = await ethers.getContractFactory("MintRedeemV2");
  const freshMintRedeem = await MintRedeemV2.deploy(
    MOCK_USDC_ADDRESS,
    freshBvixAddress,
    ORACLE_ADDRESS,
    deployer.address
  );
  
  await freshMintRedeem.waitForDeployment();
  const freshMintRedeemAddress = await freshMintRedeem.getAddress();
  console.log("✅ Fresh MintRedeemV2 deployed at:", freshMintRedeemAddress);
  
  // Transfer BVIX ownership to MintRedeemV2
  console.log("Transferring BVIX ownership...");
  const transferTx = await freshBvixToken.transferOwnership(freshMintRedeemAddress);
  await transferTx.wait();
  console.log("✅ Ownership transferred!");
  
  // Verify ownership
  const finalOwner = await freshBvixToken.owner();
  console.log("Final BVIX owner:", finalOwner);
  
  if (finalOwner === freshMintRedeemAddress) {
    console.log("🎉 SUCCESS! Ownership correctly configured");
    
    // Test mint
    console.log("\n=== TESTING MINT ===");
    const testAmount = ethers.parseUnits("100", 6);
    
    try {
      const result = await freshMintRedeem.mint.staticCall(testAmount);
      console.log("✅ MINT WORKS!");
      console.log("Would mint:", ethers.formatEther(result), "BVIX");
    } catch (error) {
      console.log("Mint test:", error.message);
      if (error.message.includes("Would violate minimum collateral ratio")) {
        console.log("This is expected for empty vault - need to bootstrap with collateral");
      }
    }
    
    console.log("\n=== NEW ADDRESSES FOR FRONTEND ===");
    console.log("BVIX_ADDRESS:", freshBvixAddress);
    console.log("MINT_REDEEM_ADDRESS:", freshMintRedeemAddress);
    console.log("MOCK_USDC_ADDRESS:", MOCK_USDC_ADDRESS);
    console.log("ORACLE_ADDRESS:", ORACLE_ADDRESS);
  } else {
    console.log("❌ Ownership transfer failed");
  }
}

main().catch(console.error);