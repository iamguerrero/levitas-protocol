const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
  console.log("🚀 Deploying EVIX V6 with higher gas price...");
  
  // Connect to Base Sepolia
  const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log("Deploying with account:", wallet.address);
  
  const balance = await provider.getBalance(wallet.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Contract addresses
  const MOCK_USDC_ADDRESS = "0x9CC37B36FDd8CF5c0297BE15b75663Bf2a193297";
  const EVIX_TOKEN_ADDRESS = "0x7066700CAf442501B308fAe34d5919091e1b2380"; // Fresh EVIX token
  const EVIX_ORACLE_ADDRESS = "0xCd7441A771a7F84E58d98E598B7Ff23A3688094F";

  try {
    // Get contract artifacts
    const fs = require("fs");
    const path = require("path");
    
    const evixV6Artifact = JSON.parse(fs.readFileSync(path.join(__dirname, "artifacts/contracts/EVIXMintRedeemV6.sol/EVIXMintRedeemV6.json")));

    // Deploy EVIX V6 with higher gas price
    console.log("\n🏗️ Deploying EVIX MintRedeem V6...");
    const evixV6Factory = new ethers.ContractFactory(evixV6Artifact.abi, evixV6Artifact.bytecode, wallet);
    
    // Get current gas price and increase it
    const currentGasPrice = await provider.getFeeData();
    const higherGasPrice = currentGasPrice.gasPrice * BigInt(2); // Double the gas price
    
    console.log("Current gas price:", ethers.formatUnits(currentGasPrice.gasPrice, "gwei"), "gwei");
    console.log("Using gas price:", ethers.formatUnits(higherGasPrice, "gwei"), "gwei");
    
    const evixV6 = await evixV6Factory.deploy(
      MOCK_USDC_ADDRESS,
      EVIX_TOKEN_ADDRESS,
      EVIX_ORACLE_ADDRESS,
      wallet.address,
      {
        gasPrice: higherGasPrice
      }
    );
    await evixV6.waitForDeployment();
    const evixV6Address = await evixV6.getAddress();
    console.log("✅ EVIX V6 deployed to:", evixV6Address);

    // Transfer EVIX ownership to V6
    console.log("\n🔑 Transferring EVIX ownership to V6...");
    const evixTokenArtifact = JSON.parse(fs.readFileSync(path.join(__dirname, "artifacts/contracts/EVIXToken.sol/EVIXToken.json")));
    const evixToken = new ethers.Contract(EVIX_TOKEN_ADDRESS, evixTokenArtifact.abi, wallet);
    
    const evixTransferTx = await evixToken.transferOwnership(evixV6Address, {
      gasPrice: higherGasPrice
    });
    await evixTransferTx.wait();
    console.log("✅ EVIX ownership transferred to V6!");

    // Verify ownership
    console.log("\n🔍 Verifying EVIX ownership...");
    const evixOwner = await evixToken.owner();
    console.log("EVIX owner:", evixOwner);
    
    const evixSuccess = evixOwner.toLowerCase() === evixV6Address.toLowerCase();
    console.log("EVIX ownership correct:", evixSuccess ? "✅" : "❌");

    console.log("\n🎉 EVIX V6 DEPLOYMENT COMPLETE!");
    console.log("EVIX V6:", evixV6Address);
    
    console.log("\n📝 Updated frontend addresses:");
    console.log(`export const EVIX_MINT_REDEEM_V6_ADDRESS = "${evixV6Address}";`);
    
    console.log("\n🔗 Contract Links:");
    console.log("EVIX V6:", `https://sepolia.basescan.org/address/${evixV6Address}`);
    console.log("EVIX Token:", `https://sepolia.basescan.org/address/${EVIX_TOKEN_ADDRESS}`);

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}); 