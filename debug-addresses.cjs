const { ethers } = require("hardhat");

async function main() {
  console.log("=== DEBUGGING CONTRACT OWNERSHIP ===");
  
  const BVIX_ADDRESS = "0xEA3d08a5A5bC48Fc984F0F773826693B7480bF48";
  const NEW_MINT_REDEEM = "0x685FEc86F539a1C0e9aEEf02894D5D90bfC48098";
  
  console.log("BVIX Token:", BVIX_ADDRESS);
  console.log("MintRedeemV2:", NEW_MINT_REDEEM);
  
  // Get the owner of BVIX token
  const bvixToken = await ethers.getContractAt("BVIXToken", BVIX_ADDRESS);
  const bvixOwner = await bvixToken.owner();
  console.log("BVIX Token Owner:", bvixOwner);
  
  // Get the owner of MintRedeemV2
  const mintRedeem = await ethers.getContractAt("MintRedeemV2", NEW_MINT_REDEEM);
  const mintRedeemOwner = await mintRedeem.owner();
  console.log("MintRedeemV2 Owner:", mintRedeemOwner);
  
  // Check if MintRedeemV2 is the owner of BVIX
  if (bvixOwner === NEW_MINT_REDEEM) {
    console.log("✅ MintRedeemV2 is the owner of BVIX Token");
  } else {
    console.log("❌ MintRedeemV2 is NOT the owner of BVIX Token");
    console.log("This is the problem! The BVIX token needs to be owned by MintRedeemV2");
  }
  
  // Show the hardhat default account
  const [deployer] = await ethers.getSigners();
  console.log("Hardhat deployer:", deployer.address);
  
  if (bvixOwner === deployer.address) {
    console.log("✅ BVIX is owned by Hardhat deployer");
    console.log("SOLUTION: Transfer BVIX ownership to MintRedeemV2");
  }
}

main().catch(console.error);