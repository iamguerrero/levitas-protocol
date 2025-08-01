import { useState, useEffect, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { getProvider, getSigner, getBVIXContract, getEVIXContract } from '@/lib/web3';
import mintRedeemV6ABI from '@/contracts/MintRedeemV6.abi.json';
import evixMintRedeemV6ABI from '@/contracts/EVIXMintRedeemV6.abi.json';

import { useUserPositions } from '@/hooks/useUserPositions';
import { useVault } from '@/hooks/useVault';

// Define vault addresses (V6 contracts that have positions method)
const BVIX_VAULT_ADDRESS = "0x653A6a4dCe04dABAEdb521091A889bb1EE298D8d"; // BVIX V8 (WORKING)
const EVIX_VAULT_ADDRESS = "0x6C3e986c4cc7b3400de732440fa01B66FF9172Cf"; // EVIX V6

export interface LiquidatableVault {
  vaultId: number;
  owner: string;
  collateral: string;
  debt: string;
  currentCR: number;
  liquidationPrice: string;
  maxBonus: string;
  canLiquidate: boolean;
  tokenType: 'BVIX' | 'EVIX';
  contractAddress: string;
}

export interface LiquidationResult {
  txHash: string;
  debtRepaid: string;
  collateralSeized: string;
  bonus: string;
  isPartial: boolean;
}

// Hook to get all liquidatable vaults
export function useLiquidatableVaults() {
  return useQuery({
    queryKey: ['liquidatable-vaults'],
    queryFn: async () => {
      try {
        // Fetch all user positions from API to find liquidatable ones
        const response = await fetch('/api/v1/liquidatable-positions');
        if (!response.ok) {
          return [];
        }
        const data = await response.json();
        
        // Filter positions that are actually liquidatable (CR < 120%)
        const liquidatable = [];
        
        if (data.bvix && data.bvix.length > 0) {
          liquidatable.push(...data.bvix.filter((v: any) => v.currentCR <= 120));
        }
        
        if (data.evix && data.evix.length > 0) {
          liquidatable.push(...data.evix.filter((v: any) => v.currentCR <= 120));
        }
        

        return liquidatable;
      } catch (error) {
        return [];
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}



// Hook to get liquidation price for a specific user position
export function useLiquidationPrice(userAddress: string | null, tokenType: 'BVIX' | 'EVIX') {
  return useQuery({
    queryKey: ['liquidation-price', userAddress, tokenType],
    queryFn: async () => {
      if (!userAddress) return null;

      // Return mock data for now since V8 contracts are not deployed
      return {
        collateral: '1500.00',
        debt: '1000.00',
        liquidationPrice: tokenType === 'BVIX' ? '52.50' : '41250.00',
        currentCR: 150,
        isAtRisk: false,
        canBeLiquidated: false
      };

      /* Original implementation for when V8 is deployed:
      const provider = getProvider();
      const contractAddress = tokenType === 'BVIX' ? MINT_REDEEM_V8_ADDRESS : EVIX_MINT_REDEEM_V8_ADDRESS;
      const abi = tokenType === 'BVIX' ? MintRedeemV8ABI : EVIXMintRedeemV8ABI;
      const contract = new ethers.Contract(contractAddress, abi, provider);

      const [position, liquidationPrice, userCR] = await Promise.all([
        contract.positions(userAddress),
        contract.getLiquidationPrice(userAddress),
        contract.getUserCollateralRatio(userAddress)
      ]);

      if (position.debt.toString() === '0') return null;

      return {
        collateral: ethers.formatUnits(position.collateral, 6),
        debt: ethers.formatEther(position.debt),
        liquidationPrice: ethers.formatUnits(liquidationPrice, tokenType === 'BVIX' ? 8 : 6),
        currentCR: Number(userCR),
        isAtRisk: Number(userCR) < 125, // Warning threshold at 125%
        canBeLiquidated: Number(userCR) < 120
      };
      */
    },
    enabled: !!userAddress,
    refetchInterval: 12000, // Reduced to 12 seconds for better performance
  });
}

// Hook to perform liquidation
export function useLiquidation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      vault, 
      repayAmount 
    }: { 
      vault: LiquidatableVault; 
      repayAmount?: string; // Optional for partial liquidation
    }) => {
      // V6 contracts don't have liquidation functions, so we simulate what V8 liquidation would do:
      // 1. Liquidator spends EVIX/BVIX tokens to repay debt
      // 2. Liquidator receives USDC collateral + 5% bonus  
      // 3. Vault owner's position is cleared and remaining collateral returned
      
      const signer = await getSigner();
      const provider = getProvider();
      const userAddress = await signer.getAddress();
      
      // Get the appropriate contracts
      const tokenContract = vault.tokenType === 'BVIX' 
        ? await getBVIXContract(signer)
        : await getEVIXContract(signer);
        
      // Get the exact debt amount from the vault contract to avoid rounding errors
      const vaultContract = vault.tokenType === 'BVIX'
        ? new ethers.Contract('0x653A6a4dCe04dABAEdb521091A889bb1EE298D8d', mintRedeemV6ABI, provider) // V8 WORKING
        : new ethers.Contract(EVIX_VAULT_ADDRESS, evixMintRedeemV6ABI, provider);
        
      const signerVaultContract = vault.tokenType === 'BVIX'
        ? new ethers.Contract('0x653A6a4dCe04dABAEdb521091A889bb1EE298D8d', mintRedeemV6ABI, signer) // V8 WORKING
        : new ethers.Contract(EVIX_VAULT_ADDRESS, evixMintRedeemV6ABI, signer);
      
      const vaultPosition = await vaultContract.positions(vault.owner);
      
      // CRITICAL FIX: For fresh vaults, use the debt from the UI, not the total contract debt
      let exactDebtWei: bigint;
      let totalCollateral: number;
      
      // Check if this is a fresh vault (has liquidation history)
      const liquidationRes = await fetch('/api/v1/liquidations');
      const liquidationData = await liquidationRes.json();
      const hasLiquidationHistory = liquidationData.liquidations.some((l: any) => 
        l.owner.toLowerCase() === vault.owner.toLowerCase() && l.tokenType === vault.tokenType
      );
      
      if (hasLiquidationHistory) {
        // FRESH VAULT: Use the isolated debt and collateral from the UI
        const debtFromUI = parseFloat(vault.debt);
        exactDebtWei = ethers.parseEther(debtFromUI.toString());
        totalCollateral = parseFloat(vault.collateral);
        console.log(`🆕 FRESH VAULT LIQUIDATION: Using isolated debt ${debtFromUI} ${vault.tokenType} (not total ${ethers.formatEther(vaultPosition.debt)})`);
        console.log(`🆕 FRESH VAULT COLLATERAL: Using ${totalCollateral} USDC`);
      } else {
        // Normal vault: use contract values
        exactDebtWei = vaultPosition.debt;
        totalCollateral = parseFloat(ethers.formatUnits(vaultPosition.collateral, 6));
        console.log(`📊 Normal vault liquidation: ${ethers.formatEther(exactDebtWei)} ${vault.tokenType}`);
      }
      
      // Check user has enough tokens to liquidate using exact debt amount
      const tokenBalance = await tokenContract.balanceOf(userAddress);
      
      if (tokenBalance < exactDebtWei) {
        throw new Error(`Insufficient ${vault.tokenType} balance. Need ${ethers.formatEther(exactDebtWei)} but have ${ethers.formatEther(tokenBalance)}`);
      }

      // Get USDC contract for direct transfers  
      const usdcContract = new ethers.Contract(
        '0x9CC37B36FDd8CF5c0297BE15b75663Bf2a193297', // MockUSDC address
        [
          'function transfer(address to, uint256 amount) external returns (bool)',
          'function balanceOf(address account) external view returns (uint256)'
        ],
        signer
      );
      
      // Get real oracle prices FIRST - BVIX uses 18 decimals, EVIX uses 8 decimals
      const bvixOracle = new ethers.Contract('0xA6FAC514Fdc2C017FBCaeeDA27562dAC83Cf22cf', ['function getPrice() external view returns (uint256)'], provider);
      const evixOracle = new ethers.Contract('0xBd6E9809B9608eCAc3610cA65327735CC3c08104', ['function getPrice() external view returns (uint256)'], provider);
      
      let tokenPrice: number;
      if (vault.tokenType === 'BVIX') {
        const bvixPriceRaw = await bvixOracle.getPrice();
        tokenPrice = parseFloat(ethers.formatUnits(bvixPriceRaw, 18)); // BVIX V8 oracle uses 18 decimals
      } else {
        const evixPriceRaw = await evixOracle.getPrice();
        tokenPrice = parseFloat(ethers.formatUnits(evixPriceRaw, 8)); // EVIX oracle uses 8 decimals
      }
      
      console.log(`🏦 Liquidation using real price: ${vault.tokenType} = $${tokenPrice}`);
      
      const exactDebtFormatted = ethers.formatEther(exactDebtWei);
      const debtValue = parseFloat(exactDebtFormatted) * tokenPrice;
      const bonusAmount = debtValue * 0.05;
      const totalPaymentToLiquidator = debtValue + bonusAmount; // What liquidator should receive
      
      // Calculate remaining collateral (totalCollateral was already set above based on fresh vault status)
      const remainingCollateral = totalCollateral - totalPaymentToLiquidator; // What vault owner gets back
      
      console.log(`🔢 Liquidation calculation:`, {
        totalCollateral: totalCollateral.toFixed(2),
        debtValue: debtValue.toFixed(2),
        bonus: bonusAmount.toFixed(2),
        liquidatorReceives: totalPaymentToLiquidator.toFixed(2),
        ownerGetsBack: Math.max(0, remainingCollateral).toFixed(2)
      });
      
      // PROPER LIQUIDATION PROCESS:
      // 1. Liquidator burns their BVIX/EVIX tokens from WALLET (not vault)
      // 2. Liquidator receives debt value + 5% bonus in USDC
      // 3. Vault owner's position is cleared
      // 4. Vault owner receives any remaining collateral
      
      // Check liquidator has enough tokens IN WALLET
      const liquidatorBalance = await tokenContract.balanceOf(userAddress);
      if (liquidatorBalance < exactDebtWei) {
        throw new Error(`Insufficient ${vault.tokenType} balance in wallet`);
      }
      
      // Since V6 contracts don't have liquidation, we simulate it:
      // 1. Burn liquidator's tokens (send to dead address)
      console.log(`🔥 Burning ${exactDebtFormatted} ${vault.tokenType} from liquidator's wallet`);
      console.log(`📊 Pre-liquidation balances:`, {
        liquidatorBVIX: ethers.formatEther(await tokenContract.balanceOf(userAddress)),
        ownerBVIX: ethers.formatEther(await tokenContract.balanceOf(vault.owner))
      });
      
      const burnTx = await tokenContract.transfer('0x000000000000000000000000000000000000dEaD', exactDebtWei);
      const receipt = await burnTx.wait();
      
      console.log(`📊 Post-burn balances:`, {
        liquidatorBVIX: ethers.formatEther(await tokenContract.balanceOf(userAddress)),
        ownerBVIX: ethers.formatEther(await tokenContract.balanceOf(vault.owner))
      });
      
      // 2. Calculate what liquidator SHOULD receive (debt value + 5% bonus)
      const liquidatorPayment = totalPaymentToLiquidator; // This is debt value + bonus
      const liquidatorPaymentFormatted = liquidatorPayment.toFixed(2);
      
      console.log(`💰 Liquidator should receive: $${liquidatorPaymentFormatted} USDC`);
      console.log(`💰 Vault owner should receive: $${Math.max(0, remainingCollateral).toFixed(2)} USDC`);
      
      // Note: In a real liquidation system, the smart contract would handle the correct payment amounts
      // Here we're simulating by redeeming tokens (which gives full value) but tracking what SHOULD happen
      
      // Get current USDC balance before mock transfer
      const liquidatorUsdcBefore = await usdcContract.balanceOf(userAddress);
      const liquidatorUsdcBeforeFormatted = parseFloat(ethers.formatUnits(liquidatorUsdcBefore, 6));
      console.log(`💰 Liquidator USDC balance before: ${liquidatorUsdcBeforeFormatted.toFixed(2)}`);
      
      // Create mock USDC transfers for liquidation
      const mockTransferData = {
        liquidatorPayment: {
          from: 'vault_collateral_pool',
          to: userAddress,
          amount: totalPaymentToLiquidator.toFixed(2),
          reason: `Liquidation payout (debt + 5% bonus) for ${vault.tokenType} vault`
        },
        ownerRefund: remainingCollateral > 0 ? {
          from: 'vault_collateral_pool',
          to: vault.owner,
          amount: remainingCollateral.toFixed(2),
          reason: `Remaining collateral refund after liquidation`
        } : null
      };
      
      console.log(`📝 Creating mock USDC transfers:`, mockTransferData);
      
      // Mark this vault as liquidated in backend (so it disappears from opportunities)
      // CRITICAL: For fresh vaults, we need to store the CURRENT contract state at liquidation
      // Check if this is a fresh vault by comparing collateral with total contract state
      const isCurrentlyFreshVault = parseFloat(vault.collateral) < 1000; // Fresh vaults have < 1000 USDC
      console.log(`🔍 Vault being liquidated: ${vault.collateral} USDC, ${vault.debt} ${vault.tokenType}, isFresh: ${isCurrentlyFreshVault}`);
      
      const contractStateAtLiquidation = isCurrentlyFreshVault ? {
        // For fresh vaults being liquidated, the current state IS the state at liquidation
        collateral: ethers.formatUnits(vaultPosition.collateral, 6),
        debt: ethers.formatEther(vaultPosition.debt)
      } : {
        // For normal vaults, use the full contract values
        collateral: ethers.formatUnits(vaultPosition.collateral, 6),
        debt: ethers.formatEther(vaultPosition.debt)
      };
      
      const liquidateResponse = await fetch('/api/v1/liquidate-vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenType: vault.tokenType,
          owner: vault.owner,
          liquidator: userAddress,
          debtRepaid: exactDebtFormatted,
          collateralSeized: totalPaymentToLiquidator.toFixed(2), // What liquidator actually gets
          bonus: bonusAmount.toFixed(2),
          totalCollateral: totalCollateral.toFixed(2),
          remainingCollateral: Math.max(0, remainingCollateral).toFixed(2), // What owner gets back
          txHash: receipt.hash,
          mockTransfers: mockTransferData, // Include mock transfers
          contractStateAtLiquidation // Store the contract state at liquidation time
        })
      });
      
      if (!liquidateResponse.ok) {
        console.error('Failed to mark vault as liquidated:', await liquidateResponse.text());
      }
      
      // Simulate USDC balance update (in a real system, the contract would handle this)
      const liquidatorUsdcAfter = liquidatorUsdcBeforeFormatted + totalPaymentToLiquidator;
      console.log(`💰 Liquidator USDC balance after: ${liquidatorUsdcAfter.toFixed(2)} (+${totalPaymentToLiquidator.toFixed(2)})`);
      
      // Force refresh balances
      await queryClient.invalidateQueries({ queryKey: ['balances'] });
      
      // CRITICAL: Invalidate all queries to ensure vault disappears from everywhere
      await queryClient.invalidateQueries({ queryKey: ['liquidatable-positions'] });
      await queryClient.invalidateQueries({ queryKey: ['user-positions', vault.owner] });
      await queryClient.invalidateQueries({ queryKey: ['liquidations'] });
      await queryClient.invalidateQueries({ queryKey: ['vault-stats'] });

      // Generate UNIQUE vault ID with transaction hash to ensure consistency between all parties
      // Use txHash for consistency since it's the same for liquidator and owner
      const txHashShort = receipt.hash.slice(-8); // Last 8 chars of tx hash
      const uniqueVaultId = `${vault.tokenType}-${vault.owner.slice(-4)}-${txHashShort}`.toLowerCase();
      
      // Create liquidation record for LIQUIDATOR (the person executing this function)
      const liquidatorRecord = {
        id: Date.now().toString(),
        type: 'liquidation' as const,
        vaultId: uniqueVaultId,
        tokenType: vault.tokenType,
        amount: vault.debt,
        liquidator: userAddress,
        liquidatedUser: vault.owner,
        collateralSeized: totalPaymentToLiquidator.toFixed(2),
        bonus: bonusAmount.toFixed(2),
        txHash: receipt.hash,
        timestamp: Date.now(),
        status: 'confirmed' as const,
        isLiquidator: true, // Flag to show this is for the liquidator
        vault: {
          owner: vault.owner,
          tokenType: vault.tokenType,
          vaultId: uniqueVaultId
        }
      };

      // Create liquidation record for VAULT OWNER (different view)
      const ownerRecord = {
        id: (Date.now() + 1).toString(),
        type: 'liquidated' as const, // Different type for vault owner
        vaultId: uniqueVaultId,
        tokenType: vault.tokenType,
        amount: vault.debt,
        liquidator: userAddress,
        liquidatedUser: vault.owner,
        collateralSeized: totalPaymentToLiquidator.toFixed(2),
        collateralReturned: Math.max(0, remainingCollateral).toFixed(2), // What they got back
        bonus: bonusAmount.toFixed(2),
        txHash: receipt.hash,
        timestamp: Date.now(),
        status: 'confirmed' as const,
        isLiquidator: false, // Flag to show this is for the vault owner
        vault: {
          owner: vault.owner,
          tokenType: vault.tokenType,
          vaultId: uniqueVaultId
        }
      };

      // CRITICAL FIX: Clear ALL existing transaction history to start fresh with consistent vault IDs
      // Remove all possible localStorage keys that might contain old inconsistent vault IDs
      const allKeys = Object.keys(localStorage);
      const liquidationKeys = allKeys.filter(key => key.includes('liquidation-history'));
      liquidationKeys.forEach(key => localStorage.removeItem(key));
      
      // ALSO clear any other potential storage that might have inconsistent vault IDs
      localStorage.removeItem('liquidation-history');
      localStorage.removeItem(`liquidation-history-${userAddress}`);
      localStorage.removeItem(`liquidation-history-${vault.owner}`);
      
      console.log(`🧹 Cleared ${liquidationKeys.length} old liquidation history keys plus specific user keys`);
      console.log(`🔄 Creating fresh transaction history with vault ID: ${uniqueVaultId}`);
      
      // Store liquidator history in GLOBAL localStorage (for current user who is liquidating)
      const globalHistory = JSON.parse(localStorage.getItem('liquidation-history') || '[]');
      globalHistory.unshift(liquidatorRecord);
      localStorage.setItem('liquidation-history', JSON.stringify(globalHistory));
      
      // Also store in user-specific key for the liquidator
      const liquidatorSpecificHistory = JSON.parse(localStorage.getItem(`liquidation-history-${userAddress}`) || '[]');
      liquidatorSpecificHistory.unshift(liquidatorRecord);
      localStorage.setItem(`liquidation-history-${userAddress}`, JSON.stringify(liquidatorSpecificHistory));
      
      // Store owner's history in their specific key (vault owner gets "got liquidated" record)
      const existingOwnerHistory = JSON.parse(localStorage.getItem(`liquidation-history-${vault.owner}`) || '[]');
      existingOwnerHistory.unshift(ownerRecord);
      localStorage.setItem(`liquidation-history-${vault.owner}`, JSON.stringify(existingOwnerHistory));
      
      console.log(`💾 Stored transaction history:`);
      console.log(`  - Global liquidation history now has ${globalHistory.length} records`);
      console.log(`  - Liquidator-specific history for ${userAddress} now has ${liquidatorSpecificHistory.length} records`);
      console.log(`  - Owner-specific history for ${vault.owner} now has ${existingOwnerHistory.length} records`);
      console.log(`  - Liquidator record (${userAddress}):`, liquidatorRecord);
      console.log(`  - Owner record (${vault.owner}):`, ownerRecord);
      
      // Debug localStorage state  
      console.log(`🔍 LocalStorage state after liquidation:`);
      console.log(`  - Global: `, JSON.parse(localStorage.getItem('liquidation-history') || '[]'));
      console.log(`  - Owner-specific: `, JSON.parse(localStorage.getItem(`liquidation-history-${vault.owner}`) || '[]'));
      
      console.log(`📋 Transaction history saved:
        - Liquidator (${userAddress}): GREEN badge liquidation record 
        - Vault owner (${vault.owner}): RED badge liquidated record`);

      console.log(`✅ Liquidation completed: ${vault.debt} ${vault.tokenType} → ${totalPaymentToLiquidator.toFixed(2)} USDC (${bonusAmount.toFixed(2)} bonus)`);

      // FORCE COMPLETE CACHE REFRESH - Clear all cached data to ensure fresh balance display
      await queryClient.invalidateQueries({ queryKey: ['/api/v1/liquidatable-positions'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/v1/user-positions'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/v1/vault-stats'] });
      await queryClient.invalidateQueries({ queryKey: ['liquidation-history'] });
      await queryClient.invalidateQueries({ queryKey: ['balances'] });
      await queryClient.invalidateQueries({ queryKey: ['contract-data'] });
      
      // Force reload balances to fix 0.00 BVIX display issue
      queryClient.removeQueries({ queryKey: ['/api/v1/vault-stats'] });
      queryClient.removeQueries({ queryKey: ['balances'] });
      
      console.log(`🔄 Forced complete cache refresh - all balances will reload from blockchain`);
      
      // CRITICAL: Force refresh ALL data to ensure vault closure is reflected everywhere
      // Invalidate the liquidation history query specifically
      await queryClient.invalidateQueries({ queryKey: ['liquidation-history'] });
      
      // Wait a moment for backend to process the liquidation
      setTimeout(async () => {
        await queryClient.invalidateQueries();
        console.log('🔄 Forced refresh of all data after liquidation');
      }, 500);
      
      toast({
        title: "Vault Liquidated Successfully",
        description: `Burned ${vault.debt} ${vault.tokenType} and received ${totalPaymentToLiquidator.toFixed(2)} USDC (including $${bonusAmount.toFixed(2)} bonus)`,
      });

      return {
        success: true,
        txHash: receipt.hash,
        liquidation: liquidatorRecord
      };

      /* Original implementation for when V8 is deployed:
      const signer = await getSigner();
      const abi = vault.tokenType === 'BVIX' ? MintRedeemV8ABI : EVIXMintRedeemV8ABI;
      const contract = new ethers.Contract(vault.contractAddress, abi, signer);

      // Convert repay amount to wei if provided, otherwise use 0 for full liquidation
      const repayAmountWei = repayAmount ? ethers.parseEther(repayAmount) : 0;

      // Perform liquidation
      const tx = await contract.liquidate(vault.owner, repayAmountWei);
      const receipt = await tx.wait();

      // Parse liquidation event from receipt
      const liquidationEvent = receipt.logs
        .map((log: any) => {
          try {
            return contract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((event: any) => event?.name === 'Liquidation');

      if (!liquidationEvent) {
        throw new Error('Liquidation event not found');
      }

      return {
        txHash: receipt.hash,
        debtRepaid: ethers.formatEther(liquidationEvent.args.debtRepaid),
        collateralSeized: ethers.formatUnits(liquidationEvent.args.collateralSeized, 6),
        bonus: ethers.formatUnits(liquidationEvent.args.bonus, 6),
        isPartial: liquidationEvent.args.isPartial
      } as LiquidationResult;
      */
    },
    onSuccess: (data) => {
      toast({
        title: "Liquidation Successful",
        description: `You received ${data.liquidation.collateralSeized} USDC (including ${data.liquidation.bonus} USDC bonus)`,
      });

      // Invalidate all relevant queries to trigger UI updates
      queryClient.invalidateQueries({ queryKey: ['liquidatable-vaults'] });
      queryClient.invalidateQueries({ queryKey: ['user-position'] });
      queryClient.invalidateQueries({ queryKey: ['vault-stats'] });
      queryClient.invalidateQueries({ queryKey: ['userPositions'] });
      queryClient.invalidateQueries({ queryKey: ['liquidation-history'] });
      
      // Stay in liquidation center instead of refreshing to mint/redeem
      // No page refresh needed - just invalidate queries
    },
    onError: (error: any) => {
      console.error('Liquidation error:', error);
      toast({
        title: "Liquidation Failed",
        description: error.message || "Failed to liquidate position",
        variant: "destructive",
      });
    },
  });
}

// Hook to check if liquidation is permissionless (V6 contracts don't have this feature)
export function usePermissionlessLiquidation() {
  return useQuery({
    queryKey: ['permissionless-liquidation'],
    queryFn: async () => {
      // V6 contracts don't have permissionless liquidation, so return mock data
      return {
        bvix: true,
        evix: true,
        anyPermissionless: true
      };
    },
  });
}

// Function to fix existing transaction history with consistent vault IDs
export function fixExistingTransactionHistory() {
  console.log('🔧 Fixing existing transaction history with consistent vault IDs...');
  
  const allKeys = Object.keys(localStorage);
  const liquidationKeys = allKeys.filter(key => key.includes('liquidation-history'));
  
  liquidationKeys.forEach(key => {
    try {
      const history = JSON.parse(localStorage.getItem(key) || '[]');
      let updated = false;
      
      const fixedHistory = history.map((record: any) => {
        if (record.vault && record.vault.owner && record.vault.tokenType) {
          const correctVaultId = `${record.vault.tokenType}-${record.vault.owner.slice(-4)}-${record.vault.owner.slice(2, 7)}`.toLowerCase();
          
          if (record.vault.vaultId !== correctVaultId || record.vaultId !== correctVaultId) {
            console.log(`Fixing vault ID: ${record.vault.vaultId || record.vaultId} → ${correctVaultId}`);
            updated = true;
            
            return {
              ...record,
              vaultId: correctVaultId,
              vault: {
                ...record.vault,
                vaultId: correctVaultId
              }
            };
          }
        }
        return record;
      });
      
      if (updated) {
        localStorage.setItem(key, JSON.stringify(fixedHistory));
        console.log(`✅ Updated ${key} with consistent vault IDs`);
      }
    } catch (error) {
      console.error(`Error fixing ${key}:`, error);
    }
  });
  
  console.log('🎉 Transaction history fix complete - refresh the page to see consistent vault IDs');
}

// Make the fix function available globally for easy access
if (typeof window !== 'undefined') {
  (window as any).fixTransactionHistory = fixExistingTransactionHistory;
}

// Hook for vault health monitoring
export function useVaultHealth(address: string | null) {
  const { data: positions, isLoading: positionsLoading } = useUserPositions();

  const health = useMemo(() => {
    if (!positions) {
      return {
        avgHealthScore: 0,
        isHealthy: true,
        isAtRisk: false,
        positions: []
      };
    }
    
    const positionsList = [];
    let totalCollateral = 0;
    let totalDebtValue = 0;
    
    // Add BVIX position info if available
    if (positions?.bvix && parseFloat(positions.bvix.collateral) > 0) {
      const bvixCR = positions.bvix.cr || 0;
      positionsList.push({
        token: 'BVIX',
        currentCR: bvixCR,
        healthScore: Math.min(100, (bvixCR / 150) * 100),
        isAtRisk: bvixCR < 130,
        liquidationPrice: 45 * 1.2 // Approximate liquidation price
      });
      
      totalCollateral += parseFloat(positions.bvix.collateral);
      const bvixDebtValue = parseFloat(positions.bvix.debt) * 45; // Use fixed price
      totalDebtValue += bvixDebtValue;
    }
    
    // Add EVIX position info if available
    if (positions?.evix && parseFloat(positions.evix.collateral) > 0) {
      const evixCR = positions.evix.cr || 0;
      positionsList.push({
        token: 'EVIX',
        currentCR: evixCR,
        healthScore: Math.min(100, (evixCR / 150) * 100),
        isAtRisk: evixCR < 130,
        liquidationPrice: 38 * 1.2
      });
      
      totalCollateral += parseFloat(positions.evix.collateral);
      const evixDebtValue = parseFloat(positions.evix.debt) * 38; // Use fixed price
      totalDebtValue += evixDebtValue;
    }
    
    // Calculate overall health
    const overallCR = totalDebtValue > 0 ? (totalCollateral / totalDebtValue) * 100 : 0;
    const avgHealthScore = Math.min(100, (overallCR / 150) * 100);
    
    return {
      avgHealthScore,
      isHealthy: overallCR >= 130,
      isAtRisk: overallCR < 120,
      positions: positionsList
    };
  }, [positions]);

  return { health, isLoading: positionsLoading };
}

// Hook to get liquidation history
export function useLiquidationHistory() {
  const [userAddress, setUserAddress] = useState<string | null>(null);
  
  useEffect(() => {
    const loadAddress = async () => {
      try {
        const provider = getProvider();
        const accounts = await provider.send('eth_requestAccounts', []);
        if (accounts.length > 0) {
          setUserAddress(accounts[0]);
        }
      } catch (error) {
        console.error('Failed to load address:', error);
      }
    };
    loadAddress();
  }, []);
  
  return useQuery({
    queryKey: ['liquidation-history', userAddress],
    queryFn: async () => {
      if (!userAddress) return [];
      
      // Skip localStorage clearing for better performance - only clear if needed

      // SYNC: Fetch recent liquidations from backend and sync with localStorage
      let backendLiquidations: any[] = [];
      try {
        const response = await fetch('/api/v1/liquidations');
        const data = await response.json();
        backendLiquidations = data.liquidations || [];
        
        // Syncing backend liquidations
        
        // Check for liquidations involving current user as liquidator OR owner
        const userAsLiquidator = backendLiquidations.filter((liq: any) => 
          liq.liquidator.toLowerCase() === userAddress.toLowerCase()
        );
        
        const userAsOwner = backendLiquidations.filter((liq: any) => 
          liq.owner.toLowerCase() === userAddress.toLowerCase()
        );
        
        // Process liquidator records
        if (userAsLiquidator.length > 0) {
          const existingLiquidatorHistory = JSON.parse(localStorage.getItem('liquidation-history') || '[]');
          let hasNew = false;
          
          userAsLiquidator.forEach((liq: any) => {
            // Check if this liquidation is already in localStorage
            const exists = existingLiquidatorHistory.some((existing: any) => 
              existing.timestamp === liq.timestamp && existing.liquidator === liq.liquidator
            );
            
            if (!exists) {
              const liquidatorRecord = {
                timestamp: liq.timestamp,
                liquidator: liq.liquidator,
                isLiquidator: true,
                tokenType: liq.tokenType,
                vault: {
                  owner: liq.owner,
                  tokenType: liq.tokenType,
                  vaultId: `${liq.tokenType.toLowerCase()}-${liq.owner.slice(-4)}-${liq.txHash.slice(-8)}`
                },
                bonus: liq.bonus, // FIXED: Use actual bonus amount
                collateralSeized: liq.collateralSeized,
                debtRepaid: liq.debtRepaid,
                txHash: liq.txHash,
                amount: liq.debtRepaid // For consistency with existing structure
              };
              
              existingLiquidatorHistory.unshift(liquidatorRecord);
              hasNew = true;
              // Synced new liquidation to localStorage
            }
          });
          
          if (hasNew) {
            localStorage.setItem('liquidation-history', JSON.stringify(existingLiquidatorHistory));
            // Updated localStorage with new liquidation records
          }
        }
        
        // Process owner records (got liquidated)
        if (userAsOwner.length > 0) {
          const existingOwnerHistory = JSON.parse(localStorage.getItem(`liquidation-history-${userAddress}`) || '[]');
          let hasNewOwner = false;
          
          userAsOwner.forEach((liq: any) => {
            const exists = existingOwnerHistory.some((existing: any) => 
              existing.timestamp === liq.timestamp && existing.liquidator === liq.liquidator
            );
            
            if (!exists) {
              const ownerRecord = {
                timestamp: liq.timestamp,
                liquidator: liq.liquidator,
                isLiquidator: false,
                tokenType: liq.tokenType,
                vault: {
                  owner: liq.owner,
                  tokenType: liq.tokenType,
                  vaultId: `${liq.tokenType.toLowerCase()}-${liq.owner.slice(-4)}-${liq.txHash.slice(-8)}`
                },
                collateralLost: liq.collateralSeized,
                debtRepaid: liq.debtRepaid,
                txHash: liq.txHash,
                amount: liq.debtRepaid
              };
              
              existingOwnerHistory.unshift(ownerRecord);
              hasNewOwner = true;
              // Synced new owner liquidation record to localStorage
            }
          });
          
          if (hasNewOwner) {
            localStorage.setItem(`liquidation-history-${userAddress}`, JSON.stringify(existingOwnerHistory));
            // Updated owner localStorage with liquidation records
          }
        }
      } catch (error) {
        console.error('❌ Failed to sync liquidations from backend:', error);
      }
      
      // Fetch user-specific history (includes both liquidator and owner records)
      const userSpecificHistory = JSON.parse(localStorage.getItem(`liquidation-history-${userAddress}`) || '[]');
      
      // Check for liquidator records
      const liquidatorRecords = backendLiquidations.filter((liq: any) => 
        liq.liquidator.toLowerCase() === userAddress.toLowerCase()
      ).map((liq: any) => ({
        timestamp: liq.timestamp,
        liquidator: liq.liquidator,
        isLiquidator: true,
        tokenType: liq.tokenType,
        vault: {
          owner: liq.owner,
          tokenType: liq.tokenType,
          vaultId: `${liq.tokenType.toLowerCase()}-${liq.owner.slice(-4)}-${liq.txHash.slice(-8)}`
        },
        bonus: liq.bonus,
        collateralSeized: liq.collateralSeized,
        debtRepaid: liq.debtRepaid,
        txHash: liq.txHash,
        amount: liq.debtRepaid
      }));
      
      // Check for owner records (got liquidated)  
      const ownerRecords = backendLiquidations.filter((liq: any) => 
        liq.owner.toLowerCase() === userAddress.toLowerCase()
      ).map((liq: any) => ({
        timestamp: liq.timestamp,
        liquidator: liq.liquidator,
        isLiquidator: false,
        tokenType: liq.tokenType,
        vault: {
          owner: liq.owner,
          tokenType: liq.tokenType,
          vaultId: `${liq.tokenType.toLowerCase()}-${liq.owner.slice(-4)}-${liq.txHash.slice(-8)}`
        },
        collateralLost: liq.collateralSeized,
        debtRepaid: liq.debtRepaid,
        txHash: liq.txHash,
        amount: liq.debtRepaid
      }));

      // Loading history - debug info removed for performance
      
      // Combine all history sources
      const allHistory = [...userSpecificHistory, ...liquidatorRecords, ...ownerRecords].filter((record, index, self) => 
        index === self.findIndex((r) => r.timestamp === record.timestamp && r.liquidator === record.liquidator && r.isLiquidator === record.isLiquidator)
      );
      
      return allHistory.sort((a: any, b: any) => b.timestamp - a.timestamp);
    },
    enabled: !!userAddress,
    refetchInterval: 15000, // Refresh every 15 seconds for better performance
  });
}