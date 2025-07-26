// Updated: 2025-07-23T19:48:41.811Z - New EVIX Oracle: 0xBd6E9809B9608eCAc3610cA65327735CC3c08104
import { ethers } from "ethers";
import BVIX_ABI from "../contracts/BVIXToken.abi.json";
import EVIX_ABI from "../contracts/EVIXToken.abi.json";
import Oracle_ABI from "../contracts/MockOracle.abi.json";
import MintRedeem_ABI from "../contracts/MintRedeemV6.abi.json";
import USDC_ABI from "../contracts/MockUSDC.abi.json";
import EVIXOracle_ABI from "../contracts/EVIXOracle.abi.json";
import EVIXMintRedeem_ABI from "../contracts/EVIXMintRedeemV6.abi.json";

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

export const ADDRESSES: { [key: string]: { bvix: string; evix: string; oracle: string; evixOracle: string; mockUsdc: string; mintRedeem: string; evixMintRedeem: string; } } = {
  '84532': {
    bvix: "0x2E3bef50887aD2A30069c79D19Bb91085351C92a",
    evix: "0x7066700CAf442501B308fAe34d5919091e1b2380",
    oracle: "0x85485dD6cFaF5220150c413309C61a8EA24d24FE",
    evixOracle: "0xBd6E9809B9608eCAc3610cA65327735CC3c08104",
    mockUsdc: "0x9CC37B36FDd8CF5c0297BE15b75663Bf2a193297",
    mintRedeem: "0x65Bec0Ab96ab751Fd0b1D9c907342d9A61FB1117",
    evixMintRedeem: "0x6C3e986c4cc7b3400de732440fa01B66FF9172Cf"
  },
  '11155111': {
    bvix: "0x5913B8B9703d990fbB96e2a16A49B9376E262850",
    evix: "0x75298e29fE21a5dcEFBe96988DdA957d421dc55C",
    oracle: "0x5254533747b373D13303AE8ACC9D464f80B6bfae",
    evixOracle: "0xBd6E9809B9608eCAc3610cA65327735CC3c08104",
    mockUsdc: "0x83a6596c6B4C6FCC99A24B10ccd1660b1deF61b1",
    mintRedeem: "0xAec6c459354D31031Ef7f77bE974eeE39BD60382",
    evixMintRedeem: "0x5cAd54Ad8CcEacB7bF0c34E58c72D6EB6eC884B8"
  }
};

export const BASE_SEPOLIA_CHAIN_ID = "0x14a34";
export const BASE_SEPOLIA_RPC_URL = "https://sepolia.base.org";

// Contract addresses - V6 with position tracking and surplus refunding
export const BVIX_ADDRESS = "0x2E3bef50887aD2A30069c79D19Bb91085351C92a"; // Fresh BVIX token

// V6 contract addresses deployed to Base Sepolia
export const BVIX_MINT_REDEEM_V6_ADDRESS = '0x65Bec0Ab96ab751Fd0b1D9c907342d9A61FB1117'; // BVIX V6
export const EVIX_MINT_REDEEM_V6_ADDRESS = '0x6C3e986c4cc7b3400de732440fa01B66FF9172Cf'; // EVIX V6

// Token and Oracle addresses
export const EVIX_ADDRESS = "0x7066700CAf442501B308fAe34d5919091e1b2380"; // EVIX token
export const ORACLE_ADDRESS = "0x85485dD6cFaF5220150c413309C61a8EA24d24FE";
export const MOCK_USDC_ADDRESS = "0x9CC37B36FDd8CF5c0297BE15b75663Bf2a193297"; // MockUSDC with public faucet
export const EVIX_ORACLE_ADDRESS = "0xBd6E9809B9608eCAc3610cA65327735CC3c08104"; // Updated EVIX Oracle

// Contract factory functions
export const getBVIXContract = async (providerOrSigner: any) => {
  const chainId = (await getCurrentChainId()).toString();
  const addresses = ADDRESSES[chainId];
  if (!addresses) throw new Error("Unsupported network");
  return new ethers.Contract(addresses.bvix, BVIX_ABI, providerOrSigner);
};

export const getEVIXContract = async (providerOrSigner: any) => {
  const chainId = (await getCurrentChainId()).toString();
  const addresses = ADDRESSES[chainId];
  if (!addresses) throw new Error("Unsupported network");
  return new ethers.Contract(addresses.evix, EVIX_ABI, providerOrSigner);
};

export const getOracleContract = async (providerOrSigner: any) => {
  const chainId = (await getCurrentChainId()).toString();
  const addresses = ADDRESSES[chainId];
  if (!addresses) throw new Error("Unsupported network");
  return new ethers.Contract(addresses.oracle, Oracle_ABI, providerOrSigner);
};

export const getMintRedeemContract = async (providerOrSigner: any) => {
  const chainId = (await getCurrentChainId()).toString();
  const addresses = ADDRESSES[chainId];
  if (!addresses) throw new Error("Unsupported network");
  return new ethers.Contract(addresses.mintRedeem, MintRedeem_ABI, providerOrSigner);
};

export const getUSDCContract = async (providerOrSigner: any) => {
  const chainId = (await getCurrentChainId()).toString();
  const addresses = ADDRESSES[chainId];
  if (!addresses) throw new Error("Unsupported network");
  
  // Check if the address is a placeholder (all zeros)
  if (addresses.mockUsdc === "0x0000000000000000000000000000000000000000") {
    throw new Error("Contracts not deployed to this network yet. Please deploy contracts first.");
  }
  

  
  return new ethers.Contract(addresses.mockUsdc, USDC_ABI, providerOrSigner);
};

export const getEVIXOracleContract = async (providerOrSigner: any) => {
  const chainId = (await getCurrentChainId()).toString();
  const addresses = ADDRESSES[chainId];
  if (!addresses) throw new Error("Unsupported network");
  return new ethers.Contract(addresses.evixOracle, EVIXOracle_ABI, providerOrSigner);
};

export const getEVIXMintRedeemContract = async (providerOrSigner: any) => {
  const chainId = (await getCurrentChainId()).toString();
  const addresses = ADDRESSES[chainId];
  if (!addresses) throw new Error("Unsupported network");
  return new ethers.Contract(addresses.evixMintRedeem, EVIXMintRedeem_ABI, providerOrSigner);
};

export const getEVIXMintRedeemContractV6 = (providerOrSigner: any) =>
  new ethers.Contract(EVIX_MINT_REDEEM_V6_ADDRESS, EVIXMintRedeem_ABI, providerOrSigner);

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

// Add switchToSepolia
export async function switchToSepolia() {
  if (typeof window.ethereum === "undefined") {
    throw new Error("MetaMask not installed");
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: HEX_CHAIN_IDS.sepolia }],
    });
  } catch (switchError: any) {
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: HEX_CHAIN_IDS.sepolia,
            chainName: "Sepolia",
            rpcUrls: ["https://rpc.sepolia.org"],
            nativeCurrency: {
              name: "ETH",
              symbol: "ETH",
              decimals: 18,
            },
            blockExplorerUrls: ["https://sepolia.etherscan.io/"],
          },
        ],
      });
    } else {
      throw switchError;
    }
  }
}

// Helper functions for contract interactions
// Optimized batch balance fetcher - reuses provider and contracts
export async function getAllBalances(address: string): Promise<{
  bvixBalance: string;
  evixBalance: string;
  usdcBalance: string;
}> {
  try {
    const provider = getProvider();
    
    // Initialize all contracts in parallel
    const [bvixContract, evixContract, usdcContract] = await Promise.all([
      getBVIXContract(provider),
      getEVIXContract(provider),
      getUSDCContract(provider)
    ]);
    
    // Fetch all balances in parallel
    const [bvixBalance, evixBalance, usdcBalance] = await Promise.all([
      bvixContract.balanceOf(address),
      evixContract.balanceOf(address),
      usdcContract.balanceOf(address)
    ]);
    
    // Format the real blockchain balances
    const result = {
      bvixBalance: ethers.formatEther(bvixBalance),
      evixBalance: ethers.formatEther(evixBalance),
      usdcBalance: ethers.formatUnits(usdcBalance, 6)
    };
    
    // Don't use mock balances in getAllBalances - keep it clean
    // Mock balances should only be used in specific liquidation contexts
    
    return result;
  } catch (error) {
    console.error("Error getting balances:", error);
    return {
      bvixBalance: "0.0",
      evixBalance: "0.0",
      usdcBalance: "0.0"
    };
  }
}

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
    const formatted = ethers.formatEther(balance);
    
    // Don't use mock balances - return real balance only
    
    return formatted;
  } catch (error) {
    console.error("Error getting EVIX balance:", error);
    return "0.0";
  }
}

