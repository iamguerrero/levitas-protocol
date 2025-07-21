const { ethers } = require("hardhat");
require("dotenv").config();

// Uniswap V3 addresses on Sepolia
const UNISWAP_V3_FACTORY = "0x0227628f3F023bb0B980b67D528571c95c6DaC1c";

async function main() {
  console.log("🏊 Creating Uniswap V3 pool on ETH Sepolia...");
  
  // Load deployed addresses
  const fs = require('fs');
  const addresses = JSON.parse(fs.readFileSync('token-addresses.json', 'utf8'));
  
  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);

  const bvixAddress = addresses.bvixToken;
  const usdcAddress = addresses.mockUsdc;
  
  console.log("\n📋 Token Addresses:");
  console.log("BVIX Token:", bvixAddress);
  console.log("Mock USDC:", usdcAddress);

  // Get Uniswap V3 Factory
  const factoryABI = [
    "function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)",
    "function createPool(address tokenA, address tokenB, uint24 fee) external returns (address pool)"
  ];
  
  const factory = new ethers.Contract(UNISWAP_V3_FACTORY, factoryABI, deployer);

  // Create pool with 0.3% fee tier
  const fee = 3000; // 0.3%
  console.log("\n🏊 Creating Uniswap V3 pool with 0.3% fee...");
  
  let poolAddress = await factory.getPool(bvixAddress, usdcAddress, fee);
  
  if (poolAddress === ethers.ZeroAddress) {
    console.log("Pool doesn't exist, creating new pool...");
    const tx = await factory.createPool(bvixAddress, usdcAddress, fee);
    await tx.wait();
    poolAddress = await factory.getPool(bvixAddress, usdcAddress, fee);
    console.log("✅ Pool created at:", poolAddress);
  } else {
    console.log("✅ Pool already exists at:", poolAddress);
  }

  // Initialize pool if needed
  const poolABI = [
    "function initialize(uint160 sqrtPriceX96) external",
    "function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)"
  ];
  
  const pool = new ethers.Contract(poolAddress, poolABI, deployer);

  try {
    await pool.slot0();
    console.log("✅ Pool is already initialized");
  } catch (error) {
    console.log("Initializing pool...");
    // Set initial price: 1 BVIX = 1 USDC (1:1 ratio)
    const sqrtPriceX96 = ethers.parseUnits("1", 96);
    const tx = await pool.initialize(sqrtPriceX96);
    await tx.wait();
    console.log("✅ Pool initialized with 1:1 price ratio");
  }

  // Update addresses file with pool information
  addresses.pool = poolAddress;
  addresses.factory = UNISWAP_V3_FACTORY;
  addresses.fee = fee;
  
  fs.writeFileSync('token-addresses.json', JSON.stringify(addresses, null, 2));
  console.log("\n✅ Updated addresses saved to token-addresses.json");

  console.log("\n🎉 Pool creation complete!");
  console.log("Pool address:", poolAddress);
  
  console.log("\n📝 Manual Liquidity Addition Instructions:");
  console.log("==========================================");
  console.log("1. Visit Uniswap V3: https://app.uniswap.org/");
  console.log("2. Connect your wallet (MetaMask)");
  console.log("3. Switch to Sepolia testnet");
  console.log("4. Go to 'Pool' tab");
  console.log("5. Click 'New Position'");
  console.log("6. Select tokens:");
  console.log("   - Token A: BVIX (0x" + bvixAddress.slice(-8) + ")");
  console.log("   - Token B: USDC (0x" + usdcAddress.slice(-8) + ")");
  console.log("7. Set fee tier to 0.3%");
  console.log("8. Set price range (recommended: 0.5 to 2.0)");
  console.log("9. Enter liquidity amounts:");
  console.log("   - BVIX: 100,000");
  console.log("   - USDC: 100,000");
  console.log("10. Click 'Preview' and then 'Add'");
  console.log("\n🔗 Links:");
  console.log("Uniswap V3: https://app.uniswap.org/");
  console.log("Sepolia Etherscan: https://sepolia.etherscan.io/");
  console.log("Pool Address:", poolAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  }); 