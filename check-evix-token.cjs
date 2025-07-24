const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Checking EVIX Token contract...");
    
    // EVIX Token address from frontend secure-v7 configuration
    const EVIX_TOKEN_ADDRESS = '0xec4b9CfCd55A724B2687Fb04270Ed799284ca8fC';
    const TEST_ADDRESS = '0xe18d3b075a241379d77fffe01ed1317dda0e8bac'; // User address from logs
    
    try {
        // Get the deployer account
        const [deployer] = await ethers.getSigners();
        console.log("Using account:", deployer.address);
        
        // Check if contract exists by getting its code
        const code = await deployer.provider.getCode(EVIX_TOKEN_ADDRESS);
        console.log("Contract code length:", code.length);
        
        if (code === "0x") {
            console.log("❌ No contract deployed at this address!");
            return;
        }
        
        console.log("✅ Contract exists at address");
        
        // Try to get the contract
        const evixToken = await ethers.getContractAt("EVIXToken", EVIX_TOKEN_ADDRESS);
        console.log("✅ Contract loaded successfully");
        
        // Get token info
        const name = await evixToken.name();
        const symbol = await evixToken.symbol();
        const decimals = await evixToken.decimals();
        const totalSupply = await evixToken.totalSupply();
        
        console.log("Token name:", name);
        console.log("Token symbol:", symbol);
        console.log("Token decimals:", decimals);
        console.log("Total supply:", ethers.formatEther(totalSupply));
        
        // Check balance for test address
        const balance = await evixToken.balanceOf(TEST_ADDRESS);
        console.log("Balance for", TEST_ADDRESS + ":", balance.toString());
        console.log("Formatted balance:", ethers.formatEther(balance));
        
        // Check balance for deployer
        const deployerBalance = await evixToken.balanceOf(deployer.address);
        console.log("Balance for deployer:", ethers.formatEther(deployerBalance));
        
    } catch (error) {
        console.error("❌ Error checking EVIX Token:", error.message);
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