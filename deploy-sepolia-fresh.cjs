const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting fresh Sepolia deployment...");
  
  try {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);
    console.log("Balance:", ethers.formatEther(await deployer.getBalance()), "ETH");

    if (await deployer.getBalance() === 0n) {
      throw new Error("Deployer has no ETH balance. Please fund the account first.");
    }

    const addresses = {};

    // 1. Deploy MockUSDC
    console.log("\n1. Deploying MockUSDC...");
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUSDC = await MockUSDC.deploy(deployer.address);
    console.log("   Transaction sent, waiting for deployment...");
    await mockUSDC.waitForDeployment();
    addresses.mockUSDC = await mockUSDC.getAddress();
    console.log("   ✅ MockUSDC deployed to:", addresses.mockUSDC);

    // 2. Deploy BVIX Oracle
    console.log("\n2. Deploying BVIX Oracle...");
    const MockOracle = await ethers.getContractFactory("MockOracle");
    const bvixOracle = await MockOracle.deploy();
    await bvixOracle.waitForDeployment();
    addresses.bvixOracle = await bvixOracle.getAddress();
    console.log("   ✅ BVIX Oracle deployed to:", addresses.bvixOracle);

    // 3. Deploy EVIX Oracle
    console.log("\n3. Deploying EVIX Oracle...");
    const evixOracle = await MockOracle.deploy();
    await evixOracle.waitForDeployment();
    addresses.evixOracle = await evixOracle.getAddress();
    console.log("   ✅ EVIX Oracle deployed to:", addresses.evixOracle);

    // 4. Deploy BVIXToken
    console.log("\n4. Deploying BVIXToken...");
    const BVIXToken = await ethers.getContractFactory("BVIXToken");
    const bvixToken = await BVIXToken.deploy(deployer.address);
    await bvixToken.waitForDeployment();
    addresses.bvixToken = await bvixToken.getAddress();
    console.log("   ✅ BVIXToken deployed to:", addresses.bvixToken);

    // 5. Deploy EVIXToken
    console.log("\n5. Deploying EVIXToken...");
    const EVIXToken = await ethers.getContractFactory("EVIXToken");
    const evixToken = await EVIXToken.deploy(deployer.address);
    await evixToken.waitForDeployment();
    addresses.evixToken = await evixToken.getAddress();
    console.log("   ✅ EVIXToken deployed to:", addresses.evixToken);

    // 6. Deploy BVIX MintRedeem
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
    console.log("   ✅ BVIX MintRedeem deployed to:", addresses.bvixMintRedeem);

    // 7. Deploy EVIX MintRedeem
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
    console.log("   ✅ EVIX MintRedeem deployed to:", addresses.evixMintRedeem);

    // 8. Transfer ownerships
    console.log("\n8. Transferring token ownerships...");
    await bvixToken.transferOwnership(addresses.bvixMintRedeem);
    await evixToken.transferOwnership(addresses.evixMintRedeem);
    console.log("   ✅ Ownerships transferred");

    // 9. Set oracle prices
    console.log("\n9. Setting oracle prices...");
    await bvixOracle.setPrice(ethers.parseUnits("42.15", 8));
    await evixOracle.setPrice(ethers.parseUnits("37.98", 8));
    console.log("   ✅ Oracle prices set");

    // 10. Test faucet
    console.log("\n10. Testing MockUSDC faucet...");
    const faucetTx = await mockUSDC.faucet();
    await faucetTx.wait();
    const balance = await mockUSDC.balanceOf(deployer.address);
    console.log("   ✅ Faucet works! Balance:", ethers.formatUnits(balance, 6), "USDC");

    // Output results
    console.log("\n🎉 SEPOLIA DEPLOYMENT COMPLETE!");
    console.log("\n=== CONTRACT ADDRESSES ===");
    console.log("MockUSDC:", addresses.mockUSDC);
    console.log("BVIX Token:", addresses.bvixToken);
    console.log("EVIX Token:", addresses.evixToken);
    console.log("BVIX Oracle:", addresses.bvixOracle);
    console.log("EVIX Oracle:", addresses.evixOracle);
    console.log("BVIX MintRedeem:", addresses.bvixMintRedeem);
    console.log("EVIX MintRedeem:", addresses.evixMintRedeem);

    console.log("\n=== FOR WEB3.TS ===");
    const web3Addresses = {
      mockUsdc: addresses.mockUSDC,
      bvix: addresses.bvixToken,
      evix: addresses.evixToken,
      oracle: addresses.bvixOracle,
      evixOracle: addresses.evixOracle,
      mintRedeem: addresses.bvixMintRedeem,
      evixMintRedeem: addresses.evixMintRedeem
    };
    console.log(JSON.stringify(web3Addresses, null, 2));

  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    console.error("Full error:", error);
    throw error;
  }
}

main()
  .then(() => {
    console.log("\n✅ Deployment script completed successfully");
    process.exit(0);
  })
  .catch(error => {
    console.error("\n❌ Deployment script failed:", error);
    process.exit(1);
  }); 