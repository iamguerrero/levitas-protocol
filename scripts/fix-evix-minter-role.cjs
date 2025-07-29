const { ethers } = require("hardhat");

async function main() {
    console.log("🔧 Fixing EVIX MINTER_ROLE issue...");
    
    // Contract addresses
    const EVIX_TOKEN_ADDRESS = '0xec4b9CfCd55A724B2687Fb04270Ed799284ca8fC';
    const EVIX_MINT_REDEEM_ADDRESS = '0x941f889F2820f734ddd0947427b242052a0d7BE5';
    
    try {
        // Get the deployer account
        const [deployer] = await ethers.getSigners();
        console.log("Using account:", deployer.address);
        console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");
        
        // Get the EVIX token contract
        const evixToken = await ethers.getContractAt("EVIXToken", EVIX_TOKEN_ADDRESS);
        console.log("✅ EVIX Token contract loaded at:", EVIX_TOKEN_ADDRESS);
        
        // Compute MINTER_ROLE
        const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
        console.log("MINTER_ROLE:", MINTER_ROLE);
        
        // Check if EVIX MintRedeem already has MINTER_ROLE
        console.log("🔍 Checking current MINTER_ROLE status...");
        const hasMinterRole = await evixToken.hasRole(MINTER_ROLE, EVIX_MINT_REDEEM_ADDRESS);
        console.log("EVIX MintRedeem has MINTER_ROLE:", hasMinterRole);
        
        if (!hasMinterRole) {
            console.log("🔧 Granting MINTER_ROLE to EVIX MintRedeem...");
            console.log("Granting to address:", EVIX_MINT_REDEEM_ADDRESS);
            
            const tx = await evixToken.grantRole(MINTER_ROLE, EVIX_MINT_REDEEM_ADDRESS);
            console.log("Transaction hash:", tx.hash);
            console.log("Waiting for transaction confirmation...");
            
            const receipt = await tx.wait();
            console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
            console.log("Gas used:", receipt.gasUsed.toString());
            
            // Verify the role was granted
            const hasRoleAfter = await evixToken.hasRole(MINTER_ROLE, EVIX_MINT_REDEEM_ADDRESS);
            console.log("EVIX MintRedeem has MINTER_ROLE (after):", hasRoleAfter);
            
            if (hasRoleAfter) {
                console.log("🎉 SUCCESS: MINTER_ROLE granted successfully!");
                console.log("EVIX minting should now work properly.");
            } else {
                console.log("❌ ERROR: MINTER_ROLE was not granted properly!");
            }
        } else {
            console.log("✅ EVIX MintRedeem already has MINTER_ROLE");
            console.log("The minting issue might be something else.");
        }
        
    } catch (error) {
        console.error("❌ Error fixing EVIX MINTER_ROLE:", error.message);
        if (error.transaction) {
            console.error("Transaction details:", error.transaction);
        }
        console.error("Stack:", error.stack);
    }
}

main()
    .then(() => {
        console.log("✅ Script completed");
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    }); 