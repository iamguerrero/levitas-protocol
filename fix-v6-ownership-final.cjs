const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
  console.log("🔑 Fixing V6 Ownership Transfers...");
  
  // Connect to Base Sepolia
  const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log("Using account:", wallet.address);
  
  // Contract addresses
  const BVIX_TOKEN_ADDRESS = "0x2E3bef50887aD2A30069c79D19Bb91085351C92a";
  const EVIX_TOKEN_ADDRESS = "0x7066700CAf442501B308fAe34d5919091e1b2380";
  const BVIX_V6_ADDRESS = "0x65Bec0Ab96ab751Fd0b1D9c907342d9A61FB1117";
  const EVIX_V6_ADDRESS = "0x6C3e986c4cc7b3400de732440fa01B66FF9172Cf";

  try {
    // Get contract artifacts
    const fs = require("fs");
    const path = require("path");
    
    const bvixTokenArtifact = JSON.parse(fs.readFileSync(path.join(__dirname, "artifacts/contracts/BVIXToken.sol/BVIXToken.json")));
    const evixTokenArtifact = JSON.parse(fs.readFileSync(path.join(__dirname, "artifacts/contracts/EVIXToken.sol/EVIXToken.json")));

    // Check current ownership
    console.log("\n🔍 Current Ownership Status:");
    const bvixToken = new ethers.Contract(BVIX_TOKEN_ADDRESS, bvixTokenArtifact.abi, provider);
    const evixToken = new ethers.Contract(EVIX_TOKEN_ADDRESS, evixTokenArtifact.abi, provider);
    
    const bvixOwner = await bvixToken.owner();
    const evixOwner = await evixToken.owner();
    
    console.log("BVIX owner:", bvixOwner);
    console.log("EVIX owner:", evixOwner);
    console.log("Our address:", wallet.address);

    // Transfer BVIX ownership if needed
    if (bvixOwner.toLowerCase() === wallet.address.toLowerCase()) {
      console.log("\n🔑 Transferring BVIX ownership to V6...");
      const bvixTokenWithSigner = bvixToken.connect(wallet);
      const bvixTransferTx = await bvixTokenWithSigner.transferOwnership(BVIX_V6_ADDRESS);
      await bvixTransferTx.wait();
      console.log("✅ BVIX ownership transferred to V6!");
    } else {
      console.log("⚠️ BVIX already owned by:", bvixOwner);
    }

    // Transfer EVIX ownership if needed
    if (evixOwner.toLowerCase() === wallet.address.toLowerCase()) {
      console.log("\n🔑 Transferring EVIX ownership to V6...");
      const evixTokenWithSigner = evixToken.connect(wallet);
      const evixTransferTx = await evixTokenWithSigner.transferOwnership(EVIX_V6_ADDRESS);
      await evixTransferTx.wait();
      console.log("✅ EVIX ownership transferred to V6!");
    } else {
      console.log("⚠️ EVIX already owned by:", evixOwner);
    }

    // Verify final ownership
    console.log("\n🔍 Final Ownership Verification:");
    const finalBVIXOwner = await bvixToken.owner();
    const finalEVIXOwner = await evixToken.owner();
    
    console.log("Final BVIX owner:", finalBVIXOwner);
    console.log("Final EVIX owner:", finalEVIXOwner);
    
    const bvixSuccess = finalBVIXOwner.toLowerCase() === BVIX_V6_ADDRESS.toLowerCase();
    const evixSuccess = finalEVIXOwner.toLowerCase() === EVIX_V6_ADDRESS.toLowerCase();
    
    console.log("BVIX ownership correct:", bvixSuccess ? "✅" : "❌");
    console.log("EVIX ownership correct:", evixSuccess ? "✅" : "❌");
    
    if (bvixSuccess && evixSuccess) {
      console.log("\n🎉 V6 DEPLOYMENT COMPLETE!");
      console.log("All tokens are now owned by V6 contracts!");
      console.log("The app should now work with V6 features!");
    } else {
      console.log("\n⚠️ Some ownership transfers may have failed.");
    }

    console.log("\n📝 Final Contract Addresses:");
    console.log("BVIX Token:", BVIX_TOKEN_ADDRESS);
    console.log("EVIX Token:", EVIX_TOKEN_ADDRESS);
    console.log("BVIX V6:", BVIX_V6_ADDRESS);
    console.log("EVIX V6:", EVIX_V6_ADDRESS);

  } catch (error) {
    console.error("❌ Ownership transfer failed:", error);
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}); 