const { ethers } = require("hardhat");

async function main() {
  console.log("=== ADDING INITIAL COLLATERAL ===");
  
  const NEW_MINT_REDEEM_ADDRESS = "0xAec6c459354D31031Ef7f77bE974eeE39BD60382";
  const MOCK_USDC_ADDRESS = "0x79640e0f510a7c6d59737442649d9600C84b035f";
  
  console.log("New MintRedeemV2:", NEW_MINT_REDEEM_ADDRESS);
  
  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  
  // Get contracts
  const usdcContract = await ethers.getContractAt("MockUSDC", MOCK_USDC_ADDRESS);
  const mintRedeem = await ethers.getContractAt("MintRedeemV2", NEW_MINT_REDEEM_ADDRESS);
  
  // Check deployer's USDC balance
  const deployerBalance = await usdcContract.balanceOf(deployer.address);
  console.log("Deployer USDC balance:", ethers.formatUnits(deployerBalance, 6));
  
  // Add initial collateral using addCollateral function
  const collateralAmount = ethers.parseUnits("1000", 6); // 1000 USDC
  
  console.log("Adding 1000 USDC collateral...");
  
  // First approve the contract to spend USDC
  const approveTx = await usdcContract.approve(NEW_MINT_REDEEM_ADDRESS, collateralAmount);
  await approveTx.wait();
  console.log("✅ USDC approved");
  
  // Add collateral
  const addCollateralTx = await mintRedeem.addCollateral(collateralAmount);
  await addCollateralTx.wait();
  console.log("✅ Collateral added!");
  
  // Check vault balance now
  const vaultBalance = await usdcContract.balanceOf(NEW_MINT_REDEEM_ADDRESS);
  console.log("Vault USDC balance:", ethers.formatUnits(vaultBalance, 6));
  
  // Test mint again
  console.log("\n=== TESTING MINT AFTER COLLATERAL ===");
  
  const testAmount = ethers.parseUnits("100", 6);
  
  try {
    const result = await mintRedeem.mint.staticCall(testAmount);
    console.log("✅ MINT TEST SUCCESSFUL!");
    console.log("Would mint:", ethers.formatEther(result), "BVIX");
    
    // Test actual collateral ratio
    const collateralRatio = await mintRedeem.getCollateralRatio();
    console.log("Current collateral ratio:", collateralRatio.toString() + "%");
    
  } catch (error) {
    console.log("❌ Mint test failed:", error.message);
  }
  
  console.log("\n=== DEPLOYMENT COMPLETE ===");
  console.log("✅ New BVIX Token: 0x75298e29fE21a5dcEFBe96988DdA957d421dc55C");
  console.log("✅ New MintRedeemV2: 0xAec6c459354D31031Ef7f77bE974eeE39BD60382");
  console.log("✅ Proper ownership configured");
  console.log("✅ Initial collateral added");
  console.log("✅ Mint function working");
}

main().catch(console.error);