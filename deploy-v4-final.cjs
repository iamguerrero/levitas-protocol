const { ethers } = require("hardhat");

async function main() {
  console.log("=== DEPLOYING V4 FINAL VERSION - NO COLLATERAL RATIO CHECK ===");
  
  const MOCK_USDC_ADDRESS = "0x79640e0f510a7c6d59737442649d9600C84b035f";
  const ORACLE_ADDRESS = "0x85485dD6cFaF5220150c413309C61a8EA24d24FE";
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  
  // Deploy fresh BVIX token
  const BVIXToken = await ethers.getContractFactory("BVIXToken");
  const bvixToken = await BVIXToken.deploy(deployer.address);
  await bvixToken.waitForDeployment();
  const bvixAddress = await bvixToken.getAddress();
  console.log("✅ BVIX deployed at:", bvixAddress);
  
  // Deploy MintRedeemV4
  const MintRedeemV4 = await ethers.getContractFactory("MintRedeemV4");
  const mintRedeemV4 = await MintRedeemV4.deploy(
    MOCK_USDC_ADDRESS,
    bvixAddress,
    ORACLE_ADDRESS,
    deployer.address
  );
  await mintRedeemV4.waitForDeployment();
  const mintRedeemAddress = await mintRedeemV4.getAddress();
  console.log("✅ MintRedeemV4 deployed at:", mintRedeemAddress);
  
  // Transfer ownership
  const transferTx = await bvixToken.transferOwnership(mintRedeemAddress);
  await transferTx.wait();
  console.log("✅ Ownership transferred!");
  
  // Verify ownership
  const finalOwner = await bvixToken.owner();
  console.log("Final BVIX owner:", finalOwner);
  
  if (finalOwner === mintRedeemAddress) {
    console.log("🎉 SUCCESS! V4 Final contracts deployed with NO collateral ratio check");
    
    console.log("\n=== V4 FINAL ADDRESSES ===");
    console.log("BVIX_ADDRESS:", bvixAddress);
    console.log("MINT_REDEEM_ADDRESS:", mintRedeemAddress);
    console.log("MOCK_USDC_ADDRESS:", MOCK_USDC_ADDRESS);
    console.log("ORACLE_ADDRESS:", ORACLE_ADDRESS);
    
    console.log("\n=== UPDATE THESE IN FRONTEND ===");
    console.log(`export const MINT_REDEEM_ADDRESS = "${mintRedeemAddress}";`);
    console.log(`export const BVIX_ADDRESS = "${bvixAddress}";`);
    
  } else {
    console.log("❌ Ownership issue");
  }
}

main().catch(console.error);