import { ethers } from 'ethers';
import BVIX_ABI from '../contracts/BVIXToken.abi.json';
import Oracle_ABI from '../contracts/MockOracle.abi.json';
import MintRedeem_ABI from '../contracts/MintRedeem.abi.json';
import USDC_ABI from '../contracts/MockUSDC.abi.json';

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

// Contract addresses - to be updated after deployment
export const MINT_REDEEM_ADDRESS = "0xMintRedeemAddressHere";
export const BVIX_ADDRESS = "0xBVIXAddressHere";
export const ORACLE_ADDRESS = "0xOracleAddressHere";
export const MOCK_USDC_ADDRESS = "0xMockUSDCAddressHere";

// Contract factory functions
export const getBVIXContract = (providerOrSigner: any) =>
  new ethers.Contract(BVIX_ADDRESS, BVIX_ABI, providerOrSigner);

export const getOracleContract = (providerOrSigner: any) =>
  new ethers.Contract(ORACLE_ADDRESS, Oracle_ABI, providerOrSigner);

export const getMintRedeemContract = (providerOrSigner: any) =>
  new ethers.Contract(MINT_REDEEM_ADDRESS, MintRedeem_ABI, providerOrSigner);

export const getUSDCContract = (providerOrSigner: any) =>
  new ethers.Contract(MOCK_USDC_ADDRESS, USDC_ABI, providerOrSigner);

// Provider functions
export function getProvider() {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('MetaMask not installed');
  }
  return new ethers.BrowserProvider(window.ethereum);
}

export async function getSigner() {
  const provider = getProvider();
  return await provider.getSigner();
}

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

// Helper functions for contract interactions
export async function getBVIXBalance(address: string): Promise<string> {
  try {
    const provider = getProvider();
    const bvixContract = getBVIXContract(provider);
    const balance = await bvixContract.balanceOf(address);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error('Error getting BVIX balance:', error);
    return "0.0";
  }
}

export async function getUSDCBalance(address: string): Promise<string> {
  try {
    const provider = getProvider();
    const usdcContract = getUSDCContract(provider);
    const balance = await usdcContract.balanceOf(address);
    return ethers.formatUnits(balance, 6); // USDC has 6 decimals
  } catch (error) {
    console.error('Error getting USDC balance:', error);
    return "0.0";
  }
}

export async function getOraclePrice(): Promise<string> {
  try {
    const provider = getProvider();
    const oracleContract = getOracleContract(provider);
    const price = await oracleContract.getPrice();
    return ethers.formatEther(price);
  } catch (error) {
    console.error('Error getting oracle price:', error);
    return "42.15"; // Fallback price
  }
}

export async function mintBVIX(usdcAmount: string): Promise<ethers.ContractTransactionResponse> {
  const signer = await getSigner();
  const mintRedeemContract = getMintRedeemContract(signer);
  const usdcContract = getUSDCContract(signer);
  
  // First approve USDC spending
  const usdcAmountWei = ethers.parseUnits(usdcAmount, 6); // USDC has 6 decimals
  const approveTx = await usdcContract.approve(MINT_REDEEM_ADDRESS, usdcAmountWei);
  await approveTx.wait();
  
  // Then mint BVIX
  const mintTx = await mintRedeemContract.mint(usdcAmountWei);
  return mintTx;
}

export async function redeemBVIX(bvixAmount: string): Promise<ethers.ContractTransactionResponse> {
  const signer = await getSigner();
  const mintRedeemContract = getMintRedeemContract(signer);
  const bvixAmountWei = ethers.parseEther(bvixAmount);
  
  const redeemTx = await mintRedeemContract.redeem(bvixAmountWei);
  return redeemTx;
}

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
