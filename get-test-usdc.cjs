const { ethers } = require("hardhat");

async function main() {
  console.log("=== GETTING TEST USDC ===");
  
  const MOCK_USDC_ADDRESS = "0x79640e0f510a7c6d59737442649d9600C84b035f";
  
  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  
  // Get USDC contract
  const usdcContract = await ethers.getContractAt("MockUSDC", MOCK_USDC_ADDRESS);
  
  // Check current balance
  const currentBalance = await usdcContract.balanceOf(deployer.address);
  console.log("Current USDC balance:", ethers.formatUnits(currentBalance, 6));
  
  // Mint 10,000 USDC to deployer
  const mintAmount = ethers.parseUnits("10000", 6);
  
  console.log("Minting 10,000 USDC to deployer...");
  
  const mintTx = await usdcContract.mint(deployer.address, mintAmount);
  await mintTx.wait();
  
  console.log("✅ USDC minted!");
  
  // Check new balance
  const newBalance = await usdcContract.balanceOf(deployer.address);
  console.log("New USDC balance:", ethers.formatUnits(newBalance, 6));
  
  // Now add collateral to the new contract
  const NEW_MINT_REDEEM_ADDRESS = "0xAec6c459354D31031Ef7f77bE974eeE39BD60382";
  const mintRedeem = await ethers.getContractAt("MintRedeemV2", NEW_MINT_REDEEM_ADDRESS);
  
  const collateralAmount = ethers.parseUnits("2000", 6); // 2000 USDC
  
  console.log("Adding 2000 USDC collateral...");
  
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
  
  // Test mint function
  console.log("\n=== TESTING MINT FUNCTION ===");
  
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
  
  console.log("\n=== READY TO UPDATE FRONTEND ===");
}

main().catch(console.error);