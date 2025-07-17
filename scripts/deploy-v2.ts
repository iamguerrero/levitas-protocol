const { ethers } = require("hardhat");

async function main(): Promise<void> {
  console.log("Deploying MintRedeemV2 with collateral enforcement...");

  // Existing contract addresses
  const MOCK_USDC_ADDRESS = "0x79640e0f510a7c6d59737442649d9600C84b035f";
  const BVIX_ADDRESS = "0xEA3d08a5A5bC48Fc984F0F773826693B7480bF48";
  const ORACLE_ADDRESS = "0x85485dD6cFaF5220150c413309C61a8EA24d24FE";

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Deploy MintRedeemV2
  const MintRedeemV2 = await ethers.getContractFactory("MintRedeemV2");
  const mintRedeemV2 = await MintRedeemV2.deploy(
    MOCK_USDC_ADDRESS,
    BVIX_ADDRESS,
    ORACLE_ADDRESS,
    deployer.address
  );

  await mintRedeemV2.waitForDeployment();
  const mintRedeemV2Address = await mintRedeemV2.getAddress();

  console.log("MintRedeemV2 deployed to:", mintRedeemV2Address);

  // Set the new contract as the BVIX minter/burner
  const bvix = await ethers.getContractAt("BVIXToken", BVIX_ADDRESS);
  
  console.log("Setting MintRedeemV2 as BVIX owner...");
  await bvix.transferOwnership(mintRedeemV2Address);
  
  console.log("✅ Deployment complete!");
  console.log("📋 Update these addresses in web3.ts:");
  console.log(`MINT_REDEEM_ADDRESS = "${mintRedeemV2Address}"`);
  
  // Verify current collateral ratio
  console.log("\n📊 Checking current vault status...");
  const collateralRatio = await mintRedeemV2.getCollateralRatio();
  console.log(`Current collateral ratio: ${collateralRatio}%`);
  
  if (collateralRatio < 120) {
    console.log("⚠️  WARNING: Collateral ratio below 120%! Minting will be restricted.");
  } else {
    console.log("✅ Collateral ratio is healthy for minting.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });