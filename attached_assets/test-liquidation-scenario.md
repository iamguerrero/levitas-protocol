# Test Liquidation Scenario

## Current State:
- **Owner (c24b)**: 300 USDC collateral, 6 BVIX debt at 118.62% CR
- **Liquidator (8bac)**: Should have at least 6 BVIX to liquidate

## Expected Results After Liquidation:

### 1. Vault State:
- c24b's vault should show 0/0 (closed)
- Vault should disappear from liquidation opportunities

### 2. Balance Changes:
- **Liquidator (8bac)**:
  - BVIX: -6 (burned to repay debt)
  - USDC: +265.54 (debt value $252.90 + 5% bonus $12.64)
  
- **Owner (c24b)**:
  - BVIX: No change (keeps personal 23.57 BVIX)
  - USDC: +34.46 (remaining collateral: $300 - $265.54)

### 3. Transaction History:
- Liquidator sees GREEN badge: "Earned $12.64 bonus"
- Owner sees RED badge: "Vault liquidated, received $34.46 refund"

### 4. Liquidation Record:
- Stored in liquidations.json with:
  - contractStateAtLiquidation: { collateral: "1495.5", debt: "29.567022514827997" }
  - This ensures future mints show as fresh vaults

## Test Steps:
1. Execute liquidation from 8bac wallet
2. Verify all 4 expected results above
3. If owner mints again, it should show as a fresh vault