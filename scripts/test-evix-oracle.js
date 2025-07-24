const { ethers } = require("ethers");

async function main() {
    console.log("Testing EVIX Oracle...");
    
    // EVIX Oracle address
    const EVIX_ORACLE_ADDRESS = '0xCd7441A771a7F84E58d98E598B7Ff23A3688094F';
    const BASE_SEPOLIA_RPC = 'https://sepolia.base.org';
    
    try {
        // Create provider
        const provider = new ethers.JsonRpcProvider(BASE_SEPOLIA_RPC);
        
        // Create oracle contract instance
        const oracleABI = ['function getPrice() external view returns (int256)'];
        const oracle = new ethers.Contract(EVIX_ORACLE_ADDRESS, oracleABI, provider);
        
        console.log("🔍 Testing EVIX Oracle at:", EVIX_ORACLE_ADDRESS);
        
        // Try to get price
        const price = await oracle.getPrice();
        console.log("✅ EVIX Oracle Price (raw):", price.toString());
        console.log("✅ EVIX Oracle Price (formatted):", ethers.formatUnits(price, 18));
        
    } catch (error) {
        console.error("❌ EVIX Oracle Error:", error.message);
        
        // Try with different ABI
        try {
            console.log("\n🔄 Trying with uint256 ABI...");
            const provider = new ethers.JsonRpcProvider(BASE_SEPOLIA_RPC);
            const oracleABI2 = ['function getPrice() external view returns (uint256)'];
            const oracle2 = new ethers.Contract(EVIX_ORACLE_ADDRESS, oracleABI2, provider);
            
            const price2 = await oracle2.getPrice();
            console.log("✅ EVIX Oracle Price (uint256):", price2.toString());
            console.log("✅ EVIX Oracle Price (formatted):", ethers.formatUnits(price2, 18));
            
        } catch (error2) {
            console.error("❌ EVIX Oracle Error (uint256):", error2.message);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 