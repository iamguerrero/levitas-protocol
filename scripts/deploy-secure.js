const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);

    // Configuration
    const initialPrice = ethers.parseUnits("100", 6); // $100.00
    const updateDelay = 120; // 2 minutes for testnet (86400 for mainnet)
    const governor = deployer.address; // In production, this should be a multisig

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

    // Deploy MintRedeemV7
    console.log("\n4. Deploying MintRedeemV7...");
    const MintRedeemV7 = await ethers.getContractFactory("MintRedeemV7");
    const mintRedeem = await MintRedeemV7.deploy(
        await usdc.getAddress(),
        await bvix.getAddress(),
        await priceOracle.getAddress(),
        governor
    );
    await mintRedeem.waitForDeployment();
    console.log("MintRedeemV7 deployed to:", await mintRedeem.getAddress());

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

    const ORACLE_GOVERNOR_ROLE = await priceOracle.GOVERNOR_ROLE();
    const ORACLE_PAUSER_ROLE = await priceOracle.PAUSER_ROLE();
    const ORACLE_UPDATER_ROLE = await priceOracle.PRICE_UPDATER_ROLE();

    console.log("Oracle roles:");
    console.log("- GOVERNOR_ROLE:", await priceOracle.hasRole(ORACLE_GOVERNOR_ROLE, governor));
    console.log("- PAUSER_ROLE:", await priceOracle.hasRole(ORACLE_PAUSER_ROLE, governor));
    console.log("- PRICE_UPDATER_ROLE:", await priceOracle.hasRole(ORACLE_UPDATER_ROLE, governor));

    // Verify deployer admin role is revoked
    console.log("\n7. Verifying security setup...");
    const deployerHasAdmin = await mintRedeem.hasRole(await mintRedeem.DEFAULT_ADMIN_ROLE(), deployer.address);
    console.log("Deployer has admin role (should be false):", deployerHasAdmin);

    const oracleDeployerHasAdmin = await priceOracle.hasRole(await priceOracle.DEFAULT_ADMIN_ROLE(), deployer.address);
    console.log("Oracle deployer has admin role (should be false):", oracleDeployerHasAdmin);

    // Test basic functionality
    console.log("\n8. Testing basic functionality...");
    
    // Mint some USDC to deployer for testing
    await usdc.mint(deployer.address, ethers.parseUnits("10000", 6));
    console.log("Minted 10,000 USDC to deployer");

    // Test oracle price
    const currentPrice = await priceOracle.getPrice();
    console.log("Current oracle price:", ethers.formatUnits(currentPrice, 6), "USD");

    // Test vault state
    const globalCR = await mintRedeem.getCollateralRatio();
    console.log("Global collateral ratio:", globalCR.toString(), "%");

    // Save deployment addresses
    const deploymentInfo = {
        network: (await ethers.provider.getNetwork()).name,
        deployer: deployer.address,
        governor: governor,
        contracts: {
            usdc: await usdc.getAddress(),
            bvix: await bvix.getAddress(),
            priceOracle: await priceOracle.getAddress(),
            mintRedeem: await mintRedeem.getAddress()
        },
        configuration: {
            initialPrice: ethers.formatUnits(initialPrice, 6),
            updateDelay: updateDelay,
            mintFee: (await mintRedeem.mintFee()).toString(),
            redeemFee: (await mintRedeem.redeemFee()).toString(),
            minCollateralRatio: (await mintRedeem.minCollateralRatio()).toString(),
            liquidationThreshold: (await mintRedeem.liquidationThreshold()).toString(),
            liquidationBonus: (await mintRedeem.liquidationBonus()).toString()
        },
        timestamp: new Date().toISOString()
    };

    console.log("\n9. Deployment Summary:");
    console.log(JSON.stringify(deploymentInfo, null, 2));

    // Save to file
    const fs = require("fs");
    fs.writeFileSync(
        `deployment-secure-${Date.now()}.json`,
        JSON.stringify(deploymentInfo, null, 2)
    );
    console.log("\nDeployment info saved to file");

    console.log("\n✅ Secure deployment completed successfully!");
    console.log("\nNext steps:");
    console.log("1. Run tests: npx hardhat test");
    console.log("2. Run static analysis: npx slither .");
    console.log("3. Deploy to testnet for community testing");
    console.log("4. Schedule security audit");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 