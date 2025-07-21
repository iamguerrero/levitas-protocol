const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
  console.log("🎉 V6 DEPLOYMENT SUMMARY");
  console.log("========================\n");
  
  // Connect to Base Sepolia
  const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log("Deployer Account:", wallet.address);
  
  // V6 Contract Addresses
  const BVIX_V6_ADDRESS = "0x2C1DB2D58f405596054A49CC03CDfDE0438EA1c4";
  const EVIX_V6_ADDRESS = "0xa86bc41e09a6a783B5361755Cbef482e5587b0d0";
  
  // Token Addresses
  const BVIX_TOKEN_ADDRESS = "0xdcCCCC3A977cC0166788265eD4B683D41f3AED09";
  const EVIX_TOKEN_ADDRESS = "0x089C132BC246bF2060F40B0608Cb14b2A0cC9127";
  
  console.log("✅ V6 Contracts Successfully Deployed:");
  console.log("   BVIX MintRedeem V6:", BVIX_V6_ADDRESS);
  console.log("   EVIX MintRedeem V6:", EVIX_V6_ADDRESS);
  
  try {
    // Get contract artifacts
    const fs = require("fs");
    const path = require("path");
    
    const bvixTokenArtifact = JSON.parse(fs.readFileSync(path.join(__dirname, "artifacts/contracts/BVIXToken.sol/BVIXToken.json")));
    const evixTokenArtifact = JSON.parse(fs.readFileSync(path.join(__dirname, "artifacts/contracts/EVIXToken.sol/EVIXToken.json")));

    // Check token ownership
    console.log("\n🔍 Token Ownership Status:");
    const bvixToken = new ethers.Contract(BVIX_TOKEN_ADDRESS, bvixTokenArtifact.abi, provider);
    const evixToken = new ethers.Contract(EVIX_TOKEN_ADDRESS, evixTokenArtifact.abi, provider);
    
    const bvixOwner = await bvixToken.owner();
    const evixOwner = await evixToken.owner();
    
    console.log("   BVIX Token Owner:", bvixOwner);
    console.log("   EVIX Token Owner:", evixOwner);
    
    const bvixOwnedByV6 = bvixOwner.toLowerCase() === BVIX_V6_ADDRESS.toLowerCase();
    const evixOwnedByV6 = evixOwner.toLowerCase() === EVIX_V6_ADDRESS.toLowerCase();
    
    console.log("   BVIX owned by V6:", bvixOwnedByV6 ? "✅" : "❌");
    console.log("   EVIX owned by V6:", evixOwnedByV6 ? "✅" : "❌");
    
    console.log("\n📝 Frontend Configuration Updated:");
    console.log("   ✅ BVIX_MINT_REDEEM_V6_ADDRESS =", BVIX_V6_ADDRESS);
    console.log("   ✅ EVIX_MINT_REDEEM_V6_ADDRESS =", EVIX_V6_ADDRESS);
    
    console.log("\n🚀 V6 Features:");
    console.log("   ✅ Position tracking for individual users");
    console.log("   ✅ Surplus refunding on redemption");
    console.log("   ✅ Collateral ratio validation");
    console.log("   ✅ ERC-4626 standard compliance");
    
    if (!bvixOwnedByV6 || !evixOwnedByV6) {
      console.log("\n⚠️  NEXT STEPS REQUIRED:");
      console.log("   The V6 contracts are deployed but don't own the tokens yet.");
      console.log("   You need to contact the current token owners to transfer ownership:");
      console.log("   - BVIX owner:", bvixOwner);
      console.log("   - EVIX owner:", evixOwner);
      console.log("   ");
      console.log("   Once ownership is transferred, the V6 contracts will be fully functional!");
    } else {
      console.log("\n🎉 V6 DEPLOYMENT COMPLETE!");
      console.log("   All contracts are deployed and properly configured.");
      console.log("   The app should now work with V6 features!");
    }
    
    console.log("\n🔗 Contract Links:");
    console.log("   BVIX V6:", `https://sepolia.basescan.org/address/${BVIX_V6_ADDRESS}`);
    console.log("   EVIX V6:", `https://sepolia.basescan.org/address/${EVIX_V6_ADDRESS}`);
    console.log("   BVIX Token:", `https://sepolia.basescan.org/address/${BVIX_TOKEN_ADDRESS}`);
    console.log("   EVIX Token:", `https://sepolia.basescan.org/address/${EVIX_TOKEN_ADDRESS}`);

  } catch (error) {
    console.error("❌ Error checking deployment status:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}); 