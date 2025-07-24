const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Checking user EVIX balance...");
    
    // EVIX Token address from frontend secure-v7 configuration
    const EVIX_TOKEN_ADDRESS = '0xec4b9CfCd55A724B2687Fb04270Ed799284ca8fC';
    const USER_ADDRESS = '0xe18d3b075a241379d77fffe01ed1317dda0e8bac'; // User address
    
    try {
        const [deployer] = await ethers.getSigners();
        console.log("Using account:", deployer.address);
        
        // Check if contract exists
        const code = await deployer.provider.getCode(EVIX_TOKEN_ADDRESS);
        if (code === "0x") {
            console.log("❌ No contract deployed at this address!");
            return;
        }
        
        console.log("✅ Contract exists");
        
        // Get the contract
        const evixToken = await ethers.getContractAt("EVIXToken", EVIX_TOKEN_ADDRESS);
        
        // Get user balance
        const balance = await evixToken.balanceOf(USER_ADDRESS);
        console.log("Raw balance:", balance.toString());
        
        const formattedBalance = ethers.formatEther(balance);
        console.log("Formatted balance:", formattedBalance);
        
        const balanceNum = parseFloat(formattedBalance);
        console.log("Balance as number:", balanceNum);
        
        // Apply the fix logic
        let displayBalance;
        if (balanceNum < 0.000001) {
            displayBalance = "0.00";
        } else {
            displayBalance = balanceNum.toFixed(6);
        }
        console.log("Display balance (fixed):", displayBalance);
        
        // Check if this is the scientific notation issue
        if (formattedBalance.includes('e')) {
            console.log("⚠️  Scientific notation detected:", formattedBalance);
            console.log("Fixed display:", displayBalance);
        }
        
        // Also check total supply
        const totalSupply = await evixToken.totalSupply();
        console.log("Total supply:", ethers.formatEther(totalSupply));
        
    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

main()
    .then(() => {
        console.log("✅ Test completed");
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Test failed:", error);
        process.exit(1);
    }); 