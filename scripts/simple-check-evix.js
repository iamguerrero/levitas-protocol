const { ethers } = require("ethers");

async function main() {
    console.log("🔍 Checking EVIX roles...");
    
    // Contract addresses
    const EVIX_TOKEN_ADDRESS = '0xec4b9CfCd55A724B2687Fb04270Ed799284ca8fC';
    const EVIX_MINT_REDEEM_ADDRESS = '0x941f889F2820f734ddd0947427b242052a0d7BE5';
    const BASE_SEPOLIA_RPC = 'https://sepolia.base.org';
    
    try {
        // Create provider
        const provider = new ethers.JsonRpcProvider(BASE_SEPOLIA_RPC);
        console.log("✅ Provider created");
        
        // Create contract instances
        const evixTokenABI = [
            'function hasRole(bytes32 role, address account) external view returns (bool)',
            'function grantRole(bytes32 role, address account) external',
            'function DEFAULT_ADMIN_ROLE() external view returns (bytes32)'
        ];
        
        const evixToken = new ethers.Contract(EVIX_TOKEN_ADDRESS, evixTokenABI, provider);
        console.log("✅ EVIX Token contract created");
        
        // Compute MINTER_ROLE
        const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
        console.log("MINTER_ROLE:", MINTER_ROLE);
        
        // Check if EVIX MintRedeem has MINTER_ROLE
        console.log("🔍 Checking if EVIX MintRedeem has MINTER_ROLE...");
        const hasMinterRole = await evixToken.hasRole(MINTER_ROLE, EVIX_MINT_REDEEM_ADDRESS);
        console.log("EVIX MintRedeem has MINTER_ROLE:", hasMinterRole);
        
        if (!hasMinterRole) {
            console.log("❌ EVIX MintRedeem is missing MINTER_ROLE - this is the cause of the mint failure!");
            console.log("🔧 Need to grant MINTER_ROLE to:", EVIX_MINT_REDEEM_ADDRESS);
        } else {
            console.log("✅ EVIX MintRedeem has MINTER_ROLE");
        }
        
    } catch (error) {
        console.error("❌ Error checking EVIX roles:", error.message);
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