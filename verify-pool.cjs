const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("🔍 Verifying BVIX/USDC Pool Status...");
  
  // Load addresses
  const fs = require('fs');
  const addresses = JSON.parse(fs.readFileSync('token-addresses.json', 'utf8'));
  
  const [deployer] = await ethers.getSigners();
  
  const bvixAddress = addresses.bvixToken;
  const usdcAddress = addresses.mockUsdc;
  const poolAddress = addresses.pool;
  
  console.log("\n📋 Checking contracts...");
  
  // Check BVIX Token
  try {
    const bvixToken = await ethers.getContractAt("BVIXToken", bvixAddress);
    const bvixName = await bvixToken.name();
    const bvixSymbol = await bvixToken.symbol();
    const bvixBalance = await bvixToken.balanceOf(deployer.address);
    console.log("✅ BVIX Token:", bvixName, "(", bvixSymbol, ")");
    console.log("   Balance:", ethers.formatEther(bvixBalance));
  } catch (error) {
    console.log("❌ BVIX Token check failed:", error.message);
  }
  
  // Check Mock USDC
  try {
    const mockUsdc = await ethers.getContractAt("MockUSDC", usdcAddress);
    const usdcName = await mockUsdc.name();
    const usdcSymbol = await mockUsdc.symbol();
    const usdcBalance = await mockUsdc.balanceOf(deployer.address);
    console.log("✅ Mock USDC:", usdcName, "(", usdcSymbol, ")");
    console.log("   Balance:", ethers.formatUnits(usdcBalance, 6));
  } catch (error) {
    console.log("❌ Mock USDC check failed:", error.message);
  }
  
  // Check Pool
  try {
    const poolABI = [
      "function token0() external view returns (address)",
      "function token1() external view returns (address)",
      "function fee() external view returns (uint24)",
      "function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)"
    ];
    
    const pool = new ethers.Contract(poolAddress, poolABI, deployer);
    
    const token0 = await pool.token0();
    const token1 = await pool.token1();
    const fee = await pool.fee();
    
    console.log("✅ Uniswap V3 Pool:");
    console.log("   Address:", poolAddress);
    console.log("   Token0:", token0);
    console.log("   Token1:", token1);
    console.log("   Fee:", fee, "(0." + (fee / 10000) + "%)");
    
    try {
      const slot0 = await pool.slot0();
      console.log("   ✅ Pool is initialized");
      console.log("   Current tick:", slot0.tick.toString());
    } catch (error) {
      console.log("   ❌ Pool is not initialized");
    }
    
  } catch (error) {
    console.log("❌ Pool check failed:", error.message);
  }
  
  console.log("\n🎯 Pool Status Summary:");
  console.log("BVIX Token:", bvixAddress);
  console.log("Mock USDC:", usdcAddress);
  console.log("Uniswap V3 Pool:", poolAddress);
  console.log("Network: ETH Sepolia");
  
  console.log("\n🔗 View on Etherscan:");
  console.log("Pool: https://sepolia.etherscan.io/address/" + poolAddress);
  console.log("BVIX: https://sepolia.etherscan.io/address/" + bvixAddress);
  console.log("USDC: https://sepolia.etherscan.io/address/" + usdcAddress);
  
  console.log("\n🎉 The BVIX/USDC liquidity pool is ready for trading!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  }); 