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
      
      const [bvixPosition, evixPosition] = await Promise.all([
        getUserPosition(BVIX_VAULT_ADDRESS, address, mintRedeemV6ABI),
        getUserPosition(EVIX_VAULT_ADDRESS, address, evixMintRedeemV6ABI)
      ]);
      
      return {
        bvix: bvixPosition,
        evix: evixPosition
      };
    },
    enabled: isConnected && !!address,
    refetchInterval: 10000 // Refresh every 10 seconds
  });
  
  return {
    positions,
    isLoading
  };
}