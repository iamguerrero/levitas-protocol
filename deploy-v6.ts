import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying V6 contracts to Base Sepolia...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Contract addresses from previous deployments
  const MOCK_USDC_ADDRESS = "0x9CC37B36FDd8CF5c0297BE15b75663Bf2a193297";
  const BVIX_TOKEN_ADDRESS = "0xdcCCCC3A977cC0166788265eD4B683D41f3AED09";
  const EVIX_TOKEN_ADDRESS = "0x089C132BC246bF2060F40B0608Cb14b2A0cC9127";
  const BVIX_ORACLE_ADDRESS = "0x85485dD6cFaF5220150c413309C61a8EA24d24FE";
  const EVIX_ORACLE_ADDRESS = "0xCd7441A771a7F84E58d98E598B7Ff23A3688094F";

  try {
    // Deploy BVIX V6
    console.log("\n🏗️ Deploying BVIX MintRedeem V6...");
    const BVIXV6 = await ethers.getContractFactory("MintRedeemV6");
    const bvixV6 = await BVIXV6.deploy(
      MOCK_USDC_ADDRESS,
      BVIX_TOKEN_ADDRESS,
      BVIX_ORACLE_ADDRESS,
      deployer.address
    );
    await bvixV6.waitForDeployment();
    const bvixV6Address = await bvixV6.getAddress();
    console.log("✅ BVIX V6 deployed to:", bvixV6Address);

    // Transfer BVIX ownership
    console.log("🔑 Transferring BVIX ownership...");
    const bvixToken = await ethers.getContractAt("BVIXToken", BVIX_TOKEN_ADDRESS);
    await bvixToken.transferOwnership(bvixV6Address);
    console.log("✅ BVIX ownership transferred");

    // Deploy EVIX V6
    console.log("\n🏗️ Deploying EVIX MintRedeem V6...");
    const EVIXV6 = await ethers.getContractFactory("EVIXMintRedeemV6");
    const evixV6 = await EVIXV6.deploy(
      MOCK_USDC_ADDRESS,
      EVIX_TOKEN_ADDRESS,
      EVIX_ORACLE_ADDRESS,
      deployer.address
    );
    await evixV6.waitForDeployment();
    const evixV6Address = await evixV6.getAddress();
    console.log("✅ EVIX V6 deployed to:", evixV6Address);

    // Transfer EVIX ownership
    console.log("🔑 Transferring EVIX ownership...");
    const evixToken = await ethers.getContractAt("EVIXToken", EVIX_TOKEN_ADDRESS);
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