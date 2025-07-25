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
      const provider = getProvider();
      const vaults: LiquidatableVault[] = [];
      
      // Check BVIX vaults
      const bvixContract = new ethers.Contract(MINT_REDEEM_V8_ADDRESS, MintRedeemV8ABI, provider);
      const bvixVaultIds = await bvixContract.getVaultsBelowThreshold();
      
      for (const vaultId of bvixVaultIds) {
        const details = await bvixContract.getLiquidationDetails(vaultId);
        if (details.canLiquidate) {
          vaults.push({
            vaultId: Number(vaultId),
            owner: details.owner,
            collateral: ethers.formatUnits(details.collateral, 6),
            debt: ethers.formatEther(details.debt),
            currentCR: Number(details.currentCR),
            liquidationPrice: ethers.formatUnits(details.liquidationPrice, 8),
            maxBonus: ethers.formatUnits(details.maxBonus, 6),
            canLiquidate: details.canLiquidate,
            tokenType: 'BVIX',
            contractAddress: MINT_REDEEM_V8_ADDRESS
          });
        }
      }
      
      // Check EVIX vaults
      const evixContract = new ethers.Contract(EVIX_MINT_REDEEM_V8_ADDRESS, EVIXMintRedeemV8ABI, provider);
      const evixVaultIds = await evixContract.getVaultsBelowThreshold();
      
      for (const vaultId of evixVaultIds) {
        const details = await evixContract.getLiquidationDetails(vaultId);
        if (details.canLiquidate) {
          vaults.push({
            vaultId: Number(vaultId),
            owner: details.owner,
            collateral: ethers.formatUnits(details.collateral, 6),
            debt: ethers.formatEther(details.debt),
            currentCR: Number(details.currentCR),
            liquidationPrice: ethers.formatUnits(details.liquidationPrice, 6),
            maxBonus: ethers.formatUnits(details.maxBonus, 6),
            canLiquidate: details.canLiquidate,
            tokenType: 'EVIX',
            contractAddress: EVIX_MINT_REDEEM_V8_ADDRESS
          });
        }
      }
      
      // Sort by bonus amount (descending)
      return vaults.sort((a, b) => parseFloat(b.maxBonus) - parseFloat(a.maxBonus));
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
export function useVaultHealth(userAddress: string | null) {
  const bvixData = useLiquidationPrice(userAddress, 'BVIX');
  const evixData = useLiquidationPrice(userAddress, 'EVIX');
  
  const overallHealth = useCallback(() => {
    const positions = [];
    
    if (bvixData.data) {
      positions.push({
        token: 'BVIX',
        ...bvixData.data,
        healthScore: Math.max(0, Math.min(100, ((bvixData.data.currentCR - 100) / 100) * 100))
      });
    }
    
    if (evixData.data) {
      positions.push({
        token: 'EVIX',
        ...evixData.data,
        healthScore: Math.max(0, Math.min(100, ((evixData.data.currentCR - 100) / 100) * 100))
      });
    }
    
    const minCR = Math.min(...positions.map(p => p.currentCR).filter(cr => cr > 0));
    const avgHealthScore = positions.length > 0 
      ? positions.reduce((sum, p) => sum + p.healthScore, 0) / positions.length 
      : 100;
    
    return {
      positions,
      minCR,
      avgHealthScore,
      isHealthy: minCR >= 150,
      isAtRisk: minCR < 125 && minCR >= 120,
      canBeLiquidated: minCR < 120
    };
  }, [bvixData.data, evixData.data]);
  
  return {
    health: overallHealth(),
    isLoading: bvixData.isLoading || evixData.isLoading,
    refetch: () => {
      bvixData.refetch();
      evixData.refetch();
    }
  };
}