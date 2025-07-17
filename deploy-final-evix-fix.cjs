const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 Deploying FINAL EVIX fix with correct decimal handling...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  // Deploy fresh EVIX token
  console.log("\n📄 Deploying fresh EVIX token...");
  const EVIXToken = await ethers.getContractFactory("EVIXToken");
  const evixToken = await EVIXToken.deploy(deployer.address);
  await evixToken.waitForDeployment();
  const evixTokenAddress = await evixToken.getAddress();
  console.log("✅ Fresh EVIX token deployed to:", evixTokenAddress);
  
  // Deploy fixed EVIX MintRedeem
  console.log("\n📄 Deploying fixed EVIX MintRedeem...");
  const EVIXMintRedeem = await ethers.getContractFactory("EVIXMintRedeemV5Simple");
  const evixMintRedeem = await EVIXMintRedeem.deploy(
    "0x79640e0f510a7c6d59737442649d9600C84b035f", // MockUSDC
    evixTokenAddress, // Fresh EVIX token
    "0xCd7441A771a7F84E58d98E598B7Ff23A3688094F", // EVIX Oracle
    deployer.address // initialOwner
  );
  await evixMintRedeem.waitForDeployment();
  const evixMintRedeemAddress = await evixMintRedeem.getAddress();
  console.log("✅ Fixed EVIX MintRedeem deployed to:", evixMintRedeemAddress);
  
  // Transfer ownership
  const transferTx = await evixToken.transferOwnership(evixMintRedeemAddress);
  await transferTx.wait();
  console.log("✅ EVIX token ownership transferred");
  
  // Test the fix
  console.log("\n🧪 Testing fixed EVIX minting...");
  
  const mockUSDC = await ethers.getContractAt("MockUSDC", "0x79640e0f510a7c6d59737442649d9600C84b035f");
  
  // Get test USDC
  const mintUsdcTx = await mockUSDC.mint(deployer.address, ethers.parseUnits("100", 6));
  await mintUsdcTx.wait();
  
  // Approve USDC
  const approveTx = await mockUSDC.approve(evixMintRedeemAddress, ethers.parseUnits("100", 6));
  await approveTx.wait();
  
  // Test mint: 100 USDC at 150% CR
  const testMintTx = await evixMintRedeem.mintWithCollateralRatio(
    ethers.parseUnits("100", 6), // 100 USDC
    ethers.parseUnits("150", 16)  // 150% (with 18 decimals)
  );
  await testMintTx.wait();
  
  // Check results
  const [deployerBalance, totalSupply] = await Promise.all([
    evixToken.balanceOf(deployer.address),
    evixToken.totalSupply()
  ]);
  
  console.log("\n📊 Test mint results:");
  console.log("EVIX balance:", ethers.formatEther(deployerBalance));
  console.log("Total supply:", ethers.formatEther(totalSupply));
  
  // Expected: ~1.75 EVIX tokens (100 USDC ÷ (37.98 × 1.5))
  const expected = 100 / (37.98 * 1.5);
  console.log("Expected tokens:", expected.toFixed(2));
  console.log("Actual tokens:", ethers.formatEther(deployerBalance));
  
  if (parseFloat(ethers.formatEther(deployerBalance)) > 1) {
    console.log("✅ EVIX minting FINALLY FIXED!");
  } else {
    console.log("❌ Still broken - decimal issue persists");
  }
  
  console.log("\n🎯 FINAL CONTRACT ADDRESSES:");
  console.log("EVIX_ADDRESS =", evixTokenAddress);
  console.log("EVIX_MINT_REDEEM_ADDRESS =", evixMintRedeemAddress);
}

main().catch(console.error);