export async function getUSDCBalance(address: string): Promise<string> {
  try {
    // Don't use mock balances - return real balance only
    
    const provider = getProvider();
    const usdcContract = await getUSDCContract(provider);
    
    // Force fresh call - no caching
    const balance = await usdcContract.balanceOf(address);
    const formattedBalance = ethers.formatUnits(balance, 6); // USDC has 6 decimals
    
    console.log("🔍 USDC Balance Debug:", { 
      address, 
      contract: MOCK_USDC_ADDRESS,
      balance: balance.toString(), 
      formatted: formattedBalance,
      timestamp: new Date().toISOString()
    });
    
    return formattedBalance;
  } catch (error) {
    console.error("Error getting USDC balance:", error);
    return "0.0";
  }
}

export async function getOraclePrice(): Promise<string> {
  try {
    const provider = getProvider();
    const oracleContract = await getOracleContract(provider);
    const price = await oracleContract.getPrice();
    const chainId = await getCurrentChainId();
    
    // ETH Sepolia uses 18 decimals, Base Sepolia uses 8 decimals
    const decimals = chainId === CHAIN_IDS.sepolia ? 18 : 8;
    const formattedPrice = ethers.formatUnits(price, decimals);
    
    console.log("🔍 BVIX Price Debug:", {
      chainId,
      decimals,
      rawPrice: price.toString(),
      formattedPrice,
      finalPrice: parseFloat(formattedPrice).toFixed(2)
    });
    
    // Validate the price is reasonable (between $0.01 and $100,000)
    const priceFloat = parseFloat(formattedPrice);
    if (priceFloat < 0.01 || priceFloat > 100000) {
      console.warn("⚠️ BVIX price seems unreasonable:", priceFloat, "using fallback");
      
      // Try alternative decimal formats if the price seems wrong
      if (chainId === CHAIN_IDS.sepolia) {
        // Try with 8 decimals instead of 18 for ETH Sepolia
        const altFormattedPrice = ethers.formatUnits(price, 8);
        const altPriceFloat = parseFloat(altFormattedPrice);
        if (altPriceFloat >= 0.01 && altPriceFloat <= 100000) {
          console.log("✅ Fixed BVIX price with 8 decimals:", altPriceFloat);
          return altPriceFloat.toFixed(2);
        }
      } else {
        // Try with 18 decimals instead of 8 for Base Sepolia
        const altFormattedPrice = ethers.formatUnits(price, 18);
        const altPriceFloat = parseFloat(altFormattedPrice);
        if (altPriceFloat >= 0.01 && altPriceFloat <= 100000) {
          console.log("✅ Fixed BVIX price with 18 decimals:", altPriceFloat);
          return altPriceFloat.toFixed(2);
        }
      }
      
      return "42.15"; // Fallback price
    }
    
    // Parse and format to 2 decimal places
    return priceFloat.toFixed(2);
  } catch (error) {
    console.error("Error getting oracle price:", error);
    return "42.15"; // Fallback price
  }
}

// Get EVIX price from oracle
export async function getEVIXPrice(): Promise<string> {
  try {
    const provider = getProvider();
    const evixOracle = await getEVIXOracleContract(provider);
    const priceRaw = await evixOracle.getPrice();
    const chainId = await getCurrentChainId();
    
    // ETH Sepolia uses 18 decimals, Base Sepolia uses 8 decimals
    const decimals = chainId === CHAIN_IDS.sepolia ? 18 : 8;
    const formattedPrice = ethers.formatUnits(priceRaw, decimals);
    
    console.log("🔍 EVIX Price Debug:", {
      chainId,
      decimals,
      rawPrice: priceRaw.toString(),
      formattedPrice,
      finalPrice: parseFloat(formattedPrice).toFixed(2)
    });
    
    // Validate the price is reasonable (between $0.01 and $100,000)
    const priceFloat = parseFloat(formattedPrice);
    if (priceFloat < 0.01 || priceFloat > 100000) {
      console.warn("⚠️ EVIX price seems unreasonable:", priceFloat, "using fallback");
      
      // Try alternative decimal formats if the price seems wrong
      if (chainId === CHAIN_IDS.sepolia) {
        // Try with 8 decimals instead of 18 for ETH Sepolia
        const altFormattedPrice = ethers.formatUnits(priceRaw, 8);
        const altPriceFloat = parseFloat(altFormattedPrice);
        if (altPriceFloat >= 0.01 && altPriceFloat <= 100000) {
          console.log("✅ Fixed EVIX price with 8 decimals:", altPriceFloat);
          return altPriceFloat.toFixed(2);
        }
      } else {
        // Try with 18 decimals instead of 8 for Base Sepolia
        const altFormattedPrice = ethers.formatUnits(priceRaw, 18);
        const altPriceFloat = parseFloat(altFormattedPrice);
        if (altPriceFloat >= 0.01 && altPriceFloat <= 100000) {
          console.log("✅ Fixed EVIX price with 18 decimals:", altPriceFloat);
          return altPriceFloat.toFixed(2);
        }
      }
      
      return "37.98"; // Fallback price
    }
    
    // Parse and format to 2 decimal places
    return priceFloat.toFixed(2);
  } catch (error) {
    console.error("Error getting EVIX price:", error);
    return "37.98"; // Fallback price
  }
}

export async function mintBVIX(
  usdcAmount: string,
  targetCR: number = 150,
): Promise<ethers.ContractTransactionResponse> {
  console.log("🚀 Starting BVIX mint process for", usdcAmount, "USDC at", targetCR + "% CR");
  
  const signer = await getSigner();
  const address = await signer.getAddress();
  const mintRedeemContract = await getMintRedeemContract(signer);
  const usdcContract = await getUSDCContract(signer);

  const usdcAmountWei = ethers.parseUnits(usdcAmount, 6); // USDC has 6 decimals

  console.log("🔍 Checking balances and allowances...");
  console.log("User address:", address);
  console.log("USDC contract:", MOCK_USDC_ADDRESS);
      console.log("MintRedeem V6 contract:", BVIX_MINT_REDEEM_V6_ADDRESS);

  // Check USDC balance first
  const usdcBalance = await usdcContract.balanceOf(address);
  console.log("USDC balance:", ethers.formatUnits(usdcBalance, 6));
  console.log("Required amount:", usdcAmount);
  
  if (usdcBalance < usdcAmountWei) {
    throw new Error(
      `Insufficient USDC balance. You have ${ethers.formatUnits(usdcBalance, 6)} USDC but need ${usdcAmount} USDC.`,
    );
  }

  // Check current allowance
  const currentAllowance = await usdcContract.allowance(
    address,
    BVIX_MINT_REDEEM_V6_ADDRESS,
  );
  console.log("Current allowance:", ethers.formatUnits(currentAllowance, 6));

  // Only approve if needed
  if (currentAllowance < usdcAmountWei) {
    console.log("🔄 Approving USDC spending...");
    const approveTx = await usdcContract.approve(
      BVIX_MINT_REDEEM_V6_ADDRESS,
      usdcAmountWei,
    );
    await approveTx.wait();
    console.log("✅ USDC approval confirmed");
  } else {
    console.log("✅ Sufficient allowance already exists");
  }

  // Use V6 collateral-aware mint function
  console.log(`🎯 Using V6 mintWithCollateralRatio: ${usdcAmount} USDC at ${targetCR}% CR`);
  console.log(`💰 Expected token value: $${(parseFloat(usdcAmount) / (targetCR / 100)).toFixed(2)}`);
  
  const mintTx = await mintRedeemContract.mintWithCollateralRatio(usdcAmountWei, targetCR);
  console.log("📄 Transaction hash:", mintTx.hash);
  
  // Wait for transaction confirmation
  await mintTx.wait();
  console.log("✅ V6 Mint transaction confirmed with proper CR enforcement!");
  
  return mintTx;
}

