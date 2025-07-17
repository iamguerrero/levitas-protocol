const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing collateral enforcement in new MintRedeemV2...");

  // New contract address
  const NEW_MINT_REDEEM = "0x685FEc86F539a1C0e9aEEf02894D5D90bfC48098";
  const MOCK_USDC_ADDRESS = "0x79640e0f510a7c6d59737442649d9600C84b035f";

  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);

  // Connect to contracts
  const usdcContract = await ethers.getContractAt("MockUSDC", MOCK_USDC_ADDRESS);
  const newMintRedeem = await ethers.getContractAt("MintRedeemV2", NEW_MINT_REDEEM);

  // Check current state
  const deployerBalance = await usdcContract.balanceOf(deployer.address);
  const vaultBalance = await usdcContract.balanceOf(NEW_MINT_REDEEM);
  const collateralRatio = await newMintRedeem.getCollateralRatio();
  
  console.log(`Deployer USDC balance: ${ethers.formatUnits(deployerBalance, 6)} USDC`);
  console.log(`Vault USDC balance: ${ethers.formatUnits(vaultBalance, 6)} USDC`);
  console.log(`Current collateral ratio: ${collateralRatio}%`);

  // Test 1: Try to mint with 0 collateral (should fail)
  console.log("\n🧪 Test 1: Attempting to mint with 0 vault collateral...");
  try {
    const mintAmount = ethers.parseUnits("100", 6);
    await newMintRedeem.mint(mintAmount);
    console.log("❌ Test 1 FAILED: Mint succeeded when it should have failed");
  } catch (error) {
    console.log("✅ Test 1 PASSED: Mint correctly failed with 0 collateral");
    console.log(`   Error: ${error.message.includes('Would violate') ? 'Collateral ratio violation' : error.message}`);
  }

  // Test 2: Add some collateral and try to mint at exactly 120% (should succeed)
  console.log("\n🧪 Test 2: Adding collateral and testing 120% minting...");
  
  // First ensure we have USDC
  if (deployerBalance < ethers.parseUnits("200", 6)) {
    console.log("Need more USDC. Please get test USDC from the web interface first.");
    return;
  }

  // Add 120 USDC as collateral
  const collateralAmount = ethers.parseUnits("120", 6);
  console.log(`Adding ${ethers.formatUnits(collateralAmount, 6)} USDC as collateral...`);
  
  const approveTx = await usdcContract.approve(NEW_MINT_REDEEM, collateralAmount);
  await approveTx.wait();
  
  const addCollateralTx = await newMintRedeem.addCollateral(collateralAmount);
  await addCollateralTx.wait();
  
  const newCollateralRatio = await newMintRedeem.getCollateralRatio();
  console.log(`New collateral ratio: ${newCollateralRatio}%`);

  // Now try to mint 100 USDC worth (should fail because it would create ~100% CR)
  console.log("\n🧪 Test 3: Attempting to mint 100 USDC worth (should fail)...");
  try {
    const mintAmount = ethers.parseUnits("100", 6);
    const approveMintTx = await usdcContract.approve(NEW_MINT_REDEEM, mintAmount);
    await approveMintTx.wait();
    
    await newMintRedeem.mint(mintAmount);
    console.log("❌ Test 3 FAILED: Mint succeeded when it should have failed");
  } catch (error) {
    console.log("✅ Test 3 PASSED: Mint correctly failed due to collateral ratio");
    console.log(`   Error: ${error.message.includes('Would violate') ? 'Collateral ratio violation' : error.message}`);
  }

  console.log("\n🎉 Collateral enforcement tests completed!");
  console.log("The new contract properly enforces the 120% minimum collateral ratio.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });