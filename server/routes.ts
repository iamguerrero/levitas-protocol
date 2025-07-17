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
      // Contract addresses (use proper checksums from web3.ts)
      const MOCK_USDC_ADDRESS = '0x79640e0f510a7c6d59737442649d9600C84b035f';
      const BVIX_ADDRESS = '0xEA3d08a5A5bC48Fc984F0F773826693B7480bF48';
      const MINT_REDEEM_ADDRESS = '0x1f3FB11995F1650D469649C476defB753766b2A0';
      const ORACLE_ADDRESS = '0x85485dD6cFaF5220150c413309C61a8EA24d24FE';
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
      
      // Initialize contracts with proper address checksumming
      const usdcContract = new ethers.Contract(ethers.getAddress(MOCK_USDC_ADDRESS), ERC20_ABI, provider);
      const bvixContract = new ethers.Contract(ethers.getAddress(BVIX_ADDRESS), ERC20_ABI, provider);
      const oracleContract = new ethers.Contract(ethers.getAddress(ORACLE_ADDRESS), ORACLE_ABI, provider);
      
      // Fetch data in parallel
      const [vaultUsdcBalance, bvixTotalSupply, bvixPrice] = await Promise.all([
        usdcContract.balanceOf(ethers.getAddress(MINT_REDEEM_ADDRESS)),
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
        details: error.message 
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
