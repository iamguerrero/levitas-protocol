export const CHAIN_IDS = {
  polygonAmoy: 80002,
  baseSepolia: 84532,
  sepolia: 11155111
};

export const HEX_CHAIN_IDS = {
  polygonAmoy: '0x13882',
  baseSepolia: '0x14a34',
  sepolia: '0xaa36a7'
};

export const NETWORK_CONFIG = {
  polygonAmoy: {
    chainId: '0x13882',
    chainName: 'Polygon Amoy Testnet',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
    rpcUrls: ['https://polygon-amoy.drpc.org', 'https://rpc-amoy.polygon.technology/'],
    blockExplorerUrls: ['https://amoy.polygonscan.com/'],
    iconUrls: ['https://polygon.technology/favicon.ico'],
  },
  baseSepolia: {
    chainId: '0x14a34',
    chainName: 'Base Sepolia Testnet',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['https://sepolia.base.org'],
    blockExplorerUrls: ['https://sepolia.basescan.org'],
    iconUrls: ['https://base.org/favicon.ico'],
  }
};

export const PRIMARY_NETWORK = 'polygonAmoy';
export const PRIMARY_CHAIN_ID = CHAIN_IDS.polygonAmoy;
export const PRIMARY_HEX_CHAIN_ID = HEX_CHAIN_IDS.polygonAmoy;
export const PRIMARY_RPC_URL = NETWORK_CONFIG.polygonAmoy.rpcUrls[0]; // Using more stable DRPC endpoint