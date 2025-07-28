import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ethers } from "ethers";
import { recordLiquidation, isVaultLiquidated, getLiquidation, getAllLiquidations, clearLiquidations } from './services/liquidation';
import { recordMockTransfer, getMockUsdcBalance, getMockTransfers } from './services/mockUsdcTransfer';

// Declare global types for TypeScript
declare global {
  var liquidatedVaults: Record<string, any> | undefined;
}

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
      const BVIX_ADDRESS = '0x7223A0Eb07B8d7d3CFbf84AC78eee4ae9DaA22CE'; // BVIX token V8 (WORKING)
      const MINT_REDEEM_ADDRESS = '0x653A6a4dCe04dABAEdb521091A889bb1EE298D8d'; // BVIX MintRedeem V8 (WORKING)
      // Oracle addresses
      const BVIX_ORACLE_ADDRESS = '0xA6FAC514Fdc2C017FBCaeeDA27562dAC83Cf22cf'; // V8 BVIX ORACLE (WORKING)
      const EVIX_ORACLE_ADDRESS = '0xBd6E9809B9608eCAc3610cA65327735CC3c08104'; // Updated EVIX Oracle
      // EVIX contracts - V6 addresses
      const EVIX_ADDRESS = '0x7066700CAf442501B308fAe34d5919091e1b2380'; // EVIX token V6
      const EVIX_MINT_REDEEM_ADDRESS = '0x6C3e986c4cc7b3400de732440fa01B66FF9172Cf'; // EVIX MintRedeem V6
      const BASE_SEPOLIA_RPC_URL = 'https://sepolia.base.org';

      // Minimal ERC20 ABI for balance and supply queries
      const ERC20_ABI = [
        'function balanceOf(address account) external view returns (uint256)',
        // 'function totalSupply() external view returns (uint256)', // Removed - individual vault mode
      ];

      // Oracle ABI for price queries - BVIX uses uint256, EVIX uses int256, but we can cast
      const ORACLE_ABI = [
        'function getPrice() external view returns (uint256)',
      ];

      // Initialize provider
      const provider = new ethers.JsonRpcProvider(BASE_SEPOLIA_RPC_URL);
      
      // Initialize contracts
      const usdcContract = new ethers.Contract(MOCK_USDC_ADDRESS, ERC20_ABI, provider);
      const bvixContract = new ethers.Contract('0x7223A0Eb07B8d7d3CFbf84AC78eee4ae9DaA22CE', ERC20_ABI, provider); // V8 BVIX TOKEN (WORKING)
      const bvixOracleContract = new ethers.Contract(BVIX_ORACLE_ADDRESS, ORACLE_ABI, provider);
      const evixOracleContract = new ethers.Contract(EVIX_ORACLE_ADDRESS, ORACLE_ABI, provider);
      
      // Fetch data in parallel from both vaults
      const [bvixVaultUsdcBalance, evixVaultUsdcBalance, bvixTotalSupply, bvixPrice] = await Promise.all([
        usdcContract.balanceOf(MINT_REDEEM_ADDRESS),
        usdcContract.balanceOf(EVIX_MINT_REDEEM_ADDRESS),
        Promise.resolve(BigInt(0)), // Don't use totalSupply for individual vaults
        bvixOracleContract.getPrice()
      ]);
      
      // Format values
      const bvixUsdcValue = ethers.formatUnits(bvixVaultUsdcBalance, 6);
      const evixUsdcValue = ethers.formatUnits(evixVaultUsdcBalance, 6);
      const totalUsdcValue = evixUsdcValue; // INDIVIDUAL VAULT ONLY - no protocol-wide sums
      const bvixSupply = "0.0"; // Individual vault mode - no total supply
      const price = ethers.formatUnits(bvixPrice, 8); // Oracle returns 8-decimal format on Base Sepolia
      
      // Individual vault calculations only - NO PROTOCOL-WIDE LOGIC
      const totalUsdcFloat = parseFloat(totalUsdcValue);
      const bvixFloat = parseFloat(bvixSupply);
      const priceFloat = parseFloat(price);
      
      // Add EVIX data for individual vault calculations
      const evixContract = new ethers.Contract(EVIX_ADDRESS, ERC20_ABI, provider);
      
      console.log('Debug: Using EVIX contract address:', EVIX_ADDRESS);
      console.log('Debug: Using EVIX vault address:', EVIX_MINT_REDEEM_ADDRESS);
      
      const [evixTotalSupply, evixPrice] = await Promise.all([
        Promise.resolve(BigInt(0)), // Don't use totalSupply for individual vaults
        evixOracleContract.getPrice()
      ]);
      
      const evixSupply = "0.0"; // Individual vault mode - no total supply
      // When fetching evixPrice, handle int256
      // Change: const evixPriceFormatted = ethers.formatUnits(evixPrice, 8);
      // To handle potential negative, but since prices are positive:
      const evixPriceFormatted = ethers.formatUnits(evixPrice.toString(), 8); // Convert BigInt to string for formatUnits
      
      const bvixValueInUsd = bvixFloat * priceFloat;
      const evixValueInUsd = parseFloat(evixSupply) * parseFloat(evixPriceFormatted);
      const totalTokenValueInUsd = bvixValueInUsd + evixValueInUsd;
      
      // Calculate individual vault CRs only - NO PROTOCOL-WIDE CR
      const individualCR = totalTokenValueInUsd > 0 ? (totalUsdcFloat / totalTokenValueInUsd) * 100 : 0;
      
      // Also calculate individual vault CRs for debugging
      const bvixVaultCR = bvixValueInUsd > 0 ? (parseFloat(bvixUsdcValue) / bvixValueInUsd) * 100 : 0;
      // Calculate EVIX vault CR from actual position data (if exists)
      const evixVaultCR = evixValueInUsd > 0 ? (parseFloat(evixUsdcValue) / evixValueInUsd) * 100 : 0;
      
      // Get user's personal wallet USDC balance (not vault balance)
      const userAddress = req.query.address as string;
      let adjustedUsdcBalance = "0.0000";
      
      if (userAddress) {
        // Fetch user's actual wallet USDC balance
        const userWalletUsdcBalance = await usdcContract.balanceOf(userAddress);
        const userWalletUsdcFormatted = ethers.formatUnits(userWalletUsdcBalance, 6);
        
        // Apply mock transfers to user's actual wallet balance
        adjustedUsdcBalance = getMockUsdcBalance(userAddress, userWalletUsdcFormatted);
        console.log(`💰 USDC Balance for ${userAddress}: Wallet=${userWalletUsdcFormatted}, With Transfers=${adjustedUsdcBalance}`);
      } else {
        // Fallback if no user address provided
        adjustedUsdcBalance = totalUsdcFloat.toFixed(4);
      }
      
      // GET ACTUAL USER POSITION DATA DIRECTLY WITHOUT API CALL TO AVOID CIRCULAR DEPENDENCY
      let bvixPositionValueInUsd = 0;
      let bvixPositionUsdc = "0.0";
      let bvixPositionCR = 0;
      let evixPositionValueInUsd = 0;
      let evixPositionUsdc = "0.0";
      let evixPositionCR = 0;
      
      if (userAddress) {
        try {
          // DIRECT CONTRACT CALLS TO GET ACTUAL POSITIONS (same logic as user-positions endpoint)
          const BVIX_MINT_REDEEM_ADDRESS = '0x653A6a4dCe04dABAEdb521091A889bb1EE298D8d';
          const EVIX_MINT_REDEEM_ADDRESS = '0x6C3e986c4cc7b3400de732440fa01B66FF9172Cf';
          
          const MINT_REDEEM_ABI = [
            'function positions(address user) external view returns (uint256 collateral, uint256 debt)',
          ];
          
          const bvixVaultContract = new ethers.Contract(BVIX_MINT_REDEEM_ADDRESS, MINT_REDEEM_ABI, provider);
          const evixVaultContract = new ethers.Contract(EVIX_MINT_REDEEM_ADDRESS, MINT_REDEEM_ABI, provider);
          
          const [bvixPosition, evixPosition] = await Promise.all([
            bvixVaultContract.positions(userAddress),
            evixVaultContract.positions(userAddress)
          ]);
          
          // Check if BVIX vault was liquidated and format position accordingly
          const bvixLiquidated = isVaultLiquidated('BVIX', userAddress);
          const evixLiquidated = isVaultLiquidated('EVIX', userAddress);
          
          // Calculate BVIX position if exists and not liquidated
          console.log(`🔍 BVIX Position Raw Data for ${userAddress}:`, {
            liquidated: bvixLiquidated,
            collateral: bvixPosition.collateral.toString(),
            debt: bvixPosition.debt.toString(),
            debtGreaterThanZero: bvixPosition.debt > 0n
          });
          
          if (!bvixLiquidated && bvixPosition.debt > 0n) {
            const collateral = parseFloat(ethers.formatUnits(bvixPosition.collateral, 6));
            const debt = parseFloat(ethers.formatEther(bvixPosition.debt));
            const priceFloat = parseFloat(price);
            const cr = debt > 0 ? (collateral / (debt * priceFloat)) * 100 : 0;
            
            bvixPositionUsdc = collateral.toFixed(6);
            bvixPositionValueInUsd = debt * priceFloat;
            bvixPositionCR = cr;
            
            console.log(`✅ BVIX Position Calculated:`, {
              collateral: bvixPositionUsdc,
              valueInUsd: bvixPositionValueInUsd,
              cr: bvixPositionCR
            });
          } else {
            console.log(`❌ BVIX Position Skipped: liquidated=${bvixLiquidated}, hasDebt=${bvixPosition.debt > 0n}`);
          }
          
          // Calculate EVIX position if exists and not liquidated  
          if (!evixLiquidated && evixPosition.debt > 0n) {
            const collateral = parseFloat(ethers.formatUnits(evixPosition.collateral, 6));
            const debt = parseFloat(ethers.formatEther(evixPosition.debt));
            const priceFloat = parseFloat(evixPriceFormatted);
            const cr = debt > 0 ? (collateral / (debt * priceFloat)) * 100 : 0;
            
            evixPositionUsdc = collateral.toFixed(6);
            evixPositionValueInUsd = debt * priceFloat;
            evixPositionCR = cr;
          }
          
        } catch (error) {
          console.log('Could not fetch user positions for vault stats:', error);
        }
      }

      res.json({
        usdc: adjustedUsdcBalance, // Adjusted USDC balance with mock transfers
        bvix: bvixSupply,
        evix: evixSupply,
        cr: Math.round(evixPositionCR * 100) / 100, // INDIVIDUAL EVIX VAULT CR ONLY
        price: price,
        evixPrice: evixPriceFormatted,
        usdcValue: parseFloat(adjustedUsdcBalance), // Adjusted USDC value
        bvixValueInUsd: bvixPositionValueInUsd, // ACTUAL BVIX POSITION VALUE
        evixValueInUsd: evixPositionValueInUsd,
        totalTokenValueInUsd: bvixPositionValueInUsd + evixPositionValueInUsd, // Both position values
        bvixVaultUsdc: bvixPositionUsdc, // ACTUAL BVIX POSITION COLLATERAL
        evixVaultUsdc: evixPositionUsdc, // ACTUAL EVIX POSITION COLLATERAL
        bvixVaultCR: Math.round(bvixPositionCR * 100) / 100, // ACTUAL BVIX POSITION CR
        evixVaultCR: Math.round(evixPositionCR * 100) / 100
      });
      
    } catch (error) {
      console.error('Error fetching vault stats:', error);
      res.status(500).json({ 
        error: 'Failed to fetch vault statistics',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get all liquidatable positions across individual vaults
  app.get('/api/v1/liquidatable-positions', async (req, res) => {
    try {
      // Contract addresses - V8 BVIX (WORKING), V6 EVIX (WORKING) 
      const BVIX_MINT_REDEEM_ADDRESS = '0x653A6a4dCe04dABAEdb521091A889bb1EE298D8d'; // BVIX MintRedeem V8 (WORKING)
      const EVIX_MINT_REDEEM_ADDRESS = '0x6C3e986c4cc7b3400de732440fa01B66FF9172Cf'; // EVIX MintRedeem V6
      const BVIX_ORACLE_ADDRESS = '0xA6FAC514Fdc2C017FBCaeeDA27562dAC83Cf22cf'; // V8 BVIX ORACLE (WORKING)
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
      // Check multiple known addresses including current user
      const knownAddresses = [
        '0x18633ea30ad5c91e13d2e5714fe5e3d97043679b', // Original test address
        '0x58bc63cbb24854f0a5edeaf3c5e530192dcbc24b', // Current user address
        '0xe18d3b075a241379d77fffe01ed1317dda0e8bac'  // Another user address
      ];
      
      // Use V8 BVIX (WORKING - identical to EVIX) and V6 EVIX contracts
      const bvixVault = new ethers.Contract(BVIX_MINT_REDEEM_ADDRESS, MINT_REDEEM_ABI, provider); // V8 WORKING
      const evixVault = new ethers.Contract(EVIX_MINT_REDEEM_ADDRESS, MINT_REDEEM_ABI, provider);
      const bvixOracle = new ethers.Contract(BVIX_ORACLE_ADDRESS, ORACLE_ABI, provider);
      const evixOracle = new ethers.Contract(EVIX_ORACLE_ADDRESS, ORACLE_ABI, provider);
      
      // Get prices first
      const [bvixPrice, evixPrice] = await Promise.all([
        bvixOracle.getPrice(),
        evixOracle.getPrice()
      ]);
      
      const liquidatable = [];
      
      // Check all known addresses for liquidatable positions
      for (const userAddress of knownAddresses) {
        try {
          const [bvixPosition, evixPosition] = await Promise.all([
            bvixVault.positions(userAddress),
            evixVault.positions(userAddress)
          ]);
      
          // Check BVIX position for this user
          if (bvixPosition.debt > 0n) {
            const collateral = parseFloat(ethers.formatUnits(bvixPosition.collateral, 6));
            const debt = parseFloat(ethers.formatEther(bvixPosition.debt));
            // V8 BVIX Oracle uses 18 decimals - raw: 42150000000000000000 -> 42.15
            let price = parseFloat(ethers.formatUnits(bvixPrice, 18));
            const cr = debt > 0 ? (collateral / (debt * price)) * 100 : 0;
            
            // Check if this vault has been liquidated
            const isLiquidated = isVaultLiquidated('BVIX', userAddress);
            
            console.log(`🔍 BVIX Position Check for ${userAddress}:`, {
              collateral,
              debt,
              price,
              cr: cr.toFixed(2),
              isLiquidatable: cr <= 120.1 && cr > 0 && !isLiquidated
            });
            
            if (cr <= 120.1 && cr > 0 && !isLiquidated) { // Allow small floating point precision, exclude liquidated
              liquidatable.push({
                vaultId: liquidatable.length + 1,
                owner: userAddress,
                collateral: collateral.toFixed(2),
                debt: debt.toFixed(2),
                currentCR: Math.round(cr * 100) / 100,
                liquidationPrice: (price * 1.2).toFixed(2),
                maxBonus: ((debt * price * 0.05)).toFixed(2),
                canLiquidate: true,
                tokenType: 'BVIX',
                contractAddress: BVIX_MINT_REDEEM_ADDRESS // V8 WORKING
              });
            }
          }
          
          // Check EVIX position for this user
          if (evixPosition.debt > 0n) {
            const collateral = parseFloat(ethers.formatUnits(evixPosition.collateral, 6));
            const debt = parseFloat(ethers.formatEther(evixPosition.debt));
            const price = parseFloat(ethers.formatUnits(evixPrice, 8));
            const cr = debt > 0 ? (collateral / (debt * price)) * 100 : 0;
            
            // Check if this vault has been liquidated
            const isLiquidated = isVaultLiquidated('EVIX', userAddress);
            
            console.log(`🔍 EVIX Position Check for ${userAddress}:`, {
              collateral,
              debt,
              price,
              cr: cr.toFixed(2),
              isLiquidatable: cr <= 120.1 && cr > 0 && !isLiquidated
            });
            
            if (cr <= 120.1 && cr > 0 && !isLiquidated) { // Allow small floating point precision, exclude liquidated
              liquidatable.push({
                vaultId: liquidatable.length + 1,
                owner: userAddress,
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
        } catch (error) {
          console.error(`Error checking positions for ${userAddress}:`, error);
        }
      }
      
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
      
      // Contract addresses - V7 BVIX (FIXED), V6 EVIX
      const BVIX_MINT_REDEEM_ADDRESS = '0x653A6a4dCe04dABAEdb521091A889bb1EE298D8d'; // BVIX MintRedeem V8 (WORKING)
      const EVIX_MINT_REDEEM_ADDRESS = '0x6C3e986c4cc7b3400de732440fa01B66FF9172Cf'; // EVIX MintRedeem V6
      const BVIX_ORACLE_ADDRESS = '0xA6FAC514Fdc2C017FBCaeeDA27562dAC83Cf22cf'; // V8 BVIX ORACLE (WORKING)
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

      // VAULT ISOLATION: Contract correctly tracks minting activity only (not external DEX purchases)
      // One vault per user containing only: USDC deposited via minting + BVIX tokens minted
      // External BVIX/USDC from DEXes should not affect vault CR, only wallet balances
      console.log(`✅ VAULT DESIGN CORRECT: One vault per user tracking minting activity only`);
      console.log(`Vault data (minting only): collateral=${ethers.formatUnits(bvixPosition.collateral, 6)}, debt=${ethers.formatEther(bvixPosition.debt)}`);

      // Check if BVIX vault was liquidated and format position accordingly
      const bvixLiquidated = isVaultLiquidated('BVIX', userAddress);
      
      // Use vault data directly - contract correctly tracks only minting activity
      const bvixCollateral = bvixLiquidated ? "0" : ethers.formatUnits(bvixPosition.collateral, 6);
      const bvixDebt = bvixLiquidated ? "0" : ethers.formatEther(bvixPosition.debt);
      
      console.log(`💰 VAULT STATUS: ${bvixCollateral} USDC collateral, ${bvixDebt} BVIX debt (cumulative minting history, external DEX activity isolated)`);
      
      // V8 BVIX Oracle uses 18 decimals - raw: 42150000000000000000 -> 42.15
      const bvixPriceFormatted = parseFloat(ethers.formatUnits(bvixPrice, 18));
      
      // Check if EVIX vault was liquidated and format position accordingly
      const evixLiquidated = isVaultLiquidated('EVIX', userAddress);
      
      const evixCollateral = evixLiquidated ? "0" : ethers.formatUnits(evixPosition.collateral, 6);
      const evixDebt = evixLiquidated ? "0" : ethers.formatEther(evixPosition.debt);
      const evixPriceFormatted = parseFloat(ethers.formatUnits(evixPrice, 8));

      // Calculate CRs
      let bvixCR = 0;
      let evixCR = 0;
      
      if (parseFloat(bvixDebt) > 0 && !bvixLiquidated) {
        const bvixDebtValue = parseFloat(bvixDebt) * bvixPriceFormatted;
        bvixCR = (parseFloat(bvixCollateral) / bvixDebtValue) * 100;
        
        console.log(`📊 BVIX CR Calculation for ${userAddress}:`, {
          collateral: parseFloat(bvixCollateral),
          debt: parseFloat(bvixDebt),
          price: bvixPriceFormatted,
          debtValue: bvixDebtValue,
          cr: bvixCR.toFixed(2)
        });
      }
      
      if (parseFloat(evixDebt) > 0 && !evixLiquidated) {
        const evixDebtValue = parseFloat(evixDebt) * evixPriceFormatted;
        evixCR = (parseFloat(evixCollateral) / evixDebtValue) * 100;
        
        console.log(`📊 EVIX CR Calculation for ${userAddress}:`, {
          collateral: parseFloat(evixCollateral),
          debt: parseFloat(evixDebt),
          price: evixPriceFormatted,
          debtValue: evixDebtValue,
          cr: evixCR.toFixed(2)
        });
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

  // Liquidation tracking endpoint with mock USDC transfers
  app.post('/api/v1/liquidate-vault', async (req, res) => {
    try {
      console.log('🔍 Raw request body:', req.body);
      
      const { liquidator, vault } = req.body;
      
      console.log('🔍 Liquidation request received:', { liquidator, vault });
      
      if (!vault || !vault.tokenType) {
        console.error('❌ Missing vault or tokenType in request');
        return res.status(400).json({ error: 'Missing vault or tokenType in request body' });
      }
      
      // Extract vault properties
      const { tokenType, owner, debt, collateral, maxBonus } = vault;
      
      console.log('🔍 Extracted vault properties:', { tokenType, owner, debt, collateral, maxBonus });
      
      // Calculate liquidation amounts - CORRECT DeFi mechanics
      const debtRepaid = debt;
      const debtValue = parseFloat(debt) * (vault.tokenType === 'BVIX' ? 42.15 : 37.98); // debt * price
      const bonus = debtValue * 0.05; // 5% bonus on debt value
      const totalLiquidatorCost = debtValue + bonus; // Liquidator pays debt + bonus
      const ownerRefund = (parseFloat(collateral) - totalLiquidatorCost).toFixed(2); // Owner gets remaining collateral
      
      console.log(`💰 Liquidation Economics:`, {
        collateral: parseFloat(collateral),
        debtValue: debtValue.toFixed(2),
        bonus: bonus.toFixed(2),
        liquidatorPays: totalLiquidatorCost.toFixed(2),
        ownerGets: ownerRefund
      });
      const txHash = `0x${Date.now().toString(16).padStart(8, '0')}${Math.random().toString(16).slice(2, 18).padEnd(16, '0')}${Math.random().toString(16).slice(2, 18).padEnd(16, '0')}${Math.random().toString(16).slice(2, 18).padEnd(16, '0')}`;

      
      // Record liquidation in service
      recordLiquidation({
        tokenType,
        owner,
        liquidator,
        debtRepaid,
        collateralSeized: totalLiquidatorCost.toFixed(2),
        bonus: bonus.toFixed(2),
        ownerRefund,
        timestamp: Date.now(),
        txHash
      });
      
      // Mock USDC transfers - CORRECT DeFi mechanics
      // 1. Liquidator PAYS debt value to protocol (negative transfer)
      recordMockTransfer(
        liquidator,
        'protocol_treasury',
        debtValue.toFixed(2),
        `Debt payment for ${tokenType} liquidation`
      );
      
      // 2. Liquidator RECEIVES debt value + 5% bonus from vault collateral
      recordMockTransfer(
        'vault_collateral_pool',
        liquidator,
        totalLiquidatorCost.toFixed(2),
        `Liquidation payout (debt + 5% bonus) for ${tokenType} vault`
      );
      
      // 3. Vault owner gets remaining collateral (if any)
      if (parseFloat(ownerRefund) > 0) {
        recordMockTransfer(
          'vault_collateral_pool',
          owner,
          ownerRefund,
          `Remaining collateral refund after liquidation`
        );
      }
      
      console.log(`✅ Vault liquidated with correct DeFi mechanics:`, {
        tokenType,
        owner,
        liquidator,
        liquidatorNetGain: bonus.toFixed(2), // Only the 5% bonus is profit
        liquidatorTotalReceived: totalLiquidatorCost.toFixed(2),
        liquidatorPaid: debtValue.toFixed(2),
        ownerReceived: ownerRefund
      });
      
      res.json({ 
        success: true, 
        liquidation: {
          tokenType,
          owner,
          liquidator,
          debtRepaid,
          collateralSeized: totalLiquidatorCost.toFixed(2),
          bonus: bonus.toFixed(2),
          ownerRefund,
          txHash,
          timestamp: Date.now()
        }
      });
    } catch (error) {
      console.error('Error processing liquidation:', error);
      res.status(500).json({ error: 'Failed to process liquidation' });
    }
  });
  
  // Get liquidation history
  app.get('/api/v1/liquidations', async (req, res) => {
    try {
      const liquidations = getAllLiquidations();
      res.json({ liquidations });
    } catch (error) {
      console.error('Error fetching liquidations:', error);
      res.status(500).json({ error: 'Failed to fetch liquidations' });
    }
  });

  // Check if vault is liquidated endpoint
  app.get('/api/v1/vault-liquidated/:tokenType/:owner', async (req, res) => {
    try {
      const { tokenType, owner } = req.params;
      const liquidationKey = `liquidated_${tokenType.toLowerCase()}_${owner}`;
      
      global.liquidatedVaults = global.liquidatedVaults || {};
      const isLiquidated = !!global.liquidatedVaults[liquidationKey];
      
      res.json({ isLiquidated, liquidation: global.liquidatedVaults[liquidationKey] || null });
    } catch (error) {
      res.status(500).json({ error: 'Failed to check liquidation status' });
    }
  });

  // Clear liquidations endpoint for testing
  app.post('/api/v1/clear-liquidations', async (req, res) => {
    try {
      global.liquidatedVaults = {};
      console.log('🧹 All liquidation records cleared');
      res.json({ success: true, message: 'All liquidation records cleared' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to clear liquidations' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
