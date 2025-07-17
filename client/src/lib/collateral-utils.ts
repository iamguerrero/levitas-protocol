import { ethers } from "ethers";

export interface CollateralCalculation {
  maxMintableUSDC: number;
  maxMintableTokens: number;
  currentCR: number;
  futureCR: number;
  isValid: boolean;
  warningMessage?: string;
}

export interface VaultStats {
  usdc: string;
  bvix: string;
  cr: number;
  price: string;
  usdcValue: number;
  bvixValueInUsd: number;
}

/**
 * Calculate maximum mintable amount maintaining 120% collateral ratio
 */
export function calculateMaxMintable(
  usdcInput: number,
  tokenPrice: number,
  vaultStats: VaultStats,
  minCollateralRatio: number = 120
): CollateralCalculation {
  const currentVaultUSDC = parseFloat(vaultStats.usdc);
  const currentTokenSupply = parseFloat(vaultStats.bvix);
  
  // If vault has no collateral, can't mint anything
  if (currentVaultUSDC === 0) {
    return {
      maxMintableUSDC: 0,
      maxMintableTokens: 0,
      currentCR: 0,
      futureCR: 0,
      isValid: false,
      warningMessage: "Vault has no collateral. Use 'Add Collateral' to fund the vault first."
    };
  }

  // Calculate future state after minting
  const futureVaultUSDC = currentVaultUSDC + usdcInput;
  const tokensToMint = (usdcInput * 0.997) / tokenPrice; // 0.3% mint fee
  const actualTokensToMint = usdcInput / tokenPrice * 0.997;
  const futureTokenSupply = currentTokenSupply + tokensToMint;
  const futureTokenValueUSD = futureTokenSupply * tokenPrice;
  
  const futureCR = futureTokenValueUSD > 0 ? (futureVaultUSDC / futureTokenValueUSD) * 100 : 0;
  
  // Calculate maximum mintable USDC while maintaining min CR
  const maxTokenValue = (currentVaultUSDC + usdcInput) / (minCollateralRatio / 100);
  const maxMintableTokens = Math.max(0, (maxTokenValue - (currentTokenSupply * tokenPrice)) / tokenPrice);
  const maxMintableUSDC = maxMintableTokens * tokenPrice / 0.997; // Account for fee
  
  return {
    maxMintableUSDC: Math.max(0, maxMintableUSDC),
    maxMintableTokens: actualTokensToMint,
    currentCR: vaultStats.cr,
    futureCR,
    isValid: futureCR >= minCollateralRatio,
    warningMessage: futureCR < minCollateralRatio ? 
      `This would drop collateral ratio to ${futureCR.toFixed(1)}%. Minimum is ${minCollateralRatio}%.` : 
      undefined
  };
}

/**
 * Calculate suggested mint amount for optimal collateral ratio
 */
export function calculateSuggestedMint(
  vaultStats: VaultStats,
  tokenPrice: number,
  targetCR: number = 150
): number {
  const currentVaultUSDC = parseFloat(vaultStats.usdc);
  const currentTokenSupply = parseFloat(vaultStats.bvix);
  
  if (currentVaultUSDC === 0) return 0;
  
  // Calculate how much we can mint to achieve target CR
  const maxTokenValue = currentVaultUSDC / (targetCR / 100);
  const maxMintableTokens = Math.max(0, (maxTokenValue - (currentTokenSupply * tokenPrice)) / tokenPrice);
  const suggestedUSDC = maxMintableTokens * tokenPrice / 0.997; // Account for fee
  
  return Math.max(0, suggestedUSDC);
}

/**
 * Format collateral ratio with color coding
 */
export function formatCRWithStatus(cr: number): { text: string; color: string; level: 'green' | 'yellow' | 'red' } {
  if (cr >= 150) {
    return { text: `${cr.toFixed(1)}% (Healthy)`, color: 'text-green-600', level: 'green' };
  } else if (cr >= 120) {
    return { text: `${cr.toFixed(1)}% (Acceptable)`, color: 'text-yellow-600', level: 'yellow' };
  } else {
    return { text: `${cr.toFixed(1)}% (Risky)`, color: 'text-red-600', level: 'red' };
  }
}