const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing New EVIX Oracle Contract");
  console.log("==================================");
  
  const NEW_EVIX_ORACLE = "0xBd6E9809B9608eCAc3610cA65327735CC3c08104";
  
  try {
    // Check if contract exists
    const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
    const code = await provider.getCode(NEW_EVIX_ORACLE);
    
    if (code === "0x") {
      console.log("❌ Contract does not exist at this address");
      return;
    }
    
    console.log("✅ Contract exists");
    
    // Test with the same ABI that frontend uses
    const evixOracleABI = [
      "function getPrice() external view returns (int256)",
      "function owner() external view returns (address)",
      "function getLastUpdated() external view returns (uint256)"
    ];
    
    const evixOracle = new ethers.Contract(NEW_EVIX_ORACLE, evixOracleABI, provider);
    
    // Test getPrice function
    console.log("🔍 Testing getPrice() function...");
    const price = await evixOracle.getPrice();
    console.log("Raw price:", price.toString());
    console.log("Formatted price (8 decimals):", ethers.formatUnits(price, 8));
    
    // Test owner function
    console.log("🔍 Testing owner() function...");
    const owner = await evixOracle.owner();
    console.log("Owner:", owner);
    
    // Test getLastUpdated function
    console.log("🔍 Testing getLastUpdated() function...");
    const lastUpdated = await evixOracle.getLastUpdated();
    console.log("Last updated:", new Date(Number(lastUpdated) * 1000).toLocaleString());
    
    console.log("\n✅ All oracle functions working correctly!");
    console.log("📝 Frontend should be able to read this oracle");
    
    // Now test what the frontend ABI looks like
    console.log("\n🔍 Testing with actual frontend ABI...");
    
    const fs = require('fs');
    const path = require('path');
    const frontendAbiPath = path.join(__dirname, '..', 'client', 'src', 'contracts', 'EVIXOracle.abi.json');
    
    if (fs.existsSync(frontendAbiPath)) {
      const frontendAbi = JSON.parse(fs.readFileSync(frontendAbiPath, 'utf8'));
      console.log("Frontend ABI found, testing with it...");
      
      const frontendContract = new ethers.Contract(NEW_EVIX_ORACLE, frontendAbi, provider);
      const frontendPrice = await frontendContract.getPrice();
      console.log("Frontend call result:", frontendPrice.toString());
      console.log("✅ Frontend ABI works correctly!");
    } else {
      console.log("⚠️  Frontend ABI file not found");
    }
    
  } catch (error) {
    console.error("❌ Test failed:", error);
    
    if (error.message.includes("could not decode result data")) {
      console.log("🔍 This is the same error the frontend is getting!");
      console.log("The issue is likely with the ABI or function signature");
    }
  }
}

main().catch(console.error); 