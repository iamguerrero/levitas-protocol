const { ethers } = require("ethers");

async function main() {
    console.log("Fixing EVIX MINTER_ROLE...");
    
    // Contract addresses
    const EVIX_TOKEN_ADDRESS = '0xec4b9CfCd55A724B2687Fb04270Ed799284ca8fC';
    const EVIX_MINT_REDEEM_ADDRESS = '0x941f889F2820f734ddd0947427b242052a0d7BE5';
    const BASE_SEPOLIA_RPC = 'https://sepolia.base.org';
    
    // You'll need to set your private key
    const PRIVATE_KEY = process.env.PRIVATE_KEY;
    if (!PRIVATE_KEY) {
        console.error("❌ Please set PRIVATE_KEY environment variable");
        return;
    }
    
    try {
        // Create provider and wallet
        const provider = new ethers.JsonRpcProvider(BASE_SEPOLIA_RPC);
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
        
        // Create contract instances
        const evixTokenABI = [
            'function hasRole(bytes32 role, address account) external view returns (bool)',
            'function grantRole(bytes32 role, address account) external',
            'function getRoleAdmin(bytes32 role) external view returns (bytes32)',
            'function DEFAULT_ADMIN_ROLE() external view returns (bytes32)'
        ];
        
        const evixToken = new ethers.Contract(EVIX_TOKEN_ADDRESS, evixTokenABI, wallet);
        
        // Compute MINTER_ROLE
        const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
        console.log("MINTER_ROLE:", MINTER_ROLE);
        
        // Check if EVIX MintRedeem has MINTER_ROLE
        const hasMinterRole = await evixToken.hasRole(MINTER_ROLE, EVIX_MINT_REDEEM_ADDRESS);
        console.log("EVIX MintRedeem has MINTER_ROLE:", hasMinterRole);
        
        if (!hasMinterRole) {
            console.log("Granting MINTER_ROLE to EVIX MintRedeem...");
            const tx = await evixToken.grantRole(MINTER_ROLE, EVIX_MINT_REDEEM_ADDRESS);
            await tx.wait();
            console.log("✅ MINTER_ROLE granted successfully!");
            
            // Verify
            const hasRoleAfter = await evixToken.hasRole(MINTER_ROLE, EVIX_MINT_REDEEM_ADDRESS);
            console.log("EVIX MintRedeem has MINTER_ROLE (after):", hasRoleAfter);
        } else {
            console.log("✅ EVIX MintRedeem already has MINTER_ROLE");
        }
        
    } catch (error) {
        console.error("❌ Error fixing EVIX roles:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 