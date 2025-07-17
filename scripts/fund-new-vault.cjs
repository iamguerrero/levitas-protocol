const { ethers } = require("hardhat");

async function main() {
  console.log("🔄 Funding new MintRedeemV2 contract with fresh USDC...");

  // Contract addresses
  const NEW_MINT_REDEEM = "0x5254533747b373D13303AE8ACC9D464f80B6bfae";
  const MOCK_USDC_ADDRESS = "0x79640e0f510a7c6d59737442649d9600C84b035f";

  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);

  // Connect to contracts
  const usdcContract = await ethers.getContractAt("MockUSDC", MOCK_USDC_ADDRESS);
  const newMintRedeem = await ethers.getContractAt("MintRedeemV2", NEW_MINT_REDEEM);

  // Check current balances
  const deployerBalance = await usdcContract.balanceOf(deployer.address);
  const newBalance = await usdcContract.balanceOf(NEW_MINT_REDEEM);
  
  console.log(`Deployer USDC balance: ${ethers.formatUnits(deployerBalance, 6)} USDC`);
  console.log(`New contract USDC balance: ${ethers.formatUnits(newBalance, 6)} USDC`);

  // Use the addCollateral function to fund the new contract
  const transferAmount = ethers.parseUnits("950", 6); // 950 USDC
  
  console.log(`\n💰 Using addCollateral to fund new contract with ${ethers.formatUnits(transferAmount, 6)} USDC...`);
  
  if (deployerBalance < transferAmount) {
    console.log("Need to get more USDC. Check if you have USDC or use the web interface to get test USDC.");
    return;
  }

  // First approve the new contract to spend USDC
  console.log("📝 Approving new contract to spend USDC...");
  const approveTx = await usdcContract.approve(NEW_MINT_REDEEM, transferAmount);
  await approveTx.wait();
  console.log("✅ Approval successful");

  // Use addCollateral function to fund the vault
  console.log("💰 Adding collateral to vault...");
  const addCollateralTx = await newMintRedeem.addCollateral(transferAmount);
  await addCollateralTx.wait();
  console.log("✅ Collateral added successfully");

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