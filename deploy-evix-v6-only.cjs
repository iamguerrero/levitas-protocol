const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
  console.log("🚀 Deploying EVIX V6 contract to Base Sepolia...");
  
  // Connect to Base Sepolia
  const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log("Deploying with account:", wallet.address);
  
  const balance = await provider.getBalance(wallet.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Contract addresses from previous deployments
  const MOCK_USDC_ADDRESS = "0x9CC37B36FDd8CF5c0297BE15b75663Bf2a193297";
  const EVIX_TOKEN_ADDRESS = "0x089C132BC246bF2060F40B0608Cb14b2A0cC9127";
  const EVIX_ORACLE_ADDRESS = "0xCd7441A771a7F84E58d98E598B7Ff23A3688094F";

  try {
    // Get contract artifacts
    const fs = require("fs");
    const path = require("path");
    
    const evixV6Artifact = JSON.parse(fs.readFileSync(path.join(__dirname, "artifacts/contracts/EVIXMintRedeemV6.sol/EVIXMintRedeemV6.json")));

    // Deploy EVIX V6
    console.log("\n🏗️ Deploying EVIX MintRedeem V6...");
    const evixV6Factory = new ethers.ContractFactory(evixV6Artifact.abi, evixV6Artifact.bytecode, wallet);
    const evixV6 = await evixV6Factory.deploy(
      MOCK_USDC_ADDRESS,
      EVIX_TOKEN_ADDRESS,
      EVIX_ORACLE_ADDRESS,
      wallet.address
    );
    await evixV6.waitForDeployment();
    const evixV6Address = await evixV6.getAddress();
    console.log("✅ EVIX V6 deployed to:", evixV6Address);

    console.log("\n🎉 EVIX V6 Deployment Complete!");
    console.log("EVIX MintRedeem V6:", evixV6Address);
    
    console.log("\n📝 Frontend addresses:");
    console.log(`export const EVIX_MINT_REDEEM_V6_ADDRESS = "${evixV6Address}";`);

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}); 