const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying V5 contracts with proper collateral ratio enforcement...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Existing contract addresses
  const MOCK_USDC_ADDRESS = "0x79640e0f510a7c6d59737442649d9600C84b035f";
  const BVIX_TOKEN_ADDRESS = "0xcA7aC262190a3d126971281c496a521F5dD0f8D0";
  const EVIX_TOKEN_ADDRESS = "0x37e3b45fEF91D54Ef4992B71382EC36307908463";
  const ORACLE_ADDRESS = "0x85485dD6cFaF5220150c413309C61a8EA24d24FE";
  const EVIX_ORACLE_ADDRESS = "0xCd7441A771a7F84E58d98E598B7Ff23A3688094F";

  console.log("\n📋 Using existing contracts:");
  console.log("USDC:", MOCK_USDC_ADDRESS);
  console.log("BVIX Token:", BVIX_TOKEN_ADDRESS);
  console.log("EVIX Token:", EVIX_TOKEN_ADDRESS);
  console.log("BVIX Oracle:", ORACLE_ADDRESS);
  console.log("EVIX Oracle:", EVIX_ORACLE_ADDRESS);

  try {
    // Deploy BVIX MintRedeem V5 Simple
    console.log("\n🏗️ Deploying BVIX MintRedeem V5 Simple...");
    const MintRedeemV5Simple = await ethers.getContractFactory("MintRedeemV5Simple");
    const mintRedeemV5 = await MintRedeemV5Simple.deploy(
      MOCK_USDC_ADDRESS,
      BVIX_TOKEN_ADDRESS,
      ORACLE_ADDRESS,
      deployer.address
    );
    await mintRedeemV5.waitForDeployment();
    const mintRedeemV5Address = await mintRedeemV5.getAddress();
    console.log("✅ BVIX MintRedeem V5 deployed to:", mintRedeemV5Address);

    // Deploy EVIX MintRedeem V5 Simple
    console.log("\n🏗️ Deploying EVIX MintRedeem V5 Simple...");
    const EVIXMintRedeemV5Simple = await ethers.getContractFactory("EVIXMintRedeemV5Simple");
    const evixMintRedeemV5 = await EVIXMintRedeemV5Simple.deploy(
      MOCK_USDC_ADDRESS,
      EVIX_TOKEN_ADDRESS,
      EVIX_ORACLE_ADDRESS,
      deployer.address
    );
    await evixMintRedeemV5.waitForDeployment();
    const evixMintRedeemV5Address = await evixMintRedeemV5.getAddress();
    console.log("✅ EVIX MintRedeem V5 deployed to:", evixMintRedeemV5Address);

    // Set up ownership for BVIX token
    console.log("\n🔑 Setting up BVIX token ownership...");
    const bvixToken = await ethers.getContractAt("BVIXToken", BVIX_TOKEN_ADDRESS);
    const currentBvixOwner = await bvixToken.owner();
    console.log("Current BVIX owner:", currentBvixOwner);
    
    if (currentBvixOwner.toLowerCase() !== mintRedeemV5Address.toLowerCase()) {
      console.log("Transferring BVIX ownership to V5 contract...");
      const transferTx = await bvixToken.transferOwnership(mintRedeemV5Address);
      await transferTx.wait();
      console.log("✅ BVIX ownership transferred");
    } else {
      console.log("✅ BVIX already owned by V5 contract");
    }

    // Set up ownership for EVIX token
    console.log("\n🔑 Setting up EVIX token ownership...");
    const evixToken = await ethers.getContractAt("EVIXToken", EVIX_TOKEN_ADDRESS);
    const currentEvixOwner = await evixToken.owner();
    console.log("Current EVIX owner:", currentEvixOwner);
    
    if (currentEvixOwner.toLowerCase() !== evixMintRedeemV5Address.toLowerCase()) {
      console.log("Transferring EVIX ownership to V5 contract...");
      const evixTransferTx = await evixToken.transferOwnership(evixMintRedeemV5Address);
      await evixTransferTx.wait();
      console.log("✅ EVIX ownership transferred");
    } else {
      console.log("✅ EVIX already owned by V5 contract");
    }

    console.log("\n🎉 V5 Deployment Complete!");
    console.log("==========================================");
    console.log("BVIX MintRedeem V5:", mintRedeemV5Address);
    console.log("EVIX MintRedeem V5:", evixMintRedeemV5Address);
    console.log("==========================================");
    
    console.log("\n🔧 Key Features:");
    console.log("• Proper collateral ratio enforcement");
    console.log("• User spends full USDC amount");
    console.log("• Receives proportionally fewer tokens based on CR");
    console.log("• 200% CR = half the tokens for full USDC spend");
    console.log("• 150% CR = 67% of tokens for full USDC spend");

    // Test the new functionality
    console.log("\n🧪 Testing V5 functionality...");
    
    // Check initial state
    const bvixCR = await mintRedeemV5.getCollateralRatio();
    const evixCR = await evixMintRedeemV5.getCollateralRatio();
    console.log("Current BVIX CR:", bvixCR.toString() + "%");
    console.log("Current EVIX CR:", evixCR.toString() + "%");

    console.log("\n✅ Ready to use! Frontend will be updated to use V5 contracts.");

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });