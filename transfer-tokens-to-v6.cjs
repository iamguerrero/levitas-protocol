const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
  console.log("🔑 Transferring Token Ownership to V6 Contracts...");
  
  // Connect to Base Sepolia
  const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log("Using account:", wallet.address);
  
  // Contract addresses
  const BVIX_TOKEN_ADDRESS = "0xdcCCCC3A977cC0166788265eD4B683D41f3AED09";
  const EVIX_TOKEN_ADDRESS = "0x089C132BC246bF2060F40B0608Cb14b2A0cC9127";
  const BVIX_V6_ADDRESS = "0x2C1DB2D58f405596054A49CC03CDfDE0438EA1c4";
  const EVIX_V6_ADDRESS = "0xa86bc41e09a6a783B5361755Cbef482e5587b0d0";
  
  // V5 contract addresses (current token owners)
  const BVIX_V5_ADDRESS = "0x4d0ddFBCBa76f2e72B0Fef2fdDcaE9ddd6922397";
  const EVIX_V5_ADDRESS = "0xb187c5Ff48D69BB0b477dAf30Eec779E0D07771D";

  try {
    // Get contract artifacts
    const fs = require("fs");
    const path = require("path");
    
    const bvixTokenArtifact = JSON.parse(fs.readFileSync(path.join(__dirname, "artifacts/contracts/BVIXToken.sol/BVIXToken.json")));
    const evixTokenArtifact = JSON.parse(fs.readFileSync(path.join(__dirname, "artifacts/contracts/EVIXToken.sol/EVIXToken.json")));
    const mintRedeemV5Artifact = JSON.parse(fs.readFileSync(path.join(__dirname, "artifacts/contracts/MintRedeemV5Simple.sol/MintRedeemV5Simple.json")));
    const evixMintRedeemV5Artifact = JSON.parse(fs.readFileSync(path.join(__dirname, "artifacts/contracts/EVIXMintRedeemV5Simple.sol/EVIXMintRedeemV5Simple.json")));

    console.log("\n🔍 Current Status:");
    console.log("BVIX Token Owner:", BVIX_V5_ADDRESS);
    console.log("EVIX Token Owner:", EVIX_V5_ADDRESS);
    console.log("Target BVIX V6:", BVIX_V6_ADDRESS);
    console.log("Target EVIX V6:", EVIX_V6_ADDRESS);

    // Transfer BVIX ownership
    console.log("\n🔑 Transferring BVIX ownership...");
    const bvixV5Contract = new ethers.Contract(BVIX_V5_ADDRESS, mintRedeemV5Artifact.abi, wallet);
    
    try {
      const transferBVIXTx = await bvixV5Contract.transferBVIXOwnership(BVIX_V6_ADDRESS);
      console.log("BVIX transfer transaction sent:", transferBVIXTx.hash);
      await transferBVIXTx.wait();
      console.log("✅ BVIX ownership transferred to V6!");
    } catch (error) {
      console.log("BVIX transfer failed, trying direct token transfer...");
      // Try direct token ownership transfer
      const bvixToken = new ethers.Contract(BVIX_TOKEN_ADDRESS, bvixTokenArtifact.abi, wallet);
      const directTransferBVIXTx = await bvixToken.transferOwnership(BVIX_V6_ADDRESS);
      console.log("Direct BVIX transfer transaction sent:", directTransferBVIXTx.hash);
      await directTransferBVIXTx.wait();
      console.log("✅ BVIX ownership transferred to V6!");
    }

    // Transfer EVIX ownership
    console.log("\n🔑 Transferring EVIX ownership...");
    const evixV5Contract = new ethers.Contract(EVIX_V5_ADDRESS, evixMintRedeemV5Artifact.abi, wallet);
    
    try {
      const transferEVIXTx = await evixV5Contract.transferEVIXOwnership(EVIX_V6_ADDRESS);
      console.log("EVIX transfer transaction sent:", transferEVIXTx.hash);
      await transferEVIXTx.wait();
      console.log("✅ EVIX ownership transferred to V6!");
    } catch (error) {
      console.log("EVIX transfer failed, trying direct token transfer...");
      // Try direct token ownership transfer
      const evixToken = new ethers.Contract(EVIX_TOKEN_ADDRESS, evixTokenArtifact.abi, wallet);
      const directTransferEVIXTx = await evixToken.transferOwnership(EVIX_V6_ADDRESS);
      console.log("Direct EVIX transfer transaction sent:", directTransferEVIXTx.hash);
      await directTransferEVIXTx.wait();
      console.log("✅ EVIX ownership transferred to V6!");
    }

    // Verify the transfers
    console.log("\n🔍 Verifying ownership transfers...");
    const bvixToken = new ethers.Contract(BVIX_TOKEN_ADDRESS, bvixTokenArtifact.abi, provider);
    const evixToken = new ethers.Contract(EVIX_TOKEN_ADDRESS, evixTokenArtifact.abi, provider);
    
    const finalBVIXOwner = await bvixToken.owner();
    const finalEVIXOwner = await evixToken.owner();
    
    console.log("Final BVIX owner:", finalBVIXOwner);
    console.log("Final EVIX owner:", finalEVIXOwner);
    
    const bvixSuccess = finalBVIXOwner.toLowerCase() === BVIX_V6_ADDRESS.toLowerCase();
    const evixSuccess = finalEVIXOwner.toLowerCase() === EVIX_V6_ADDRESS.toLowerCase();
    
    console.log("BVIX transfer successful:", bvixSuccess ? "✅" : "❌");
    console.log("EVIX transfer successful:", evixSuccess ? "✅" : "❌");
    
    if (bvixSuccess && evixSuccess) {
      console.log("\n🎉 V6 DEPLOYMENT COMPLETE!");
      console.log("All tokens are now owned by V6 contracts!");
      console.log("The app should now work with V6 features!");
    } else {
      console.log("\n⚠️ Some transfers may have failed. Please check manually.");
    }

  } catch (error) {
    console.error("❌ Transfer failed:", error);
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}); 