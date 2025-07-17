const { ethers } = require("hardhat");

async function main() {
  console.log("🔄 Transferring USDC from old contract to new MintRedeemV2...");

  // Contract addresses
  const OLD_MINT_REDEEM = "0x1f3FB11995F1650D469649C476defB753766b2A0";
  const NEW_MINT_REDEEM = "0x5254533747b373D13303AE8ACC9D464f80B6bfae";
  const MOCK_USDC_ADDRESS = "0x79640e0f510a7c6d59737442649d9600C84b035f";

  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);

  // Connect to contracts
  const usdcContract = await ethers.getContractAt("MockUSDC", MOCK_USDC_ADDRESS);
  const newMintRedeem = await ethers.getContractAt("MintRedeemV2", NEW_MINT_REDEEM);

  // Check current balances
  const oldBalance = await usdcContract.balanceOf(OLD_MINT_REDEEM);
  const newBalance = await usdcContract.balanceOf(NEW_MINT_REDEEM);
  
  console.log(`Old contract USDC balance: ${ethers.formatUnits(oldBalance, 6)} USDC`);
  console.log(`New contract USDC balance: ${ethers.formatUnits(newBalance, 6)} USDC`);

  // Transfer USDC from deployer to new contract to restore collateral
  const transferAmount = ethers.parseUnits("950", 6); // 950 USDC
  
  console.log(`\n💰 Transferring ${ethers.formatUnits(transferAmount, 6)} USDC to new contract...`);
  
  // First check deployer balance
  const deployerBalance = await usdcContract.balanceOf(deployer.address);
  console.log(`Deployer USDC balance: ${ethers.formatUnits(deployerBalance, 6)} USDC`);
  
  if (deployerBalance < transferAmount) {
    console.log("⚠️  Insufficient USDC balance. Minting more USDC first...");
    const mintTx = await usdcContract.mint(deployer.address, transferAmount);
    await mintTx.wait();
    console.log("✅ Minted additional USDC");
  }

  // Transfer USDC to new contract
  const transferTx = await usdcContract.transfer(NEW_MINT_REDEEM, transferAmount);
  await transferTx.wait();
  
  console.log("✅ USDC transferred to new contract");

  // Check new collateral ratio
  const newBalanceAfter = await usdcContract.balanceOf(NEW_MINT_REDEEM);
  const collateralRatio = await newMintRedeem.getCollateralRatio();
  
  console.log(`\n📊 New vault balance: ${ethers.formatUnits(newBalanceAfter, 6)} USDC`);
  console.log(`📊 New collateral ratio: ${collateralRatio}%`);
  
  if (collateralRatio >= 120) {
    console.log("✅ Collateral ratio is healthy! Minting is now enabled.");
  } else {
    console.log("⚠️  Collateral ratio still below 120%. May need more USDC.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });