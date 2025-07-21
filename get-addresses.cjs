const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Getting deployed contract addresses...");
  
  try {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);

    // Deploy MockUSDC first to get its address
    console.log("\n1. Deploying MockUSDC...");
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUSDC = await MockUSDC.deploy(deployer.address);
    await mockUSDC.waitForDeployment();
    const mockUSDCAddress = await mockUSDC.getAddress();
    console.log("✅ MockUSDC:", mockUSDCAddress);

    // Deploy BVIX Oracle
    console.log("\n2. Deploying BVIX Oracle...");
    const MockOracle = await ethers.getContractFactory("MockOracle");
    const bvixOracle = await MockOracle.deploy();
    await bvixOracle.waitForDeployment();
    const bvixOracleAddress = await bvixOracle.getAddress();
    console.log("✅ BVIX Oracle:", bvixOracleAddress);

    // Deploy EVIX Oracle
    console.log("\n3. Deploying EVIX Oracle...");
    const evixOracle = await MockOracle.deploy();
    await evixOracle.waitForDeployment();
    const evixOracleAddress = await evixOracle.getAddress();
    console.log("✅ EVIX Oracle:", evixOracleAddress);

    // Deploy BVIXToken
    console.log("\n4. Deploying BVIXToken...");
    const BVIXToken = await ethers.getContractFactory("BVIXToken");
    const bvixToken = await BVIXToken.deploy(deployer.address);
    await bvixToken.waitForDeployment();
    const bvixTokenAddress = await bvixToken.getAddress();
    console.log("✅ BVIXToken:", bvixTokenAddress);

    // Deploy EVIXToken
    console.log("\n5. Deploying EVIXToken...");
    const EVIXToken = await ethers.getContractFactory("EVIXToken");
    const evixToken = await EVIXToken.deploy(deployer.address);
    await evixToken.waitForDeployment();
    const evixTokenAddress = await evixToken.getAddress();
    console.log("✅ EVIXToken:", evixTokenAddress);

    // Deploy BVIX MintRedeem
    console.log("\n6. Deploying BVIX MintRedeemV6...");
    const MintRedeemV6 = await ethers.getContractFactory("MintRedeemV6");
    const bvixMintRedeem = await MintRedeemV6.deploy(
      mockUSDCAddress,
      bvixTokenAddress,
      bvixOracleAddress,
      deployer.address
    );
    await bvixMintRedeem.waitForDeployment();
    const bvixMintRedeemAddress = await bvixMintRedeem.getAddress();
    console.log("✅ BVIX MintRedeem:", bvixMintRedeemAddress);

    // Transfer BVIX ownership
    await bvixToken.transferOwnership(bvixMintRedeemAddress);
    console.log("✅ BVIX ownership transferred");

    // Deploy EVIX MintRedeem
    console.log("\n7. Deploying EVIX MintRedeemV6...");
    const EVIXMintRedeemV6 = await ethers.getContractFactory("EVIXMintRedeemV6");
    const evixMintRedeem = await EVIXMintRedeemV6.deploy(
      mockUSDCAddress,
      evixTokenAddress,
      evixOracleAddress,
      deployer.address
    );
    await evixMintRedeem.waitForDeployment();
    const evixMintRedeemAddress = await evixMintRedeem.getAddress();
    console.log("✅ EVIX MintRedeem:", evixMintRedeemAddress);

    // Transfer EVIX ownership
    await evixToken.transferOwnership(evixMintRedeemAddress);
    console.log("✅ EVIX ownership transferred");

    // Set oracle prices
    await bvixOracle.setPrice(ethers.parseUnits("42.15", 8));
    await evixOracle.setPrice(ethers.parseUnits("37.98", 8));
    console.log("✅ Oracle prices set");

    // Test faucet
    console.log("\nTesting faucet...");
    const faucetTx = await mockUSDC.faucet();
    await faucetTx.wait();
    console.log("✅ Faucet works!");

    console.log("\n🎉 DEPLOYMENT COMPLETE!");
    console.log("\n=== SEPOLIA CONTRACT ADDRESSES ===");
    console.log("MockUSDC:", mockUSDCAddress);
    console.log("BVIX Token:", bvixTokenAddress);
    console.log("EVIX Token:", evixTokenAddress);
    console.log("BVIX Oracle:", bvixOracleAddress);
    console.log("EVIX Oracle:", evixOracleAddress);
    console.log("BVIX MintRedeem:", bvixMintRedeemAddress);
    console.log("EVIX MintRedeem:", evixMintRedeemAddress);
    
    console.log("\n=== FOR WEB3.TS ===");
    const web3Addresses = {
      mockUsdc: mockUSDCAddress,
      bvix: bvixTokenAddress,
      evix: evixTokenAddress,
      oracle: bvixOracleAddress,
      evixOracle: evixOracleAddress,
      mintRedeem: bvixMintRedeemAddress,
      evixMintRedeem: evixMintRedeemAddress
    };
    console.log(JSON.stringify(web3Addresses, null, 2));

  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    throw error;
  }
}

main()
  .then(() => {
    console.log("Script completed successfully");
    process.exit(0);
  })
  .catch(error => {
    console.error("Script failed:", error);
    process.exit(1);
  }); 