
const { ethers } = require('hardhat');

async function createUniswapPool() {
  const [deployer] = await ethers.getSigners();
  console.log('Creating Uniswap V3 Pool for EVIX/USDC...');

  const UNISWAP_V3_FACTORY = '0x4648a43B2C14Da09FdF82B161150d3F634f40491'; // Base Sepolia
  const EVIX_ADDRESS = '0x37e3b45fEF91D54Ef4992B71382EC36307908463';
  const USDC_ADDRESS = '0x79640e0F510A7C6d59737442649D9600C84B035f';
  const FEE_TIER = 500; // 0.05% fee tier

  // Factory ABI (minimal)
  const factoryABI = [
    'function createPool(address tokenA, address tokenB, uint24 fee) external returns (address pool)',
    'function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)'
  ];

  const factory = new ethers.Contract(UNISWAP_V3_FACTORY, factoryABI, deployer);
  
  // Check if pool already exists
  const existingPool = await factory.getPool(EVIX_ADDRESS, USDC_ADDRESS, FEE_TIER);
  
  if (existingPool !== '0x0000000000000000000000000000000000000000') {
    console.log('Pool already exists at:', existingPool);
    return existingPool;
  }

  // Create the pool
  const tx = await factory.createPool(EVIX_ADDRESS, USDC_ADDRESS, FEE_TIER);
  await tx.wait();
  
  const newPool = await factory.getPool(EVIX_ADDRESS, USDC_ADDRESS, FEE_TIER);
  console.log('New EVIX/USDC pool created at:', newPool);
  
  return newPool;
}

createUniswapPool().catch(console.error);
