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
      // Contract addresses - V6 (current production)
      const MOCK_USDC_ADDRESS = '0x9CC37B36FDd8CF5c0297BE15b75663Bf2a193297'; // MockUSDC with public faucet
      const BVIX_ADDRESS = '0x2E3bef50887aD2A30069c79D19Bb91085351C92a'; // BVIX token V6
      const MINT_REDEEM_ADDRESS = '0x65Bec0Ab96ab751Fd0b1D9c907342d9A61FB1117'; // BVIX MintRedeem V6
      // Oracle addresses
      const BVIX_ORACLE_ADDRESS = '0x85485dD6cFaF5220150c413309C61a8EA24d24FE';
      const EVIX_ORACLE_ADDRESS = '0xBd6E9809B9608eCAc3610cA65327735CC3c08104'; // Updated EVIX Oracle
      // EVIX contracts - V6 addresses
      const EVIX_ADDRESS = '0x7066700CAf442501B308fAe34d5919091e1b2380'; // EVIX token V6
      const EVIX_MINT_REDEEM_ADDRESS = '0x6C3e986c4cc7b3400de732440fa01B66FF9172Cf'; // EVIX MintRedeem V6
      const BASE_SEPOLIA_RPC_URL = 'https://sepolia.base.org';

      // Minimal ERC20 ABI for balance and supply queries
      const ERC20_ABI = [
        'function balanceOf(address account) external view returns (uint256)',
        'function totalSupply() external view returns (uint256)',
      ];

      // Oracle ABI for price queries - BVIX uses uint256, EVIX uses int256, but we can cast
      const ORACLE_ABI = [
        'function getPrice() external view returns (uint256)',
      ];

      // Initialize provider
      const provider = new ethers.JsonRpcProvider(BASE_SEPOLIA_RPC_URL);
      
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
      const price = ethers.formatUnits(bvixPrice, 8); // Oracle returns 8-decimal format on Base Sepolia
      
      // Calculate protocol-wide collateral ratio (total USDC vs total token value)
      // This should be the standard practice for protocol health
      const totalUsdcFloat = parseFloat(totalUsdcValue);
      const bvixFloat = parseFloat(bvixSupply);
      const priceFloat = parseFloat(price);
      
      // Add EVIX data for complete protocol-wide collateral ratio
      const evixContract = new ethers.Contract(EVIX_ADDRESS, ERC20_ABI, provider);
      
      console.log('Debug: Using EVIX contract address:', EVIX_ADDRESS);
      console.log('Debug: Using EVIX vault address:', EVIX_MINT_REDEEM_ADDRESS);
      
      const [evixTotalSupply, evixPrice] = await Promise.all([
        evixContract.totalSupply(),
        evixOracleContract.getPrice()
      ]);
      
      const evixSupply = ethers.formatEther(evixTotalSupply);
      // When fetching evixPrice, handle int256
      // Change: const evixPriceFormatted = ethers.formatUnits(evixPrice, 8);
      // To handle potential negative, but since prices are positive:
      const evixPriceFormatted = ethers.formatUnits(evixPrice.toString(), 8); // Convert BigInt to string for formatUnits
      
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

  // Get all liquidatable positions across the protocol
  app.get('/api/v1/liquidatable-positions', async (req, res) => {
    try {
      // Contract addresses - V6 (current production)
      const BVIX_MINT_REDEEM_ADDRESS = '0x65Bec0Ab96ab751Fd0b1D9c907342d9A61FB1117'; // BVIX MintRedeem V6
      const EVIX_MINT_REDEEM_ADDRESS = '0x6C3e986c4cc7b3400de732440fa01B66FF9172Cf'; // EVIX MintRedeem V6
      const BVIX_ORACLE_ADDRESS = '0x85485dD6cFaF5220150c413309C61a8EA24d24FE';
      const EVIX_ORACLE_ADDRESS = '0xBd6E9809B9608eCAc3610cA65327735CC3c08104';
      const BASE_SEPOLIA_RPC_URL = 'https://sepolia.base.org';

      // MintRedeem ABI for position queries
      const MINT_REDEEM_ABI = [
        'function positions(address user) external view returns (uint256 collateral, uint256 debt)',
        'function getUserCollateralRatio(address user) external view returns (uint256)',
        'function getPrice() external view returns (uint256)'
      ];

      // Oracle ABI
      const ORACLE_ABI = [
        'function getPrice() external view returns (uint256)',
      ];
      
      const provider = new ethers.JsonRpcProvider(BASE_SEPOLIA_RPC_URL);
      
      // Get all positions that might be liquidatable
      // For now, return the known user's position if it's liquidatable
      const knownAddress = '0x18633ea30ad5c91e13d2e5714fe5e3d97043679b';
      
      // Fetch user positions
      const bvixVault = new ethers.Contract(BVIX_MINT_REDEEM_ADDRESS, MINT_REDEEM_ABI, provider);
      const evixVault = new ethers.Contract(EVIX_MINT_REDEEM_ADDRESS, MINT_REDEEM_ABI, provider);
      const bvixOracle = new ethers.Contract(BVIX_ORACLE_ADDRESS, ORACLE_ABI, provider);
      const evixOracle = new ethers.Contract(EVIX_ORACLE_ADDRESS, ORACLE_ABI, provider);
      
      const [bvixPosition, evixPosition, bvixPrice, evixPrice] = await Promise.all([
        bvixVault.positions(knownAddress),
        evixVault.positions(knownAddress),
        bvixOracle.getPrice(),
        evixOracle.getPrice()
      ]);
      
      const liquidatable = [];
      
      // Check BVIX position
      if (bvixPosition.debt > 0n) {
        const collateral = parseFloat(ethers.formatUnits(bvixPosition.collateral, 6));
        const debt = parseFloat(ethers.formatEther(bvixPosition.debt));
        const price = parseFloat(ethers.formatUnits(bvixPrice, 8));
        const cr = debt > 0 ? (collateral / (debt * price)) * 100 : 0;
        
        if (cr < 120 && cr > 0) {
          liquidatable.push({
            vaultId: 1,
            owner: knownAddress,
            collateral: collateral.toFixed(2),
            debt: debt.toFixed(2),
            currentCR: Math.round(cr * 100) / 100,
            liquidationPrice: (price * 1.2).toFixed(2),
            maxBonus: ((debt * price * 0.05)).toFixed(2),
            canLiquidate: true,
            tokenType: 'BVIX',
            contractAddress: BVIX_MINT_REDEEM_ADDRESS
          });
        }
      }
      
      // Check EVIX position
      if (evixPosition.debt > 0n) {
        const collateral = parseFloat(ethers.formatUnits(evixPosition.collateral, 6));
        const debt = parseFloat(ethers.formatEther(evixPosition.debt));
        const price = parseFloat(ethers.formatUnits(evixPrice, 8));
        const cr = debt > 0 ? (collateral / (debt * price)) * 100 : 0;
        
        if (cr < 120 && cr > 0) {
          liquidatable.push({
            vaultId: 2,
            owner: knownAddress,
            collateral: collateral.toFixed(2),
            debt: debt.toFixed(2),
            currentCR: Math.round(cr * 100) / 100,
            liquidationPrice: (price * 1.2).toFixed(2),
            maxBonus: ((debt * price * 0.05)).toFixed(2),
            canLiquidate: true,
            tokenType: 'EVIX',
            contractAddress: EVIX_MINT_REDEEM_ADDRESS
          });
        }
      }
      
      console.log('Liquidatable positions found:', liquidatable);
      res.json({ bvix: liquidatable.filter(v => v.tokenType === 'BVIX'), evix: liquidatable.filter(v => v.tokenType === 'EVIX') });
      
    } catch (error) {
      console.error('Error fetching liquidatable positions:', error);
      res.status(500).json({ 
        error: 'Failed to fetch liquidatable positions',
        details: error instanceof Error ? error.message : String(error),
        bvix: [],
        evix: []
      });
    }
  });

  // User-specific vault positions endpoint
  app.get("/api/v1/user-positions/:address", async (req, res) => {
    try {
      const userAddress = req.params.address;
      
      // Contract addresses - V6 (current production)
      const BVIX_MINT_REDEEM_ADDRESS = '0x65Bec0Ab96ab751Fd0b1D9c907342d9A61FB1117'; // BVIX MintRedeem V6
      const EVIX_MINT_REDEEM_ADDRESS = '0x6C3e986c4cc7b3400de732440fa01B66FF9172Cf'; // EVIX MintRedeem V6
      const BVIX_ORACLE_ADDRESS = '0x85485dD6cFaF5220150c413309C61a8EA24d24FE';
      const EVIX_ORACLE_ADDRESS = '0xBd6E9809B9608eCAc3610cA65327735CC3c08104';
      const BASE_SEPOLIA_RPC_URL = 'https://sepolia.base.org';

      // MintRedeem ABI for position queries
      const MINT_REDEEM_ABI = [
        'function positions(address user) external view returns (uint256 collateral, uint256 debt)',
        'function getUserCollateralRatio(address user) external view returns (uint256)',
        'function getPrice() external view returns (uint256)'
      ];

      // Oracle ABI
      const ORACLE_ABI = [
        'function getPrice() external view returns (uint256)',
      ];

      // Initialize provider
      const provider = new ethers.JsonRpcProvider(BASE_SEPOLIA_RPC_URL);
      
      // Initialize contracts
      const bvixVaultContract = new ethers.Contract(BVIX_MINT_REDEEM_ADDRESS, MINT_REDEEM_ABI, provider);
      const evixVaultContract = new ethers.Contract(EVIX_MINT_REDEEM_ADDRESS, MINT_REDEEM_ABI, provider);
      const bvixOracleContract = new ethers.Contract(BVIX_ORACLE_ADDRESS, ORACLE_ABI, provider);
      const evixOracleContract = new ethers.Contract(EVIX_ORACLE_ADDRESS, ORACLE_ABI, provider);

      // Fetch user positions and prices in parallel
      const [bvixPosition, evixPosition, bvixPrice, evixPrice] = await Promise.all([
        bvixVaultContract.positions(userAddress),
        evixVaultContract.positions(userAddress),
        bvixOracleContract.getPrice(),
        evixOracleContract.getPrice()
      ]);

      // Format BVIX position
      const bvixCollateral = ethers.formatUnits(bvixPosition.collateral, 6); // USDC has 6 decimals
      const bvixDebt = ethers.formatEther(bvixPosition.debt); // Tokens have 18 decimals
      const bvixPriceFormatted = parseFloat(ethers.formatUnits(bvixPrice, 8));
      
      // Format EVIX position
      const evixCollateral = ethers.formatUnits(evixPosition.collateral, 6);
      const evixDebt = ethers.formatEther(evixPosition.debt);
      const evixPriceFormatted = parseFloat(ethers.formatUnits(evixPrice, 8));

      // Calculate CRs
      let bvixCR = 0;
      let evixCR = 0;
      
      if (parseFloat(bvixDebt) > 0) {
        const bvixDebtValue = parseFloat(bvixDebt) * bvixPriceFormatted;
        bvixCR = (parseFloat(bvixCollateral) / bvixDebtValue) * 100;
      }
      
      if (parseFloat(evixDebt) > 0) {
        const evixDebtValue = parseFloat(evixDebt) * evixPriceFormatted;
        evixCR = (parseFloat(evixCollateral) / evixDebtValue) * 100;
      }

      res.json({
        bvix: {
          collateral: bvixCollateral,
          debt: bvixDebt,
          cr: Math.round(bvixCR * 100) / 100
        },
        evix: {
          collateral: evixCollateral,
          debt: evixDebt,
          cr: Math.round(evixCR * 100) / 100
        },
        prices: {
          bvix: bvixPriceFormatted,
          evix: evixPriceFormatted
        }
      });
      
    } catch (error) {
      console.error('Error fetching user positions:', error);
      res.status(500).json({ 
        error: 'Failed to fetch user positions',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
