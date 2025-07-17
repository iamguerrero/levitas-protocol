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
      const MOCK_USDC_ADDRESS = '0x79640e0f510a7c6d59737442649d9600C84b035f';
      const BVIX_ADDRESS = '0xa60289981b67139fb7a9F3d31dD2D2BaA414A263'; // Fresh BVIX
      const MINT_REDEEM_ADDRESS = '0xa0133C6380bf9618e97Ab9a855aF2035e9498829'; // V5 Final
      const ORACLE_ADDRESS = '0x85485dD6cFaF5220150c413309C61a8EA24d24FE';
      // EVIX contracts - V5 Final addresses
      const EVIX_MINT_REDEEM_ADDRESS = '0xe65a6e1425DB77C7eCA7460c93184B5E4132D9DD'; // Fixed V5 with proper decimal handling
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
      const evixContract = new ethers.Contract('0x4dEaB86baa7CBDb7859665a7FE9766f22fB799C1', ERC20_ABI, provider);
      const evixOracleContract = new ethers.Contract('0xCd7441A771a7F84E58d98E598B7Ff23A3688094F', ['function getPrice() external view returns (uint256)'], provider);
      
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
