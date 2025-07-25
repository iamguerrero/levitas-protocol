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
      // Contract addresses - Polygon Amoy V7 Final deployment
      const MOCK_USDC_ADDRESS = '0x4Cd0c0ed02363F27fC2A8a3D7dC9aEA88ddCCf5E'; // MockUSDC on Polygon Amoy
      const BVIX_ADDRESS = '0xb507A6743787E1Ee10365385F46DD5BFEa10Dcd5'; // BVIX Token on Polygon Amoy
      const MINT_REDEEM_ADDRESS = '0xec319c7F63031952d3a296833575bF28eb6cDC5f'; // BVIX MintRedeemV7 on Polygon Amoy
      const BVIX_ORACLE_ADDRESS = '0xcA7aC262190a3d126971281c496a521F5dD0f8D0'; // BVIX Oracle on Polygon Amoy
      const EVIX_ORACLE_ADDRESS = '0x9d12b251f8F6c432b1Ecd6ef722Bf45A8aFdE6A8'; // EVIX Oracle on Polygon Amoy
      // EVIX contracts - V7 Final addresses on Polygon Amoy
      const EVIX_MINT_REDEEM_ADDRESS = '0xFe9c81A98F33F15B279DE45ba022302113245D9F'; // EVIX MintRedeemV7 on Polygon Amoy
      // Try multiple RPC endpoints for better reliability
      const POLYGON_AMOY_RPC_URLS = [
        'https://polygon-amoy-bor-rpc.publicnode.com', // More stable
        'https://rpc.ankr.com/polygon_amoy',
        'https://rpc-amoy.polygon.technology' // Official but less stable
      ];

      // Minimal ERC20 ABI for balance and supply queries
      const ERC20_ABI = [
        'function balanceOf(address account) external view returns (uint256)',
        'function totalSupply() external view returns (uint256)',
      ];

      // Oracle ABI for price queries - BVIX uses uint256, EVIX uses int256, but we can cast
      const ORACLE_ABI = [
        'function getPrice() external view returns (uint256)',
      ];

      // Initialize provider with fallback mechanism
      let provider: ethers.JsonRpcProvider | null = null;
      for (const rpcUrl of POLYGON_AMOY_RPC_URLS) {
        try {
          const testProvider = new ethers.JsonRpcProvider(rpcUrl);
          await testProvider.getBlockNumber(); // Test connection
          provider = testProvider;
          console.log(`Connected to RPC: ${rpcUrl}`);
          break;
        } catch (error) {
          console.warn(`Failed to connect to ${rpcUrl}, trying next...`);
        }
      }
      
      if (!provider) {
        throw new Error('All RPC endpoints failed');
      }
      
      // Initialize contracts
      const usdcContract = new ethers.Contract(MOCK_USDC_ADDRESS, ERC20_ABI, provider);
      const bvixContract = new ethers.Contract(BVIX_ADDRESS, ERC20_ABI, provider);
      const bvixOracleContract = new ethers.Contract(BVIX_ORACLE_ADDRESS, ORACLE_ABI, provider);
      const evixOracleContract = new ethers.Contract(EVIX_ORACLE_ADDRESS, ORACLE_ABI, provider);
      
      // Fetch data in parallel from both vaults
      const [bvixVaultUsdcBalance, evixVaultUsdcBalance, bvixTotalSupply, bvixPrice] = await Promise.all([
        usdcContract.balanceOf(MINT_REDEEM_ADDRESS),
        usdcContract.balanceOf(EVIX_MINT_REDEEM_ADDRESS),
        bvixContract.totalSupply(),
        bvixOracleContract.getPrice()
      ]);
      
      // Format values
      const bvixUsdcValue = ethers.formatUnits(bvixVaultUsdcBalance, 6);
      const evixUsdcValue = ethers.formatUnits(evixVaultUsdcBalance, 6);
      const totalUsdcValue = (parseFloat(bvixUsdcValue) + parseFloat(evixUsdcValue)).toString();
      const bvixSupply = ethers.formatEther(bvixTotalSupply); // BVIX has 18 decimals
      const price = ethers.formatUnits(bvixPrice, 6); // Oracle returns 6-decimal format on Polygon Amoy
      
      // Calculate protocol-wide collateral ratio (total USDC vs total token value)
      // This should be the standard practice for protocol health
      const totalUsdcFloat = parseFloat(totalUsdcValue);
      const bvixFloat = parseFloat(bvixSupply);
      const priceFloat = parseFloat(price);
      
      // Add EVIX data for complete protocol-wide collateral ratio
      const evixContract = new ethers.Contract('0x3c56D64B9bB348CC823742A861dB73405090408F', ERC20_ABI, provider);
      
      console.log('Debug: Using EVIX contract address:', '0x3c56D64B9bB348CC823742A861dB73405090408F');
      console.log('Debug: Using EVIX vault address:', EVIX_MINT_REDEEM_ADDRESS);
      
      const [evixTotalSupply, evixPrice] = await Promise.all([
        evixContract.totalSupply(),
        evixOracleContract.getPrice()
      ]);
      
      const evixSupply = ethers.formatEther(evixTotalSupply);
      // When fetching evixPrice, handle int256
      // Change: const evixPriceFormatted = ethers.formatUnits(evixPrice, 8);
      // To handle potential negative, but since prices are positive:
      const evixPriceFormatted = ethers.formatUnits(evixPrice.toString(), 6); // Convert BigInt to string for formatUnits - Polygon Amoy uses 6 decimals
      
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
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
