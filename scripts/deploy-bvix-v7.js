const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying BVIX V7 with FIXED decimal precision...");
  
  // Contract addresses on Base Sepolia
  const MOCK_USDC_ADDRESS = "0x9CC37B36FDd8CF5c0297BE15b75663Bf2a193297";
  const BVIX_TOKEN_ADDRESS = "0x2E3bef50887aD2A30069c79D19Bb91085351C92a";
  const BVIX_ORACLE_ADDRESS = "0x85485dD6cFaF5220150c413309C61a8EA24d24FE";

  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);

  // Deploy MintRedeemV7 with fixed decimal handling
  const MintRedeemV7 = await ethers.getContractFactory("MintRedeemV7");
  const mintRedeemV7 = await MintRedeemV7.deploy(
    MOCK_USDC_ADDRESS,
    BVIX_TOKEN_ADDRESS,
    BVIX_ORACLE_ADDRESS,
    deployer.address // Initial owner
  );

  await mintRedeemV7.waitForDeployment();
  const v7Address = await mintRedeemV7.getAddress();
  console.log("✅ MintRedeemV7 deployed to:", v7Address);

  // Update BVIX token ownership to V7 contract
  const bvixToken = await ethers.getContractAt("BVIXToken", BVIX_TOKEN_ADDRESS);
  const transferTx = await bvixToken.transferOwnership(v7Address);
  await transferTx.wait();
  console.log("✅ BVIX token ownership transferred to V7 contract");

  console.log("\n📋 DEPLOYMENT SUMMARY:");
  console.log("BVIX V7 Contract:", v7Address);
  console.log("USDC:", MOCK_USDC_ADDRESS);
  console.log("BVIX Token:", BVIX_TOKEN_ADDRESS);
  console.log("Oracle:", BVIX_ORACLE_ADDRESS);
  
  console.log("\n🔧 DECIMAL FIX DETAILS:");
  console.log("- Fixed 1e30 multiplier bug that caused massive token creation");
  console.log("- Now uses proper 1e12 * 1e18 for USDC(6dec) -> Token(18dec) conversion");
  console.log("- 300 USDC at 120% CR should mint ~5.56 BVIX tokens (not 55 billion!)");
  
  // Save addresses to file
  const addresses = {
    mintRedeemV7: v7Address,
    mockUsdc: MOCK_USDC_ADDRESS,
    bvixToken: BVIX_TOKEN_ADDRESS,
    oracle: BVIX_ORACLE_ADDRESS,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    fix: "1e30 -> 1e12*1e18 decimal conversion"
  };

  require('fs').writeFileSync('bvix-v7-addresses.json', JSON.stringify(addresses, null, 2));
  console.log("📁 Addresses saved to bvix-v7-addresses.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });