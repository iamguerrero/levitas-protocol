declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (accounts: string[]) => void) => void;
      removeListener: (event: string, callback: (accounts: string[]) => void) => void;
    };
  }
}

export const BASE_SEPOLIA_CHAIN_ID = '0x14a34';
export const BASE_SEPOLIA_RPC_URL = 'https://sepolia.base.org';

export const CONTRACTS = {
  BVIX_TOKEN: '0x...',  // Contract addresses would be filled in production
  MOCK_ORACLE: '0x...',
  MINT_REDEEM: '0x...',
  MOCK_USDC: '0x...'
};

export async function switchToBaseSepolia() {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('MetaMask not installed');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: BASE_SEPOLIA_CHAIN_ID }],
    });
  } catch (switchError: any) {
    // If the chain hasn't been added to MetaMask, add it
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: BASE_SEPOLIA_CHAIN_ID,
          chainName: 'Base Sepolia',
          rpcUrls: [BASE_SEPOLIA_RPC_URL],
          nativeCurrency: {
            name: 'ETH',
            symbol: 'ETH',
            decimals: 18,
          },
          blockExplorerUrls: ['https://sepolia.basescan.org/'],
        }],
      });
    } else {
      throw switchError;
    }
  }
}

export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatBalance(balance: string, decimals: number = 18): string {
  const num = parseFloat(balance) / Math.pow(10, decimals);
  return num.toFixed(4);
}
