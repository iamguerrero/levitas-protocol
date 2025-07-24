const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("🚀 Deploying contracts to Polygon Amoy testnet...");
  console.log("Deploying with account:", deployer.address);

  // Deploy MockUSDC first
  console.log("📄 Deploying MockUSDC...");
  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy(deployer.address);
  await mockUSDC.waitForDeployment();
  const mockUSDCAddress = await mockUSDC.getAddress();
  console.log("✅ MockUSDC deployed to:", mockUSDCAddress);

  // Deploy BVIX Token
  console.log("📄 Deploying BVIXToken...");
  const BVIXToken = await hre.ethers.getContractFactory("BVIXToken");
  const bvixToken = await BVIXToken.deploy();
  await bvixToken.waitForDeployment();
  const bvixAddress = await bvixToken.getAddress();
  console.log("✅ BVIXToken deployed to:", bvixAddress);

  // Deploy EVIX Token
  console.log("📄 Deploying EVIXToken...");
  const EVIXToken = await hre.ethers.getContractFactory("EVIXToken");
  const evixToken = await EVIXToken.deploy();
  await evixToken.waitForDeployment();
  const evixAddress = await evixToken.getAddress();
  console.log("✅ EVIXToken deployed to:", evixAddress);

  // Deploy BVIX Oracle
  console.log("📄 Deploying MockOracle for BVIX...");
  const MockOracle = await hre.ethers.getContractFactory("MockOracle");
  const bvixOracle = await MockOracle.deploy();
  await bvixOracle.waitForDeployment();
  const bvixOracleAddress = await bvixOracle.getAddress();
  console.log("✅ BVIX Oracle deployed to:", bvixOracleAddress);

  // Deploy EVIX Oracle
  console.log("📄 Deploying EVIXOracle...");
  const EVIXOracle = await hre.ethers.getContractFactory("EVIXOracle");
  const evixOracle = await EVIXOracle.deploy();
  await evixOracle.waitForDeployment();
  const evixOracleAddress = await evixOracle.getAddress();
  console.log("✅ EVIX Oracle deployed to:", evixOracleAddress);

  // Deploy MintRedeemV7 for BVIX
  console.log("📄 Deploying MintRedeemV7 for BVIX...");
  const MintRedeemV7 = await hre.ethers.getContractFactory("MintRedeemV7");
  const bvixMintRedeem = await MintRedeemV7.deploy(
    bvixAddress,
    mockUSDCAddress,
    bvixOracleAddress
  );
  await bvixMintRedeem.waitForDeployment();
  const bvixMintRedeemAddress = await bvixMintRedeem.getAddress();
  console.log("✅ BVIX MintRedeemV7 deployed to:", bvixMintRedeemAddress);

  // Deploy MintRedeemV7 for EVIX
  console.log("📄 Deploying MintRedeemV7 for EVIX...");
  const evixMintRedeem = await MintRedeemV7.deploy(
    evixAddress,
    mockUSDCAddress,
    evixOracleAddress
  );
  await evixMintRedeem.waitForDeployment();
  const evixMintRedeemAddress = await evixMintRedeem.getAddress();
  console.log("✅ EVIX MintRedeemV7 deployed to:", evixMintRedeemAddress);

  // Set up ownership for tokens
  console.log("🔧 Setting up token ownership...");
  await bvixToken.transferOwnership(bvixMintRedeemAddress);
  await evixToken.transferOwnership(evixMintRedeemAddress);
  console.log("✅ Token ownership transferred to MintRedeem contracts");

  // Output deployment summary
  console.log("\n🎉 Deployment Complete! Contract Addresses:");
  console.log("=====================================");
  console.log(`MockUSDC: ${mockUSDCAddress}`);
  console.log(`BVIXToken: ${bvixAddress}`);
  console.log(`EVIXToken: ${evixAddress}`);
  console.log(`BVIX Oracle: ${bvixOracleAddress}`);
  console.log(`EVIX Oracle: ${evixOracleAddress}`);
  console.log(`BVIX MintRedeemV7: ${bvixMintRedeemAddress}`);
  console.log(`EVIX MintRedeemV7: ${evixMintRedeemAddress}`);
  console.log("=====================================");

  // Save addresses to file
  const addresses = {
    mockUsdc: mockUSDCAddress,
    bvix: bvixAddress,
    evix: evixAddress,
    bvixOracle: bvixOracleAddress,
    evixOracle: evixOracleAddress,
    bvixMintRedeem: bvixMintRedeemAddress,
    evixMintRedeem: evixMintRedeemAddress,
    network: "polygonAmoy",
    chainId: 80002
  };

  const fs = require('fs');
  fs.writeFileSync('polygon-amoy-addresses.json', JSON.stringify(addresses, null, 2));
  console.log("📝 Addresses saved to polygon-amoy-addresses.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });