import { Router } from 'express';
import { ethers } from 'ethers';

const router = Router();

// Contract addresses and ABIs - V5 Final with fresh BVIX
const MOCK_USDC_ADDRESS = '0x79640e0f510a7c6d59737442649d9600C84b035f';
const BVIX_ADDRESS = '0xa60289981b67139fb7a9F3d31dD2D2BaA414A263'; // Fresh BVIX
const MINT_REDEEM_ADDRESS = '0xa0133C6380bf9618e97Ab9a855aF2035e9498829'; // V5 Final
const BASE_SEPOLIA_RPC_URL = 'https://sepolia.base.org';

// Minimal ERC20 ABI for balance and supply queries
const ERC20_ABI = [
  'function balanceOf(address account) external view returns (uint256)',
  'function totalSupply() external view returns (uint256)',
];

// Oracle ABI for price queries
const ORACLE_ABI = [
  'function getPrice() external view returns (uint256)',
];

const ORACLE_ADDRESS = '0x85485dD6cFaF5220150c413309C61a8EA24d24FE';

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
      bvixContract.totalSupply(),
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