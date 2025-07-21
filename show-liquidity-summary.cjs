const fs = require('fs');

console.log("🎉 BVIX/USDC Liquidity Pool Deployment Summary");
console.log("=============================================");

// Load addresses
const addresses = JSON.parse(fs.readFileSync('token-addresses.json', 'utf8'));

console.log("\n📋 Contract Addresses:");
console.log("BVIX Token:", addresses.bvixToken);
console.log("Mock USDC:", addresses.mockUsdc);
console.log("Uniswap V3 Pool:", addresses.pool);
console.log("Deployer:", addresses.deployer);
console.log("Network: ETH Sepolia");

console.log("\n💰 Token Balances:");
console.log("BVIX Available:", addresses.bvixAmount);
console.log("USDC Available:", addresses.usdcAmount);

console.log("\n🏊 Uniswap V3 Pool Details:");
console.log("Pool Address:", addresses.pool);
console.log("Fee Tier: 0.3%");
console.log("Initial Price: 1 BVIX = 1 USDC");

console.log("\n🔗 Useful Links:");
console.log("Uniswap V3 App: https://app.uniswap.org/");
console.log("Sepolia Etherscan: https://sepolia.etherscan.io/");
console.log("Pool on Etherscan: https://sepolia.etherscan.io/address/" + addresses.pool);
console.log("BVIX on Etherscan: https://sepolia.etherscan.io/address/" + addresses.bvixToken);
console.log("USDC on Etherscan: https://sepolia.etherscan.io/address/" + addresses.mockUsdc);

console.log("\n📝 How to Trade BVIX/USDC:");
console.log("1. Visit https://app.uniswap.org/");
console.log("2. Connect your wallet (MetaMask)");
console.log("3. Switch to Sepolia testnet");
console.log("4. Go to 'Swap' tab");
console.log("5. Select BVIX and USDC tokens");
console.log("6. Enter the amount you want to swap");
console.log("7. Click 'Swap' and confirm the transaction");

console.log("\n📝 How to Add More Liquidity:");
console.log("1. Visit https://app.uniswap.org/");
console.log("2. Connect your wallet (MetaMask)");
console.log("3. Switch to Sepolia testnet");
console.log("4. Go to 'Pool' tab");
console.log("5. Click 'New Position'");
console.log("6. Select BVIX and USDC tokens");
console.log("7. Set fee tier to 0.3%");
console.log("8. Set your desired price range");
console.log("9. Enter liquidity amounts");
console.log("10. Click 'Preview' and then 'Add'");

console.log("\n🎯 Pool Status: READY FOR TRADING!");
console.log("The BVIX/USDC liquidity pool is now live on Uniswap V3 Sepolia!");
console.log("Users can now swap between BVIX and USDC tokens."); 