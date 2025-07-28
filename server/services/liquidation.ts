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
  preActivationDebt?: string;
  preActivationCollateral?: string;
  freshVaultCollateral?: string;
  freshVaultDebt?: string;
}

// Persistent storage for liquidations using JSON file
import fs from 'fs';
import path from 'path';

const LIQUIDATIONS_FILE = path.join(process.cwd(), 'liquidations.json');

// Load liquidations from file on startup
function loadLiquidations(): Map<string, LiquidationState> {
  try {
    if (fs.existsSync(LIQUIDATIONS_FILE)) {
      const data = fs.readFileSync(LIQUIDATIONS_FILE, 'utf8');
      const parsed = JSON.parse(data);
      const map = new Map<string, LiquidationState>();
      for (const [key, value] of Object.entries(parsed)) {
        map.set(key, value as LiquidationState);
      }
      console.log(`📂 Loaded ${map.size} liquidation records from file`);
      return map;
    }
  } catch (error) {
    console.error('Error loading liquidations file:', error);
  }
  return new Map<string, LiquidationState>();
}

// Save liquidations to file
function saveLiquidations(liquidations: Map<string, LiquidationState>) {
  try {
    const obj = Object.fromEntries(liquidations.entries());
    fs.writeFileSync(LIQUIDATIONS_FILE, JSON.stringify(obj, null, 2));
    console.log(`💾 Saved ${liquidations.size} liquidation records to file`);
  } catch (error) {
    console.error('Error saving liquidations file:', error);
  }
}

// Persistent storage for liquidations
const liquidations = loadLiquidations();

export function recordLiquidation(liquidation: LiquidationState) {
  const key = `${liquidation.tokenType.toLowerCase()}_${liquidation.owner}`;
  liquidations.set(key, liquidation);
  saveLiquidations(liquidations);
  
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

export function clearVaultLiquidation(tokenType: string, owner: string): void {
  const key = `${tokenType.toLowerCase()}_${owner}`;
  liquidations.delete(key);
  saveLiquidations(liquidations);
  console.log(`🗑️ Cleared liquidation record for ${tokenType} vault: ${owner}`);
}

export function hasFreshVaultAfterLiquidation(tokenType: string, owner: string): LiquidationState | null {
  const key = `${tokenType.toLowerCase()}_${owner}`;
  const liquidation = liquidations.get(key);
  return liquidation && liquidation.freshVaultCollateral ? liquidation : null;
}

export function getAllLiquidations(): LiquidationState[] {
  return Array.from(liquidations.values());
}

export function clearLiquidations() {
  liquidations.clear();
  saveLiquidations(liquidations);
}