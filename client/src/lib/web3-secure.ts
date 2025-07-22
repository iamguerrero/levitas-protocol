import { ethers } from "ethers";
import BVIX_ABI from "../contracts/BVIXToken.abi.json";
import EVIX_ABI from "../contracts/EVIXToken.abi.json";
import PriceOracle_ABI from "../contracts/PriceOracle.abi.json";
import MintRedeemV7_ABI from "../contracts/MintRedeemV7.abi.json";
import USDC_ABI from "../contracts/MockUSDC.abi.json";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (accounts: string[]) => void) => void;
      removeListener: (
        event: string,
        callback: (accounts: string[]) => void,
      ) => void;
    };
  }
}

export const CHAIN_IDS = {
  baseSepolia: 84532,
  sepolia: 11155111
};

export const HEX_CHAIN_IDS = {
  baseSepolia: '0x14a34',
  sepolia: '0xaa36a7'
};

// Updated addresses for secure contracts deployed to Base Sepolia
export const SECURE_ADDRESSES: { [key: string]: { 
  bvix: string; 
  evix: string; 
  priceOracle: string; 
  evixPriceOracle: string; 
  mockUsdc: string; 
  mintRedeemV7: string; 
  evixMintRedeemV7: string; 
} } = {
  '84532': {
    bvix: "0xc18Fa9D1345D7B68E798e4370B99554c9d5540A1", // BVIXToken V7
    evix: "0xb20CE7575bA09d6a3eeF30682Bc108D0C9EEeAd1", // EVIXToken V7
    priceOracle: "0xa57E229E6998b05FA1BDAdF5c4d7aEdf0e6538a2", // BVIX PriceOracle V7
    evixPriceOracle: "0x587eD1E7D27DCf9c0f5C1b0861500b0cA06Ddd8b", // EVIX PriceOracle V7
    mockUsdc: "0x4E0e879814d7AbAbEAc7013Dc7c721dC45162294", // MockUSDC V7
    mintRedeemV7: "0x4C4aDf5A07794BC89Ad4A4d609b39547e03DBbfa", // BVIX MintRedeemV7
    evixMintRedeemV7: "0x1CA8eC26FFF5FABE35796642dE95446a22cbB843" // EVIX MintRedeemV7
  },
  '11155111': {
    bvix: "0x0000000000000000000000000000000000000000", // TODO: Deploy to ETH Sepolia
    evix: "0x0000000000000000000000000000000000000000", // TODO: Deploy to ETH Sepolia
    priceOracle: "0x0000000000000000000000000000000000000000", // TODO: Deploy to ETH Sepolia
    evixPriceOracle: "0x0000000000000000000000000000000000000000", // TODO: Deploy to ETH Sepolia
    mockUsdc: "0x0000000000000000000000000000000000000000", // TODO: Deploy to ETH Sepolia
    mintRedeemV7: "0x0000000000000000000000000000000000000000", // TODO: Deploy to ETH Sepolia
    evixMintRedeemV7: "0x0000000000000000000000000000000000000000" // TODO: Deploy to ETH Sepolia
  }
};

export const BASE_SEPOLIA_CHAIN_ID = "0x14a34";
export const BASE_SEPOLIA_RPC_URL = "https://sepolia.base.org";

// Contract factory functions for secure contracts
export const getBVIXContract = async (providerOrSigner: any) => {
  const chainId = (await getCurrentChainId()).toString();
  const addresses = SECURE_ADDRESSES[chainId];
  if (!addresses || addresses.bvix === "0x0000000000000000000000000000000000000000") {
    throw new Error("Secure contracts not deployed to this network yet");
  }
  return new ethers.Contract(addresses.bvix, BVIX_ABI, providerOrSigner);
};

export const getEVIXContract = async (providerOrSigner: any) => {
  const chainId = (await getCurrentChainId()).toString();
  const addresses = SECURE_ADDRESSES[chainId];
  if (!addresses || addresses.evix === "0x0000000000000000000000000000000000000000") {
    throw new Error("Secure contracts not deployed to this network yet");
  }
  return new ethers.Contract(addresses.evix, EVIX_ABI, providerOrSigner);
};

