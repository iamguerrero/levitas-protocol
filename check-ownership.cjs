const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
  console.log("🔍 Checking token ownership...");
  
  // Connect to Base Sepolia
  const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log("Checking with account:", wallet.address);

  // Contract addresses
  const BVIX_TOKEN_ADDRESS = "0xdcCCCC3A977cC0166788265eD4B683D41f3AED09";
  const EVIX_TOKEN_ADDRESS = "0x089C132BC246bF2060F40B0608Cb14b2A0cC9127";

  try {
    // Get contract artifacts
    const fs = require("fs");
    const path = require("path");
    
    const bvixTokenArtifact = JSON.parse(fs.readFileSync(path.join(__dirname, "artifacts/contracts/BVIXToken.sol/BVIXToken.json")));
    const evixTokenArtifact = JSON.parse(fs.readFileSync(path.join(__dirname, "artifacts/contracts/EVIXToken.sol/EVIXToken.json")));

    // Check BVIX ownership
    console.log("\n🔍 Checking BVIX token ownership...");
    const bvixToken = new ethers.Contract(BVIX_TOKEN_ADDRESS, bvixTokenArtifact.abi, provider);
    const bvixOwner = await bvixToken.owner();
    console.log("BVIX Token Owner:", bvixOwner);
    console.log("Our address:", wallet.address);
    console.log("Is owner?", bvixOwner.toLowerCase() === wallet.address.toLowerCase());

    // Check EVIX ownership
    console.log("\n🔍 Checking EVIX token ownership...");
    const evixToken = new ethers.Contract(EVIX_TOKEN_ADDRESS, evixTokenArtifact.abi, provider);
    const evixOwner = await evixToken.owner();
    console.log("EVIX Token Owner:", evixOwner);
    console.log("Our address:", wallet.address);
    console.log("Is owner?", evixOwner.toLowerCase() === wallet.address.toLowerCase());

  } catch (error) {
    console.error("❌ Check failed:", error);
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}); 