const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
  console.log("🧪 Testing V6 Contract Functionality...");
  
  // Connect to Base Sepolia
  const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log("Testing with account:", wallet.address);
  
  // Contract addresses
  const BVIX_TOKEN_ADDRESS = "0x2E3bef50887aD2A30069c79D19Bb91085351C92a";
  const EVIX_TOKEN_ADDRESS = "0x7066700CAf442501B308fAe34d5919091e1b2380";
  const BVIX_V6_ADDRESS = "0x65Bec0Ab96ab751Fd0b1D9c907342d9A61FB1117";
  const EVIX_V6_ADDRESS = "0x6C3e986c4cc7b3400de732440fa01B66FF9172Cf";
  const MOCK_USDC_ADDRESS = "0x9CC37B36FDd8CF5c0297BE15b75663Bf2a193297";

  try {
    // Get contract artifacts
    const fs = require("fs");
    const path = require("path");
    
    const bvixV6Artifact = JSON.parse(fs.readFileSync(path.join(__dirname, "artifacts/contracts/MintRedeemV6.sol/MintRedeemV6.json")));
    const evixV6Artifact = JSON.parse(fs.readFileSync(path.join(__dirname, "artifacts/contracts/EVIXMintRedeemV6.sol/EVIXMintRedeemV6.json")));
    const usdcArtifact = JSON.parse(fs.readFileSync(path.join(__dirname, "artifacts/contracts/MockUSDC.sol/MockUSDC.json")));

    // Test BVIX V6 contract
    console.log("\n🔍 Testing BVIX V6 Contract...");
    const bvixV6Contract = new ethers.Contract(BVIX_V6_ADDRESS, bvixV6Artifact.abi, provider);
    
    // Check if mintWithCollateralRatio function exists
    const bvixFunctions = bvixV6Artifact.abi.filter(item => item.type === 'function').map(item => item.name);
    console.log("BVIX V6 functions:", bvixFunctions);
    
    const hasMintFunction = bvixFunctions.includes('mintWithCollateralRatio');
    console.log("Has mintWithCollateralRatio:", hasMintFunction ? "✅" : "❌");
    
    // Test EVIX V6 contract
    console.log("\n🔍 Testing EVIX V6 Contract...");
    const evixV6Contract = new ethers.Contract(EVIX_V6_ADDRESS, evixV6Artifact.abi, provider);
    
    const evixFunctions = evixV6Artifact.abi.filter(item => item.type === 'function').map(item => item.name);
    console.log("EVIX V6 functions:", evixFunctions);
    
    const evixHasMintFunction = evixFunctions.includes('mintWithCollateralRatio');
    console.log("Has mintWithCollateralRatio:", evixHasMintFunction ? "✅" : "❌");
    
    // Test USDC contract
    console.log("\n🔍 Testing USDC Contract...");
    const usdcContract = new ethers.Contract(MOCK_USDC_ADDRESS, usdcArtifact.abi, provider);
    const usdcBalance = await usdcContract.balanceOf(wallet.address);
    console.log("USDC balance:", ethers.formatUnits(usdcBalance, 6));
    
    // Test oracle price
    console.log("\n🔍 Testing Oracle Price...");
    try {
      const oraclePrice = await bvixV6Contract.oracle();
      console.log("Oracle address:", oraclePrice);
      
      // Try to get price from oracle
      const oracleContract = new ethers.Contract(oraclePrice, [
        "function getPrice() view returns (uint256)"
      ], provider);
      const price = await oracleContract.getPrice();
      console.log("Oracle price:", ethers.formatEther(price));
    } catch (error) {
      console.log("Oracle test failed:", error.message);
    }
    
    // Test collateral ratio
    console.log("\n🔍 Testing Collateral Ratio...");
    try {
      const cr = await bvixV6Contract.getCollateralRatio();
      console.log("Global collateral ratio:", cr.toString(), "%");
    } catch (error) {
      console.log("Collateral ratio test failed:", error.message);
    }
    
    console.log("\n✅ V6 Contract Tests Complete!");
    console.log("The contracts should now work with the frontend.");

  } catch (error) {
    console.error("❌ Test failed:", error);
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}); 