import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ethers } from "ethers";

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  // Vault statistics endpoint
  app.get("/api/v1/vault-stats", async (req, res) => {
    try {
      // Contract addresses - Updated V4 final addresses (no collateral ratio check)
      const MOCK_USDC_ADDRESS = '0x79640e0f510a7c6d59737442649d9600C84b035f';
      const BVIX_ADDRESS = '0xcA7aC262190a3d126971281c496a521F5dD0f8D0';
      const MINT_REDEEM_ADDRESS = '0x9d12b251f8F6c432b1Ecd6ef722Bf45A8aFdE6A8';
      const ORACLE_ADDRESS = '0x85485dD6cFaF5220150c413309C61a8EA24d24FE';
      // EVIX contracts - correct checksummed address
      const EVIX_MINT_REDEEM_ADDRESS = '0xe521441B7b9f2Dcaf5aC2b2Ac5CA5BfD6fB48a55';
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

      // Initialize provider
      const provider = new ethers.JsonRpcProvider(BASE_SEPOLIA_RPC_URL);
      
      // Initialize contracts
      const usdcContract = new ethers.Contract(MOCK_USDC_ADDRESS, ERC20_ABI, provider);
      const bvixContract = new ethers.Contract(BVIX_ADDRESS, ERC20_ABI, provider);
      const oracleContract = new ethers.Contract(ORACLE_ADDRESS, ORACLE_ABI, provider);
      
      // Fetch data in parallel from both vaults
      const [bvixVaultUsdcBalance, evixVaultUsdcBalance, bvixTotalSupply, bvixPrice] = await Promise.all([
        usdcContract.balanceOf(MINT_REDEEM_ADDRESS),
        usdcContract.balanceOf(EVIX_MINT_REDEEM_ADDRESS),
        bvixContract.totalSupply(),
        oracleContract.getPrice()
      ]);
      
      // Format values
      const bvixUsdcValue = ethers.formatUnits(bvixVaultUsdcBalance, 6);
      const evixUsdcValue = ethers.formatUnits(evixVaultUsdcBalance, 6);
      const totalUsdcValue = (parseFloat(bvixUsdcValue) + parseFloat(evixUsdcValue)).toString();
      const bvixSupply = ethers.formatEther(bvixTotalSupply); // BVIX has 18 decimals
      const price = ethers.formatEther(bvixPrice); // Price in ETH format
      
      // Calculate collateral ratio using BVIX vault only (as it should be)
      const bvixUsdcFloat = parseFloat(bvixUsdcValue);
      const bvixFloat = parseFloat(bvixSupply);
      const priceFloat = parseFloat(price);
      
      const bvixValueInUsd = bvixFloat * priceFloat;
      const collateralRatio = bvixValueInUsd > 0 ? (bvixUsdcFloat / bvixValueInUsd) * 100 : 0;
      
      res.json({
        usdc: totalUsdcValue, // Combined USDC from both vaults for display
        bvix: bvixSupply,
        cr: Math.round(collateralRatio * 100) / 100, // BVIX vault CR only
        price: price,
        usdcValue: parseFloat(totalUsdcValue),
        bvixValueInUsd: bvixValueInUsd,
        bvixVaultUsdc: bvixUsdcValue, // Individual vault amounts for debugging
        evixVaultUsdc: evixUsdcValue
      });
      
    } catch (error) {
      console.error('Error fetching vault stats:', error);
      res.status(500).json({ 
        error: 'Failed to fetch vault statistics',
        details: error.message 
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
