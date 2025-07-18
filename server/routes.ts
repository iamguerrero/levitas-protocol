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
      // Contract addresses - V5 Final with fresh BVIX and proper ownership
      const MOCK_USDC_ADDRESS = '0x9CC37B36FDd8CF5c0297BE15b75663Bf2a193297'; // MockUSDC with public faucet
      const BVIX_ADDRESS = '0xdcCCCC3A977cC0166788265eD4B683D41f3AED09'; // Fresh BVIX with faucet USDC
      const MINT_REDEEM_ADDRESS = '0x4d0ddFBCBa76f2e72B0Fef2fdDcaE9ddd6922397'; // V5 with faucet USDC
      const ORACLE_ADDRESS = '0x85485dD6cFaF5220150c413309C61a8EA24d24FE';
      // EVIX contracts - V5 Final addresses
      const EVIX_MINT_REDEEM_ADDRESS = '0xb187c5Ff48D69BB0b477dAf30Eec779E0D07771D'; // EVIX V5 with faucet USDC
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
      const price = ethers.formatEther(bvixPrice); // Oracle returns 18-decimal format
      
      // Calculate protocol-wide collateral ratio (total USDC vs total token value)
      // This should be the standard practice for protocol health
      const totalUsdcFloat = parseFloat(totalUsdcValue);
      const bvixFloat = parseFloat(bvixSupply);
      const priceFloat = parseFloat(price);
      
      // Add EVIX data for complete protocol-wide collateral ratio
      const evixContract = new ethers.Contract('0x089C132BC246bF2060F40B0608Cb14b2A0cC9127', ERC20_ABI, provider);
      const evixOracleContract = new ethers.Contract('0xCd7441A771a7F84E58d98E598B7Ff23A3688094F', ['function getPrice() external view returns (uint256)'], provider);
      
      console.log('Debug: Using EVIX contract address:', '0x089C132BC246bF2060F40B0608Cb14b2A0cC9127');
      console.log('Debug: Using EVIX vault address:', EVIX_MINT_REDEEM_ADDRESS);
      
      const [evixTotalSupply, evixPrice] = await Promise.all([
        evixContract.totalSupply(),
        evixOracleContract.getPrice()
      ]);
      
      const evixSupply = ethers.formatEther(evixTotalSupply);
      const evixPriceFormatted = ethers.formatEther(evixPrice); // EVIX oracle also returns 18-decimal format
      
      const bvixValueInUsd = bvixFloat * priceFloat;
      const evixValueInUsd = parseFloat(evixSupply) * parseFloat(evixPriceFormatted);
      const totalTokenValueInUsd = bvixValueInUsd + evixValueInUsd;
      
      // Calculate protocol-wide collateral ratio (correct math)
      // Total USDC in all vaults / Total value of all tokens
      const protocolWideCR = totalTokenValueInUsd > 0 ? (totalUsdcFloat / totalTokenValueInUsd) * 100 : 0;
      
      // Also calculate individual vault CRs for debugging
      const bvixVaultCR = bvixValueInUsd > 0 ? (parseFloat(bvixUsdcValue) / bvixValueInUsd) * 100 : 0;
      const evixVaultCR = evixValueInUsd > 0 ? (parseFloat(evixUsdcValue) / evixValueInUsd) * 100 : 0;
      
      res.json({
        usdc: totalUsdcValue, // Total USDC across all vaults (protocol-wide view)
        bvix: bvixSupply,
        evix: evixSupply,
        cr: Math.round(protocolWideCR * 100) / 100, // Protocol-wide CR (what user expects)
        price: price,
        evixPrice: evixPriceFormatted,
        usdcValue: parseFloat(totalUsdcValue),
        bvixValueInUsd: bvixValueInUsd,
        evixValueInUsd: evixValueInUsd,
        totalTokenValueInUsd: totalTokenValueInUsd,
        bvixVaultUsdc: bvixUsdcValue,
        evixVaultUsdc: evixUsdcValue,
        bvixVaultCR: Math.round(bvixVaultCR * 100) / 100,
        evixVaultCR: Math.round(evixVaultCR * 100) / 100
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
