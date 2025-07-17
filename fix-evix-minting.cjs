const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 Fixing EVIX minting decimal bug...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  // Deploy corrected EVIX MintRedeem contract
  console.log("\n📄 Deploying fixed EVIX MintRedeem contract...");
  
  const EVIXMintRedeemV5Fixed = await ethers.getContractFactory("EVIXMintRedeemV5Simple");
  const evixMintRedeem = await EVIXMintRedeemV5Fixed.deploy(
    "0x79640e0f510a7c6d59737442649d9600C84b035f", // MockUSDC
    "0x4dEaB86baa7CBDb7859665a7FE9766f22fB799C1", // Fresh EVIX token  
    "0xCd7441A771a7F84E58d98E598B7Ff23A3688094F", // EVIX Oracle
    deployer.address // initialOwner
  );
  
  await evixMintRedeem.waitForDeployment();
  const evixMintRedeemAddress = await evixMintRedeem.getAddress();
  
  console.log("✅ Fixed EVIX MintRedeem deployed to:", evixMintRedeemAddress);
  
  // Transfer EVIX token ownership to new contract
  console.log("\n🔄 Transferring EVIX token ownership...");
  
  const evixToken = await ethers.getContractAt("EVIXToken", "0x4dEaB86baa7CBDb7859665a7FE9766f22fB799C1");
  const transferTx = await evixToken.transferOwnership(evixMintRedeemAddress);
  await transferTx.wait();
  
  console.log("✅ EVIX token ownership transferred to new MintRedeem contract");
  
  // Test mint to verify decimal fix
  console.log("\n🧪 Testing corrected EVIX minting...");
  
  const mockUSDC = await ethers.getContractAt("MockUSDC", "0x79640e0f510a7c6d59737442649d9600C84b035f");
  
  // Get test USDC
  const mintUsdcTx = await mockUSDC.mint(deployer.address, ethers.parseUnits("1000", 6));
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
    console.log("✅ EVIX minting fixed! Creating proper token amounts");
  } else {
    console.log("❌ EVIX minting still broken");
  }
  
  console.log("\n🎯 New EVIX MintRedeem address:", evixMintRedeemAddress);
  console.log("Update frontend to use this address!");
}

main().catch(console.error);