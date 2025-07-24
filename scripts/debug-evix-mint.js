const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Debugging EVIX mint with account:", deployer.address);

    // Contract addresses
    const EVIX_TOKEN_ADDRESS = '0xec4b9CfCd55A724B2687Fb04270Ed799284ca8fC';
    const EVIX_MINT_REDEEM_ADDRESS = '0x941f889F2820f734ddd0947427b242052a0d7BE5';
    const EVIX_ORACLE_ADDRESS = '0xCd7441A771a7F84E58d98E598B7Ff23A3688094F';
    const MOCK_USDC_ADDRESS = '0x1a706D5BcB8eE5f9CD72F75a8cA7E12d238bfFdf';

    try {
        // Get contracts
        const evixToken = await ethers.getContractAt("EVIXToken", EVIX_TOKEN_ADDRESS);
        const evixMintRedeem = await ethers.getContractAt("EVIXMintRedeemV7", EVIX_MINT_REDEEM_ADDRESS);
        const evixOracle = await ethers.getContractAt("PriceOracle", EVIX_ORACLE_ADDRESS);
        const mockUsdc = await ethers.getContractAt("MockUSDC", MOCK_USDC_ADDRESS);

        console.log("\n🔍 Checking contract states:");
        
        // Check EVIX token state
        const evixTotalSupply = await evixToken.totalSupply();
        console.log("EVIX Total Supply:", ethers.formatEther(evixTotalSupply));
        
        // Check if EVIX MintRedeem has MINTER_ROLE
        const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
        const hasMinterRole = await evixToken.hasRole(MINTER_ROLE, EVIX_MINT_REDEEM_ADDRESS);
        console.log("EVIX MintRedeem has MINTER_ROLE:", hasMinterRole);
        
        // Check EVIX oracle price
        try {
            const evixPrice = await evixOracle.getPrice();
            console.log("EVIX Oracle Price (raw):", evixPrice.toString());
            console.log("EVIX Oracle Price (formatted):", ethers.formatUnits(evixPrice, 18));
        } catch (error) {
            console.log("❌ EVIX Oracle Price Error:", error.message);
        }
        
        // Check user USDC balance
        const userUsdcBalance = await mockUsdc.balanceOf(deployer.address);
        console.log("User USDC Balance:", ethers.formatUnits(userUsdcBalance, 6));
        
        // Check EVIX MintRedeem USDC balance
        const vaultUsdcBalance = await mockUsdc.balanceOf(EVIX_MINT_REDEEM_ADDRESS);
        console.log("EVIX Vault USDC Balance:", ethers.formatUnits(vaultUsdcBalance, 6));
        
        // Check if contract is paused
        const isPaused = await evixMintRedeem.paused();
        console.log("EVIX MintRedeem is paused:", isPaused);
        
        // Check mint fee
        const mintFee = await evixMintRedeem.mintFee();
        console.log("EVIX Mint Fee (basis points):", mintFee.toString());
        
        // Check min collateral ratio
        const minCR = await evixMintRedeem.minCollateralRatio();
        console.log("EVIX Min Collateral Ratio:", minCR.toString());
        
        // Check user position
        const userPosition = await evixMintRedeem.positions(deployer.address);
        console.log("User Position - Collateral:", ethers.formatUnits(userPosition.collateral, 6));
        console.log("User Position - Debt:", ethers.formatEther(userPosition.debt));
        
        // Check total vault state
        const totalCollateral = await evixMintRedeem.totalCollateral();
        const totalDebt = await evixMintRedeem.totalDebt();
        console.log("Total Vault Collateral:", ethers.formatUnits(totalCollateral, 6));
        console.log("Total Vault Debt:", ethers.formatEther(totalDebt));
        
        // Try to calculate what would happen with a 1 USDC mint
        console.log("\n🧮 Testing mint calculation with 1 USDC:");
        const testAmount = ethers.parseUnits("1", 6); // 1 USDC
        const targetCR = 150; // 150%
        
        try {
            // Simulate the calculation
            const price = await evixOracle.getPrice();
            const fee = (testAmount * mintFee) / 10000;
            const netAmount = testAmount - fee;
            const debtValue = (netAmount * 100) / targetCR;
            const tokensToMint = (debtValue * ethers.parseUnits("1", 30)) / price;
            
            console.log("Test Amount (USDC):", ethers.formatUnits(testAmount, 6));
            console.log("Fee:", ethers.formatUnits(fee, 6));
            console.log("Net Amount:", ethers.formatUnits(netAmount, 6));
            console.log("Debt Value:", ethers.formatUnits(debtValue, 6));
            console.log("Tokens to Mint:", ethers.formatEther(tokensToMint));
            
            // Check if this would violate global CR
            const futureCollateral = totalCollateral + netAmount;
            const futureDebtValue = ((totalDebt + tokensToMint) * price) / ethers.parseUnits("1", 18);
            const futureCR = (futureCollateral * 100) / futureDebtValue;
            console.log("Future Global CR:", futureCR.toString());
            console.log("Would pass CR check:", futureCR >= minCR);
            
        } catch (error) {
            console.log("❌ Calculation error:", error.message);
        }
        
    } catch (error) {
        console.error("❌ Error debugging EVIX mint:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 