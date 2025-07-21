const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying V6 contracts with position tracking and surplus refunding...");
  
  try {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

    // Existing contract addresses
    const MOCK_USDC_ADDRESS = "0x9CC37B36FDd8CF5c0297BE15b75663Bf2a193297";
    const BVIX_TOKEN_ADDRESS = "0xdcCCCC3A977cC0166788265eD4B683D41f3AED09";
    const EVIX_TOKEN_ADDRESS = "0x089C132BC246bF2060F40B0608Cb14b2A0cC9127";
    const BVIX_ORACLE_ADDRESS = "0x85485dD6cFaF5220150c413309C61a8EA24d24FE";
    const EVIX_ORACLE_ADDRESS = "0xCd7441A771a7F84E58d98E598B7Ff23A3688094F";

    // 1. Deploy BVIX MintRedeem V6
    console.log("\n🏗️ Deploying BVIX MintRedeem V6...");
    const MintRedeemV6 = await ethers.getContractFactory("MintRedeemV6");
    const bvixV6 = await MintRedeemV6.deploy(
      MOCK_USDC_ADDRESS,
      BVIX_TOKEN_ADDRESS,
      BVIX_ORACLE_ADDRESS,
      deployer.address
    );
    await bvixV6.waitForDeployment();
    const bvixV6Address = await bvixV6.getAddress();
    console.log("✅ BVIX MintRedeem V6 deployed to:", bvixV6Address);

    // After bvixV6 deployment
    console.log("\n🔑 Transferring BVIX ownership to V6 contract...");
    const bvixTokenInst = await ethers.getContractAt("BVIXToken", BVIX_TOKEN_ADDRESS);
    const bvixTransferTx = await bvixTokenInst.transferOwnership(bvixV6Address);
    await bvixTransferTx.wait();
    console.log("✅ BVIX ownership transferred!");

    // 2. Deploy EVIX MintRedeem V6
    console.log("\n🏗️ Deploying EVIX MintRedeem V6...");
    const EVIXMintRedeemV6 = await ethers.getContractFactory("EVIXMintRedeemV6");
    const evixV6 = await EVIXMintRedeemV6.deploy(
      MOCK_USDC_ADDRESS,
      EVIX_TOKEN_ADDRESS,
      EVIX_ORACLE_ADDRESS,
      deployer.address
    );
    await evixV6.waitForDeployment();
    const evixV6Address = await evixV6.getAddress();
    console.log("✅ EVIX MintRedeem V6 deployed to:", evixV6Address);

    // After evixV6 deployment
    console.log("\n🔑 Transferring EVIX ownership to V6 contract...");
    const evixTokenInst = await ethers.getContractAt("EVIXToken", EVIX_TOKEN_ADDRESS);
    const evixTransferTx = await evixTokenInst.transferOwnership(evixV6Address);
    await evixTransferTx.wait();
    console.log("✅ EVIX ownership transferred!");

    // 3. Verify deployment
    console.log("\n✅ V6 Deployment complete! New addresses:");
    console.log("BVIX MintRedeem V6:", bvixV6Address);
    console.log("EVIX MintRedeem V6:", evixV6Address);

    // 4. Verify contract setup
    console.log("\n🔍 Verification:");
    const bvixUsdc = await bvixV6.usdc();
    const bvixToken = await bvixV6.bvix();
    const bvixOracle = await bvixV6.oracle();
    const bvixOwner = await bvixV6.owner();
    
    console.log("BVIX V6 USDC:", bvixUsdc);
    console.log("BVIX V6 Token:", bvixToken);
    console.log("BVIX V6 Oracle:", bvixOracle);
    console.log("BVIX V6 Owner:", bvixOwner);

    const evixUsdc = await evixV6.usdc();
    const evixToken = await evixV6.evix();
    const evixOracle = await evixV6.oracle();
    const evixOwner = await evixV6.owner();
    
    console.log("EVIX V6 USDC:", evixUsdc);
    console.log("EVIX V6 Token:", evixToken);
    console.log("EVIX V6 Oracle:", evixOracle);
    console.log("EVIX V6 Owner:", evixOwner);

    console.log("\n📝 Update these addresses in your frontend:");
    console.log(`export const BVIX_MINT_REDEEM_V6_ADDRESS = "${bvixV6Address}";`);
    console.log(`export const EVIX_MINT_REDEEM_V6_ADDRESS = "${evixV6Address}";`);

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

main().catch(console.error); 