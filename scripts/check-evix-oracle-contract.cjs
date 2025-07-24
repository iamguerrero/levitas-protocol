const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Checking EVIX Oracle contract...");
    
    // EVIX Oracle address from frontend configuration
    const EVIX_ORACLE_ADDRESS = '0x587eD1E7D27DCf9c0f5C1b0861500b0cA06Ddd8b';
    
    try {
        // Get the deployer account
        const [deployer] = await ethers.getSigners();
        console.log("Using account:", deployer.address);
        
        // Check if contract exists by getting its code
        const code = await deployer.provider.getCode(EVIX_ORACLE_ADDRESS);
        console.log("Contract code length:", code.length);
        
        if (code === "0x") {
            console.log("❌ No contract deployed at this address!");
            return;
        }
        
        console.log("✅ Contract exists at address");
        
        // Try to get the contract
        const evixOracle = await ethers.getContractAt("PriceOracle", EVIX_ORACLE_ADDRESS);
        console.log("✅ Contract loaded successfully");
        
        // Try to get the price
        console.log("🔧 Getting price...");
        const price = await evixOracle.getPrice();
        console.log("✅ Price retrieved successfully");
        console.log("Price (raw):", price.toString());
        console.log("Price (formatted):", ethers.formatUnits(price, 6));
        
        // Try to get other oracle functions
        try {
            const lastUpdateTime = await evixOracle.lastUpdateTime();
            console.log("Last update time:", lastUpdateTime.toString());
        } catch (error) {
            console.log("Could not get lastUpdateTime:", error.message);
        }
        
        try {
            const updateDelay = await evixOracle.updateDelay();
            console.log("Update delay:", updateDelay.toString());
        } catch (error) {
            console.log("Could not get updateDelay:", error.message);
        }
        
    } catch (error) {
        console.error("❌ Error checking EVIX Oracle:", error.message);
        if (error.data) {
            console.error("Error data:", error.data);
        }
    }
}

main()
    .then(() => {
        console.log("✅ Check completed");
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Check failed:", error);
        process.exit(1);
    }); 