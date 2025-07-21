const { ethers } = require("hardhat");
require("dotenv").config();

// Uniswap V3 Factory address on Sepolia
const UNISWAP_V3_FACTORY = "0x0227628f3F023bb0B980b67D528571c95c6DaC1c";
const WETH9 = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14"; // WETH on Sepolia

// Uniswap V3 Router address on Sepolia
const UNISWAP_V3_ROUTER = "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E";

// Uniswap V3 Pool Deployer address on Sepolia
const UNISWAP_V3_POOL_DEPLOYER = "0x8FDe96D90A2Aba66130c5d540F9a27A1b793B455";

async function main() {
  console.log("🚀 Starting liquidity pool deployment on ETH Sepolia...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Deploy BVIX Token
  console.log("\n📦 Deploying BVIX Token...");
  const BVIXToken = await ethers.getContractFactory("BVIXToken");
  const bvixToken = await BVIXToken.deploy(deployer.address);
  await bvixToken.waitForDeployment();
  const bvixAddress = await bvixToken.getAddress();
  console.log("BVIX Token deployed to:", bvixAddress);

  // Deploy Mock USDC
  console.log("\n📦 Deploying Mock USDC...");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUsdc = await MockUSDC.deploy(deployer.address);
  await mockUsdc.waitForDeployment();
  const usdcAddress = await mockUsdc.getAddress();
  console.log("Mock USDC deployed to:", usdcAddress);

  // Mint some tokens for liquidity
  console.log("\n💰 Minting tokens for liquidity...");
  const bvixAmount = ethers.parseEther("1000000"); // 1M BVIX
  const usdcAmount = ethers.parseUnits("1000000", 6); // 1M USDC (6 decimals)
  
  await bvixToken.mint(deployer.address, bvixAmount);
  console.log("Minted", ethers.formatEther(bvixAmount), "BVIX");
  
  // MockUSDC already mints 1B tokens to owner, so we don't need to mint more
  console.log("USDC balance:", ethers.formatUnits(await mockUsdc.balanceOf(deployer.address), 6));

  // Get Uniswap V3 Factory contract
  const factoryABI = [
    "function createPool(address tokenA, address tokenB, uint24 fee) external returns (address pool)",
    "function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)"
  ];
  
  const factory = new ethers.Contract(UNISWAP_V3_FACTORY, factoryABI, deployer);

  // Create pool with 0.3% fee tier
  const fee = 3000; // 0.3%
  console.log("\n🏊 Creating Uniswap V3 pool with 0.3% fee...");
  
  // Check if pool already exists
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

  // Get Pool contract
  const poolABI = [
    "function initialize(uint160 sqrtPriceX96) external",
    "function token0() external view returns (address)",
    "function token1() external view returns (address)",
    "function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)"
  ];
  
  const pool = new ethers.Contract(poolAddress, poolABI, deployer);

  // Check if pool is initialized
  try {
    await pool.slot0();
    console.log("Pool is already initialized");
  } catch (error) {
    console.log("Initializing pool...");
    // Set initial price: 1 BVIX = 1 USDC (1:1 ratio)
    // sqrtPriceX96 = sqrt(price) * 2^96
    // price = 1 (1 BVIX = 1 USDC)
    // sqrtPriceX96 = sqrt(1) * 2^96 = 2^96
    const sqrtPriceX96 = ethers.parseUnits("1", 96);
    const tx = await pool.initialize(sqrtPriceX96);
    await tx.wait();
    console.log("Pool initialized with 1:1 price ratio");
  }

  // Get NonfungiblePositionManager for adding liquidity
  const positionManagerAddress = "0x1238536071E1c677A632429e3655c799b22cDA52"; // Sepolia
  const positionManagerABI = [
    "function createAndInitializePoolIfNecessary(address token0, address token1, uint24 fee, uint160 sqrtPriceX96) external payable returns (address pool)",
    "function mint((address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, address recipient, uint256 deadline)) external payable returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)",
    "function positions(uint256 tokenId) external view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)"
  ];

  const positionManager = new ethers.Contract(positionManagerAddress, positionManagerABI, deployer);

  // Add liquidity
  console.log("\n💧 Adding liquidity to the pool...");
  
  // Approve tokens for position manager
  await bvixToken.approve(positionManagerAddress, bvixAmount);
  await mockUsdc.approve(positionManagerAddress, usdcAmount);
  console.log("Approved tokens for position manager");

  // Calculate tick range for full range position
  const tickLower = -887220; // Full range lower tick
  const tickUpper = 887220;  // Full range upper tick

  const mintParams = {
    token0: bvixAddress < usdcAddress ? bvixAddress : usdcAddress,
    token1: bvixAddress < usdcAddress ? usdcAddress : bvixAddress,
    fee: fee,
    tickLower: tickLower,
    tickUpper: tickUpper,
    amount0Desired: bvixAmount,
    amount1Desired: usdcAmount,
    amount0Min: 0,
    amount1Min: 0,
    recipient: deployer.address,
    deadline: Math.floor(Date.now() / 1000) + 1800 // 30 minutes
  };

  console.log("Adding liquidity with params:", {
    token0: mintParams.token0,
    token1: mintParams.token1,
    fee: mintParams.fee,
    tickLower: mintParams.tickLower,
    tickUpper: mintParams.tickUpper,
    amount0Desired: ethers.formatEther(mintParams.amount0Desired),
    amount1Desired: ethers.formatUnits(mintParams.amount1Desired, 6)
  });

  const mintTx = await positionManager.mint(mintParams);
  const mintReceipt = await mintTx.wait();
  console.log("Liquidity added! Transaction hash:", mintReceipt.hash);

  // Get the token ID from the event
  const mintEvent = mintReceipt.logs.find(log => {
    try {
      const parsed = positionManager.interface.parseLog(log);
      return parsed.name === "IncreaseLiquidity";
    } catch {
      return false;
    }
  });

  if (mintEvent) {
    const parsed = positionManager.interface.parseLog(mintEvent);
    console.log("Position created with token ID:", parsed.args.tokenId.toString());
  }

  // Save addresses
  const addresses = {
    bvixToken: bvixAddress,
    mockUsdc: usdcAddress,
    pool: poolAddress,
    positionManager: positionManagerAddress,
    factory: UNISWAP_V3_FACTORY,
    router: UNISWAP_V3_ROUTER
  };

  console.log("\n📋 Deployment Summary:");
  console.log("BVIX Token:", bvixAddress);
  console.log("Mock USDC:", usdcAddress);
  console.log("Uniswap V3 Pool:", poolAddress);
  console.log("Position Manager:", positionManagerAddress);
  console.log("Factory:", UNISWAP_V3_FACTORY);
  console.log("Router:", UNISWAP_V3_ROUTER);

  // Save to file
  const fs = require('fs');
  fs.writeFileSync('liquidity-pool-addresses.json', JSON.stringify(addresses, null, 2));
  console.log("\n✅ Addresses saved to liquidity-pool-addresses.json");

  console.log("\n🎉 Liquidity pool deployment complete!");
  console.log("You can now trade BVIX/USDC on Uniswap V3 on ETH Sepolia!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 