export async function redeemBVIX(
  bvixAmount: string,
): Promise<ethers.ContractTransactionResponse> {
  const signer = await getSigner();
  const address = await signer.getAddress();
  const mintRedeemContract = await getMintRedeemContract(signer);
  const bvixContract = await getBVIXContract(signer);

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

export async function mintEVIX(
  usdcAmount: string,
  targetCR: number = 150,
): Promise<ethers.ContractTransactionResponse> {
  console.log("🚀 Starting EVIX mint process for", usdcAmount, "USDC at", targetCR + "% CR");
  
  const signer = await getSigner();
  const address = await signer.getAddress();
  const evixMintRedeemContract = await getEVIXMintRedeemContract(signer);
  const usdcContract = await getUSDCContract(signer);

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
    EVIX_MINT_REDEEM_V6_ADDRESS,
  );

  // Only approve if needed
  if (currentAllowance < usdcAmountWei) {
    console.log("🔄 Approving USDC spending for EVIX...");
    const approveTx = await usdcContract.approve(
      EVIX_MINT_REDEEM_V6_ADDRESS,
      usdcAmountWei,
    );
    await approveTx.wait();
    console.log("✅ USDC approval confirmed for EVIX");
  }

  // Use V6 collateral-aware mint function
  console.log(`🎯 Using V6 EVIX mintWithCollateralRatio: ${usdcAmount} USDC at ${targetCR}% CR`);
  console.log(`💰 Expected token value: $${(parseFloat(usdcAmount) / (targetCR / 100)).toFixed(2)}`);
  
  const mintTx = await evixMintRedeemContract.mintWithCollateralRatio(usdcAmountWei, targetCR);
  console.log("📄 EVIX Transaction hash:", mintTx.hash);
  
  await mintTx.wait();
  console.log("✅ V6 EVIX Mint transaction confirmed with proper CR enforcement!");
  
  return mintTx;
}

export async function redeemEVIX(
  evixAmount: string,
): Promise<ethers.ContractTransactionResponse> {
  const signer = await getSigner();
  const address = await signer.getAddress();
  const evixMintRedeemContract = await getEVIXMintRedeemContract(signer);
  const evixContract = await getEVIXContract(signer);

  const evixAmountWei = ethers.parseEther(evixAmount);

  // Check EVIX balance first
  const evixBalance = await evixContract.balanceOf(address);
  if (evixBalance < evixAmountWei) {
    throw new Error(
      `Insufficient EVIX balance. You have ${ethers.formatEther(evixBalance)} EVIX but need ${evixAmount} EVIX`,
    );
  }

  console.log("Redeeming EVIX tokens...");
  const redeemTx = await evixMintRedeemContract.redeem(evixAmountWei);
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

// Helper function to format prices safely
export function formatPrice(price: string | number): string {
  try {
    const priceFloat = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(priceFloat) || priceFloat < 0.01 || priceFloat > 100000) {
      return "42.15"; // Fallback price
    }
    return priceFloat.toFixed(2);
  } catch (error) {
    return "42.15"; // Fallback price
  }
}

