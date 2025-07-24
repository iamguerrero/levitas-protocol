const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Updating oracle price with account:", deployer.address);

    // Contract addresses
    const ORACLE_ADDRESS = '0x390dBFb41274940f7500e41627a5d3BFE82a3a49';
    const oracle = await ethers.getContractAt("PriceOracle", ORACLE_ADDRESS);

    console.log("\n1. Checking current oracle state...");
    const currentPrice = await oracle.getPrice();
    const lastUpdateTime = await oracle.lastUpdateTime();
    const updateDelay = await oracle.updateDelay();
    const currentTime = Math.floor(Date.now() / 1000);
    
    console.log("Current price:", ethers.formatUnits(currentPrice, 6), "USD");
    console.log("Last update time:", new Date(lastUpdateTime * 1000).toISOString());
    console.log("Update delay:", updateDelay.toString(), "seconds");
    console.log("Current time:", new Date(currentTime * 1000).toISOString());
    console.log("Time since last update:", currentTime - Number(lastUpdateTime), "seconds");

    // Check if we can update
    const canUpdate = await oracle.canUpdatePrice();
    console.log("Can update price:", canUpdate);

    if (!canUpdate) {
        const timeUntilUpdate = await oracle.timeUntilUpdateAllowed();
        console.log("Time until update allowed:", timeUntilUpdate.toString(), "seconds");
        
        if (timeUntilUpdate > 0) {
            console.log("Waiting for timelock to expire...");
            return;
        }
    }

    // Update price to current market price (around $42.15)
    const newPrice = ethers.parseUnits("42.15", 6);
    console.log("\n2. Updating oracle price to:", ethers.formatUnits(newPrice, 6), "USD");
    
    try {
        const tx = await oracle.pushPrice(newPrice);
        await tx.wait();
        console.log("✅ Oracle price updated successfully!");
        
        // Check new state
        const updatedPrice = await oracle.getPrice();
        const updatedTime = await oracle.lastUpdateTime();
        console.log("New price:", ethers.formatUnits(updatedPrice, 6), "USD");
        console.log("New update time:", new Date(updatedTime * 1000).toISOString());
        
    } catch (error) {
        console.error("❌ Failed to update oracle price:", error.message);
        
        // Try emergency update if regular update fails
        console.log("\n3. Trying emergency update...");
        try {
            const emergencyTx = await oracle.emergencyUpdatePrice(newPrice);
            await emergencyTx.wait();
            console.log("✅ Emergency oracle price update successful!");
        } catch (emergencyError) {
            console.error("❌ Emergency update also failed:", emergencyError.message);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 