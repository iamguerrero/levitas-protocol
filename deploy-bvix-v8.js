const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying BVIX V8 contracts that work exactly like EVIX V6...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Use same USDC contract as EVIX
  const USDC_ADDRESS = "0x9CC37B36FDd8CF5c0297BE15b75663Bf2a193297";
  
  console.log("📄 Step 1: Deploy BVIX Token V8 (identical to EVIX)");
  const BVIXToken = await ethers.getContractFactory("BVIXToken");
  const bvixToken = await BVIXToken.deploy(deployer.address);
  await bvixToken.waitForDeployment();
  console.log("✅ BVIX Token V8 deployed to:", await bvixToken.getAddress());

  console.log("📄 Step 2: Deploy BVIX Oracle V8 (identical to EVIX)");  
  const MockOracle = await ethers.getContractFactory("MockOracle");
  const bvixOracle = await MockOracle.deploy(ethers.parseEther("42.15"));
  await bvixOracle.waitForDeployment();
  console.log("✅ BVIX Oracle V8 deployed to:", await bvixOracle.getAddress());

  console.log("📄 Step 3: Deploy BVIX MintRedeem V8 (exact copy of EVIX V6)");
  const MintRedeemV6 = await ethers.getContractFactory("MintRedeemV6");
  const bvixMintRedeem = await MintRedeemV6.deploy(
    USDC_ADDRESS,
    await bvixToken.getAddress(),
    await bvixOracle.getAddress(),
    deployer.address
  );
  await bvixMintRedeem.waitForDeployment();
  console.log("✅ BVIX MintRedeem V8 deployed to:", await bvixMintRedeem.getAddress());

  console.log("📄 Step 4: Transfer BVIX token ownership to MintRedeem contract");
  try {
    // Try transferOwnership first (if contract inherits from Ownable)
    await bvixToken.transferOwnership(await bvixMintRedeem.getAddress());
    console.log("✅ BVIX token ownership transferred to MintRedeem");
  } catch (error) {
    console.log("⚠️ transferOwnership not available, trying setOwner...");
    try {
      await bvixToken.setOwner(await bvixMintRedeem.getAddress());
      console.log("✅ BVIX token owner set to MintRedeem");
    } catch (error2) {
      console.log("ℹ️ No ownership transfer function found - token may not need ownership transfer");
    }
  }

  console.log("📄 Step 5: Oracle price already set to $42.15 during deployment");
  console.log("✅ BVIX Oracle initialized with correct price");

  console.log("\n🎉 BVIX V8 DEPLOYMENT COMPLETE - IDENTICAL TO EVIX V6");
  console.log("=====================================");
  console.log("BVIX Token V8:", await bvixToken.getAddress());
  console.log("BVIX Oracle V8:", await bvixOracle.getAddress());
  console.log("BVIX MintRedeem V8:", await bvixMintRedeem.getAddress());
  console.log("USDC (shared):", USDC_ADDRESS);
  console.log("=====================================");

  // Save addresses for frontend update
  const addresses = {
    bvixTokenV8: await bvixToken.getAddress(),
    bvixOracleV8: await bvixOracle.getAddress(),
    bvixMintRedeemV8: await bvixMintRedeem.getAddress(),
    mockUsdc: USDC_ADDRESS
  };
  
  console.log("\n📝 Copy these addresses to update frontend:");
  console.log(JSON.stringify(addresses, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });