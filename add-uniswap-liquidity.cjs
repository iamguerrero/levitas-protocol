const { ethers } = require("hardhat");
require("dotenv").config();

// Uniswap V3 addresses on Sepolia
const UNISWAP_V3_FACTORY = "0x0227628f3F023bb0B980b67D528571c95c6DaC1c";
const UNISWAP_V3_POSITION_MANAGER = "0x1238536071E1c677A632429e3655c799b22cDA52";
const UNISWAP_V3_ROUTER = "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E";

async function main() {
  console.log("🏊 Adding liquidity to Uniswap V3 on ETH Sepolia...");
  
  // Load deployed addresses
  const fs = require('fs');
  const addresses = JSON.parse(fs.readFileSync('token-addresses.json', 'utf8'));
  
  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  const bvixAddress = addresses.bvixToken;
  const usdcAddress = addresses.mockUsdc;
  
  console.log("\n📋 Token Addresses:");
  console.log("BVIX Token:", bvixAddress);
  console.log("Mock USDC:", usdcAddress);

  // Get token contracts
  const bvixToken = await ethers.getContractAt("BVIXToken", bvixAddress);
  const mockUsdc = await ethers.getContractAt("MockUSDC", usdcAddress);

  // Check balances
  const bvixBalance = await bvixToken.balanceOf(deployer.address);
  const usdcBalance = await mockUsdc.balanceOf(deployer.address);
  
  console.log("\n💰 Current Balances:");
  console.log("BVIX Balance:", ethers.formatEther(bvixBalance));
  console.log("USDC Balance:", ethers.formatUnits(usdcBalance, 6));

  // Get Uniswap V3 Factory
  const factoryABI = [
    "function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)",
    "function createPool(address tokenA, address tokenB, uint24 fee) external returns (address pool)"
  ];
  
  const factory = new ethers.Contract(UNISWAP_V3_FACTORY, factoryABI, deployer);

  // Create pool with 0.3% fee tier
  const fee = 3000; // 0.3%
  console.log("\n🏊 Creating/Getting Uniswap V3 pool with 0.3% fee...");
  
  let poolAddress = await factory.getPool(bvixAddress, usdcAddress, fee);
  
  if (poolAddress === ethers.ZeroAddress) {
    console.log("Pool doesn't exist, creating new pool...");
    const tx = await factory.createPool(bvixAddress, usdcAddress, fee);
    await tx.wait();
    poolAddress = await factory.getPool(bvixAddress, usdcAddress, fee);
    console.log("Pool created at:", poolAddress);
  } else {
    console.log("Pool already exists at:", poolAddress);
  }

  // Initialize pool if needed
  const poolABI = [
    "function initialize(uint160 sqrtPriceX96) external",
    "function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)"
  ];
  
  const pool = new ethers.Contract(poolAddress, poolABI, deployer);

  try {
    await pool.slot0();
    console.log("Pool is already initialized");
  } catch (error) {
    console.log("Initializing pool...");
    // Set initial price: 1 BVIX = 1 USDC (1:1 ratio)
    const sqrtPriceX96 = ethers.parseUnits("1", 96);
    const tx = await pool.initialize(sqrtPriceX96);
    await tx.wait();
    console.log("Pool initialized with 1:1 price ratio");
  }

  // Get Position Manager
  const positionManagerABI = [
    "function mint((address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, address recipient, uint256 deadline)) external payable returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)"
  ];

  const positionManager = new ethers.Contract(UNISWAP_V3_POSITION_MANAGER, positionManagerABI, deployer);

  // Calculate amounts for liquidity
  const bvixAmount = ethers.parseEther("100000"); // 100K BVIX
  const usdcAmount = ethers.parseUnits("100000", 6); // 100K USDC

  console.log("\n💧 Adding liquidity to the pool...");
  console.log("BVIX Amount:", ethers.formatEther(bvixAmount));
  console.log("USDC Amount:", ethers.formatUnits(usdcAmount, 6));

  // Approve tokens for position manager
  await bvixToken.approve(UNISWAP_V3_POSITION_MANAGER, bvixAmount);
  await mockUsdc.approve(UNISWAP_V3_POSITION_MANAGER, usdcAmount);
  console.log("Approved tokens for position manager");

  // Calculate tick range for concentrated liquidity
  // For a 1:1 price ratio, we'll use a narrow range around the current price
  const tickLower = -100; // Small range around current price
  const tickUpper = 100;  // Small range around current price

  const mintParams = {
    token0: bvixAddress < usdcAddress ? bvixAddress : usdcAddress,
    token1: bvixAddress < usdcAddress ? usdcAddress : bvixAddress,
    fee: fee,
    tickLower: tickLower,
    tickUpper: tickUpper,
    amount0Desired: bvixAddress < usdcAddress ? bvixAmount : usdcAmount,
    amount1Desired: bvixAddress < usdcAddress ? usdcAmount : bvixAmount,
    amount0Min: 0,
    amount1Min: 0,
    recipient: deployer.address,
    deadline: Math.floor(Date.now() / 1000) + 1800 // 30 minutes
  };

  console.log("Mint params:", {
    token0: mintParams.token0,
    token1: mintParams.token1,
    fee: mintParams.fee,
    tickLower: mintParams.tickLower,
    tickUpper: mintParams.tickUpper,
    amount0Desired: ethers.formatEther(mintParams.amount0Desired),
    amount1Desired: ethers.formatUnits(mintParams.amount1Desired, 6)
  });

  try {
    const mintTx = await positionManager.mint(mintParams);
    console.log("Mint transaction sent:", mintTx.hash);
    
    const mintReceipt = await mintTx.wait();
    console.log("✅ Liquidity added successfully!");
    console.log("Transaction hash:", mintReceipt.hash);

    // Try to get the token ID from events
    const increaseLiquidityEvent = mintReceipt.logs.find(log => {
      try {
        const parsed = positionManager.interface.parseLog(log);
        return parsed.name === "IncreaseLiquidity";
      } catch {
        return false;
      }
    });

    if (increaseLiquidityEvent) {
      const parsed = positionManager.interface.parseLog(increaseLiquidityEvent);
      console.log("Position created with token ID:", parsed.args.tokenId.toString());
    }

  } catch (error) {
    console.error("❌ Failed to add liquidity:", error.message);
    
    // Try alternative approach with simpler parameters
    console.log("\n🔄 Trying alternative approach...");
    
    const simpleMintParams = {
      token0: bvixAddress < usdcAddress ? bvixAddress : usdcAddress,
      token1: bvixAddress < usdcAddress ? usdcAddress : bvixAddress,
      fee: fee,
      tickLower: -887220, // Full range
      tickUpper: 887220,  // Full range
      amount0Desired: bvixAddress < usdcAddress ? bvixAmount : usdcAmount,
      amount1Desired: bvixAddress < usdcAddress ? usdcAmount : bvixAmount,
      amount0Min: 0,
      amount1Min: 0,
      recipient: deployer.address,
      deadline: Math.floor(Date.now() / 1000) + 1800
    };

    try {
      const simpleMintTx = await positionManager.mint(simpleMintParams);
      console.log("Simple mint transaction sent:", simpleMintTx.hash);
      
      const simpleMintReceipt = await simpleMintTx.wait();
      console.log("✅ Liquidity added successfully with simple approach!");
      console.log("Transaction hash:", simpleMintReceipt.hash);
    } catch (simpleError) {
      console.error("❌ Simple approach also failed:", simpleError.message);
      console.log("\n📝 Manual instructions:");
      console.log("1. Visit Uniswap V3: https://app.uniswap.org/");
      console.log("2. Connect wallet and switch to Sepolia");
      console.log("3. Go to Pool tab and click 'New Position'");
      console.log("4. Select BVIX and USDC tokens");
      console.log("5. Set fee to 0.3%");
      console.log("6. Add liquidity manually");
    }
  }

  // Update addresses file with pool information
  addresses.pool = poolAddress;
  addresses.positionManager = UNISWAP_V3_POSITION_MANAGER;
  addresses.factory = UNISWAP_V3_FACTORY;
  addresses.router = UNISWAP_V3_ROUTER;
  
  fs.writeFileSync('token-addresses.json', JSON.stringify(addresses, null, 2));
  console.log("\n✅ Updated addresses saved to token-addresses.json");

  console.log("\n🎉 Liquidity pool setup complete!");
  console.log("Pool address:", poolAddress);
  console.log("You can now trade BVIX/USDC on Uniswap V3!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  }); 