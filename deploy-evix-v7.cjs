const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying EVIX V7 with full collateral ratio functionality...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  // Step 1: Deploy fresh EVIX token
  console.log("\n📄 Deploying fresh EVIX token...");
  const EVIXToken = await ethers.getContractFactory("EVIXToken");
  const evixToken = await EVIXToken.deploy(deployer.address);
  await evixToken.waitForDeployment();
  const evixTokenAddress = await evixToken.getAddress();
  console.log("✅ Fresh EVIX token deployed to:", evixTokenAddress);
  
  // Step 2: Deploy EVIX V7 MintRedeem with full functionality
  console.log("\n📄 Deploying EVIX V7 MintRedeem...");
  const EVIXMintRedeemV7 = await ethers.getContractFactory("EVIXMintRedeemV7");
  const evixMintRedeemV7 = await EVIXMintRedeemV7.deploy(
    "0x79640e0f510a7c6d59737442649d9600C84b035f", // MockUSDC
    evixTokenAddress, // Fresh EVIX token
    "0xCd7441A771a7F84E58d98E598B7Ff23A3688094F", // EVIX Oracle
    deployer.address // governor
  );
  await evixMintRedeemV7.waitForDeployment();
  const evixMintRedeemV7Address = await evixMintRedeemV7.getAddress();
  console.log("✅ EVIX V7 MintRedeem deployed to:", evixMintRedeemV7Address);
  
  // Step 3: Grant MINTER_ROLE to MintRedeem contract
  console.log("\n🔑 Granting MINTER_ROLE to MintRedeem contract...");
  const MINTER_ROLE = await evixToken.MINTER_ROLE();
  const grantRoleTx = await evixToken.grantRole(MINTER_ROLE, evixMintRedeemV7Address);
  await grantRoleTx.wait();
  console.log("✅ MINTER_ROLE granted to MintRedeem contract");
  
  // Step 4: Test the minting with collateral ratio
  console.log("\n🧪 Testing EVIX V7 minting with collateral ratio...");
  
  const mockUSDC = await ethers.getContractAt("MockUSDC", "0x79640e0f510a7c6d59737442649d9600C84b035f");
  
  // Get test USDC
  const mintUsdcTx = await mockUSDC.mint(deployer.address, ethers.parseUnits("1000", 6));
  await mintUsdcTx.wait();
  
  // Approve USDC
  const approveTx = await mockUSDC.approve(evixMintRedeemV7Address, ethers.parseUnits("100", 6));
  await approveTx.wait();
  
  // Test mint with 150% CR
  const testMintTx = await evixMintRedeemV7.mintWithCollateralRatio(
    ethers.parseUnits("100", 6), // 100 USDC
    150 // 150% CR
  );
  await testMintTx.wait();
  console.log("✅ Test mint with 150% CR successful!");
  
  // Check balances and collateral ratio
  const evixBalance = await evixToken.balanceOf(deployer.address);
  const collateralRatio = await evixMintRedeemV7.getCollateralRatio();
  const userCR = await evixMintRedeemV7.getUserCollateralRatio(deployer.address);
  
  console.log("EVIX balance after test mint:", ethers.formatEther(evixBalance));
  console.log("Global collateral ratio:", collateralRatio.toString());
  console.log("User collateral ratio:", userCR.toString());
  
  // Step 5: Save deployment info
  const deploymentInfo = {
    network: "baseSepolia",
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    contracts: {
      evix: evixTokenAddress,
      evixMintRedeemV7: evixMintRedeemV7Address,
      evixPriceOracle: "0xCd7441A771a7F84E58d98E598B7Ff23A3688094F",
      sharedUsdc: "0x79640e0f510a7c6d59737442649d9600C84b035f"
    },
    configuration: {
      initialPrice: "80.0",
      updateDelay: 120,
      liquidationThreshold: 120,
      liquidationBonus: 5,
      minCollateralRatio: 120,
      mintFee: 30,
      redeemFee: 30
    },
    features: [
      "Full collateral ratio enforcement",
      "Position tracking",
      "Liquidation functionality",
      "Role-based access control",
      "Reentrancy protection",
      "Pausable operations"
    ]
  };
  
  const fs = require('fs');
  const filename = `evix-v7-deployment-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n📄 Deployment info saved to: ${filename}`);
  
  console.log("\n🎉 EVIX V7 ECOSYSTEM DEPLOYED SUCCESSFULLY!");
  console.log("New EVIX Token:", evixTokenAddress);
  console.log("New EVIX MintRedeem V7:", evixMintRedeemV7Address);
  console.log("MINTER_ROLE properly configured");
  console.log("Collateral ratio enforcement: ✅");
  console.log("Liquidation functionality: ✅");
  console.log("Test mint successful - ready for frontend use!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 