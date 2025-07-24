const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Checking EVIX contract configuration with account:", deployer.address);

    // EVIX contract addresses
    const EVIX_ADDRESS = '0xb20CE7575bA09d6a3eeF30682Bc108D0C9EEeAd1';
    const EVIX_MINT_REDEEM_ADDRESS = '0x1CA8eC26FFF5FABE35796642dE95446a22cbB843';
    const EVIX_ORACLE_ADDRESS = '0x587eD1E7D27DCf9c0f5C1b0861500b0cA06Ddd8b';

    try {
        // Get EVIX token contract
        const evixToken = await ethers.getContractAt("EVIXToken", EVIX_ADDRESS);
        console.log("\n1. EVIX Token Contract:", EVIX_ADDRESS);
        
        // Check MINTER_ROLE
        const MINTER_ROLE = await evixToken.MINTER_ROLE();
        console.log("MINTER_ROLE:", MINTER_ROLE);
        
        // Check if EVIX MintRedeem contract has MINTER_ROLE
        const hasMinterRole = await evixToken.hasRole(MINTER_ROLE, EVIX_MINT_REDEEM_ADDRESS);
        console.log("EVIX MintRedeem has MINTER_ROLE:", hasMinterRole);
        
        // Check if deployer has MINTER_ROLE
        const deployerHasRole = await evixToken.hasRole(MINTER_ROLE, deployer.address);
        console.log("Deployer has MINTER_ROLE:", deployerHasRole);
        
        // Get EVIX MintRedeem contract
        const evixMintRedeem = await ethers.getContractAt("MintRedeemV7", EVIX_MINT_REDEEM_ADDRESS);
        console.log("\n2. EVIX MintRedeem Contract:", EVIX_MINT_REDEEM_ADDRESS);
        
        // Check if vault is paused
        const isPaused = await evixMintRedeem.paused();
        console.log("Vault is paused:", isPaused);
        
        // Check liquidation threshold
        const liquidationThreshold = await evixMintRedeem.liquidationThreshold();
        console.log("Liquidation threshold:", liquidationThreshold.toString());
        
        // Get EVIX Oracle contract
        const evixOracle = await ethers.getContractAt("PriceOracle", EVIX_ORACLE_ADDRESS);
        console.log("\n3. EVIX Oracle Contract:", EVIX_ORACLE_ADDRESS);
        
        // Check current price
        const currentPrice = await evixOracle.getPrice();
        console.log("Current EVIX price:", ethers.formatUnits(currentPrice, 6));
        
        // Check if deployer has PRICE_UPDATER_ROLE
        const PRICE_UPDATER_ROLE = await evixOracle.PRICE_UPDATER_ROLE();
        const deployerHasPriceRole = await evixOracle.hasRole(PRICE_UPDATER_ROLE, deployer.address);
        console.log("Deployer has PRICE_UPDATER_ROLE:", deployerHasPriceRole);
        
        if (!hasMinterRole) {
            console.log("\n❌ ISSUE FOUND: EVIX MintRedeem contract does not have MINTER_ROLE!");
            console.log("This is why EVIX minting is failing.");
            
            if (deployerHasRole) {
                console.log("\n🔧 FIXING: Granting MINTER_ROLE to EVIX MintRedeem contract...");
                const grantTx = await evixToken.grantRole(MINTER_ROLE, EVIX_MINT_REDEEM_ADDRESS);
                await grantTx.wait();
                console.log("✅ MINTER_ROLE granted successfully!");
                
                // Verify the role was granted
                const hasRoleAfter = await evixToken.hasRole(MINTER_ROLE, EVIX_MINT_REDEEM_ADDRESS);
                console.log("EVIX MintRedeem has MINTER_ROLE (after fix):", hasRoleAfter);
            } else {
                console.log("❌ Cannot fix: Deployer doesn't have MINTER_ROLE to grant it.");
            }
        } else {
            console.log("\n✅ EVIX MintRedeem contract has MINTER_ROLE - this should work.");
        }
        
    } catch (error) {
        console.error("❌ Error checking EVIX contract:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 