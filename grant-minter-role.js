const { ethers } = require("hardhat");

async function main() {
  console.log("🔑 Granting MINTER_ROLE to BVIX MintRedeem V8...");
  
  const [deployer] = await ethers.getSigners();
  const BVIX_TOKEN_V8 = "0x7223A0Eb07B8d7d3CFbf84AC78eee4ae9DaA22CE";
  const BVIX_MINT_REDEEM_V8 = "0x653A6a4dCe04dABAEdb521091A889bb1EE298D8d";
  
  const BVIXToken = await ethers.getContractFactory("BVIXToken");
  const bvixToken = BVIXToken.attach(BVIX_TOKEN_V8);
  
  const MINTER_ROLE = await bvixToken.MINTER_ROLE();
  await bvixToken.grantRole(MINTER_ROLE, BVIX_MINT_REDEEM_V8);
  
  console.log("✅ MINTER_ROLE granted to BVIX MintRedeem V8");
  console.log("🎉 BVIX V8 is now fully functional - identical to EVIX V6!");
}

main().catch(console.error);