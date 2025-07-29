const { ethers } = require("ethers");

async function main() {
  console.log("🧪 Testing Frontend Oracle Calls Exactly");
  console.log("========================================");
  
  // Same addresses the frontend uses
  const ADDRESSES = {
    '84532': {
      oracle: "0x85485dD6cFaF5220150c413309C61a8EA24d24FE",
      evixOracle: "0xBd6E9809B9608eCAc3610cA65327735CC3c08104"
    }
  };
  
  // Same RPC the frontend uses
  const BASE_SEPOLIA_RPC_URL = "https://sepolia.base.org";
  const provider = new ethers.JsonRpcProvider(BASE_SEPOLIA_RPC_URL);
  
  try {
    console.log("🔍 Testing BVIX Oracle (MockOracle)...");
    
    // BVIX Oracle - exactly as frontend does it
    const MockOracle_ABI = [
      {
        "inputs": [],
        "name": "getPrice",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      }
    ];
    
    const bvixOracle = new ethers.Contract(ADDRESSES['84532'].oracle, MockOracle_ABI, provider);
    const bvixPrice = await bvixOracle.getPrice();
    
    // Frontend logic for BVIX
    const chainId = 84532; // Base Sepolia
    const decimals = chainId === 11155111 ? 18 : 8; // ETH Sepolia uses 18, Base Sepolia uses 8
    const formattedBvixPrice = ethers.formatUnits(bvixPrice, decimals);
    const bvixPriceFloat = parseFloat(formattedBvixPrice);
    
    console.log(`BVIX Raw: ${bvixPrice.toString()}`);
    console.log(`BVIX Formatted (${decimals} decimals): $${formattedBvixPrice}`);
    console.log(`BVIX Final: $${bvixPriceFloat.toFixed(2)}`);
    
    if (bvixPriceFloat >= 0.01 && bvixPriceFloat <= 100000) {
      console.log("✅ BVIX price is reasonable");
    } else {
      console.log("⚠️  BVIX price seems unreasonable, frontend will use fallback");
    }
    
    console.log("\n🔍 Testing EVIX Oracle...");
    
    // EVIX Oracle - exactly as frontend does it
    const EVIXOracle_ABI = [
      {
        "inputs": [],
        "name": "getPrice",
        "outputs": [
          {
            "internalType": "int256",
            "name": "",
            "type": "int256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      }
    ];
    
    const evixOracle = new ethers.Contract(ADDRESSES['84532'].evixOracle, EVIXOracle_ABI, provider);
    const evixPriceRaw = await evixOracle.getPrice();
    
    // Frontend logic for EVIX (same as BVIX)
    const formattedEvixPrice = ethers.formatUnits(evixPriceRaw, decimals);
    const evixPriceFloat = parseFloat(formattedEvixPrice);
    
    console.log(`EVIX Raw: ${evixPriceRaw.toString()}`);
    console.log(`EVIX Formatted (${decimals} decimals): $${formattedEvixPrice}`);
    console.log(`EVIX Final: $${evixPriceFloat.toFixed(2)}`);
    
    if (evixPriceFloat >= 0.01 && evixPriceFloat <= 100000) {
      console.log("✅ EVIX price is reasonable");
    } else {
      console.log("⚠️  EVIX price seems unreasonable, frontend will use fallback");
    }
    
    console.log("\n📊 Summary for Frontend:");
    console.log("========================");
    console.log(`BVIX: $${bvixPriceFloat.toFixed(2)} ${bvixPriceFloat >= 0.01 && bvixPriceFloat <= 100000 ? '✅' : '❌'}`);
    console.log(`EVIX: $${evixPriceFloat.toFixed(2)} ${evixPriceFloat >= 0.01 && evixPriceFloat <= 100000 ? '✅' : '❌'}`);
    
    console.log("\n💡 What should happen in frontend:");
    console.log("• BVIX price should update from simulation");
    console.log("• EVIX price should update from simulation");
    console.log("• Both prices should change every 60 seconds");
    console.log("• Collateral ratios should update automatically");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
    
    if (error.message.includes("could not decode result data")) {
      console.log("\n🔍 This is the same error you're seeing!");
      console.log("The contract call is returning empty data (0x)");
      console.log("Possible causes:");
      console.log("1. Contract doesn't exist at that address");
      console.log("2. Function signature doesn't match");
      console.log("3. Network connectivity issue");
      console.log("4. ABI mismatch");
    }
  }
}

main().catch(console.error); 