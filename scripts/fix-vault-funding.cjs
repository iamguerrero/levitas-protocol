const { ethers } = require("hardhat");

async function main() {
  console.log("🔄 Fixing vault funding issue...");

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

  // Since deployer owns the MockUSDC contract, mint more USDC to deployer
  const mintAmount = ethers.parseUnits("1000", 6); // 1000 USDC
  
  console.log(`\n💰 Minting ${ethers.formatUnits(mintAmount, 6)} USDC to deployer...`);
  const mintTx = await usdcContract.mint(deployer.address, mintAmount);
  await mintTx.wait();
  console.log("✅ USDC minted successfully");

  // Check new deployer balance
  const newDeployerBalance = await usdcContract.balanceOf(deployer.address);
  console.log(`New deployer balance: ${ethers.formatUnits(newDeployerBalance, 6)} USDC`);

  // Use the addCollateral function to fund the new contract
  const transferAmount = ethers.parseUnits("950", 6); // 950 USDC
  
  console.log(`\n💰 Using addCollateral to fund new contract with ${ethers.formatUnits(transferAmount, 6)} USDC...`);

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
  const finalBalance = await usdcContract.balanceOf(NEW_MINT_REDEEM);
  const collateralRatio = await newMintRedeem.getCollateralRatio();
  
  console.log(`\n📊 Final vault balance: ${ethers.formatUnits(finalBalance, 6)} USDC`);
  console.log(`📊 Final collateral ratio: ${collateralRatio}%`);
  
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