const { ethers } = require("hardhat");

async function main() {
  console.log("💰 Adding USDC collateral to vault...");

  // Contract addresses
  const NEW_MINT_REDEEM = "0x685FEc86F539a1C0e9aEEf02894D5D90bfC48098";
  const MOCK_USDC_ADDRESS = "0x79640e0f510a7c6d59737442649d9600C84b035f";
  const BVIX_ADDRESS = "0xEA3d08a5A5bC48Fc984F0F773826693B7480bF48";
  const ORACLE_ADDRESS = "0x85485dD6cFaF5220150c413309C61a8EA24d24FE";

  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);

  // Connect to contracts
  const usdcContract = await ethers.getContractAt("MockUSDC", MOCK_USDC_ADDRESS);
  const mintRedeem = await ethers.getContractAt("MintRedeemV2", NEW_MINT_REDEEM);
  const bvixContract = await ethers.getContractAt("BVIXToken", BVIX_ADDRESS);
  const oracleContract = await ethers.getContractAt("MockOracle", ORACLE_ADDRESS);

  // Get current state
  const deployerBalance = await usdcContract.balanceOf(deployer.address);
  const vaultBalance = await usdcContract.balanceOf(NEW_MINT_REDEEM);
  const bvixSupply = await bvixContract.totalSupply();
  const bvixPrice = await oracleContract.getPrice();
  const currentCR = await mintRedeem.getCollateralRatio();
  
  console.log(`\n📊 Current State:`);
  console.log(`   Deployer USDC: ${ethers.formatUnits(deployerBalance, 6)} USDC`);
  console.log(`   Vault USDC: ${ethers.formatUnits(vaultBalance, 6)} USDC`);
  console.log(`   BVIX Supply: ${ethers.formatUnits(bvixSupply, 18)} BVIX`);
  console.log(`   BVIX Price: $${ethers.formatUnits(bvixPrice, 18)}`);
  console.log(`   Current CR: ${currentCR}%`);

  // Calculate how much USDC needed for 150% CR
  const bvixValueUSD = (bvixSupply * bvixPrice) / ethers.parseUnits("1", 18);
  const neededUSDC = (bvixValueUSD * 150n) / 100n; // 150% CR
  const neededUSDC6 = neededUSDC / ethers.parseUnits("1", 12); // Convert to 6 decimals
  
  console.log(`\n🎯 Collateral Requirements:`);
  console.log(`   BVIX Value: $${ethers.formatUnits(bvixValueUSD, 18)}`);
  console.log(`   USDC needed for 150% CR: ${ethers.formatUnits(neededUSDC6, 6)} USDC`);

  // Get test USDC if needed
  if (deployerBalance < neededUSDC6) {
    console.log(`\n💰 Getting test USDC...`);
    try {
      const mintAmount = ethers.parseUnits("2000", 6); // Get 2000 USDC
      const mintTx = await usdcContract.mint(deployer.address, mintAmount);
      await mintTx.wait();
      console.log(`✅ Minted ${ethers.formatUnits(mintAmount, 6)} test USDC`);
    } catch (error) {
      console.log(`⚠️  USDC mint failed: ${error.message}`);
      console.log(`   You may need to send USDC to: ${deployer.address}`);
      return;
    }
  }

  // Add collateral to reach 150% CR
  console.log(`\n📈 Adding collateral to reach 150% CR...`);
  try {
    const approveTx = await usdcContract.approve(NEW_MINT_REDEEM, neededUSDC6);
    await approveTx.wait();
    console.log(`✅ Approved ${ethers.formatUnits(neededUSDC6, 6)} USDC`);
    
    const addCollateralTx = await mintRedeem.addCollateral(neededUSDC6);
    await addCollateralTx.wait();
    console.log(`✅ Added ${ethers.formatUnits(neededUSDC6, 6)} USDC as collateral`);
    
    // Check new state
    const newVaultBalance = await usdcContract.balanceOf(NEW_MINT_REDEEM);
    const newCR = await mintRedeem.getCollateralRatio();
    
    console.log(`\n🎉 Success! New vault status:`);
    console.log(`   Vault USDC: ${ethers.formatUnits(newVaultBalance, 6)} USDC`);
    console.log(`   Collateral ratio: ${newCR}%`);
    console.log(`   Minting is now enabled! 🚀`);
    
  } catch (error) {
    console.error(`❌ Failed to add collateral: ${error.message}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });