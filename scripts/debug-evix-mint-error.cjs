const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Debugging EVIX mint error...");
    
    // Contract addresses
    const EVIX_TOKEN_ADDRESS = '0xec4b9CfCd55A724B2687Fb04270Ed799284ca8fC';
    const EVIX_MINT_REDEEM_ADDRESS = '0x941f889F2820f734ddd0947427b242052a0d7BE5';
    const EVIX_ORACLE_ADDRESS = '0xCd7441A771a7F84E58d98E598B7Ff23A3688094F';
    const MOCK_USDC_ADDRESS = '0x1a706D5BcB8eE5f9CD72F75a8cA7E12d238bfFdf';
    
    try {
        // Get the deployer account
        const [deployer] = await ethers.getSigners();
        console.log("Using account:", deployer.address);
        
        // Get contracts
        const evixToken = await ethers.getContractAt("EVIXToken", EVIX_TOKEN_ADDRESS);
        const evixMintRedeem = await ethers.getContractAt("EVIXMintRedeemV7", EVIX_MINT_REDEEM_ADDRESS);
        const evixOracle = await ethers.getContractAt("PriceOracle", EVIX_ORACLE_ADDRESS);
        const mockUSDC = await ethers.getContractAt("MockUSDC", MOCK_USDC_ADDRESS);
        
        console.log("✅ All contracts loaded");
        
        // Check if vault is paused
        const isPaused = await evixMintRedeem.paused();
        console.log("Vault is paused:", isPaused);
        
        if (isPaused) {
            console.log("❌ Vault is paused - this is the issue!");
            return;
        }
        
        // Check oracle price
        const oraclePrice = await evixOracle.getPrice();
        console.log("EVIX Oracle Price (raw):", oraclePrice.toString());
        console.log("EVIX Oracle Price (formatted):", ethers.formatUnits(oraclePrice, 6));
        
        // Check balances
        const usdcBalance = await mockUSDC.balanceOf(deployer.address);
        const evixBalance = await evixToken.balanceOf(deployer.address);
        console.log("USDC Balance:", ethers.formatUnits(usdcBalance, 6));
        console.log("EVIX Balance:", ethers.formatUnits(evixBalance, 18));
        
        // Check MINTER_ROLE
        const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
        const hasMinterRole = await evixToken.hasRole(MINTER_ROLE, EVIX_MINT_REDEEM_ADDRESS);
        console.log("EVIX MintRedeem has MINTER_ROLE:", hasMinterRole);
        
        // Check USDC allowance
        const usdcAllowance = await mockUSDC.allowance(deployer.address, EVIX_MINT_REDEEM_ADDRESS);
        console.log("USDC Allowance:", ethers.formatUnits(usdcAllowance, 6));
        
        // Check vault parameters
        const minCollateralRatio = await evixMintRedeem.minCollateralRatio();
        const mintFee = await evixMintRedeem.mintFee();
        const totalCollateral = await evixMintRedeem.totalCollateral();
        const totalDebt = await evixMintRedeem.totalDebt();
        
        console.log("Min Collateral Ratio:", minCollateralRatio.toString());
        console.log("Mint Fee:", mintFee.toString());
        console.log("Total Collateral:", ethers.formatUnits(totalCollateral, 6));
        console.log("Total Debt:", ethers.formatUnits(totalDebt, 18));
        
        // Try to simulate the mint transaction
        const mintAmount = ethers.parseUnits("1", 6); // 1 USDC
        const targetCR = 150; // 150%
        
        console.log("🔧 Simulating mint transaction...");
        console.log("Mint Amount:", ethers.formatUnits(mintAmount, 6), "USDC");
        console.log("Target CR:", targetCR, "%");
        
        // Calculate expected values
        const fee = (mintAmount * mintFee) / 10000;
        const netAmount = mintAmount - fee;
        const debtValue = (netAmount * 100) / targetCR;
        const tokensToMint = (debtValue * ethers.parseUnits("1", 30)) / oraclePrice;
        
        console.log("Expected fee:", ethers.formatUnits(fee, 6), "USDC");
        console.log("Net amount:", ethers.formatUnits(netAmount, 6), "USDC");
        console.log("Debt value:", ethers.formatUnits(debtValue, 6), "USDC");
        console.log("Tokens to mint:", ethers.formatUnits(tokensToMint, 18), "EVIX");
        
        // Check if this would violate min collateral ratio
        const futureCollateral = totalCollateral + netAmount;
        const futureDebtValue = ((totalDebt + tokensToMint) * oraclePrice) / ethers.parseUnits("1", 18);
        const futureCR = (futureCollateral * 100) / futureDebtValue;
        
        console.log("Future collateral:", ethers.formatUnits(futureCollateral, 6), "USDC");
        console.log("Future debt value:", ethers.formatUnits(futureDebtValue, 6), "USDC");
        console.log("Future CR:", futureCR.toString(), "%");
        console.log("Min CR required:", minCollateralRatio.toString(), "%");
        
        if (futureCR < minCollateralRatio) {
            console.log("❌ Future CR would be below minimum - this would cause the transaction to revert!");
            console.log("Need at least", minCollateralRatio.toString(), "% but would be", futureCR.toString(), "%");
        } else {
            console.log("✅ Future CR looks good");
        }
        
        // Try to call the function with callStatic to see the exact error
        try {
            console.log("🔧 Testing mintWithCollateralRatio with callStatic...");
            await evixMintRedeem.mintWithCollateralRatio.staticCall(mintAmount, targetCR);
            console.log("✅ Static call succeeded - transaction should work");
        } catch (error) {
            console.log("❌ Static call failed:", error.message);
            if (error.data) {
                console.log("Error data:", error.data);
            }
        }
        
    } catch (error) {
        console.error("❌ Error debugging EVIX mint:", error.message);
        if (error.data) {
            console.error("Error data:", error.data);
        }
    }
}

main()
    .then(() => {
        console.log("✅ Debug completed");
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Debug failed:", error);
        process.exit(1);
    }); 