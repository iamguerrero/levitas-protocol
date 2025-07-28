// Script to add a simulated liquidatable position to the liquidation opportunities API
const fs = require('fs');

console.log('Creating simulated liquidatable position...');

// Read the current routes.ts file
let routesContent = fs.readFileSync('server/routes.ts', 'utf8');

// Find the liquidatable positions endpoint and inject test data
const injectionPoint = 'if (cr <= 120.25 && cr > 0 && vaultIsLiquidatable) { // Liquidatable at or below 120% CR (allow floating point precision)';

// Add test liquidatable position before the real logic
const testPosition = `
  // 🧪 SIMULATION: Add test liquidatable position for 8bac address
  const testAddress = '0xe18d3b075a241379d77fffe01ed1317dda0e8bac';
  if (userAddress.toLowerCase() === testAddress.toLowerCase() && !isLiquidated) {
    liquidatable.push({
      vaultId: liquidatable.length + 1,
      owner: testAddress,
      collateral: '600.00',
      debt: '14.30',
      currentCR: 119.8,
      liquidationPrice: (price * 1.2).toFixed(2),
      maxBonus: ((14.30 * price * 0.05)).toFixed(2),
      canLiquidate: true,
      tokenType: 'BVIX',
      contractAddress: BVIX_MINT_REDEEM_ADDRESS // V8 WORKING
    });
    console.log('🧪 Added simulated liquidatable position for 8bac at 119.8% CR');
  }

  // Hide residual liquidated vault - only show if fresh vault is significant (> $200)
  const isResidualLiquidatedVault = isLiquidated && collateral < 200;
  if (isResidualLiquidatedVault) {
    console.log('🚫 Hiding residual liquidated vault:', { collateral, debt, cr: cr.toFixed(2) });
    continue; // Skip this vault
  }

  `;

// Insert the test logic before the real liquidation check
if (routesContent.includes(injectionPoint)) {
  routesContent = routesContent.replace(injectionPoint, testPosition + injectionPoint);
  fs.writeFileSync('server/routes.ts', routesContent);
  console.log('✅ Added simulated liquidatable position logic to routes.ts');
  console.log('📍 Test position: 0xe18d3b075a241379d77fffe01ed1317dda0e8bac');
  console.log('   - Collateral: $600 USDC');
  console.log('   - Debt: 14.30 BVIX');
  console.log('   - CR: 119.8% (liquidatable)');
  console.log('🚫 Also hiding residual liquidated vaults under $200');
} else {
  console.log('❌ Could not find injection point in routes.ts');
}