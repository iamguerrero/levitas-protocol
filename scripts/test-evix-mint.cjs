const { ethers } = require("hardhat");

async function main() {
    console.log("🧪 Testing EVIX minting...");
    
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
        
        // Check balances
        const usdcBalance = await mockUSDC.balanceOf(deployer.address);
        const evixBalance = await evixToken.balanceOf(deployer.address);
        console.log("USDC Balance:", ethers.formatUnits(usdcBalance, 6));
        console.log("EVIX Balance:", ethers.formatUnits(evixBalance, 18));
        
        // Check oracle price
        const oraclePrice = await evixOracle.getPrice();
        console.log("EVIX Oracle Price (raw):", oraclePrice.toString());
        console.log("EVIX Oracle Price (formatted):", ethers.formatUnits(oraclePrice, 6));
        
        // Check MINTER_ROLE
        const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
        const hasMinterRole = await evixToken.hasRole(MINTER_ROLE, EVIX_MINT_REDEEM_ADDRESS);
        console.log("EVIX MintRedeem has MINTER_ROLE:", hasMinterRole);
        
        // Check USDC allowance
        const usdcAllowance = await mockUSDC.allowance(deployer.address, EVIX_MINT_REDEEM_ADDRESS);
        console.log("USDC Allowance:", ethers.formatUnits(usdcAllowance, 6));
        
        // Try to mint a small amount (1 USDC worth)
        const mintAmount = ethers.parseUnits("1", 6); // 1 USDC
        console.log("🔧 Attempting to mint EVIX for", ethers.formatUnits(mintAmount, 6), "USDC");
        
        // First approve USDC
        console.log("Approving USDC...");
        const approveTx = await mockUSDC.approve(EVIX_MINT_REDEEM_ADDRESS, mintAmount);
        await approveTx.wait();
        console.log("✅ USDC approved");
        
        // Try to mint
        console.log("Minting EVIX...");
        const mintTx = await evixMintRedeem.mint(mintAmount);
        console.log("Mint transaction hash:", mintTx.hash);
        
        const receipt = await mintTx.wait();
        console.log("✅ Mint successful! Block:", receipt.blockNumber);
        
        // Check new balances
        const newUsdcBalance = await mockUSDC.balanceOf(deployer.address);
        const newEvixBalance = await evixToken.balanceOf(deployer.address);
        console.log("New USDC Balance:", ethers.formatUnits(newUsdcBalance, 6));
        console.log("New EVIX Balance:", ethers.formatUnits(newEvixBalance, 18));
        
        console.log("🎉 EVIX minting is working!");
        
    } catch (error) {
        console.error("❌ Error testing EVIX mint:", error.message);
        if (error.data) {
            console.error("Error data:", error.data);
        }
        if (error.transaction) {
            console.error("Transaction details:", error.transaction);
        }
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