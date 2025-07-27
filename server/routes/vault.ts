import { Router } from 'express';
import { ethers } from 'ethers';

const router = Router();

// Contract addresses and ABIs - V7 BVIX (FIXED DECIMALS)
const MOCK_USDC_ADDRESS = '0x9CC37B36FDd8CF5c0297BE15b75663Bf2a193297';
const BVIX_ADDRESS = '0x7223A0Eb07B8d7d3CFbf84AC78eee4ae9DaA22CE'; // V8 BVIX TOKEN (WORKING)
const MINT_REDEEM_ADDRESS = '0x653A6a4dCe04dABAEdb521091A889bb1EE298D8d'; // V8 BVIX MINT/REDEEM (WORKING)
const BASE_SEPOLIA_RPC_URL = 'https://sepolia.base.org';

// Minimal ERC20 ABI for balance and supply queries
const ERC20_ABI = [
  'function balanceOf(address account) external view returns (uint256)',
  // 'function totalSupply() external view returns (uint256)', // Removed - individual vault mode
];

// Oracle ABI for price queries
const ORACLE_ABI = [
  'function getPrice() external view returns (uint256)',
];

const ORACLE_ADDRESS = '0xA6FAC514Fdc2C017FBCaeeDA27562dAC83Cf22cf'; // V8 BVIX ORACLE (WORKING)

router.get('/api/v1/vault-stats', async (req, res) => {
  try {
    // Initialize provider
    const provider = new ethers.JsonRpcProvider(BASE_SEPOLIA_RPC_URL);
    
    // Initialize contracts
    const usdcContract = new ethers.Contract(MOCK_USDC_ADDRESS, ERC20_ABI, provider);
    const bvixContract = new ethers.Contract(BVIX_ADDRESS, ERC20_ABI, provider);
    const oracleContract = new ethers.Contract(ORACLE_ADDRESS, ORACLE_ABI, provider);
    
    // Fetch data in parallel
    const [vaultUsdcBalance, bvixTotalSupply, bvixPrice] = await Promise.all([
      usdcContract.balanceOf(MINT_REDEEM_ADDRESS),
      Promise.resolve(BigInt(0)), // Individual vault mode - no total supply
      oracleContract.getPrice()
    ]);
    
    // Format values
    const usdcValue = ethers.formatUnits(vaultUsdcBalance, 6); // USDC has 6 decimals
    const bvixSupply = ethers.formatEther(bvixTotalSupply); // BVIX has 18 decimals
    const price = ethers.formatEther(bvixPrice); // Price in ETH format
    
    // Calculate collateral ratio
    const usdcFloat = parseFloat(usdcValue);
    const bvixFloat = parseFloat(bvixSupply);
    const priceFloat = parseFloat(price);
    
    const bvixValueInUsd = bvixFloat * priceFloat;
    const collateralRatio = bvixValueInUsd > 0 ? (usdcFloat / bvixValueInUsd) * 100 : 0;
    
    res.json({
      usdc: usdcValue,
      bvix: bvixSupply,
      cr: Math.round(collateralRatio * 100) / 100, // Round to 2 decimal places
      price: price,
      usdcValue: usdcFloat,
      bvixValueInUsd: bvixValueInUsd
    });
    
  } catch (error) {
    console.error('Error fetching vault stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch vault statistics',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;