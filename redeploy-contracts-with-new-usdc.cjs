const { ethers } = require("hardhat");

async function main() {
  console.log("🔄 Redeploying all contracts with new MockUSDC...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const NEW_MOCK_USDC = "0x9CC37B36FDd8CF5c0297BE15b75663Bf2a193297";
  
  // Deploy fresh BVIX token
  console.log("\n📄 Deploying fresh BVIX token...");
  const BVIXToken = await ethers.getContractFactory("BVIXToken");
  const bvixToken = await BVIXToken.deploy(deployer.address);
  await bvixToken.waitForDeployment();
  const bvixTokenAddress = await bvixToken.getAddress();
  console.log("✅ Fresh BVIX token deployed to:", bvixTokenAddress);
  
  // Deploy BVIX MintRedeem with new USDC
  console.log("\n📄 Deploying BVIX MintRedeem with new USDC...");
  const BVIXMintRedeem = await ethers.getContractFactory("MintRedeemV5Simple");
  const bvixMintRedeem = await BVIXMintRedeem.deploy(
    NEW_MOCK_USDC, // New MockUSDC with faucet
    bvixTokenAddress,
    "0x85485dD6cFaF5220150c413309C61a8EA24d24FE", // BVIX Oracle
    deployer.address
  );
  await bvixMintRedeem.waitForDeployment();
  const bvixMintRedeemAddress = await bvixMintRedeem.getAddress();
  console.log("✅ BVIX MintRedeem deployed to:", bvixMintRedeemAddress);
  
  // Transfer BVIX ownership
  const transferBVIXTx = await bvixToken.transferOwnership(bvixMintRedeemAddress);
  await transferBVIXTx.wait();
  console.log("✅ BVIX token ownership transferred");
  
  // Deploy fresh EVIX token
  console.log("\n📄 Deploying fresh EVIX token...");
  const EVIXToken = await ethers.getContractFactory("EVIXToken");
  const evixToken = await EVIXToken.deploy(deployer.address);
  await evixToken.waitForDeployment();
  const evixTokenAddress = await evixToken.getAddress();
  console.log("✅ Fresh EVIX token deployed to:", evixTokenAddress);
  
  // Deploy EVIX MintRedeem with new USDC
  console.log("\n📄 Deploying EVIX MintRedeem with new USDC...");
  const EVIXMintRedeem = await ethers.getContractFactory("EVIXMintRedeemV5Simple");
  const evixMintRedeem = await EVIXMintRedeem.deploy(
    NEW_MOCK_USDC, // New MockUSDC with faucet
    evixTokenAddress,
    "0xCd7441A771a7F84E58d98E598B7Ff23A3688094F", // EVIX Oracle
    deployer.address
  );
  await evixMintRedeem.waitForDeployment();
  const evixMintRedeemAddress = await evixMintRedeem.getAddress();
  console.log("✅ EVIX MintRedeem deployed to:", evixMintRedeemAddress);
  
  // Transfer EVIX ownership
  const transferEVIXTx = await evixToken.transferOwnership(evixMintRedeemAddress);
  await transferEVIXTx.wait();
  console.log("✅ EVIX token ownership transferred");
  
  console.log("\n🎯 FINAL CONTRACT ADDRESSES WITH NEW USDC:");
  console.log("MOCK_USDC_ADDRESS =", NEW_MOCK_USDC);
  console.log("BVIX_ADDRESS =", bvixTokenAddress);
  console.log("BVIX_MINT_REDEEM_ADDRESS =", bvixMintRedeemAddress);
  console.log("EVIX_ADDRESS =", evixTokenAddress);
  console.log("EVIX_MINT_REDEEM_ADDRESS =", evixMintRedeemAddress);
  console.log("\nUsers can now use the faucet button to get test USDC and mint tokens!");
}

main().catch(console.error);