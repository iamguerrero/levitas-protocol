const { ethers } = require("hardhat");

async function main() {
    console.log("🔧 Granting MINTER_ROLE to EVIX MintRedeem...");
    
    // Contract addresses
    const EVIX_TOKEN_ADDRESS = '0xec4b9CfCd55A724B2687Fb04270Ed799284ca8fC';
    const EVIX_MINT_REDEEM_ADDRESS = '0x941f889F2820f734ddd0947427b242052a0d7BE5';
    
    try {
        // Get the deployer account
        const [deployer] = await ethers.getSigners();
        console.log("Using account:", deployer.address);
        
        // Get the EVIX token contract
        const evixToken = await ethers.getContractAt("EVIXToken", EVIX_TOKEN_ADDRESS);
        console.log("✅ EVIX Token contract loaded");
        
        // Compute MINTER_ROLE
        const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
        console.log("MINTER_ROLE:", MINTER_ROLE);
        
        // Check if EVIX MintRedeem already has MINTER_ROLE
        const hasMinterRole = await evixToken.hasRole(MINTER_ROLE, EVIX_MINT_REDEEM_ADDRESS);
        console.log("EVIX MintRedeem has MINTER_ROLE:", hasMinterRole);
        
        if (!hasMinterRole) {
            console.log("🔧 Granting MINTER_ROLE to EVIX MintRedeem...");
            const tx = await evixToken.grantRole(MINTER_ROLE, EVIX_MINT_REDEEM_ADDRESS);
            console.log("Transaction hash:", tx.hash);
            
            await tx.wait();
            console.log("✅ MINTER_ROLE granted successfully!");
            
            // Verify
            const hasRoleAfter = await evixToken.hasRole(MINTER_ROLE, EVIX_MINT_REDEEM_ADDRESS);
            console.log("EVIX MintRedeem has MINTER_ROLE (after):", hasRoleAfter);
        } else {
            console.log("✅ EVIX MintRedeem already has MINTER_ROLE");
        }
        
    } catch (error) {
        console.error("❌ Error granting MINTER_ROLE:", error.message);
        console.error("Stack:", error.stack);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 