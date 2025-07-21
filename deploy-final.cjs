const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting Sepolia deployment...");
  
  try {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);
    console.log("Balance:", ethers.formatEther(await deployer.getBalance()), "ETH");

    const addresses = {};

    // Deploy MockUSDC
    console.log("\n1. Deploying MockUSDC...");
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUSDC = await MockUSDC.deploy(deployer.address);
    await mockUSDC.waitForDeployment();
    addresses.mockUSDC = await mockUSDC.getAddress();
    console.log("✅ MockUSDC:", addresses.mockUSDC);

    // Test faucet
    console.log("Testing faucet...");
    const faucetTx = await mockUSDC.faucet();
    await faucetTx.wait();
    console.log("✅ Faucet works!");

    // Deploy BVIX Oracle
    console.log("\n2. Deploying BVIX Oracle...");
    const MockOracle = await ethers.getContractFactory("MockOracle");
    const bvixOracle = await MockOracle.deploy();
    await bvixOracle.waitForDeployment();
    addresses.bvixOracle = await bvixOracle.getAddress();
    console.log("✅ BVIX Oracle:", addresses.bvixOracle);

    // Deploy EVIX Oracle
    console.log("\n3. Deploying EVIX Oracle...");
    const evixOracle = await MockOracle.deploy();
    await evixOracle.waitForDeployment();
    addresses.evixOracle = await evixOracle.getAddress();
    console.log("✅ EVIX Oracle:", addresses.evixOracle);

    // Deploy BVIXToken
    console.log("\n4. Deploying BVIXToken...");
    const BVIXToken = await ethers.getContractFactory("BVIXToken");
    const bvixToken = await BVIXToken.deploy(deployer.address);
    await bvixToken.waitForDeployment();
    addresses.bvixToken = await bvixToken.getAddress();
    console.log("✅ BVIXToken:", addresses.bvixToken);

    // Deploy EVIXToken
    console.log("\n5. Deploying EVIXToken...");
    const EVIXToken = await ethers.getContractFactory("EVIXToken");
    const evixToken = await EVIXToken.deploy(deployer.address);
    await evixToken.waitForDeployment();
    addresses.evixToken = await evixToken.getAddress();
    console.log("✅ EVIXToken:", addresses.evixToken);

    // Deploy BVIX MintRedeem
    console.log("\n6. Deploying BVIX MintRedeemV6...");
    const MintRedeemV6 = await ethers.getContractFactory("MintRedeemV6");
    const bvixMintRedeem = await MintRedeemV6.deploy(
      addresses.mockUSDC,
      addresses.bvixToken,
      addresses.bvixOracle,
      deployer.address
    );
    await bvixMintRedeem.waitForDeployment();
    addresses.bvixMintRedeem = await bvixMintRedeem.getAddress();
    console.log("✅ BVIX MintRedeem:", addresses.bvixMintRedeem);

    // Transfer BVIX ownership
    await bvixToken.transferOwnership(addresses.bvixMintRedeem);
    console.log("✅ BVIX ownership transferred");

    // Deploy EVIX MintRedeem
    console.log("\n7. Deploying EVIX MintRedeemV6...");
    const EVIXMintRedeemV6 = await ethers.getContractFactory("EVIXMintRedeemV6");
    const evixMintRedeem = await EVIXMintRedeemV6.deploy(
      addresses.mockUSDC,
      addresses.evixToken,
      addresses.evixOracle,
      deployer.address
    );
    await evixMintRedeem.waitForDeployment();
    addresses.evixMintRedeem = await evixMintRedeem.getAddress();
    console.log("✅ EVIX MintRedeem:", addresses.evixMintRedeem);

    // Transfer EVIX ownership
    await evixToken.transferOwnership(addresses.evixMintRedeem);
    console.log("✅ EVIX ownership transferred");

    // Set oracle prices
    await bvixOracle.setPrice(ethers.parseUnits("42.15", 8));
    await evixOracle.setPrice(ethers.parseUnits("37.98", 8));
    console.log("✅ Oracle prices set");

    // Prepare addresses for web3.ts
    const web3Addresses = {
      mockUsdc: addresses.mockUSDC,
      bvix: addresses.bvixToken,
      evix: addresses.evixToken,
      oracle: addresses.bvixOracle,
      evixOracle: addresses.evixOracle,
      mintRedeem: addresses.bvixMintRedeem,
      evixMintRedeem: addresses.evixMintRedeem
    };

    console.log("\n🎉 DEPLOYMENT COMPLETE!");
    console.log("\n=== SEPOLIA CONTRACT ADDRESSES ===");
    console.log("MockUSDC:", web3Addresses.mockUsdc);
    console.log("BVIX Token:", web3Addresses.bvix);
    console.log("EVIX Token:", web3Addresses.evix);
    console.log("BVIX Oracle:", web3Addresses.oracle);
    console.log("EVIX Oracle:", web3Addresses.evixOracle);
    console.log("BVIX MintRedeem:", web3Addresses.mintRedeem);
    console.log("EVIX MintRedeem:", web3Addresses.evixMintRedeem);
    
    console.log("\n=== FOR WEB3.TS ===");
    console.log(JSON.stringify(web3Addresses, null, 2));

  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    console.error("Full error:", error);
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