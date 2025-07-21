const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
  console.log("🔑 Transferring token ownership to V6 contracts...");
  
  // Connect to Base Sepolia
  const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log("Using account:", wallet.address);

  // Contract addresses
  const BVIX_TOKEN_ADDRESS = "0xdcCCCC3A977cC0166788265eD4B683D41f3AED09";
  const EVIX_TOKEN_ADDRESS = "0x089C132BC246bF2060F40B0608Cb14b2A0cC9127";
  const BVIX_V6_ADDRESS = "0x2C1DB2D58f405596054A49CC03CDfDE0438EA1c4";
  const EVIX_V6_ADDRESS = "0xa86bc41e09a6a783B5361755Cbef482e5587b0d0";

  try {
    // Get contract artifacts
    const fs = require("fs");
    const path = require("path");
    
    const bvixTokenArtifact = JSON.parse(fs.readFileSync(path.join(__dirname, "artifacts/contracts/BVIXToken.sol/BVIXToken.json")));
    const evixTokenArtifact = JSON.parse(fs.readFileSync(path.join(__dirname, "artifacts/contracts/EVIXToken.sol/EVIXToken.json")));

    // Check and transfer BVIX ownership
    console.log("\n🔍 Checking BVIX token ownership...");
    const bvixToken = new ethers.Contract(BVIX_TOKEN_ADDRESS, bvixTokenArtifact.abi, provider);
    const bvixOwner = await bvixToken.owner();
    console.log("Current BVIX owner:", bvixOwner);
    
    if (bvixOwner.toLowerCase() === wallet.address.toLowerCase()) {
      console.log("✅ We own BVIX token, transferring to V6 contract...");
      const bvixTokenWithSigner = bvixToken.connect(wallet);
      await bvixTokenWithSigner.transferOwnership(BVIX_V6_ADDRESS);
      console.log("✅ BVIX ownership transferred to V6 contract!");
    } else {
      console.log("⚠️ We don't own BVIX token. Current owner:", bvixOwner);
      console.log("You may need to contact the current owner to transfer ownership.");
    }

    // Check and transfer EVIX ownership
    console.log("\n🔍 Checking EVIX token ownership...");
    const evixToken = new ethers.Contract(EVIX_TOKEN_ADDRESS, evixTokenArtifact.abi, provider);
    const evixOwner = await evixToken.owner();
    console.log("Current EVIX owner:", evixOwner);
    
    if (evixOwner.toLowerCase() === wallet.address.toLowerCase()) {
      console.log("✅ We own EVIX token, transferring to V6 contract...");
      const evixTokenWithSigner = evixToken.connect(wallet);
      await evixTokenWithSigner.transferOwnership(EVIX_V6_ADDRESS);
      console.log("✅ EVIX ownership transferred to V6 contract!");
    } else {
      console.log("⚠️ We don't own EVIX token. Current owner:", evixOwner);
      console.log("You may need to contact the current owner to transfer ownership.");
    }

    console.log("\n📝 Final V6 Contract Addresses:");
    console.log("BVIX MintRedeem V6:", BVIX_V6_ADDRESS);
    console.log("EVIX MintRedeem V6:", EVIX_V6_ADDRESS);

  } catch (error) {
    console.error("❌ Transfer failed:", error);
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}); 