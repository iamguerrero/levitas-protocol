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
const BVIX_VAULT_ADDRESS = "0x4c271CffdBf8DcdC21D4Cb80feEc425E00309175"; // BVIX V7 (FIXED)
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
          console.error('Failed to fetch liquidatable positions');
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
        
        console.log('Liquidatable vaults found:', liquidatable);
        return liquidatable;
      } catch (error) {
        console.error('Error fetching liquidatable vaults:', error);
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
    refetchInterval: 5000, // Refresh every 5 seconds for real-time updates
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
        ? new ethers.Contract('0x4c271CffdBf8DcdC21D4Cb80feEc425E00309175', mintRedeemV6ABI, provider) // V7 FIXED
        : new ethers.Contract(EVIX_VAULT_ADDRESS, evixMintRedeemV6ABI, provider);
        
      const signerVaultContract = vault.tokenType === 'BVIX'
        ? new ethers.Contract('0x4c271CffdBf8DcdC21D4Cb80feEc425E00309175', mintRedeemV6ABI, signer) // V7 FIXED
        : new ethers.Contract(EVIX_VAULT_ADDRESS, evixMintRedeemV6ABI, signer);
      
      const vaultPosition = await vaultContract.positions(vault.owner);
      const exactDebtWei = vaultPosition.debt; // Use exact debt amount from contract
      
      // Check user has enough tokens to liquidate using exact debt amount
      const tokenBalance = await tokenContract.balanceOf(userAddress);
      
      if (tokenBalance < exactDebtWei) {
        throw new Error(`Insufficient ${vault.tokenType} balance. Need ${ethers.formatEther(exactDebtWei)} but have ${ethers.formatEther(tokenBalance)}`);
      }

      // Get USDC contract for direct transfers  
      const usdcContract = new ethers.Contract(
        '0x9CC37B36FDd8CF5c0297BE15b75663Bf2a193297', // MockUSDC address
        ['function transfer(address to, uint256 amount) external returns (bool)'],
        signer
      );
      
      // For V6 simulation, liquidation works as follows:
      // 1. Liquidator burns their tokens (to simulate paying debt)
      // 2. Liquidator gets USDC worth debt value + 5% bonus
      // 3. Vault owner's position is marked as liquidated
      
      // Burn liquidator's tokens first using exact debt amount (this reduces their balance)
      const burnTx = vault.tokenType === 'BVIX'
        ? await signerVaultContract.redeem(exactDebtWei) // Redeem = burn tokens, get USDC
        : await signerVaultContract.redeem(exactDebtWei);
      
      const receipt = await burnTx.wait();
      
      // Calculate amounts using real oracle prices and exact debt amount
      const tokenPrice = vault.tokenType === 'EVIX' ? 38.02 : 45.0; // Current prices
      const exactDebtFormatted = ethers.formatEther(exactDebtWei);
      const debtValue = parseFloat(exactDebtFormatted) * tokenPrice;
      const bonusAmount = debtValue * 0.05;
      const totalCollateralSeized = debtValue + bonusAmount;
      
      // Mark this vault as liquidated in backend (so it disappears from opportunities)
      await fetch('/api/v1/liquidate-vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenType: vault.tokenType,
          owner: vault.owner,
          liquidator: userAddress,
          debtRepaid: exactDebtFormatted,
          collateralSeized: totalCollateralSeized.toFixed(2),
          bonus: bonusAmount.toFixed(2),
          txHash: receipt.hash
        })
      });

      // Create liquidation record for history
      const liquidationRecord = {
        id: Date.now().toString(),
        type: 'liquidation' as const,
        vaultId: vault.vaultId,
        tokenType: vault.tokenType,
        amount: vault.debt,
        liquidator: userAddress,
        liquidatedUser: vault.owner,
        collateralSeized: totalCollateralSeized.toFixed(2),
        bonus: bonusAmount.toFixed(2),
        txHash: receipt.hash,
        timestamp: Date.now(),
        status: 'confirmed' as const
      };

      // Store in localStorage for history tracking
      const existingHistory = JSON.parse(localStorage.getItem('liquidation-history') || '[]');
      existingHistory.unshift(liquidationRecord);
      localStorage.setItem('liquidation-history', JSON.stringify(existingHistory));

      console.log(`✅ Liquidation completed: ${vault.debt} ${vault.tokenType} → ${totalCollateralSeized.toFixed(2)} USDC (${bonusAmount.toFixed(2)} bonus)`);

      // Invalidate cache to refresh data
      await queryClient.invalidateQueries({ queryKey: ['/api/v1/liquidatable-positions'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/v1/user-positions'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/v1/vault-stats'] });
      await queryClient.invalidateQueries({ queryKey: ['liquidation-history'] });

      return {
        success: true,
        txHash: receipt.hash,
        liquidation: liquidationRecord
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
      
      // Force refresh the page to ensure all components update
      setTimeout(() => {
        window.location.reload();
      }, 1500);
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
  return useQuery({
    queryKey: ['liquidation-history'],
    queryFn: async () => {
      const history = JSON.parse(localStorage.getItem('liquidation-history') || '[]');
      return history.sort((a: any, b: any) => b.timestamp - a.timestamp);
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });
}