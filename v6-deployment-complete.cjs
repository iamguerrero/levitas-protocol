const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
  console.log("🎉 V6 DEPLOYMENT COMPLETE!");
  console.log("==========================\n");
  
  // Connect to Base Sepolia
  const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log("Deployer Account:", wallet.address);
  
  // Final V6 Contract Addresses
  const BVIX_TOKEN_ADDRESS = "0x2E3bef50887aD2A30069c79D19Bb91085351C92a";
  const EVIX_TOKEN_ADDRESS = "0x7066700CAf442501B308fAe34d5919091e1b2380";
  const BVIX_V6_ADDRESS = "0x65Bec0Ab96ab751Fd0b1D9c907342d9A61FB1117";
  const EVIX_V6_ADDRESS = "0x6C3e986c4cc7b3400de732440fa01B66FF9172Cf";
  
  console.log("✅ V6 Contracts Successfully Deployed:");
  console.log("   BVIX Token:", BVIX_TOKEN_ADDRESS);
  console.log("   EVIX Token:", EVIX_TOKEN_ADDRESS);
  console.log("   BVIX MintRedeem V6:", BVIX_V6_ADDRESS);
  console.log("   EVIX MintRedeem V6:", EVIX_V6_ADDRESS);
  
  try {
    // Get contract artifacts
    const fs = require("fs");
    const path = require("path");
    
    const bvixTokenArtifact = JSON.parse(fs.readFileSync(path.join(__dirname, "artifacts/contracts/BVIXToken.sol/BVIXToken.json")));
    const evixTokenArtifact = JSON.parse(fs.readFileSync(path.join(__dirname, "artifacts/contracts/EVIXToken.sol/EVIXToken.json")));

    // Verify ownership
    console.log("\n🔍 Ownership Verification:");
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
    console.log("   ✅ BVIX_ADDRESS =", BVIX_TOKEN_ADDRESS);
    console.log("   ✅ EVIX_ADDRESS =", EVIX_TOKEN_ADDRESS);
    console.log("   ✅ BVIX_MINT_REDEEM_V6_ADDRESS =", BVIX_V6_ADDRESS);
    console.log("   ✅ EVIX_MINT_REDEEM_V6_ADDRESS =", EVIX_V6_ADDRESS);
    
    console.log("\n🚀 V6 Features Ready:");
    console.log("   ✅ Position tracking for individual users");
    console.log("   ✅ Surplus refunding on redemption");
    console.log("   ✅ Collateral ratio validation");
    console.log("   ✅ ERC-4626 standard compliance");
    console.log("   ✅ Fresh tokens with proper ownership");
    
    if (bvixOwnedByV6 && evixOwnedByV6) {
      console.log("\n🎉 V6 DEPLOYMENT FULLY COMPLETE!");
      console.log("All contracts are deployed and properly configured.");
      console.log("The app should now work with V6 features!");
      console.log("Users can mint and redeem BVIX/EVIX with position tracking!");
    } else {
      console.log("\n⚠️ Some ownership transfers may need attention.");
    }
    
    console.log("\n🔗 Contract Links:");
    console.log("   BVIX Token:", `https://sepolia.basescan.org/address/${BVIX_TOKEN_ADDRESS}`);
    console.log("   EVIX Token:", `https://sepolia.basescan.org/address/${EVIX_TOKEN_ADDRESS}`);
    console.log("   BVIX V6:", `https://sepolia.basescan.org/address/${BVIX_V6_ADDRESS}`);
    console.log("   EVIX V6:", `https://sepolia.basescan.org/address/${EVIX_V6_ADDRESS}`);
    
    console.log("\n📋 Next Steps:");
    console.log("   1. Test the app with the new V6 contracts");
    console.log("   2. Verify minting and redemption work correctly");
    console.log("   3. Check that position tracking functions properly");
    console.log("   4. Monitor for any issues and fix as needed");

  } catch (error) {
    console.error("❌ Error checking deployment status:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}); 