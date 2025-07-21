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

export const BASE_SEPOLIA_CHAIN_ID = "0x14a34";
export const BASE_SEPOLIA_RPC_URL = "https://sepolia.base.org";

// Contract addresses - V6 with position tracking and surplus refunding
export const BVIX_ADDRESS = "0x2E3bef50887aD2A30069c79D19Bb91085351C92a"; // Fresh BVIX token

// V6 contract addresses deployed to Base Sepolia
export const BVIX_MINT_REDEEM_V6_ADDRESS = '0x65Bec0Ab96ab751Fd0b1D9c907342d9A61FB1117'; // BVIX V6
export const EVIX_MINT_REDEEM_V6_ADDRESS = '0x6C3e986c4cc7b3400de732440fa01B66FF9172Cf'; // EVIX V6

// Legacy V5 addresses (for backward compatibility)
export const MINT_REDEEM_ADDRESS = '0x4d0ddFBCBa76f2e72B0Fef2fdDcaE9ddd6922397'; // V5 with faucet USDC
export const EVIX_MINT_REDEEM_ADDRESS = "0xb187c5Ff48D69BB0b477dAf30Eec779E0D07771D"; // EVIX V5 with faucet USDC

export const EVIX_ADDRESS = "0x7066700CAf442501B308fAe34d5919091e1b2380"; // Fresh EVIX token
export const ORACLE_ADDRESS = "0x85485dD6cFaF5220150c413309C61a8EA24d24FE";
export const MOCK_USDC_ADDRESS = "0x9CC37B36FDd8CF5c0297BE15b75663Bf2a193297"; // MockUSDC with public faucet
export const EVIX_ORACLE_ADDRESS = "0xCd7441A771a7F84E58d98E598B7Ff23A3688094F";

// Contract factory functions
export const getBVIXContract = (providerOrSigner: any) =>
  new ethers.Contract(BVIX_ADDRESS, BVIX_ABI, providerOrSigner);

export const getEVIXContract = (providerOrSigner: any) =>
  new ethers.Contract(EVIX_ADDRESS, EVIX_ABI, providerOrSigner);

export const getOracleContract = (providerOrSigner: any) =>
  new ethers.Contract(ORACLE_ADDRESS, Oracle_ABI, providerOrSigner);

export const getMintRedeemContract = (providerOrSigner: any) =>
  new ethers.Contract(BVIX_MINT_REDEEM_V6_ADDRESS, MintRedeem_ABI, providerOrSigner);

export const getUSDCContract = (providerOrSigner: any) =>
  new ethers.Contract(MOCK_USDC_ADDRESS, USDC_ABI, providerOrSigner);

export const getEVIXOracleContract = (providerOrSigner: any) =>
  new ethers.Contract(EVIX_ORACLE_ADDRESS, EVIXOracle_ABI, providerOrSigner);

export const getEVIXMintRedeemContract = (providerOrSigner: any) =>
  new ethers.Contract(EVIX_MINT_REDEEM_V6_ADDRESS, EVIXMintRedeem_ABI, providerOrSigner);

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

export async function getEVIXBalance(address: string): Promise<string> {
  try {
    const provider = getProvider();
    const evixContract = getEVIXContract(provider);
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
    const usdcContract = getUSDCContract(provider);
    
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
    const oracleContract = getOracleContract(provider);
    const price = await oracleContract.getPrice();
    return ethers.formatEther(price);
  } catch (error) {
    console.error("Error getting oracle price:", error);
    return "42.15"; // Fallback price
  }
}

// Get EVIX price from oracle
export async function getEVIXPrice(): Promise<string> {
  try {
    const provider = getProvider();
    const evixOracle = getEVIXOracleContract(provider);
    const priceRaw = await evixOracle.getPrice();
    // The oracle stores price as a large integer (e.g. 379800000000 for $37.98)
    // Convert to proper decimal format
    const price = parseFloat(ethers.formatUnits(priceRaw, 8)) / 10000000000;
    return price.toFixed(2);
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
  const mintRedeemContract = getMintRedeemContract(signer);
  const usdcContract = getUSDCContract(signer);

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

export async function mintEVIX(
  usdcAmount: string,
  targetCR: number = 150,
): Promise<ethers.ContractTransactionResponse> {
  console.log("🚀 Starting EVIX mint process for", usdcAmount, "USDC at", targetCR + "% CR");
  
  const signer = await getSigner();
  const address = await signer.getAddress();
  const evixMintRedeemContract = getEVIXMintRedeemContract(signer);
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
  const evixMintRedeemContract = getEVIXMintRedeemContract(signer);
  const evixContract = getEVIXContract(signer);

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
    const usdc = getUSDCContract(provider);
    const bvix = getBVIXContract(provider);

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

export async function getUserPosition(user: string) {
  try {
    // V6 contracts have individual position tracking
    const provider = getProvider();
    const contract = getMintRedeemContract(provider);
    
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
    const contract = getMintRedeemContract(provider);
    
    console.log('🔍 Getting BVIX CR for user:', user);
    
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
    const contract = getEVIXMintRedeemContract(provider);
    
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
    const contract = getEVIXMintRedeemContract(provider);
    
    console.log('🔍 Getting EVIX CR for user:', user);
    console.log('🔍 Using EVIX V6 contract address:', EVIX_MINT_REDEEM_V6_ADDRESS);
    
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

