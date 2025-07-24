const { ethers } = require("ethers");

async function main() {
    console.log("Checking EVIX roles...");
    
    // Contract addresses
    const EVIX_TOKEN_ADDRESS = '0xec4b9CfCd55A724B2687Fb04270Ed799284ca8fC';
    const EVIX_MINT_REDEEM_ADDRESS = '0x941f889F2820f734ddd0947427b242052a0d7BE5';
    const BASE_SEPOLIA_RPC = 'https://sepolia.base.org';
    
    try {
        // Create provider
        const provider = new ethers.JsonRpcProvider(BASE_SEPOLIA_RPC);
        
        // Create contract instances
        const evixTokenABI = [
            'function hasRole(bytes32 role, address account) external view returns (bool)',
            'function getRoleAdmin(bytes32 role) external view returns (bytes32)',
            'function DEFAULT_ADMIN_ROLE() external view returns (bytes32)'
        ];
        
        const evixToken = new ethers.Contract(EVIX_TOKEN_ADDRESS, evixTokenABI, provider);
        
        // Compute MINTER_ROLE
        const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
        console.log("MINTER_ROLE:", MINTER_ROLE);
        
        // Check if EVIX MintRedeem has MINTER_ROLE
        const hasMinterRole = await evixToken.hasRole(MINTER_ROLE, EVIX_MINT_REDEEM_ADDRESS);
        console.log("EVIX MintRedeem has MINTER_ROLE:", hasMinterRole);
        
        if (!hasMinterRole) {
            console.log("❌ EVIX MintRedeem is missing MINTER_ROLE - this is likely the cause of the mint failure!");
        } else {
            console.log("✅ EVIX MintRedeem has MINTER_ROLE");
        }
        
        // Check who has DEFAULT_ADMIN_ROLE
        const DEFAULT_ADMIN_ROLE = await evixToken.DEFAULT_ADMIN_ROLE();
        console.log("DEFAULT_ADMIN_ROLE:", DEFAULT_ADMIN_ROLE);
        
    } catch (error) {
        console.error("❌ Error checking EVIX roles:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 