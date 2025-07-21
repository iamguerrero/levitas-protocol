const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
  console.log("🔍 Checking BVIX Ownership Issue...");
  
  // Connect to Base Sepolia
  const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log("Our address:", wallet.address);
  
  // Contract addresses
  const BVIX_TOKEN_ADDRESS = "0x2E3bef50887aD2A30069c79D19Bb91085351C92a";
  const BVIX_V6_ADDRESS = "0x65Bec0Ab96ab751Fd0b1D9c907342d9A61FB1117";

  try {
    // Get contract artifacts
    const fs = require("fs");
    const path = require("path");
    
    const bvixTokenArtifact = JSON.parse(fs.readFileSync(path.join(__dirname, "artifacts/contracts/BVIXToken.sol/BVIXToken.json")));

    // Check current ownership
    console.log("\n🔍 Current BVIX Ownership:");
    const bvixToken = new ethers.Contract(BVIX_TOKEN_ADDRESS, bvixTokenArtifact.abi, provider);
    const bvixOwner = await bvixToken.owner();
    console.log("BVIX owner:", bvixOwner);
    console.log("Target V6:", BVIX_V6_ADDRESS);
    console.log("We own it:", bvixOwner.toLowerCase() === wallet.address.toLowerCase());

    // Try to transfer ownership again
    if (bvixOwner.toLowerCase() === wallet.address.toLowerCase()) {
      console.log("\n🔑 Transferring BVIX ownership to V6...");
      const bvixTokenWithSigner = bvixToken.connect(wallet);
      
      // Get current gas price and increase it
      const currentGasPrice = await provider.getFeeData();
      const higherGasPrice = currentGasPrice.gasPrice * BigInt(2);
      
      console.log("Using gas price:", ethers.formatUnits(higherGasPrice, "gwei"), "gwei");
      
      const bvixTransferTx = await bvixTokenWithSigner.transferOwnership(BVIX_V6_ADDRESS, {
        gasPrice: higherGasPrice
      });
      console.log("Transfer transaction sent:", bvixTransferTx.hash);
      await bvixTransferTx.wait();
      console.log("✅ BVIX ownership transferred to V6!");
      
      // Verify the transfer
      const newOwner = await bvixToken.owner();
      console.log("New BVIX owner:", newOwner);
      console.log("Transfer successful:", newOwner.toLowerCase() === BVIX_V6_ADDRESS.toLowerCase() ? "✅" : "❌");
    } else {
      console.log("❌ We don't own the BVIX token. Current owner:", bvixOwner);
    }

  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}); 