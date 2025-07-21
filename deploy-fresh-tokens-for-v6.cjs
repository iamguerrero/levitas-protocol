const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
  console.log("🚀 Deploying Fresh Tokens for V6...");
  
  // Connect to Base Sepolia
  const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log("Deploying with account:", wallet.address);
  
  const balance = await provider.getBalance(wallet.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Contract addresses
  const MOCK_USDC_ADDRESS = "0x9CC37B36FDd8CF5c0297BE15b75663Bf2a193297";
  const BVIX_ORACLE_ADDRESS = "0x85485dD6cFaF5220150c413309C61a8EA24d24FE";
  const EVIX_ORACLE_ADDRESS = "0xCd7441A771a7F84E58d98E598B7Ff23A3688094F";

  try {
    // Get contract artifacts
    const fs = require("fs");
    const path = require("path");
    
    const bvixTokenArtifact = JSON.parse(fs.readFileSync(path.join(__dirname, "artifacts/contracts/BVIXToken.sol/BVIXToken.json")));
    const evixTokenArtifact = JSON.parse(fs.readFileSync(path.join(__dirname, "artifacts/contracts/EVIXToken.sol/EVIXToken.json")));
    const bvixV6Artifact = JSON.parse(fs.readFileSync(path.join(__dirname, "artifacts/contracts/MintRedeemV6.sol/MintRedeemV6.json")));
    const evixV6Artifact = JSON.parse(fs.readFileSync(path.join(__dirname, "artifacts/contracts/EVIXMintRedeemV6.sol/EVIXMintRedeemV6.json")));

    // 1. Deploy fresh BVIX token
    console.log("\n🏗️ Deploying fresh BVIX token...");
    const bvixTokenFactory = new ethers.ContractFactory(bvixTokenArtifact.abi, bvixTokenArtifact.bytecode, wallet);
    const bvixToken = await bvixTokenFactory.deploy(wallet.address);
    await bvixToken.waitForDeployment();
    const bvixTokenAddress = await bvixToken.getAddress();
    console.log("✅ Fresh BVIX token deployed to:", bvixTokenAddress);

    // 2. Deploy fresh EVIX token
    console.log("\n🏗️ Deploying fresh EVIX token...");
    const evixTokenFactory = new ethers.ContractFactory(evixTokenArtifact.abi, evixTokenArtifact.bytecode, wallet);
    const evixToken = await evixTokenFactory.deploy(wallet.address);
    await evixToken.waitForDeployment();
    const evixTokenAddress = await evixToken.getAddress();
    console.log("✅ Fresh EVIX token deployed to:", evixTokenAddress);

    // 3. Deploy BVIX V6 with fresh token
    console.log("\n🏗️ Deploying BVIX V6 with fresh token...");
    const bvixV6Factory = new ethers.ContractFactory(bvixV6Artifact.abi, bvixV6Artifact.bytecode, wallet);
    const bvixV6 = await bvixV6Factory.deploy(
      MOCK_USDC_ADDRESS,
      bvixTokenAddress,
      BVIX_ORACLE_ADDRESS,
      wallet.address
    );
    await bvixV6.waitForDeployment();
    const bvixV6Address = await bvixV6.getAddress();
    console.log("✅ BVIX V6 deployed to:", bvixV6Address);

    // 4. Deploy EVIX V6 with fresh token
    console.log("\n🏗️ Deploying EVIX V6 with fresh token...");
    const evixV6Factory = new ethers.ContractFactory(evixV6Artifact.abi, evixV6Artifact.bytecode, wallet);
    const evixV6 = await evixV6Factory.deploy(
      MOCK_USDC_ADDRESS,
      evixTokenAddress,
      EVIX_ORACLE_ADDRESS,
      wallet.address
    );
    await evixV6.waitForDeployment();
    const evixV6Address = await evixV6.getAddress();
    console.log("✅ EVIX V6 deployed to:", evixV6Address);

    // 5. Transfer token ownership to V6 contracts
    console.log("\n🔑 Transferring token ownership to V6 contracts...");
    
    const bvixTransferTx = await bvixToken.transferOwnership(bvixV6Address);
    await bvixTransferTx.wait();
    console.log("✅ BVIX ownership transferred to V6!");
    
    const evixTransferTx = await evixToken.transferOwnership(evixV6Address);
    await evixTransferTx.wait();
    console.log("✅ EVIX ownership transferred to V6!");

    // 6. Verify ownership
    console.log("\n🔍 Verifying ownership...");
    const bvixOwner = await bvixToken.owner();
    const evixOwner = await evixToken.owner();
    
    console.log("BVIX owner:", bvixOwner);
    console.log("EVIX owner:", evixOwner);
    
    const bvixSuccess = bvixOwner.toLowerCase() === bvixV6Address.toLowerCase();
    const evixSuccess = evixOwner.toLowerCase() === evixV6Address.toLowerCase();
    
    console.log("BVIX ownership correct:", bvixSuccess ? "✅" : "❌");
    console.log("EVIX ownership correct:", evixSuccess ? "✅" : "❌");

    console.log("\n🎉 FRESH V6 DEPLOYMENT COMPLETE!");
    console.log("All contracts deployed with proper ownership!");
    
    console.log("\n📝 NEW CONTRACT ADDRESSES:");
    console.log("BVIX Token:", bvixTokenAddress);
    console.log("EVIX Token:", evixTokenAddress);
    console.log("BVIX V6:", bvixV6Address);
    console.log("EVIX V6:", evixV6Address);
    
    console.log("\n📝 Frontend addresses to update:");
    console.log(`export const BVIX_ADDRESS = "${bvixTokenAddress}";`);
    console.log(`export const EVIX_ADDRESS = "${evixTokenAddress}";`);
    console.log(`export const BVIX_MINT_REDEEM_V6_ADDRESS = "${bvixV6Address}";`);
    console.log(`export const EVIX_MINT_REDEEM_V6_ADDRESS = "${evixV6Address}";`);
    
    console.log("\n🔗 Contract Links:");
    console.log("BVIX Token:", `https://sepolia.basescan.org/address/${bvixTokenAddress}`);
    console.log("EVIX Token:", `https://sepolia.basescan.org/address/${evixTokenAddress}`);
    console.log("BVIX V6:", `https://sepolia.basescan.org/address/${bvixV6Address}`);
    console.log("EVIX V6:", `https://sepolia.basescan.org/address/${evixV6Address}`);

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}); 