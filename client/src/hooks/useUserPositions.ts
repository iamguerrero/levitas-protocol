import { useQuery } from '@tanstack/react-query';
import { useWallet } from './use-wallet';
import { getProvider } from '@/lib/web3';
import { Contract } from 'ethers';
import mintRedeemV6ABI from '@/contracts/MintRedeemV6.abi.json';
import evixMintRedeemV6ABI from '@/contracts/EVIXMintRedeemV6.abi.json';
import { useState, useEffect } from 'react';

const BVIX_VAULT_ADDRESS = "0x4d0ddFBCBa76f2e72B0Fef2fdDcaE9ddd6922397";
const EVIX_VAULT_ADDRESS = "0xb187c5Ff48D69BB0b477dAf30Eec779E0D07771D";

export interface UserPosition {
  collateral: string;
  debt: string;
  cr: number;
}

export interface UserPositions {
  bvix: UserPosition;
  evix: UserPosition;
}

async function getUserPosition(
  vaultAddress: string,
  userAddress: string,
  abi: any
): Promise<UserPosition> {
  try {
    const provider = getProvider();
    const contract = new Contract(vaultAddress, abi, provider);

    const position = await contract.positions(userAddress);
    const collateral = position.collateral.toString();
    const debt = position.debt.toString();

    let cr = 0;
    try {
      // Only get CR if there's actual debt to avoid divide-by-zero
      if (position.debt && position.debt > BigInt(0)) {
        const crRatio = await contract.getUserCollateralRatio(userAddress);
        cr = Number(crRatio);
      }
    } catch (error) {
      console.log("Error getting CR, position might be empty");
    }

    return {
      collateral: (Number(collateral) / 1e6).toFixed(2), // USDC has 6 decimals
      debt: (Number(debt) / 1e18).toFixed(2), // Tokens have 18 decimals
      cr
    };
  } catch (error) {
    console.error("Error fetching user position:", error);
    return {
      collateral: "0",
      debt: "0",
      cr: 0
    };
  }
}

export function useUserPositions() {
  const { address, isConnected } = useWallet();

  // No refresh trigger needed - we only use real blockchain data

  const { data: positions, isLoading } = useQuery({
    queryKey: ['userPositions', address],
    queryFn: async () => {
      if (!address) return null;

      // Get positions and prices in parallel for better performance
      const provider = getProvider();
      const bvixContract = new Contract(BVIX_VAULT_ADDRESS, mintRedeemV6ABI, provider);
      const evixContract = new Contract(EVIX_VAULT_ADDRESS, evixMintRedeemV6ABI, provider);

      // Don't check for liquidated vaults - only use real blockchain data
      const isBVIXLiquidated = false;
      const isEVIXLiquidated = false;
      
      // DEBUG: Let's see what the raw blockchain data shows
      console.log('🔧 Raw blockchain fetch about to start for contracts:', {
        bvixContract: BVIX_VAULT_ADDRESS,
        evixContract: EVIX_VAULT_ADDRESS,
        userAddress: address
      });

      const [rawBvixPosition, rawEvixPosition, bvixPrice, evixPrice] = await Promise.all([
        getUserPosition(BVIX_VAULT_ADDRESS, address, mintRedeemV6ABI),
        getUserPosition(EVIX_VAULT_ADDRESS, address, evixMintRedeemV6ABI),
        bvixContract.getPrice().catch(() => BigInt(0)),
        evixContract.getPrice().catch(() => BigInt(0))
      ]);
      
      console.log('🔧 RAW BLOCKCHAIN DATA:', {
        rawBvixPosition,
        rawEvixPosition,
        bvixPrice: bvixPrice.toString(),
        evixPrice: evixPrice.toString()
      });

      // Always use raw blockchain positions - no overrides
      const bvixPosition = rawBvixPosition;
      const evixPosition = rawEvixPosition;
      
      console.log('🔍 Vault-specific liquidation check:', { 
        isBVIXLiquidated, 
        isEVIXLiquidated, 
        rawBvixPosition, 
        rawEvixPosition, 
        finalBvixPosition: bvixPosition,
        finalEvixPosition: evixPosition 
      });

      // Calculate collateral ratios
      let bvixCR = 0;
      let evixCR = 0;

      try {
        // For BVIX: CR = (collateral) / (debt * price) * 100 - only if not liquidated
        if (!isBVIXLiquidated && Number(bvixPosition.debt) > 0 && bvixPrice > BigInt(0)) {
          const bvixPriceFormatted = Number(bvixPrice) / 1e8;
          const debtValueInUSDC = Number(bvixPosition.debt) * bvixPriceFormatted;
          bvixCR = Math.floor((Number(bvixPosition.collateral) / debtValueInUSDC) * 100);
          console.log('🔍 BVIX CR calculation:', {
            collateral: bvixPosition.collateral,
            debt: bvixPosition.debt,
            price: bvixPriceFormatted,
            debtValueInUSDC,
            calculatedCR: bvixCR
          });
        }

        // For EVIX: CR = (collateral) / (debt * price) * 100 - only if not liquidated
        if (!isEVIXLiquidated && Number(evixPosition.debt) > 0 && evixPrice > BigInt(0)) {
          const evixPriceFormatted = Number(evixPrice) / 1e8;
          const debtValueInUSDC = Number(evixPosition.debt) * evixPriceFormatted;
          evixCR = Math.floor((Number(evixPosition.collateral) / debtValueInUSDC) * 100);
        }

      } catch (error) {
        console.log('🔍 CR calculation failed:', error);
      }

      const result = {
        bvix: {...bvixPosition, cr: bvixCR},
        evix: {...evixPosition, cr: evixCR}
      };
      
      console.log('🔍 Final positions result:', result);
      return result;
    },
    enabled: isConnected && !!address,
    refetchInterval: 10000, // Refresh every 10 seconds
    staleTime: 5000 // Consider data stale after 5 seconds for faster updates
  });

  return {
    data: positions,
    isLoading
  };
}