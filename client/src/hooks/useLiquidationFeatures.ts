import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { getProvider, getSigner } from '@/lib/web3';
import { MINT_REDEEM_V8_ADDRESS, EVIX_MINT_REDEEM_V8_ADDRESS } from '@/lib/constants';
import MintRedeemV8ABI from '@/contracts/MintRedeemV8.abi.json';
import EVIXMintRedeemV8ABI from '@/contracts/EVIXMintRedeemV8.abi.json';

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
      const mockVaults: LiquidatableVault[] = [
        {
          vaultId: 1,
          owner: '0x742d35Cc6634C0532925a3b844Bc9e7095931a48',
          collateral: '1000',
          debt: '900',
          currentCR: 111,
          liquidationPrice: '50.00',
          maxBonus: '45.00',
          canLiquidate: true,
          tokenType: 'BVIX',
          contractAddress: MINT_REDEEM_V8_ADDRESS
        },
        {
          vaultId: 2,
          owner: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
          collateral: '2000',
          debt: '1700',
          currentCR: 118,
          liquidationPrice: '48.00',
          maxBonus: '85.00',
          canLiquidate: true,
          tokenType: 'BVIX',
          contractAddress: MINT_REDEEM_V8_ADDRESS
        }
      ];

      // Filter out liquidated vaults from history
      const history = JSON.parse(localStorage.getItem('liquidationHistory') || '[]');
      const liquidatedIds = history.map((h: any) => `${h.vault.tokenType}-${h.vault.vaultId}`);

      return mockVaults.filter(v => !liquidatedIds.includes(`${v.tokenType}-${v.vaultId}`));
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
  const { toast } = useToast();

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

      const mockBonus = parseFloat(vault.collateral) * 0.05; // 5% bonus
      const mockResult: LiquidationResult = {
        txHash: '0x' + Math.random().toString(16).substr(2, 64),
        debtRepaid: vault.debt,
        collateralSeized: vault.collateral,
        bonus: mockBonus.toFixed(2),
        isPartial: false
      };

      // Store liquidation in local storage for history
      const history = JSON.parse(localStorage.getItem('liquidationHistory') || '[]');
      history.push({
        ...mockResult,
        vault,
        timestamp: Date.now()
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

  const health = useMemo(() => {
    if (!positions) {
      return {
        avgHealthScore: 0,
        isHealthy: true,
        isAtRisk: false,
        positions: []
      };
    }

    // Use the same calculation as Vault Summary - combined vault CR
    let totalCollateral = 0;
    let totalDebtValue = 0;

    const positionsList = [];

    // Add BVIX position if it exists
    if (parseFloat(positions.bvix.collateral) > 0) {
      const bvixDebt = parseFloat(positions.bvix.debt);
      const bvixCollateral = parseFloat(positions.bvix.collateral);
      totalCollateral += bvixCollateral;

      // Use a reasonable price estimate for debt value calculation
      // This should ideally come from the same source as trading interface
      const bvixPrice = 42; // Use approximate current price
      totalDebtValue += bvixDebt * bvixPrice;

      positionsList.push({
        token: 'BVIX',
        currentCR: positions.bvix.cr,
        healthScore: Math.min(100, (positions.bvix.cr / 150) * 100),
        isAtRisk: positions.bvix.cr < 130,
        liquidationPrice: bvixPrice * 1.2
      });
    }

    // Add EVIX position if it exists  
    if (parseFloat(positions.evix.collateral) > 0) {
      const evixDebt = parseFloat(positions.evix.debt);
      const evixCollateral = parseFloat(positions.evix.collateral);
      totalCollateral += evixCollateral;

      const evixPrice = 38; // Use approximate current price
      totalDebtValue += evixDebt * evixPrice;

      positionsList.push({
        token: 'EVIX',
        currentCR: positions.evix.cr,
        healthScore: Math.min(100, (positions.evix.cr / 150) * 100),
        isAtRisk: positions.evix.cr < 130,
        liquidationPrice: evixPrice * 1.2
      });
    }

    // Calculate combined vault CR (same as Vault Summary)
    const vaultCR = totalDebtValue > 0 ? (totalCollateral / totalDebtValue) * 100 : 0;
    const avgHealthScore = Math.min(100, (vaultCR / 150) * 100);

    return {
      avgHealthScore,
      isHealthy: avgHealthScore >= 75,
      isAtRisk: avgHealthScore < 65,
      positions: positionsList
    };
  }, [positions]);

  return { health, isLoading: !positions };
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