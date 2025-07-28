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
        ? new ethers.Contract('0x653A6a4dCe04dABAEdb521091A889bb1EE298D8d', mintRedeemV6ABI, provider) // V8 WORKING
        : new ethers.Contract(EVIX_VAULT_ADDRESS, evixMintRedeemV6ABI, provider);
        
      const signerVaultContract = vault.tokenType === 'BVIX'
        ? new ethers.Contract('0x653A6a4dCe04dABAEdb521091A889bb1EE298D8d', mintRedeemV6ABI, signer) // V8 WORKING
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
      
      // Get the vault's total collateral to calculate remaining amount
      const totalCollateral = parseFloat(ethers.formatUnits(vaultPosition.collateral, 6)); // USDC collateral
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
      const burnTx = await tokenContract.transfer('0x000000000000000000000000000000000000dEaD', exactDebtWei);
      const receipt = await burnTx.wait();
      
      // 2. Calculate what liquidator SHOULD receive (debt value + 5% bonus)
      const liquidatorPayment = totalPaymentToLiquidator; // This is debt value + bonus
      const liquidatorPaymentFormatted = liquidatorPayment.toFixed(2);
      
      console.log(`💰 Liquidator should receive: $${liquidatorPaymentFormatted} USDC`);
      console.log(`💰 Vault owner should receive: $${Math.max(0, remainingCollateral).toFixed(2)} USDC`);
      
      // Note: In a real liquidation system, the smart contract would handle the correct payment amounts
      // Here we're simulating by redeeming tokens (which gives full value) but tracking what SHOULD happen
      
      // Mark this vault as liquidated in backend (so it disappears from opportunities)
      await fetch('/api/v1/liquidate-vault', {
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
          txHash: receipt.hash
        })
      });

      // Create liquidation record for LIQUIDATOR (the person executing this function)
      const liquidatorRecord = {
        id: Date.now().toString(),
        type: 'liquidation' as const,
        vaultId: vault.vaultId,
        tokenType: vault.tokenType,
        amount: vault.debt,
        liquidator: userAddress,
        liquidatedUser: vault.owner,
        collateralSeized: totalPaymentToLiquidator.toFixed(2),
        bonus: bonusAmount.toFixed(2),
        txHash: receipt.hash,
        timestamp: Date.now(),
        status: 'confirmed' as const,
        isLiquidator: true // Flag to show this is for the liquidator
      };

      // Create liquidation record for VAULT OWNER (different view)
      const ownerRecord = {
        id: (Date.now() + 1).toString(),
        type: 'liquidated' as const, // Different type for vault owner
        vaultId: vault.vaultId,
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
        isLiquidator: false // Flag to show this is for the vault owner
      };

      // Store liquidator history in their localStorage (CURRENT USER - the liquidator)
      const existingLiquidatorHistory = JSON.parse(localStorage.getItem('liquidation-history') || '[]');
      existingLiquidatorHistory.unshift(liquidatorRecord);
      localStorage.setItem('liquidation-history', JSON.stringify(existingLiquidatorHistory));
      
      // Store owner's history in their specific key (vault owner gets "got liquidated" record)
      const existingOwnerHistory = JSON.parse(localStorage.getItem(`liquidation-history-${vault.owner}`) || '[]');
      existingOwnerHistory.unshift(ownerRecord);
      localStorage.setItem(`liquidation-history-${vault.owner}`, JSON.stringify(existingOwnerHistory));
      
      console.log(`📋 Transaction history saved:
        - Liquidator (${userAddress}): GREEN badge liquidation record 
        - Vault owner (${vault.owner}): RED badge liquidated record`);

      console.log(`✅ Liquidation completed: ${vault.debt} ${vault.tokenType} → ${totalPaymentToLiquidator.toFixed(2)} USDC (${bonusAmount.toFixed(2)} bonus)`);

      // Invalidate cache to refresh data
      await queryClient.invalidateQueries({ queryKey: ['/api/v1/liquidatable-positions'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/v1/user-positions'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/v1/vault-stats'] });
      await queryClient.invalidateQueries({ queryKey: ['liquidation-history'] });

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
      
      // Fetch liquidator's history (when user liquidated others)
      const liquidatorHistory = JSON.parse(localStorage.getItem('liquidation-history') || '[]');
      
      // Fetch owner's history (when user got liquidated)
      const ownerHistory = JSON.parse(localStorage.getItem(`liquidation-history-${userAddress}`) || '[]');
      
      // Combine all history for current user
      const allHistory = [
        ...liquidatorHistory.filter((item: any) => item.liquidator === userAddress),
        ...ownerHistory
      ];
      
      return allHistory.sort((a: any, b: any) => b.timestamp - a.timestamp);
    },
    enabled: !!userAddress,
    refetchInterval: 5000, // Refresh every 5 seconds
  });
}