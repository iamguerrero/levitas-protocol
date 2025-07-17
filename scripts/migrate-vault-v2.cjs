const { ethers } = require("hardhat");

async function main() {
  console.log("🔄 Migrating vault from old MintRedeem to MintRedeemV2...");

  // Contract addresses
  const OLD_MINT_REDEEM = "0x1f3FB11995F1650D469649C476defB753766b2A0";
  const NEW_MINT_REDEEM = "0x5254533747b373D13303AE8ACC9D464f80B6bfae";
  const MOCK_USDC_ADDRESS = "0x79640e0f510a7c6d59737442649d9600C84b035f";

  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);

  // Connect to contracts
  const usdcContract = await ethers.getContractAt("MockUSDC", MOCK_USDC_ADDRESS);
  const oldMintRedeem = await ethers.getContractAt("MintRedeem", OLD_MINT_REDEEM);
  const newMintRedeem = await ethers.getContractAt("MintRedeemV2", NEW_MINT_REDEEM);

  // Check balances
  const oldBalance = await usdcContract.balanceOf(OLD_MINT_REDEEM);
  const newBalance = await usdcContract.balanceOf(NEW_MINT_REDEEM);
  
  console.log(`Old contract USDC balance: ${ethers.formatUnits(oldBalance, 6)} USDC`);
  console.log(`New contract USDC balance: ${ethers.formatUnits(newBalance, 6)} USDC`);

  if (oldBalance > 0) {
    console.log("⚠️  Old contract still has USDC. Need to transfer it to new contract.");
    console.log("Note: This requires the old contract to have a transfer function or owner privileges.");
  }

  // Check collateral ratio with new contract
  try {
    const collateralRatio = await newMintRedeem.getCollateralRatio();
    console.log(`\n📊 Current collateral ratio: ${collateralRatio}%`);
    
    if (collateralRatio < 120) {
      console.log("⚠️  Collateral ratio is below 120%. Minting will be restricted.");
      console.log("💡 Need to add more USDC to vault or reduce BVIX supply.");
    }
  } catch (error) {
    console.error("Error checking collateral ratio:", error.message);
  }

  console.log("\n✅ Migration check complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });