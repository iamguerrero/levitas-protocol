const { ethers } = require("hardhat");

async function main() {
  console.log("🔄 Creating comprehensive solution for vault funding...");

  // Contract addresses
  const NEW_MINT_REDEEM = "0x5254533747b373D13303AE8ACC9D464f80B6bfae";
  const MOCK_USDC_ADDRESS = "0x79640e0f510a7c6d59737442649d9600C84b035f";

  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);

  // Deploy a new MockUSDC contract that the deployer owns
  console.log("🚀 Deploying new MockUSDC contract...");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const newUSDC = await MockUSDC.deploy(deployer.address);
  await newUSDC.waitForDeployment();
  const newUSDCAddress = await newUSDC.getAddress();
  
  console.log(`New MockUSDC deployed at: ${newUSDCAddress}`);
  console.log(`Deployer balance: ${ethers.formatUnits(await newUSDC.balanceOf(deployer.address), 6)} USDC`);

  // Deploy a new MintRedeemV2 with the new USDC
  console.log("🚀 Deploying new MintRedeemV2 with new USDC...");
  const MintRedeemV2 = await ethers.getContractFactory("MintRedeemV2");
  const newMintRedeem = await MintRedeemV2.deploy(
    newUSDCAddress,
    "0xEA3d08a5A5bC48Fc984F0F773826693B7480bF48", // BVIX
    "0x85485dD6cFaF5220150c413309C61a8EA24d24FE", // Oracle
    deployer.address
  );
  await newMintRedeem.waitForDeployment();
  const newMintRedeemAddress = await newMintRedeem.getAddress();
  
  console.log(`New MintRedeemV2 deployed at: ${newMintRedeemAddress}`);

  // Fund the new vault with proper collateral
  const fundAmount = ethers.parseUnits("1000", 6); // 1000 USDC
  
  console.log("💰 Funding new vault with proper collateral...");
  const approveTx = await newUSDC.approve(newMintRedeemAddress, fundAmount);
  await approveTx.wait();
  
  const addCollateralTx = await newMintRedeem.addCollateral(fundAmount);
  await addCollateralTx.wait();
  
  console.log("✅ New vault funded successfully!");

  // Check collateral ratio
  const collateralRatio = await newMintRedeem.getCollateralRatio();
  console.log(`\n📊 New vault collateral ratio: ${collateralRatio}%`);

  console.log("\n🔧 Update these addresses in your frontend:");
  console.log(`MOCK_USDC_ADDRESS = "${newUSDCAddress}"`);
  console.log(`MINT_REDEEM_ADDRESS = "${newMintRedeemAddress}"`);
  
  if (collateralRatio >= 120) {
    console.log("✅ Collateral ratio is healthy! Ready for trading.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });