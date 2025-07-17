const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying V5 contracts with fresh BVIX token...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Existing contract addresses
  const MOCK_USDC_ADDRESS = "0x79640e0f510a7c6d59737442649d9600C84b035f";
  const ORACLE_ADDRESS = "0x85485dD6cFaF5220150c413309C61a8EA24d24FE";
  const EVIX_TOKEN_ADDRESS = "0x37e3b45fEF91D54Ef4992B71382EC36307908463";
  const EVIX_ORACLE_ADDRESS = "0xCd7441A771a7F84E58d98E598B7Ff23A3688094F";

  try {
    // 1. Deploy fresh BVIX token
    console.log("\n🪙 Deploying fresh BVIX token...");
    const BVIXToken = await ethers.getContractFactory("BVIXToken");
    const bvixToken = await BVIXToken.deploy(deployer.address); // Initial owner = deployer
    await bvixToken.waitForDeployment();
    const bvixTokenAddress = await bvixToken.getAddress();
    console.log("✅ Fresh BVIX token deployed to:", bvixTokenAddress);

    // 2. Deploy BVIX MintRedeem V5 with fresh token
    console.log("\n🏗️ Deploying BVIX MintRedeem V5 with fresh BVIX...");
    const MintRedeemV5Simple = await ethers.getContractFactory("MintRedeemV5Simple");
    const mintRedeemV5 = await MintRedeemV5Simple.deploy(
      MOCK_USDC_ADDRESS,
      bvixTokenAddress, // Use fresh BVIX
      ORACLE_ADDRESS,
      deployer.address
    );
    await mintRedeemV5.waitForDeployment();
    const mintRedeemV5Address = await mintRedeemV5.getAddress();
    console.log("✅ BVIX MintRedeem V5 deployed to:", mintRedeemV5Address);

    // 3. Transfer BVIX ownership to V5 contract
    console.log("\n🔑 Transferring fresh BVIX ownership to V5...");
    const transferTx = await bvixToken.transferOwnership(mintRedeemV5Address);
    await transferTx.wait();
    console.log("✅ BVIX ownership transferred to V5 contract");

    // 4. Deploy EVIX MintRedeem V5 (reusing existing EVIX token)
    console.log("\n🏗️ Deploying EVIX MintRedeem V5...");
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

    // 5. Verify ownership setup
    console.log("\n✅ Deployment complete! New addresses:");
    console.log("Fresh BVIX Token:", bvixTokenAddress);
    console.log("BVIX MintRedeem V5:", mintRedeemV5Address);
    console.log("EVIX MintRedeem V5:", evixMintRedeemV5Address);

    // Verify BVIX ownership
    const bvixOwner = await bvixToken.owner();
    console.log("\n🔍 Verification:");
    console.log("BVIX owner:", bvixOwner);
    console.log("Ownership correct?", bvixOwner.toLowerCase() === mintRedeemV5Address.toLowerCase());

    console.log("\n📝 Update these addresses in your frontend:");
    console.log(`export const BVIX_ADDRESS = "${bvixTokenAddress}";`);
    console.log(`export const MINT_REDEEM_ADDRESS = "${mintRedeemV5Address}";`);
    console.log(`export const EVIX_MINT_REDEEM_ADDRESS = "${evixMintRedeemV5Address}";`);

  } catch (error) {
    console.error("❌ Deployment failed:", error);
  }
}

main().catch(console.error);