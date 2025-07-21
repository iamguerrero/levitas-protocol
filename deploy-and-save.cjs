const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("🚀 Deploying contracts to Sepolia...");
  
  try {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);
    console.log("Balance:", ethers.formatEther(await deployer.getBalance()), "ETH");

    const addresses = {};

    // Deploy MockUSDC
    console.log("1. Deploying MockUSDC...");
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUSDC = await MockUSDC.deploy(deployer.address);
    await mockUSDC.waitForDeployment();
    addresses.mockUSDC = await mockUSDC.getAddress();
    console.log("   MockUSDC:", addresses.mockUSDC);

    // Deploy BVIX Oracle
    console.log("2. Deploying BVIX Oracle...");
    const MockOracle = await ethers.getContractFactory("MockOracle");
    const bvixOracle = await MockOracle.deploy();
    await bvixOracle.waitForDeployment();
    addresses.bvixOracle = await bvixOracle.getAddress();
    console.log("   BVIX Oracle:", addresses.bvixOracle);

    // Deploy EVIX Oracle
    console.log("3. Deploying EVIX Oracle...");
    const evixOracle = await MockOracle.deploy();
    await evixOracle.waitForDeployment();
    addresses.evixOracle = await evixOracle.getAddress();
    console.log("   EVIX Oracle:", addresses.evixOracle);

    // Deploy BVIXToken
    console.log("4. Deploying BVIXToken...");
    const BVIXToken = await ethers.getContractFactory("BVIXToken");
    const bvixToken = await BVIXToken.deploy(deployer.address);
    await bvixToken.waitForDeployment();
    addresses.bvixToken = await bvixToken.getAddress();
    console.log("   BVIXToken:", addresses.bvixToken);

    // Deploy EVIXToken
    console.log("5. Deploying EVIXToken...");
    const EVIXToken = await ethers.getContractFactory("EVIXToken");
    const evixToken = await EVIXToken.deploy(deployer.address);
    await evixToken.waitForDeployment();
    addresses.evixToken = await evixToken.getAddress();
    console.log("   EVIXToken:", addresses.evixToken);

    // Deploy BVIX MintRedeem
    console.log("6. Deploying BVIX MintRedeemV6...");
    const MintRedeemV6 = await ethers.getContractFactory("MintRedeemV6");
    const bvixMintRedeem = await MintRedeemV6.deploy(
      addresses.mockUSDC,
      addresses.bvixToken,
      addresses.bvixOracle,
      deployer.address
    );
    await bvixMintRedeem.waitForDeployment();
    addresses.bvixMintRedeem = await bvixMintRedeem.getAddress();
    console.log("   BVIX MintRedeem:", addresses.bvixMintRedeem);

    // Deploy EVIX MintRedeem
    console.log("7. Deploying EVIX MintRedeemV6...");
    const EVIXMintRedeemV6 = await ethers.getContractFactory("EVIXMintRedeemV6");
    const evixMintRedeem = await EVIXMintRedeemV6.deploy(
      addresses.mockUSDC,
      addresses.evixToken,
      addresses.evixOracle,
      deployer.address
    );
    await evixMintRedeem.waitForDeployment();
    addresses.evixMintRedeem = await evixMintRedeem.getAddress();
    console.log("   EVIX MintRedeem:", addresses.evixMintRedeem);

    // Transfer ownerships
    console.log("8. Transferring ownerships...");
    await bvixToken.transferOwnership(addresses.bvixMintRedeem);
    await evixToken.transferOwnership(addresses.evixMintRedeem);

    // Set oracle prices
    console.log("9. Setting oracle prices...");
    await bvixOracle.setPrice(ethers.parseUnits("42.15", 8));
    await evixOracle.setPrice(ethers.parseUnits("37.98", 8));

    // Test faucet
    console.log("10. Testing faucet...");
    const faucetTx = await mockUSDC.faucet();
    await faucetTx.wait();
    console.log("   Faucet works!");

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

    // Save to file
    fs.writeFileSync('sepolia-addresses.json', JSON.stringify(web3Addresses, null, 2));
    
    console.log("\n🎉 DEPLOYMENT COMPLETE!");
    console.log("Addresses saved to: sepolia-addresses.json");
    console.log("\n=== SEPOLIA ADDRESSES ===");
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