// Helper function to get test USDC - check if there's a faucet function
export async function getTestUSDC(
  amount: string,
): Promise<ethers.ContractTransactionResponse | null> {
  try {
    const signer = await getSigner();
    const usdcContract = await getUSDCContract(signer);

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



// Update getContractDebugInfo
export async function getContractDebugInfo(): Promise<any> {
  try {
    const provider = getProvider();
    const signer = await getSigner();
    const address = await signer.getAddress();

    const usdcContract = await getUSDCContract(provider);
    const bvixContract = await getBVIXContract(provider);
    const oracleContract = await getOracleContract(provider);
    const mintRedeemContract = await getMintRedeemContract(provider);

    const [usdcBalance, bvixBalance, oraclePrice, usdcAllowance] =
      await Promise.all([
        usdcContract.balanceOf(address),
        bvixContract.balanceOf(address),
        oracleContract.getPrice(),
        usdcContract.allowance(address, BVIX_MINT_REDEEM_V6_ADDRESS),
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
        mintRedeem: BVIX_MINT_REDEEM_V6_ADDRESS,
      },
    };
  } catch (error) {
    console.error("Error getting debug info:", error);
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

/** -------------------------------------------------
 *  Collateral ratio = USDC in the vault ÷ BVIX debt
 *  Returned as a plain number (e.g. 1.42 = 142 %)
 * ------------------------------------------------ */
export const getCollateralRatio = async (): Promise<number> => {
  try {
    const provider = getProvider();
    // 1️⃣ contracts - using contract factory functions instead of direct ABI
    const usdc = await getUSDCContract(provider);
    const bvix = await getBVIXContract(provider);

    // 2️⃣ read chain state in parallel
    const [rawVaultUSDC, rawSupply, price] = await Promise.all([
      usdc.balanceOf(BVIX_MINT_REDEEM_V6_ADDRESS), // 6-decimals
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

export async function getUserPosition(user: string) {
  try {
    // V6 contracts have individual position tracking
    const provider = getProvider();
    const contract = await getMintRedeemContract(provider);
    
    console.log('🔍 Getting BVIX position for user:', user);
    console.log('🔍 Using V6 contract address:', BVIX_MINT_REDEEM_V6_ADDRESS);
    
    // Get user's position from V6 contract using positions(address) function
    const position = await contract.positions(user);
    
    console.log('🔍 Raw position data:', position);
    
    if (position && (position.collateral > 0 || position.debt > 0)) {
      const formattedPosition = {
        collateral: ethers.formatUnits(position.collateral, 6), // USDC has 6 decimals
        debt: ethers.formatEther(position.debt) // BVIX has 18 decimals
      };
      console.log('🔍 Formatted BVIX position:', formattedPosition);
      return formattedPosition;
    }
    
    console.log('🔍 No BVIX position found');
    return {
      collateral: '0',
      debt: '0'
    };
  } catch (error) {
    console.error('Error getting user position:', error);
    return { collateral: '0', debt: '0' };
  }
}

export async function getUserCollateralRatio(user: string): Promise<number> {
  try {
    // V6 contracts have individual CR tracking
    const provider = getProvider();
    const contract = await getMintRedeemContract(provider);
    
    console.log('🔍 Getting BVIX CR for user:', user);
    
    // First check if user has a position
    const position = await contract.positions(user);
    if (!position || position.debt === 0n) {
      console.log('🔍 User has no BVIX position, returning 0 CR');
      return 0;
    }
    
    // Get user's individual collateral ratio from V6 contract
    const ratio = await contract.getUserCollateralRatio(user);
    // The contract returns CR as percentage (e.g., 200 for 200%), no need for formatEther
    const crPercentage = Number(ratio);
    
    console.log('🔍 BVIX CR raw ratio:', ratio.toString());
    console.log('🔍 BVIX CR percentage:', crPercentage);
    
    return crPercentage;
  } catch (error) {
    console.error('Error getting user CR:', error);
    return 0;
  }
}

export async function getUserPositionEVIX(user: string) {
  try {
    // V6 contracts have individual position tracking
    const provider = getProvider();
    const contract = await getEVIXMintRedeemContract(provider);
    
    console.log('🔍 Getting EVIX position for user:', user);
    console.log('🔍 Using EVIX V6 contract address:', EVIX_MINT_REDEEM_V6_ADDRESS);
    
    // Get user's position from V6 contract using positions(address) function
    const position = await contract.positions(user);
    
    console.log('🔍 Raw EVIX position data:', position);
    
    if (position && (position.collateral > 0 || position.debt > 0)) {
      const formattedPosition = {
        collateral: ethers.formatUnits(position.collateral, 6), // USDC has 6 decimals
        debt: ethers.formatEther(position.debt) // EVIX has 18 decimals
      };
      console.log('🔍 Formatted EVIX position:', formattedPosition);
      return formattedPosition;
    }
    
    console.log('🔍 No EVIX position found');
    return {
      collateral: '0',
      debt: '0'
    };
  } catch (error) {
    console.error('Error getting EVIX position:', error);
    return { collateral: '0', debt: '0' };
  }
}

export async function getUserCollateralRatioEVIX(user: string): Promise<number> {
  try {
    // V6 contracts have individual CR tracking
    const provider = getProvider();
    const contract = await getEVIXMintRedeemContract(provider);
    
    console.log('🔍 Getting EVIX CR for user:', user);
    console.log('🔍 Using EVIX V6 contract address:', EVIX_MINT_REDEEM_V6_ADDRESS);
    
    // First check if user has a position
    const position = await contract.positions(user);
    if (!position || position.debt === 0n) {
      console.log('🔍 User has no EVIX position, returning 0 CR');
      return 0;
    }
    
    // Get user's individual collateral ratio from V6 contract
    const ratio = await contract.getUserCollateralRatio(user);
    // The contract returns CR as percentage (e.g., 200 for 200%), no need for formatEther
    const crPercentage = Number(ratio);
    
    console.log('🔍 EVIX CR raw ratio:', ratio.toString());
    console.log('🔍 EVIX CR percentage:', crPercentage);
    
    return crPercentage;
  } catch (error) {
    console.error('Error getting EVIX CR:', error);
    return 0;
  }
}

