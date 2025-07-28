import { ethers } from 'ethers';

// Track liquidation state
interface LiquidationState {
  tokenType: string;
  owner: string;
  liquidator: string;
  debtRepaid: string;
  collateralSeized: string;
  bonus: string;
  ownerRefund: string;
  timestamp: number;
  txHash: string;
}

// In-memory storage for liquidations (in production, use database)
const liquidations = new Map<string, LiquidationState>();

export function recordLiquidation(liquidation: LiquidationState) {
  const key = `${liquidation.tokenType.toLowerCase()}_${liquidation.owner}`;
  liquidations.set(key, liquidation);
  
  console.log(`📝 Liquidation recorded:`, {
    vault: `${liquidation.tokenType} ${liquidation.owner}`,
    liquidator: liquidation.liquidator,
    payment: `$${liquidation.collateralSeized} USDC`,
    ownerRefund: `$${liquidation.ownerRefund} USDC`
  });
}

export function isVaultLiquidated(tokenType: string, owner: string): boolean {
  const key = `${tokenType.toLowerCase()}_${owner}`;
  return liquidations.has(key);
}

export function getLiquidation(tokenType: string, owner: string): LiquidationState | null {
  const key = `${tokenType.toLowerCase()}_${owner}`;
  return liquidations.get(key) || null;
}

export function getAllLiquidations(): LiquidationState[] {
  return Array.from(liquidations.values());
}

export function clearLiquidations() {
  liquidations.clear();
}