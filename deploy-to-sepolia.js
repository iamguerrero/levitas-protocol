import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying to Sepolia with account:", deployer.address);

  // Deploy MockUSDC
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy(deployer.address);
  await mockUSDC.waitForDeployment();
  const mockUSDCAddress = await mockUSDC.getAddress();
  console.log("MockUSDC deployed to:", mockUSDCAddress);

  // Deploy BVIX Oracle
  const MockOracle = await ethers.getContractFactory("MockOracle");
  const bvixOracle = await MockOracle.deploy();
  await bvixOracle.waitForDeployment();
  const bvixOracleAddress = await bvixOracle.getAddress();
  console.log("BVIX Oracle deployed to:", bvixOracleAddress);

  // Deploy EVIX Oracle
  const evixOracle = await MockOracle.deploy();
  await evixOracle.waitForDeployment();
  const evixOracleAddress = await evixOracle.getAddress();
  console.log("EVIX Oracle deployed to:", evixOracleAddress);

  // Deploy BVIXToken
  const BVIXToken = await ethers.getContractFactory("BVIXToken");
  const bvixToken = await BVIXToken.deploy(deployer.address);
  await bvixToken.waitForDeployment();
  const bvixAddress = await bvixToken.getAddress();
  console.log("BVIXToken deployed to:", bvixAddress);

  // Deploy EVIXToken
  const EVIXToken = await ethers.getContractFactory("EVIXToken");
  const evixToken = await EVIXToken.deploy(deployer.address);
  await evixToken.waitForDeployment();
  const evixAddress = await evixToken.getAddress();
  console.log("EVIXToken deployed to:", evixAddress);

  // Deploy MintRedeemV6 for BVIX
  const MintRedeemV6 = await ethers.getContractFactory("MintRedeemV6");
  const bvixMintRedeem = await MintRedeemV6.deploy(
    mockUSDCAddress,
    bvixAddress,
    bvixOracleAddress,
    deployer.address
  );
  await bvixMintRedeem.waitForDeployment();
  const bvixMintRedeemAddress = await bvixMintRedeem.getAddress();
  console.log("BVIX MintRedeemV6 deployed to:", bvixMintRedeemAddress);

  // Transfer BVIX ownership
  await bvixToken.transferOwnership(bvixMintRedeemAddress);
  console.log("BVIX ownership transferred");

  // Deploy EVIXMintRedeemV6 for EVIX
  const EVIXMintRedeemV6 = await ethers.getContractFactory("EVIXMintRedeemV6");
  const evixMintRedeem = await EVIXMintRedeemV6.deploy(
    mockUSDCAddress,
    evixAddress,
    evixOracleAddress,
    deployer.address
  );
  await evixMintRedeem.waitForDeployment();
  const evixMintRedeemAddress = await evixMintRedeem.getAddress();
  console.log("EVIX MintRedeemV6 deployed to:", evixMintRedeemAddress);

  // Transfer EVIX ownership
  await evixToken.transferOwnership(evixMintRedeemAddress);
  console.log("EVIX ownership transferred");

  // Set oracle prices (assuming 8 decimals for price)
  await bvixOracle.setPrice(ethers.parseUnits("42.15", 8));
  await evixOracle.setPrice(ethers.parseUnits("37.98", 8));
  console.log("Oracle prices set");

  console.log("Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  }); 