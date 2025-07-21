const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
  console.log("🔍 Investigating V6 Ownership Issue...");
  
  // Connect to Base Sepolia
  const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log("Our deployer account:", wallet.address);
  
  // Contract addresses
  const BVIX_TOKEN_ADDRESS = "0xdcCCCC3A977cC0166788265eD4B683D41f3AED09";
  const EVIX_TOKEN_ADDRESS = "0x089C132BC246bF2060F40B0608Cb14b2A0cC9127";
  const BVIX_V6_ADDRESS = "0x2C1DB2D58f405596054A49CC03CDfDE0438EA1c4";
  const EVIX_V6_ADDRESS = "0xa86bc41e09a6a783B5361755Cbef482e5587b0d0";
  
  // Current owners from our investigation
  const BVIX_CURRENT_OWNER = "0x4d0ddFBCBa76f2e72B0Fef2fdDcaE9ddd6922397";
  const EVIX_CURRENT_OWNER = "0xb187c5Ff48D69BB0b477dAf30Eec779E0D07771D";

  try {
    // Get contract artifacts
    const fs = require("fs");
    const path = require("path");
    
    const bvixTokenArtifact = JSON.parse(fs.readFileSync(path.join(__dirname, "artifacts/contracts/BVIXToken.sol/BVIXToken.json")));
    const evixTokenArtifact = JSON.parse(fs.readFileSync(path.join(__dirname, "artifacts/contracts/EVIXToken.sol/EVIXToken.json")));

    console.log("\n📋 Current Ownership Status:");
    console.log("BVIX Token Owner:", BVIX_CURRENT_OWNER);
    console.log("EVIX Token Owner:", EVIX_CURRENT_OWNER);
    console.log("Our Address:", wallet.address);
    
    // Check if we can interact with these contracts
    console.log("\n🔍 Checking if we can interact with current owners...");
    
    // Try to get the BVIX owner contract
    const bvixToken = new ethers.Contract(BVIX_TOKEN_ADDRESS, bvixTokenArtifact.abi, provider);
    const evixToken = new ethers.Contract(EVIX_TOKEN_ADDRESS, evixTokenArtifact.abi, provider);
    
    const bvixOwner = await bvixToken.owner();
    const evixOwner = await evixToken.owner();
    
    console.log("Verified BVIX owner:", bvixOwner);
    console.log("Verified EVIX owner:", evixOwner);
    
    // Check if these are V5 contracts that we can upgrade
    console.log("\n🔍 Checking if current owners are V5 contracts...");
    
    try {
      // Try to get the BVIX V5 contract
      const bvixV5Contract = new ethers.Contract(BVIX_CURRENT_OWNER, bvixTokenArtifact.abi, provider);
      const bvixV5Owner = await bvixV5Contract.owner();
      console.log("BVIX V5 contract owner:", bvixV5Owner);
      
      if (bvixV5Owner.toLowerCase() === wallet.address.toLowerCase()) {
        console.log("✅ We own the BVIX V5 contract! We can transfer BVIX ownership.");
      } else {
        console.log("❌ We don't own the BVIX V5 contract. Owner:", bvixV5Owner);
      }
    } catch (error) {
      console.log("BVIX V5 contract not accessible or not a V5 contract");
    }
    
    try {
      // Try to get the EVIX V5 contract
      const evixV5Contract = new ethers.Contract(EVIX_CURRENT_OWNER, evixTokenArtifact.abi, provider);
      const evixV5Owner = await evixV5Contract.owner();
      console.log("EVIX V5 contract owner:", evixV5Owner);
      
      if (evixV5Owner.toLowerCase() === wallet.address.toLowerCase()) {
        console.log("✅ We own the EVIX V5 contract! We can transfer EVIX ownership.");
      } else {
        console.log("❌ We don't own the EVIX V5 contract. Owner:", evixV5Owner);
      }
    } catch (error) {
      console.log("EVIX V5 contract not accessible or not a V5 contract");
    }
    
    console.log("\n💡 SOLUTION OPTIONS:");
    console.log("1. If we own the V5 contracts, we can transfer token ownership to V6");
    console.log("2. If we don't own them, we need to deploy fresh tokens with V6 ownership");
    console.log("3. We can try to contact the current owners to transfer ownership");
    
    console.log("\n🚀 RECOMMENDED ACTION:");
    console.log("Let's deploy fresh tokens that we own and can transfer to V6 contracts!");
    
  } catch (error) {
    console.error("❌ Error investigating ownership:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}); 