export const getPriceOracleContract = async (providerOrSigner: any) => {
  const chainId = (await getCurrentChainId()).toString();
  const addresses = SECURE_ADDRESSES[chainId];
  if (!addresses || addresses.priceOracle === "0x0000000000000000000000000000000000000000") {
    throw new Error("Secure contracts not deployed to this network yet");
  }
  return new ethers.Contract(addresses.priceOracle, PriceOracle_ABI, providerOrSigner);
};

export const getMintRedeemV7Contract = async (providerOrSigner: any) => {
  const chainId = (await getCurrentChainId()).toString();
  const addresses = SECURE_ADDRESSES[chainId];
  if (!addresses || addresses.mintRedeemV7 === "0x0000000000000000000000000000000000000000") {
    throw new Error("Secure contracts not deployed to this network yet");
  }
  return new ethers.Contract(addresses.mintRedeemV7, MintRedeemV7_ABI, providerOrSigner);
};

export const getUSDCContract = async (providerOrSigner: any) => {
  const chainId = (await getCurrentChainId()).toString();
  const addresses = SECURE_ADDRESSES[chainId];
  if (!addresses || addresses.mockUsdc === "0x0000000000000000000000000000000000000000") {
    throw new Error("Secure contracts not deployed to this network yet");
  }
  return new ethers.Contract(addresses.mockUsdc, USDC_ABI, providerOrSigner);
};

// Provider functions
export function getProvider() {
  if (typeof window.ethereum === "undefined") {
    throw new Error("MetaMask not installed");
  }
  return new ethers.BrowserProvider(window.ethereum);
}

export async function getSigner() {
  const provider = getProvider();
  return await provider.getSigner();
}

export async function getCurrentChainId(): Promise<number> {
  if (typeof window.ethereum === "undefined") {
    throw new Error("MetaMask not installed");
  }
  const chainId = await window.ethereum.request({
    method: "eth_chainId",
  });
  return parseInt(chainId, 16);
}

export async function getNetworkName(): Promise<string> {
  try {
    const chainId = await getCurrentChainId();
    if (chainId === CHAIN_IDS.baseSepolia) {
      return "Base Sepolia Testnet";
    } else if (chainId === CHAIN_IDS.sepolia) {
      return "ETH Sepolia Testnet";
    }
    return "Unknown Network";
  } catch (error) {
    return "Unknown Network";
  }
}

export async function switchToBaseSepolia() {
  if (typeof window.ethereum === "undefined") {
    throw new Error("MetaMask not installed");
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BASE_SEPOLIA_CHAIN_ID }],
    });
  } catch (switchError: any) {
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: BASE_SEPOLIA_CHAIN_ID,
            chainName: "Base Sepolia",
            rpcUrls: [BASE_SEPOLIA_RPC_URL],
            nativeCurrency: {
              name: "ETH",
              symbol: "ETH",
              decimals: 18,
            },
            blockExplorerUrls: ["https://sepolia.basescan.org/"],
          },
        ],
      });
    } else {
      throw switchError;
    }
  }
}

// Security-enhanced price functions
export async function getSecureOraclePrice(): Promise<{ price: string; isStale: boolean; canUpdate: boolean; timeUntilUpdate: number }> {
  try {
    const provider = getProvider();
    const priceOracle = await getPriceOracleContract(provider);
    
    // Get price with staleness check
    const [price, isStale] = await priceOracle.getPriceWithStaleness();
    const canUpdate = await priceOracle.canUpdatePrice();
    const timeUntilUpdate = await priceOracle.timeUntilUpdateAllowed();
    
    const formattedPrice = ethers.formatUnits(price, 6); // PriceOracle uses 6 decimals
    
    return {
      price: parseFloat(formattedPrice).toFixed(2),
      isStale,
      canUpdate,
      timeUntilUpdate: Number(timeUntilUpdate)
    };
  } catch (error) {
    console.error("Error getting secure oracle price:", error);
    return {
      price: "42.15",
      isStale: false,
      canUpdate: false,
      timeUntilUpdate: 0
    };
  }
}

