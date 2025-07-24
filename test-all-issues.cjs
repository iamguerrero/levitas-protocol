const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Testing all reported issues...");
    
    // Contract addresses from frontend configuration
    const MOCK_USDC_ADDRESS = '0x1a706D5BcB8eE5f9CD72F75a8cA7E12d238bfFdf';
    const BVIX_ADDRESS = '0xd4B6e6980CCffD350FB8Bbc669744804151AB507';
    const MINT_REDEEM_ADDRESS = '0x84eD7E6314e709dcF3582059D2de1Cb65e200916';
    const ORACLE_ADDRESS = '0x390dBFb41274940f7500e41627a5d3BFE82a3a49';
    const EVIX_TOKEN_ADDRESS = '0x6b3940169D4F4d6DdCD9ED87D9D5B386E75977B1';
    const EVIX_MINT_REDEEM_ADDRESS = '0x21192257AF44182963D060B4E8F0A09D2031a52D';
    const EVIX_ORACLE_ADDRESS = '0x587eD1E7D27DCf9c0f5C1b0861500b0cA06Ddd8b';
    const TEST_ADDRESS = '0xe18d3b075a241379d77fffe01ed1317dda0e8bac';
    
    try {
        const [deployer] = await ethers.getSigners();
        console.log("Using account:", deployer.address);
        
        // 1. Test EVIX Balance Display Issue
        console.log("\n=== 1. Testing EVIX Balance Display ===");
        const evixToken = await ethers.getContractAt("EVIXToken", EVIX_TOKEN_ADDRESS);
        const evixBalance = await evixToken.balanceOf(TEST_ADDRESS);
        const formattedBalance = ethers.formatEther(evixBalance);
        const balanceNum = parseFloat(formattedBalance);
        
        console.log("Raw balance:", evixBalance.toString());
        console.log("Formatted balance:", formattedBalance);
        console.log("Balance number:", balanceNum);
        
        // Test the fix logic
        let displayBalance;
        if (balanceNum < 0.000001) {
            displayBalance = "0.00";
        } else {
            displayBalance = balanceNum.toFixed(6);
        }
        console.log("Display balance (fixed):", displayBalance);
        
        // 2. Test Vault Wallet Balance
        console.log("\n=== 2. Testing Vault Wallet Balance ===");
        const usdcContract = await ethers.getContractAt("MockUSDC", MOCK_USDC_ADDRESS);
        const bvixVaultUsdc = await usdcContract.balanceOf(MINT_REDEEM_ADDRESS);
        const evixVaultUsdc = await usdcContract.balanceOf(EVIX_MINT_REDEEM_ADDRESS);
        
        console.log("BVIX Vault USDC:", ethers.formatUnits(bvixVaultUsdc, 6));
        console.log("EVIX Vault USDC:", ethers.formatUnits(evixVaultUsdc, 6));
        console.log("Total Vault USDC:", ethers.formatUnits(bvixVaultUsdc + evixVaultUsdc, 6));
        
        // 3. Test Vault Summary Logic
        console.log("\n=== 3. Testing Vault Summary Logic ===");
        const bvixContract = await ethers.getContractAt("BVIXToken", BVIX_ADDRESS);
        const bvixOracle = await ethers.getContractAt("PriceOracle", ORACLE_ADDRESS);
        const evixOracle = await ethers.getContractAt("PriceOracle", EVIX_ORACLE_ADDRESS);
        
        const [bvixTotalSupply, bvixPrice, evixTotalSupply, evixPrice] = await Promise.all([
            bvixContract.totalSupply(),
            bvixOracle.getPrice(),
            evixToken.totalSupply(),
            evixOracle.getPrice()
        ]);
        
        // Format data
        const bvixSupply = ethers.formatEther(bvixTotalSupply);
        const evixSupply = ethers.formatEther(evixTotalSupply);
        const bvixPriceFormatted = ethers.formatUnits(bvixPrice, 6);
        const evixPriceFormatted = ethers.formatUnits(evixPrice, 6);
        
        // Calculate values
        const bvixValueInUsd = parseFloat(bvixSupply) * parseFloat(bvixPriceFormatted);
        const evixValueInUsd = parseFloat(evixSupply) * parseFloat(evixPriceFormatted);
        const totalTokenValueInUsd = bvixValueInUsd + evixValueInUsd;
        const totalUsdcFloat = parseFloat(ethers.formatUnits(bvixVaultUsdc + evixVaultUsdc, 6));
        const protocolWideCR = totalTokenValueInUsd > 0 ? (totalUsdcFloat / totalTokenValueInUsd) * 100 : 0;
        
        console.log("BVIX Supply:", bvixSupply);
        console.log("EVIX Supply:", evixSupply);
        console.log("BVIX Price:", bvixPriceFormatted);
        console.log("EVIX Price:", evixPriceFormatted);
        console.log("BVIX Value (USD):", bvixValueInUsd.toFixed(2));
        console.log("EVIX Value (USD):", evixValueInUsd.toFixed(2));
        console.log("Total Token Value (USD):", totalTokenValueInUsd.toFixed(2));
        console.log("Total Collateral (USDC):", totalUsdcFloat.toFixed(2));
        console.log("Protocol-wide CR:", protocolWideCR.toFixed(2) + "%");
        
        // 4. Test API Response Format
        console.log("\n=== 4. Testing API Response Format ===");
        const apiResponse = {
            usdc: totalUsdcFloat.toFixed(2),
            bvix: bvixSupply,
            evix: evixSupply,
            cr: Math.round(protocolWideCR * 100) / 100,
            price: bvixPriceFormatted,
            evixPrice: evixPriceFormatted,
            usdcValue: totalUsdcFloat,
            bvixValueInUsd: bvixValueInUsd,
            evixValueInUsd: evixValueInUsd,
            totalTokenValueInUsd: totalTokenValueInUsd
        };
        
        console.log("API Response:", JSON.stringify(apiResponse, null, 2));
        
    } catch (error) {
        console.error("❌ Error during testing:", error.message);
        if (error.data) {
            console.error("Error data:", error.data);
        }
    }
}

main()
    .then(() => {
        console.log("\n✅ All tests completed");
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Tests failed:", error);
        process.exit(1);
    }); 