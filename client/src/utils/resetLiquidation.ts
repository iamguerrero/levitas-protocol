// Utility to reset liquidation state for testing
export function resetLiquidationState() {
  localStorage.removeItem('liquidatedVaults');
  localStorage.removeItem('mockBalances');
  localStorage.removeItem('liquidationHistory');
  console.log('Liquidation state reset');
}