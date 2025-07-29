// Grace period for recently liquidated vaults
const LIQUIDATION_GRACE_PERIOD_MS = 30000; // 30 seconds

export function isWithinLiquidationGracePeriod(liquidationTimestamp: number | undefined): boolean {
  if (!liquidationTimestamp) return false;
  
  const timeSinceLiquidation = Date.now() - liquidationTimestamp;
  return timeSinceLiquidation < LIQUIDATION_GRACE_PERIOD_MS;
}

export function getTimeSinceLiquidation(liquidationTimestamp: number | undefined): number {
  if (!liquidationTimestamp) return Infinity;
  return Date.now() - liquidationTimestamp;
}