// Enhanced balance functions
export async function getBVIXBalance(address: string): Promise<string> {
  try {
    const provider = getProvider();
    const bvixContract = await getBVIXContract(provider);
    const balance = await bvixContract.balanceOf(address);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error("Error getting BVIX balance:", error);
    return "0.0";
  }
}

export async function getEVIXBalance(address: string): Promise<string> {
  try {
    const provider = getProvider();
    const evixContract = await getEVIXContract(provider);
    const balance = await evixContract.balanceOf(address);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error("Error getting EVIX balance:", error);
    return "0.0";
  }
}

export async function getUSDCBalance(address: string): Promise<string> {
  try {
    const provider = getProvider();
    const usdcContract = await getUSDCContract(provider);
    const balance = await usdcContract.balanceOf(address);
    return ethers.formatUnits(balance, 6);
  } catch (error) {
    console.error("Error getting USDC balance:", error);
    return "0.0";
  }
}

// Secure minting functions with enhanced validation
export async function mintBVIXSecure(
  usdcAmount: string,
  targetCR: number = 150,
): Promise<ethers.ContractTransactionResponse> {
  console.log("🚀 Starting secure BVIX mint process for", usdcAmount, "USDC at", targetCR + "% CR");
  
  const signer = await getSigner();
  const address = await signer.getAddress();
  const mintRedeemContract = await getMintRedeemV7Contract(signer);
  const usdcContract = await getUSDCContract(signer);

  const usdcAmountWei = ethers.parseUnits(usdcAmount, 6);

  // Enhanced balance and allowance checks
  const usdcBalance = await usdcContract.balanceOf(address);
  if (usdcBalance < usdcAmountWei) {
    throw new Error(
      `Insufficient USDC balance. You have ${ethers.formatUnits(usdcBalance, 6)} USDC but need ${usdcAmount} USDC.`,
    );
  }

  const currentAllowance = await usdcContract.allowance(address, await mintRedeemContract.getAddress());
  if (currentAllowance < usdcAmountWei) {
    console.log("🔄 Approving USDC spending...");
    const approveTx = await usdcContract.approve(await mintRedeemContract.getAddress(), usdcAmountWei);
    await approveTx.wait();
    console.log("✅ USDC approval confirmed");
  }

  // Check if contract is paused
  const isPaused = await mintRedeemContract.paused();
  if (isPaused) {
    throw new Error("Contract is currently paused. Please try again later.");
  }

  console.log(`🎯 Using secure V7 mintWithCollateralRatio: ${usdcAmount} USDC at ${targetCR}% CR`);
  const mintTx = await mintRedeemContract.mintWithCollateralRatio(usdcAmountWei, targetCR);
  console.log("📄 Transaction hash:", mintTx.hash);
  
  await mintTx.wait();
  console.log("✅ Secure V7 Mint transaction confirmed!");
  
  return mintTx;
}

export async function redeemBVIXSecure(
  bvixAmount: string,
): Promise<ethers.ContractTransactionResponse> {
  const signer = await getSigner();
  const address = await signer.getAddress();
  const mintRedeemContract = await getMintRedeemV7Contract(signer);
  const bvixContract = await getBVIXContract(signer);

  const bvixAmountWei = ethers.parseEther(bvixAmount);

  // Enhanced balance check
  const bvixBalance = await bvixContract.balanceOf(address);
  if (bvixBalance < bvixAmountWei) {
    throw new Error(
      `Insufficient BVIX balance. You have ${ethers.formatEther(bvixBalance)} BVIX but need ${bvixAmount} BVIX`,
    );
  }

  // Check if contract is paused
  const isPaused = await mintRedeemContract.paused();
  if (isPaused) {
    throw new Error("Contract is currently paused. Please try again later.");
  }

  console.log("Redeeming BVIX tokens securely...");
  const redeemTx = await mintRedeemContract.redeem(bvixAmountWei);
  return redeemTx;
}

