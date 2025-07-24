# BVIX/EVIX Minting Fix Summary

## Issue Identified
The minting functionality was failing with error `0xa7967db1` (InvalidAmount custom error) after adding oracles and liquidation functionality.

## Root Cause
The `mintWithCollateralRatio` function in the V7 contracts expects the `targetCR` parameter to be a regular integer (120-300), but the web3-secure-v7.ts file was incorrectly converting it to a wei value using `ethers.parseUnits(targetCR.toString(), 2)`.

## Fixes Applied

### 1. Fixed targetCR Parameter Handling
**File**: `client/src/lib/web3-secure-v7.ts`

**Before**:
```typescript
const targetCRWei = ethers.parseUnits(targetCR.toString(), 2);
return await vault.mintWithCollateralRatio(usdcAmountWei, targetCRWei);
```

**After**:
```typescript
return await vault.mintWithCollateralRatio(usdcAmountWei, targetCR);
```

### 2. Added Missing USDC Approval Logic
**File**: `client/src/lib/web3-secure-v7.ts`

Added complete USDC balance checking and approval logic that was present in the working version but missing in the secure version:

```typescript
// Check USDC balance first
const usdcBalance = await usdcContract.balanceOf(address);
if (usdcBalance < usdcAmountWei) {
  throw new Error(
    `Insufficient USDC balance. You have ${ethers.formatUnits(usdcBalance, 6)} USDC but need ${usdcAmount} USDC.`,
  );
}

// Check current allowance
const currentAllowance = await usdcContract.allowance(address, vault.target);

// Only approve if needed
if (currentAllowance < usdcAmountWei) {
  console.log("🔄 Approving USDC spending...");
  const approveTx = await usdcContract.approve(vault.target, usdcAmountWei);
  await approveTx.wait();
  console.log("✅ USDC approval confirmed");
} else {
  console.log("✅ Sufficient allowance already exists");
}
```

## Functions Fixed
1. `mintBVIX()` - Fixed targetCR parameter and added USDC approval
2. `mintEVIX()` - Fixed targetCR parameter and added USDC approval

## Expected Result
- Minting should now work exactly as it did before adding oracles and liquidation functionality
- The `InvalidAmount` error should be resolved
- USDC approval will be handled automatically
- Collateral ratio enforcement will work correctly with the proper targetCR values

## Testing
The fixes maintain compatibility with the existing V7 contracts and should restore the minting functionality to its previous working state while preserving all the new security features (oracles, liquidation, etc.). 