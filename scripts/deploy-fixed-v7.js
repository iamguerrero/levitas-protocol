const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying FIXED contracts with account:", deployer.address);

    // Configuration
    const initialPrice = ethers.parseUnits("42.15", 6); // $42.15 (6 decimals)
    const updateDelay = 120; // 2 minutes for testnet
    const governor = deployer.address;

    console.log("Deployment Configuration:");
    console.log("- Initial Price:", ethers.formatUnits(initialPrice, 6), "USD");
    console.log("- Update Delay:", updateDelay, "seconds");
    console.log("- Governor:", governor);

    // Deploy MockUSDC
    console.log("\n1. Deploying MockUSDC...");
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.deploy(governor);
    await usdc.waitForDeployment();
    console.log("MockUSDC deployed to:", await usdc.getAddress());

    // Deploy BVIXToken
    console.log("\n2. Deploying BVIXToken...");
    const BVIXToken = await ethers.getContractFactory("BVIXToken");
    const bvix = await BVIXToken.deploy(governor);
    await bvix.waitForDeployment();
    console.log("BVIXToken deployed to:", await bvix.getAddress());

    // Deploy PriceOracle
    console.log("\n3. Deploying PriceOracle...");
    const PriceOracle = await ethers.getContractFactory("PriceOracle");
    const priceOracle = await PriceOracle.deploy(initialPrice, updateDelay, governor);
    await priceOracle.waitForDeployment();
    console.log("PriceOracle deployed to:", await priceOracle.getAddress());

    // Deploy FIXED MintRedeemV7
    console.log("\n4. Deploying FIXED MintRedeemV7...");
    const MintRedeemV7 = await ethers.getContractFactory("MintRedeemV7");
    const mintRedeem = await MintRedeemV7.deploy(
        await usdc.getAddress(),
        await bvix.getAddress(),
        await priceOracle.getAddress(),
        governor
    );
    await mintRedeem.waitForDeployment();
    console.log("FIXED MintRedeemV7 deployed to:", await mintRedeem.getAddress());

    // Setup permissions
    console.log("\n5. Setting up permissions...");
    
    // Grant BVIX minting rights to vault
    const MINTER_ROLE = await bvix.MINTER_ROLE();
    await bvix.grantRole(MINTER_ROLE, await mintRedeem.getAddress());
    console.log("Granted BVIX MINTER_ROLE to vault");

    // Verify roles are set correctly
    console.log("\n6. Verifying role setup...");
    
    const GOVERNOR_ROLE = await mintRedeem.GOVERNOR_ROLE();
    const PAUSER_ROLE = await mintRedeem.PAUSER_ROLE();
    const LIQUIDATOR_ROLE = await mintRedeem.LIQUIDATOR_ROLE();

    console.log("Vault roles:");
    console.log("- GOVERNOR_ROLE:", await mintRedeem.hasRole(GOVERNOR_ROLE, governor));
    console.log("- PAUSER_ROLE:", await mintRedeem.hasRole(PAUSER_ROLE, governor));
    console.log("- LIQUIDATOR_ROLE:", await mintRedeem.hasRole(LIQUIDATOR_ROLE, governor));

    // Test basic functionality
    console.log("\n7. Testing basic functionality...");
    
    // Mint some USDC to deployer for testing
    await usdc.mint(deployer.address, ethers.parseUnits("10000", 6));
    console.log("Minted 10,000 USDC to deployer");

    // Test oracle price
    const currentPrice = await priceOracle.getPrice();
    console.log("Current oracle price:", ethers.formatUnits(currentPrice, 6), "USD");

    // Test vault state
    const globalCR = await mintRedeem.getCollateralRatio();
    console.log("Global collateral ratio:", globalCR.toString(), "%");

    // Simple test calculation
    console.log("\n8. Testing mint calculation...");
    const testAmount = ethers.parseUnits("100", 6); // 100 USDC
    console.log("Test USDC amount:", ethers.formatUnits(testAmount, 6));
    console.log("Oracle price:", ethers.formatUnits(currentPrice, 6), "USD");
    console.log("Expected BVIX for 100 USDC at 150% CR: ~2.37 BVIX");

    console.log("\n✅ DEPLOYMENT COMPLETE!");
    console.log("\nContract Addresses:");
    console.log("====================");
    console.log("MockUSDC:", await usdc.getAddress());
    console.log("BVIXToken:", await bvix.getAddress());
    console.log("PriceOracle:", await priceOracle.getAddress());
    console.log("MintRedeemV7:", await mintRedeem.getAddress());
    
    console.log("\nNext steps:");
    console.log("1. Update contract addresses in client/src/lib/web3.ts");
    console.log("2. Test minting with small amounts first");
    console.log("3. Verify decimal calculations are correct");
    console.log("4. Deploy EVIX ecosystem separately if needed");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 