// Enhanced position tracking with liquidation price
export async function getUserPositionSecure(user: string) {
  try {
    const provider = getProvider();
    const contract = await getMintRedeemV7Contract(provider);
    
    const position = await contract.positions(user);
    const liquidationPrice = await contract.getLiquidationPrice(user);
    const userCR = await contract.getUserCollateralRatio(user);
    
    if (position && (position.collateral > 0 || position.debt > 0)) {
      return {
        collateral: ethers.formatUnits(position.collateral, 6),
        debt: ethers.formatEther(position.debt),
        liquidationPrice: ethers.formatUnits(liquidationPrice, 6),
        collateralRatio: Number(userCR),
        isAtRisk: Number(userCR) < 125 // Warning threshold
      };
    }
    
    return {
      collateral: '0',
      debt: '0',
      liquidationPrice: '0',
      collateralRatio: 0,
      isAtRisk: false
    };
  } catch (error) {
    console.error('Error getting secure user position:', error);
    return { 
      collateral: '0', 
      debt: '0', 
      liquidationPrice: '0', 
      collateralRatio: 0, 
      isAtRisk: false 
    };
  }
}

// Oracle status and security information
export async function getOracleStatus() {
  try {
    const provider = getProvider();
    const priceOracle = await getPriceOracleContract(provider);
    
    const [price, isStale] = await priceOracle.getPriceWithStaleness();
    const canUpdate = await priceOracle.canUpdatePrice();
    const timeUntilUpdate = await priceOracle.timeUntilUpdateAllowed();
    const isPaused = await priceOracle.paused();
    
    return {
      price: ethers.formatUnits(price, 6),
      isStale,
      canUpdate,
      timeUntilUpdate: Number(timeUntilUpdate),
      isPaused,
      lastUpdateTime: await priceOracle.lastUpdateTime(),
      updateDelay: await priceOracle.updateDelay()
    };
  } catch (error) {
    console.error('Error getting oracle status:', error);
    return {
      price: "0",
      isStale: false,
      canUpdate: false,
      timeUntilUpdate: 0,
      isPaused: false,
      lastUpdateTime: 0,
      updateDelay: 0
    };
  }
}

// Contract security status
export async function getContractSecurityStatus() {
  try {
    const provider = getProvider();
    const mintRedeemContract = await getMintRedeemV7Contract(provider);
    
    const isPaused = await mintRedeemContract.paused();
    const globalCR = await mintRedeemContract.getCollateralRatio();
    const liquidationThreshold = await mintRedeemContract.liquidationThreshold();
    const liquidationBonus = await mintRedeemContract.liquidationBonus();
    
    return {
      isPaused,
      globalCollateralRatio: Number(globalCR),
      liquidationThreshold: Number(liquidationThreshold),
      liquidationBonus: Number(liquidationBonus),
      isHealthy: Number(globalCR) > Number(liquidationThreshold)
    };
  } catch (error) {
    console.error('Error getting contract security status:', error);
    return {
      isPaused: false,
      globalCollateralRatio: 0,
      liquidationThreshold: 120,
      liquidationBonus: 5,
      isHealthy: false
    };
  }
}

// Utility functions
export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatBalance(balance: string, decimals: number = 18): string {
  try {
    const num = parseFloat(balance);
    return num.toFixed(4);
  } catch {
    return "0.0000";
  }
}

export function formatPrice(price: string | number): string {
  try {
    const priceFloat = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(priceFloat) || priceFloat < 0.01 || priceFloat > 100000) {
      return "42.15";
    }
    return priceFloat.toFixed(2);
  } catch (error) {
    return "42.15";
  }
}

// Test USDC function for development
export async function getTestUSDC(amount: string): Promise<ethers.ContractTransactionResponse | null> {
  try {
    const signer = await getSigner();
    const usdcContract = await getUSDCContract(signer);
    const amountWei = ethers.parseUnits(amount, 6);
    const address = await signer.getAddress();
    const mintTx = await usdcContract.mint(address, amountWei);
    return mintTx;
  } catch (error) {
    console.error("No mint function available on USDC contract:", error);
    return null;
  }
} 