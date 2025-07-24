const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying simple EVIX ecosystem...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  // Step 1: Deploy fresh EVIX token
  console.log("\n📄 Deploying fresh EVIX token...");
  const EVIXToken = await ethers.getContractFactory("EVIXToken");
  const evixToken = await EVIXToken.deploy(deployer.address);
  await evixToken.waitForDeployment();
  const evixTokenAddress = await evixToken.getAddress();
  console.log("✅ Fresh EVIX token deployed to:", evixTokenAddress);
  
  // Step 2: Deploy simple EVIX MintRedeem
  console.log("\n📄 Deploying simple EVIX MintRedeem...");
  const EVIXMintRedeemSimple = await ethers.getContractFactory("EVIXMintRedeemSimple");
  const evixMintRedeem = await EVIXMintRedeemSimple.deploy(
    "0x79640e0f510a7c6d59737442649d9600C84b035f", // MockUSDC
    evixTokenAddress, // Fresh EVIX token
    "0xCd7441A771a7F84E58d98E598B7Ff23A3688094F", // EVIX Oracle
    deployer.address // initialOwner
  );
  await evixMintRedeem.waitForDeployment();
  const evixMintRedeemAddress = await evixMintRedeem.getAddress();
  console.log("✅ Simple EVIX MintRedeem deployed to:", evixMintRedeemAddress);
  
  // Step 3: Grant MINTER_ROLE to MintRedeem contract
  console.log("\n🔑 Granting MINTER_ROLE to MintRedeem contract...");
  const MINTER_ROLE = await evixToken.MINTER_ROLE();
  const grantRoleTx = await evixToken.grantRole(MINTER_ROLE, evixMintRedeemAddress);
  await grantRoleTx.wait();
  console.log("✅ MINTER_ROLE granted to MintRedeem contract");
  
  // Step 4: Test the minting
  console.log("\n🧪 Testing EVIX minting...");
  
  const mockUSDC = await ethers.getContractAt("MockUSDC", "0x79640e0f510a7c6d59737442649d9600C84b035f");
  
  // Get test USDC
  const mintUsdcTx = await mockUSDC.mint(deployer.address, ethers.parseUnits("1000", 6));
  await mintUsdcTx.wait();
  
  // Approve USDC
  const approveTx = await mockUSDC.approve(evixMintRedeemAddress, ethers.parseUnits("100", 6));
  await approveTx.wait();
  
  // Test mint
  const testMintTx = await evixMintRedeem.mint(ethers.parseUnits("100", 6));
  await testMintTx.wait();
  console.log("✅ Test mint successful!");
  
  // Check balances
  const evixBalance = await evixToken.balanceOf(deployer.address);
  console.log("EVIX balance after test mint:", ethers.formatEther(evixBalance));
  
  // Step 5: Save deployment info
  const deploymentInfo = {
    network: "baseSepolia",
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    contracts: {
      evix: evixTokenAddress,
      evixMintRedeem: evixMintRedeemAddress,
      evixPriceOracle: "0xCd7441A771a7F84E58d98E598B7Ff23A3688094F",
      sharedUsdc: "0x79640e0f510a7c6d59737442649d9600C84b035f"
    },
    configuration: {
      initialPrice: "80.0",
      updateDelay: 120,
      liquidationThreshold: 120,
      liquidationBonus: 5
    }
  };
  
  const fs = require('fs');
  const filename = `evix-simple-deployment-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n📄 Deployment info saved to: ${filename}`);
  
  console.log("\n🎉 SIMPLE EVIX ECOSYSTEM DEPLOYED SUCCESSFULLY!");
  console.log("New EVIX Token:", evixTokenAddress);
  console.log("New EVIX MintRedeem (Simple):", evixMintRedeemAddress);
  console.log("MINTER_ROLE properly configured");
  console.log("Test mint successful - ready for frontend use!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 