import { useState, useEffect, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { getProvider, getSigner } from '@/lib/web3';
import { MINT_REDEEM_V8_ADDRESS, EVIX_MINT_REDEEM_V8_ADDRESS } from '@/lib/constants';
import MintRedeemV8ABI from '@/contracts/MintRedeemV8.abi.json';
import EVIXMintRedeemV8ABI from '@/contracts/EVIXMintRedeemV8.abi.json';
import { useUserPositions } from '@/hooks/useUserPositions';
import { useVault } from '@/hooks/useVault';

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
      // For now, return mock data since V8 contracts are not deployed
      // This will be replaced with actual contract calls when V8 is deployed
      // Calculate proper liquidation amounts
      const evixPrice = 38.02; // Current EVIX price
      const debt = 218.76;
      const debtValue = debt * evixPrice; // Value of debt in USDC
      const bonusAmount = debtValue * 0.05; // 5% bonus on debt value
      
      const mockVaults: LiquidatableVault[] = [
        {
          vaultId: 1,
          owner: '0x18633ea30ad5c91e13d2e5714fe5e3d97043679b',
          collateral: '9970',
          debt: debt.toFixed(2),
          currentCR: 119,
          liquidationPrice: '38.14', // Liquidation threshold price
          maxBonus: bonusAmount.toFixed(2), // 5% bonus on debt value
          canLiquidate: true,
          tokenType: 'EVIX',
          contractAddress: EVIX_MINT_REDEEM_V8_ADDRESS
        }
      ];

      // For testing purposes, always show the liquidatable vault
      // In production, this would check actual blockchain state
      return mockVaults;
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

  return useMutation({
    mutationFn: async ({ 
      vault, 
      repayAmount 
    }: { 
      vault: LiquidatableVault; 
      repayAmount?: string; // Optional for partial liquidation
    }) => {
      // Mock implementation for testing
      // Check if user has sufficient token balance to repay debt
      const provider = getProvider();
      const accounts = await provider.send('eth_requestAccounts', []);
      if (accounts.length === 0) throw new Error('No wallet connected');

      // Liquidators need BVIX/EVIX tokens to repay the debt, not USDC
      const requiredTokens = parseFloat(vault.debt);

      // Simulate a successful liquidation
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

      // Calculate proper liquidation amounts based on DeFi mechanics
      const tokenPrice = vault.tokenType === 'EVIX' ? 38.02 : 42.19; // Current prices
      const debtValue = parseFloat(vault.debt) * tokenPrice; // Value of debt in USDC
      const bonusAmount = debtValue * 0.05; // 5% bonus on debt value
      const totalCollateralSeized = debtValue + bonusAmount; // Total USDC liquidator receives
      
      const mockResult: LiquidationResult = {
        txHash: '0x' + Math.random().toString(16).substr(2, 64),
        debtRepaid: vault.debt,
        collateralSeized: totalCollateralSeized.toFixed(2),
        bonus: bonusAmount.toFixed(2),
        isPartial: false
      };

      // Store liquidation in local storage for history
      const history = JSON.parse(localStorage.getItem('liquidationHistory') || '[]');
      history.push({
        ...mockResult,
        vault: {
          ...vault,
          vaultId: vault.vaultId || `#${Math.floor(Math.random() * 1000)}` // Ensure vault ID exists
        },
        timestamp: Date.now(),
        type: 'liquidation'
      });
      localStorage.setItem('liquidationHistory', JSON.stringify(history));

      return mockResult;

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
        description: `You received ${data.collateralSeized} USDC (including ${data.bonus} USDC bonus)`,
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['liquidatable-vaults'] });
      queryClient.invalidateQueries({ queryKey: ['user-position'] });
      queryClient.invalidateQueries({ queryKey: ['vault-stats'] });
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

// Hook to check if liquidation is permissionless
export function usePermissionlessLiquidation() {
  return useQuery({
    queryKey: ['permissionless-liquidation'],
    queryFn: async () => {
      const provider = getProvider();
      const bvixContract = new ethers.Contract(MINT_REDEEM_V8_ADDRESS, MintRedeemV8ABI, provider);
      const evixContract = new ethers.Contract(EVIX_MINT_REDEEM_V8_ADDRESS, EVIXMintRedeemV8ABI, provider);

      const [bvixPermissionless, evixPermissionless] = await Promise.all([
        bvixContract.permissionlessLiquidation(),
        evixContract.permissionlessLiquidation()
      ]);

      return {
        bvix: bvixPermissionless,
        evix: evixPermissionless,
        anyPermissionless: bvixPermissionless || evixPermissionless
      };
    },
  });
}

// Hook for vault health monitoring
export function useVaultHealth(address: string | null) {
  const { positions } = useUserPositions();
  const { vaultStats } = useVault();

  const health = useMemo(() => {
    // Use vault stats API for accurate CR calculation
    if (vaultStats?.cr) {
      const vaultCR = parseFloat(vaultStats.cr);
      const avgHealthScore = Math.min(100, (vaultCR / 150) * 100);
      
      const positionsList = [];
      
      // Add individual position info if available
      if (positions?.bvix && parseFloat(positions.bvix.collateral) > 0) {
        positionsList.push({
          token: 'BVIX',
          currentCR: positions.bvix.cr || vaultCR, // Fallback to vault CR if individual CR is 0
          healthScore: Math.min(100, (vaultCR / 150) * 100),
          isAtRisk: vaultCR < 130,
          liquidationPrice: 45 * 1.2 // Approximate liquidation price
        });
      }
      
      if (positions?.evix && parseFloat(positions.evix.collateral) > 0) {
        positionsList.push({
          token: 'EVIX',
          currentCR: positions.evix.cr,
          healthScore: Math.min(100, (positions.evix.cr / 150) * 100),
          isAtRisk: positions.evix.cr < 130,
          liquidationPrice: 38 * 1.2
        });
      }
      
      return {
        avgHealthScore,
        isHealthy: vaultCR >= 130,
        isAtRisk: vaultCR < 120,
        positions: positionsList
      };
    }
    
    // Fallback if vault stats not available
    return {
      avgHealthScore: 0,
      isHealthy: true,
      isAtRisk: false,
      positions: []
    };
  }, [positions, vaultStats]);

  return { health, isLoading: !vaultStats };
}

// Hook to get liquidation history
export function useLiquidationHistory() {
  return useQuery({
    queryKey: ['liquidation-history'],
    queryFn: async () => {
      const history = JSON.parse(localStorage.getItem('liquidationHistory') || '[]');
      return history.sort((a: any, b: any) => b.timestamp - a.timestamp);
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });
}