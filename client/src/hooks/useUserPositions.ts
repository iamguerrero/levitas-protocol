import { useQuery } from '@tanstack/react-query';
import { useWallet } from './use-wallet';
import { getProvider } from '@/lib/web3';
import { Contract } from 'ethers';
import mintRedeemV6ABI from '@/contracts/MintRedeemV6.abi.json';
import evixMintRedeemV6ABI from '@/contracts/EVIXMintRedeemV6.abi.json';

const BVIX_VAULT_ADDRESS = "0x65Bec0Ab96ab751Fd0b1D9c907342d9A61FB1117";
const EVIX_VAULT_ADDRESS = "0x6C3e986c4cc7b3400de732440fa01B66FF9172Cf";

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
      if (position.debt && position.debt > 0n) {
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

  const { data: positions, isLoading } = useQuery({
    queryKey: ['userPositions', address],
    queryFn: async () => {
      if (!address) return null;

      // Get positions and prices in parallel for better performance
      const provider = getProvider();
      const bvixContract = new Contract(BVIX_VAULT_ADDRESS, mintRedeemV6ABI, provider);
      const evixContract = new Contract(EVIX_VAULT_ADDRESS, evixMintRedeemV6ABI, provider);

      // Check if EVIX vault has been liquidated
      const liquidatedVaults = JSON.parse(localStorage.getItem('liquidatedVaults') || '[]');
      const isEVIXLiquidated = liquidatedVaults.some((lv: any) => 
        lv.vaultId === 101 && lv.tokenType === 'EVIX'
      );

      const [bvixPosition, evixPosition, bvixPrice, evixPrice] = await Promise.all([
        getUserPosition(BVIX_VAULT_ADDRESS, address, mintRedeemV6ABI),
        isEVIXLiquidated ? Promise.resolve({ collateral: "0", debt: "0", cr: 0 }) : getUserPosition(EVIX_VAULT_ADDRESS, address, evixMintRedeemV6ABI),
        bvixContract.getPrice().catch(() => 0n),
        evixContract.getPrice().catch(() => 0n)
      ]);

      // Calculate collateral ratios
      let bvixCR = 0;
      let evixCR = 0;

      try {
        // For BVIX: CR = (collateral) / (debt * price) * 100
        if (Number(bvixPosition.debt) > 0 && bvixPrice > 0n) {
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

        // For EVIX: CR = (collateral) / (debt * price) * 100
        if (Number(evixPosition.debt) > 0 && evixPrice > 0n) {
          const evixPriceFormatted = Number(evixPrice) / 1e8;
          const debtValueInUSDC = Number(evixPosition.debt) * evixPriceFormatted;
          evixCR = Math.floor((Number(evixPosition.collateral) / debtValueInUSDC) * 100);
        }

      } catch (error) {
        console.log('🔍 CR calculation failed:', error);
      }

      return {
        bvix: {...bvixPosition, cr: bvixCR},
        evix: {...evixPosition, cr: evixCR}
      };
    },
    enabled: isConnected && !!address,
    refetchInterval: 10000, // Refresh every 10 seconds
    staleTime: 5000 // Consider data stale after 5 seconds for faster updates
  });

  return {
    positions,
    isLoading
  };
}