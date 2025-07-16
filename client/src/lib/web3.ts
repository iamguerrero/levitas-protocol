import { ethers } from "ethers";
import BVIX_ABI from "../contracts/BVIXToken.abi.json";
import Oracle_ABI from "../contracts/MockOracle.abi.json";
import MintRedeem_ABI from "../contracts/MintRedeem.abi.json";
import USDC_ABI from "../contracts/MockUSDC.abi.json";
import { BigNumber, utils } from "ethers";

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

export const BASE_SEPOLIA_CHAIN_ID = "0x14a34";
export const BASE_SEPOLIA_RPC_URL = "https://sepolia.base.org";

// Contract addresses - to be updated after deployment
export const MINT_REDEEM_ADDRESS = "0x1f3FB11995F1650D469649C476defB753766b2A0";
export const BVIX_ADDRESS = "0xEA3d08a5A5bC48Fc984F0F773826693B7480bF48";
export const ORACLE_ADDRESS = "0x85485dD6cFaF5220150c413309C61a8EA24d24FE";
export const MOCK_USDC_ADDRESS = "0x79640e0f510a7c6d59737442649d9600C84b035f";

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
  if (typeof window.ethereum === "undefined") {
    throw new Error("MetaMask not installed");
  }
  return new ethers.BrowserProvider(window.ethereum);
}

export async function getSigner() {
  const provider = getProvider();
  return await provider.getSigner();
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
    // If the chain hasn't been added to MetaMask, add it
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

// Helper functions for contract interactions
export async function getBVIXBalance(address: string): Promise<string> {
  try {
    const provider = getProvider();
    const bvixContract = getBVIXContract(provider);
    const balance = await bvixContract.balanceOf(address);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error("Error getting BVIX balance:", error);
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
    console.error("Error getting USDC balance:", error);
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
    console.error("Error getting oracle price:", error);
    return "42.15"; // Fallback price
  }
}

export async function mintBVIX(
  usdcAmount: string,
): Promise<ethers.ContractTransactionResponse> {
  const signer = await getSigner();
  const address = await signer.getAddress();
  const mintRedeemContract = getMintRedeemContract(signer);
  const usdcContract = getUSDCContract(signer);

  const usdcAmountWei = ethers.parseUnits(usdcAmount, 6); // USDC has 6 decimals

  // Check USDC balance first
  const usdcBalance = await usdcContract.balanceOf(address);
  if (usdcBalance < usdcAmountWei) {
    throw new Error(
      `Insufficient USDC balance. You have ${ethers.formatUnits(usdcBalance, 6)} USDC but need ${usdcAmount} USDC`,
    );
  }

  // Check current allowance
  const currentAllowance = await usdcContract.allowance(
    address,
    MINT_REDEEM_ADDRESS,
  );

  // Only approve if needed
  if (currentAllowance < usdcAmountWei) {
    console.log("Approving USDC spending...");
    const approveTx = await usdcContract.approve(
      MINT_REDEEM_ADDRESS,
      usdcAmountWei,
    );
    await approveTx.wait();
    console.log("USDC approval confirmed");
  }

  // Then mint BVIX
  console.log("Minting BVIX tokens...");
  const mintTx = await mintRedeemContract.mint(usdcAmountWei);
  return mintTx;
}

export async function redeemBVIX(
  bvixAmount: string,
): Promise<ethers.ContractTransactionResponse> {
  const signer = await getSigner();
  const address = await signer.getAddress();
  const mintRedeemContract = getMintRedeemContract(signer);
  const bvixContract = getBVIXContract(signer);

  const bvixAmountWei = ethers.parseEther(bvixAmount);

  // Check BVIX balance first
  const bvixBalance = await bvixContract.balanceOf(address);
  if (bvixBalance < bvixAmountWei) {
    throw new Error(
      `Insufficient BVIX balance. You have ${ethers.formatEther(bvixBalance)} BVIX but need ${bvixAmount} BVIX`,
    );
  }

  console.log("Redeeming BVIX tokens...");
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

// Helper function to get test USDC - check if there's a faucet function
export async function getTestUSDC(
  amount: string,
): Promise<ethers.ContractTransactionResponse | null> {
  try {
    const signer = await getSigner();
    const usdcContract = getUSDCContract(signer);

    // Check if the contract has a mint function (for test tokens)
    const amountWei = ethers.parseUnits(amount, 6);
    const address = await signer.getAddress();

    // Try to call mint function if it exists (common in test tokens)
    const mintTx = await usdcContract.mint(address, amountWei);
    return mintTx;
  } catch (error) {
    console.error("No mint function available on USDC contract:", error);
    return null;
  }
}

// Debug function to get contract info
export async function getContractDebugInfo(): Promise<any> {
  try {
    const provider = getProvider();
    const signer = await getSigner();
    const address = await signer.getAddress();

    const usdcContract = getUSDCContract(provider);
    const bvixContract = getBVIXContract(provider);
    const oracleContract = getOracleContract(provider);
    const mintRedeemContract = getMintRedeemContract(provider);

    const [usdcBalance, bvixBalance, oraclePrice, usdcAllowance] =
      await Promise.all([
        usdcContract.balanceOf(address),
        bvixContract.balanceOf(address),
        oracleContract.getPrice(),
        usdcContract.allowance(address, MINT_REDEEM_ADDRESS),
      ]);

    return {
      userAddress: address,
      usdcBalance: ethers.formatUnits(usdcBalance, 6),
      bvixBalance: ethers.formatEther(bvixBalance),
      oraclePrice: ethers.formatEther(oraclePrice),
      usdcAllowance: ethers.formatUnits(usdcAllowance, 6),
      contractAddresses: {
        usdc: MOCK_USDC_ADDRESS,
        bvix: BVIX_ADDRESS,
        oracle: ORACLE_ADDRESS,
        mintRedeem: MINT_REDEEM_ADDRESS,
      },
    };
  } catch (error) {
    console.error("Error getting debug info:", error);
    return { error: error.message };
  }
}

/** -------------------------------------------------
 *  Collateral ratio = USDC in the vault ÷ BVIX debt
 *  Returned as a plain number (e.g. 1.42 = 142 %)
 * ------------------------------------------------ */
export const getCollateralRatio = async (): Promise<number> => {
  try {
    const provider = getProvider();
    // 1️⃣ contracts
    const usdc = new ethers.Contract(MOCK_USDC_ADDRESS, ERC20_ABI, provider);
    const bvix = new ethers.Contract(BVIX_ADDRESS, ERC20_ABI, provider);

    // 2️⃣ read chain state in parallel
    const [rawVaultUSDC, rawSupply, price] = await Promise.all([
      usdc.balanceOf(MINT_REDEEM_ADDRESS), // 6-decimals
      bvix.totalSupply(),                  // 18-decimals
      getOraclePrice()                     // plain string like "42.15"
    ]);

    // 3️⃣ convert to JS numbers (fine for frontend display)
    const vaultUSDC = Number(ethers.formatUnits(rawVaultUSDC, 6));   // → 1 234.56
    const supply = Number(ethers.formatUnits(rawSupply, 18));        // →  28.73 BVIX
    const liability = supply * Number(price);                        // in USDC

    if (liability === 0) return Infinity; // nothing minted yet

    return vaultUSDC / liability;         // e.g. 1.42
  } catch (error) {
    console.error("Error getting collateral ratio:", error);
    return 0;
  }
};

