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

export function recordLiquidation(liquidation: LiquidationState & { contractStateAtLiquidation?: { collateral: string; debt: string } }) {
  const key = `${liquidation.tokenType.toLowerCase()}_${liquidation.owner}`;
  
  // Store the contract state at time of liquidation
  // This is critical - when user mints again, we subtract this to get ONLY the new mint
  const liquidationRecord = {
    ...liquidation,
    freshVaultCollateral: undefined, // No fresh vault yet
    freshVaultDebt: undefined,
    preActivationCollateral: undefined,
    preActivationDebt: undefined,
    contractStateAtLiquidation: liquidation.contractStateAtLiquidation || {
      collateral: "0",
      debt: "0"
    }
  };
  
  liquidations.set(key, liquidationRecord);
  saveLiquidations(liquidations);
  
  console.log(`📝 Liquidation recorded and vault closed:`, {
    vault: `${liquidation.tokenType} ${liquidation.owner}`,
    liquidator: liquidation.liquidator,
    payment: `$${liquidation.collateralSeized} USDC`,
    ownerRefund: `$${liquidation.ownerRefund} USDC`,
    vaultClosed: true,
    contractState: liquidationRecord.contractStateAtLiquidation
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
  
  if (!liquidation) {
    return null;
  }
  
  // If fresh vault data already exists, return it
  if (liquidation.freshVaultCollateral) {
    return liquidation;
  }
  
  // AUTO-DETECT: Check if current vault has more activity than at liquidation time
  // This happens when users mint after being liquidated
  return null; // Will be updated by detectAndUpdateFreshVaultActivity
}

export async function detectAndUpdateFreshVaultActivity(
  tokenType: string, 
  owner: string, 
  currentCollateral: number, 
  currentDebt: number
): Promise<LiquidationState | null> {
  const key = `${tokenType.toLowerCase()}_${owner}`;
  const liquidation = liquidations.get(key);
  
  if (!liquidation) {
    return null;
  }
  
  // If fresh vault data already calculated, return it
  if (liquidation.freshVaultCollateral) {
    return liquidation;
  }
  
  // LIQUIDATED VAULTS ARE GONE FOREVER
  // If there's ANY activity after liquidation, it's a COMPLETELY NEW VAULT
  if (currentCollateral > 0 || currentDebt > 0) {
    console.log(`🆕 NEW VAULT CREATED AFTER LIQUIDATION for ${tokenType} ${owner}:`);
    console.log(`   New vault: ${currentCollateral} USDC collateral, ${currentDebt} ${tokenType} debt`);
    console.log(`   Previous vault was liquidated and is gone forever`);
    
    // The current contract state IS the fresh vault - no calculations needed
    // This is a brand new vault with only the recent mint activity
    const updatedLiquidation = {
      ...liquidation,
      preActivationCollateral: "0", // Nothing before - it's a new vault
      preActivationDebt: "0",
      freshVaultCollateral: currentCollateral.toString(),
      freshVaultDebt: currentDebt.toString()
    };
    
    liquidations.set(key, updatedLiquidation);
    saveLiquidations(liquidations);
    
    return updatedLiquidation;
  }
  
  return null;
}

export function getAllLiquidations(): LiquidationState[] {
  return Array.from(liquidations.values());
}

export function clearLiquidations() {
  liquidations.clear();
  saveLiquidations(liquidations);
}