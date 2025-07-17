const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 Redeploying EVIX V5 with fixed redeem function...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  // Deploy fresh EVIX token
  console.log("\n📄 Deploying fresh EVIX token...");
  const EVIXToken = await ethers.getContractFactory("EVIXToken");
  const evixToken = await EVIXToken.deploy(deployer.address);
  await evixToken.waitForDeployment();
  const evixTokenAddress = await evixToken.getAddress();
  console.log("✅ Fresh EVIX token deployed to:", evixTokenAddress);
  
  // Deploy EVIX MintRedeem with fixed redeem
  console.log("\n📄 Deploying EVIX MintRedeem with fixed redeem...");
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
  
  // Test mint and redeem cycle
  console.log("\n🧪 Testing complete mint/redeem cycle...");
  
  const mockUSDC = await ethers.getContractAt("MockUSDC", "0x79640e0f510a7c6d59737442649d9600C84b035f");
  
  // Get test USDC
  const mintUsdcTx = await mockUSDC.mint(deployer.address, ethers.parseUnits("1000", 6));
  await mintUsdcTx.wait();
  
  // Approve USDC
  const approveTx = await mockUSDC.approve(evixMintRedeemAddress, ethers.parseUnits("1000", 6));
  await approveTx.wait();
  
  // Test mint: 100 USDC at 150% CR
  console.log("Minting 100 USDC at 150% CR...");
  const testMintTx = await evixMintRedeem.mintWithCollateralRatio(
    ethers.parseUnits("100", 6), // 100 USDC
    ethers.parseUnits("150", 16)  // 150% (with 18 decimals)
  );
  await testMintTx.wait();
  
  const evixBalance = await evixToken.balanceOf(deployer.address);
  console.log("EVIX minted:", ethers.formatEther(evixBalance));
  
  // Test redeem: half of the tokens
  const redeemAmount = evixBalance / 2n;
  console.log("Redeeming", ethers.formatEther(redeemAmount), "EVIX...");
  
  const usdcBefore = await mockUSDC.balanceOf(deployer.address);
  console.log("USDC before redeem:", ethers.formatUnits(usdcBefore, 6));
  
  const testRedeemTx = await evixMintRedeem.redeem(redeemAmount);
  await testRedeemTx.wait();
  
  const usdcAfter = await mockUSDC.balanceOf(deployer.address);
  console.log("USDC after redeem:", ethers.formatUnits(usdcAfter, 6));
  
  const usdcReceived = usdcAfter - usdcBefore;
  console.log("USDC received:", ethers.formatUnits(usdcReceived, 6));
  
  if (usdcReceived > 0) {
    console.log("✅ EVIX mint/redeem cycle WORKS PERFECTLY!");
  } else {
    console.log("❌ Redeem still broken");
  }
  
  console.log("\n🎯 FINAL WORKING CONTRACT ADDRESSES:");
  console.log("EVIX_ADDRESS =", evixTokenAddress);
  console.log("EVIX_MINT_REDEEM_ADDRESS =", evixMintRedeemAddress);
}

main().catch(console.error);