const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
  console.log("🚀 Deploying V6 contracts to Base Sepolia...");
  
  // Connect to Base Sepolia
  const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log("Deploying with account:", wallet.address);
  
  const balance = await provider.getBalance(wallet.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Contract addresses from previous deployments
  const MOCK_USDC_ADDRESS = "0x9CC37B36FDd8CF5c0297BE15b75663Bf2a193297";
  const BVIX_TOKEN_ADDRESS = "0xdcCCCC3A977cC0166788265eD4B683D41f3AED09";
  const EVIX_TOKEN_ADDRESS = "0x089C132BC246bF2060F40B0608Cb14b2A0cC9127";
  const BVIX_ORACLE_ADDRESS = "0x85485dD6cFaF5220150c413309C61a8EA24d24FE";
  const EVIX_ORACLE_ADDRESS = "0xCd7441A771a7F84E58d98E598B7Ff23A3688094F";

  try {
    // Get contract artifacts
    const fs = require("fs");
    const path = require("path");
    
    const bvixV6Artifact = JSON.parse(fs.readFileSync(path.join(__dirname, "artifacts/contracts/MintRedeemV6.sol/MintRedeemV6.json")));
    const evixV6Artifact = JSON.parse(fs.readFileSync(path.join(__dirname, "artifacts/contracts/EVIXMintRedeemV6.sol/EVIXMintRedeemV6.json")));
    const bvixTokenArtifact = JSON.parse(fs.readFileSync(path.join(__dirname, "artifacts/contracts/BVIXToken.sol/BVIXToken.json")));
    const evixTokenArtifact = JSON.parse(fs.readFileSync(path.join(__dirname, "artifacts/contracts/EVIXToken.sol/EVIXToken.json")));

    // Deploy BVIX V6
    console.log("\n🏗️ Deploying BVIX MintRedeem V6...");
    const bvixV6Factory = new ethers.ContractFactory(bvixV6Artifact.abi, bvixV6Artifact.bytecode, wallet);
    const bvixV6 = await bvixV6Factory.deploy(
      MOCK_USDC_ADDRESS,
      BVIX_TOKEN_ADDRESS,
      BVIX_ORACLE_ADDRESS,
      wallet.address
    );
    await bvixV6.waitForDeployment();
    const bvixV6Address = await bvixV6.getAddress();
    console.log("✅ BVIX V6 deployed to:", bvixV6Address);

    // Transfer BVIX ownership
    console.log("🔑 Transferring BVIX ownership...");
    const bvixToken = new ethers.Contract(BVIX_TOKEN_ADDRESS, bvixTokenArtifact.abi, wallet);
    await bvixToken.transferOwnership(bvixV6Address);
    console.log("✅ BVIX ownership transferred");

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

    // Transfer EVIX ownership
    console.log("🔑 Transferring EVIX ownership...");
    const evixToken = new ethers.Contract(EVIX_TOKEN_ADDRESS, evixTokenArtifact.abi, wallet);
    await evixToken.transferOwnership(evixV6Address);
    console.log("✅ EVIX ownership transferred");

    console.log("\n🎉 V6 Deployment Complete!");
    console.log("BVIX MintRedeem V6:", bvixV6Address);
    console.log("EVIX MintRedeem V6:", evixV6Address);
    
    console.log("\n📝 Frontend addresses:");
    console.log(`export const BVIX_MINT_REDEEM_V6_ADDRESS = "${bvixV6Address}";`);
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