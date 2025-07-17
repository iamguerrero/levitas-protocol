const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying fresh EVIX token and contract...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Existing contract addresses
  const MOCK_USDC_ADDRESS = "0x79640e0f510a7c6d59737442649d9600C84b035f";
  const EVIX_ORACLE_ADDRESS = "0xCd7441A771a7F84E58d98E598B7Ff23A3688094F";

  try {
    // 1. Deploy fresh EVIX token
    console.log("\n🪙 Deploying fresh EVIX token...");
    const EVIXToken = await ethers.getContractFactory("EVIXToken");
    const evixToken = await EVIXToken.deploy(deployer.address); // Initial owner = deployer
    await evixToken.waitForDeployment();
    const evixTokenAddress = await evixToken.getAddress();
    console.log("✅ Fresh EVIX token deployed to:", evixTokenAddress);

    // 2. Deploy EVIX MintRedeem V5 with fresh token
    console.log("\n🏗️ Deploying EVIX MintRedeem V5 with fresh EVIX...");
    const EVIXMintRedeemV5Simple = await ethers.getContractFactory("EVIXMintRedeemV5Simple");
    const evixMintRedeemV5 = await EVIXMintRedeemV5Simple.deploy(
      MOCK_USDC_ADDRESS,
      evixTokenAddress, // Use fresh EVIX
      EVIX_ORACLE_ADDRESS,
      deployer.address
    );
    await evixMintRedeemV5.waitForDeployment();
    const evixMintRedeemV5Address = await evixMintRedeemV5.getAddress();
    console.log("✅ EVIX MintRedeem V5 deployed to:", evixMintRedeemV5Address);

    // 3. Transfer EVIX ownership to V5 contract
    console.log("\n🔑 Transferring fresh EVIX ownership to V5...");
    const transferTx = await evixToken.transferOwnership(evixMintRedeemV5Address);
    await transferTx.wait();
    console.log("✅ EVIX ownership transferred to V5 contract");

    // 4. Verify ownership setup
    console.log("\n✅ Deployment complete! New addresses:");
    console.log("Fresh EVIX Token:", evixTokenAddress);
    console.log("EVIX MintRedeem V5:", evixMintRedeemV5Address);

    // Verify EVIX ownership
    const evixOwner = await evixToken.owner();
    console.log("\n🔍 Verification:");
    console.log("EVIX owner:", evixOwner);
    console.log("Ownership correct?", evixOwner.toLowerCase() === evixMintRedeemV5Address.toLowerCase());

    console.log("\n📝 Update these addresses in your frontend:");
    console.log(`export const EVIX_ADDRESS = "${evixTokenAddress}";`);
    console.log(`export const EVIX_MINT_REDEEM_ADDRESS = "${evixMintRedeemV5Address}";`);

  } catch (error) {
    console.error("❌ Deployment failed:", error);
  }
}

main().catch(console.error);