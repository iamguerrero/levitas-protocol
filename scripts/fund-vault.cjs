const { ethers } = require("hardhat");

async function main() {
  console.log("💰 Funding vault with collateral for testing...");

  // Contract addresses
  const NEW_MINT_REDEEM = "0x685FEc86F539a1C0e9aEEf02894D5D90bfC48098";
  const MOCK_USDC_ADDRESS = "0x79640e0f510a7c6d59737442649d9600C84b035f";

  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);

  // Connect to contracts
  const usdcContract = await ethers.getContractAt("MockUSDC", MOCK_USDC_ADDRESS);
  const mintRedeem = await ethers.getContractAt("MintRedeemV2", NEW_MINT_REDEEM);

  // Check current balances
  const deployerBalance = await usdcContract.balanceOf(deployer.address);
  const vaultBalance = await usdcContract.balanceOf(NEW_MINT_REDEEM);
  
  console.log(`Deployer USDC balance: ${ethers.formatUnits(deployerBalance, 6)} USDC`);
  console.log(`Vault USDC balance: ${ethers.formatUnits(vaultBalance, 6)} USDC`);

  // Get test USDC if needed
  if (deployerBalance < ethers.parseUnits("1000", 6)) {
    console.log("Getting test USDC...");
    try {
      const mintTx = await usdcContract.mint(deployer.address, ethers.parseUnits("10000", 6));
      await mintTx.wait();
      console.log("✅ Got 10,000 test USDC");
    } catch (error) {
      console.log("⚠️  USDC mint failed (might not have mint function)");
    }
  }

  // Add 1000 USDC as collateral to make vault functional
  const collateralAmount = ethers.parseUnits("1000", 6);
  console.log(`\nAdding ${ethers.formatUnits(collateralAmount, 6)} USDC as collateral...`);
  
  try {
    const approveTx = await usdcContract.approve(NEW_MINT_REDEEM, collateralAmount);
    await approveTx.wait();
    console.log("✅ Approved USDC for collateral");
    
    const addCollateralTx = await mintRedeem.addCollateral(collateralAmount);
    await addCollateralTx.wait();
    console.log("✅ Added collateral to vault");
    
    // Check new vault state
    const newVaultBalance = await usdcContract.balanceOf(NEW_MINT_REDEEM);
    const newCollateralRatio = await mintRedeem.getCollateralRatio();
    
    console.log(`\n📊 New vault status:`);
    console.log(`   Vault USDC: ${ethers.formatUnits(newVaultBalance, 6)} USDC`);
    console.log(`   Collateral ratio: ${newCollateralRatio}%`);
    console.log(`\n🎉 Vault is now ready for minting!`);
    
  } catch (error) {
    console.error("❌ Failed to add collateral:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });