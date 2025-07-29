// Script to create a liquidatable position for testing
const fs = require('fs');

// Create mock transfers to simulate a new position at 8bac address
const mockTransfers = JSON.parse(fs.readFileSync('mock-transfers.json', 'utf8'));

// Add new BVIX position for 8bac address at 119% CR
const testAddress = '0xe18d3b075a241379d77fffe01ed1317dda0e8bac';
const testAmount = 500; // $500 USDC

// Remove any existing entries for this address to start fresh
const filteredTransfers = mockTransfers.filter(t => 
  !(t.to.toLowerCase() === testAddress.toLowerCase() && t.type === 'mint')
);

// Add new mint transaction for liquidatable position
// At 119% CR: 500 USDC should mint about 11.9 BVIX (at $42 price)
filteredTransfers.push({
  to: testAddress,
  amount: testAmount,
  type: 'mint',
  token: 'BVIX',
  timestamp: Date.now(),
  collateralRatio: 119, // Just below liquidation threshold
  description: 'Test liquidation position at 119% CR'
});

// Write back to file
fs.writeFileSync('mock-transfers.json', JSON.stringify(filteredTransfers, null, 2));

console.log(`✅ Created liquidatable BVIX position for ${testAddress}:`);
console.log(`   - Collateral: $${testAmount} USDC`);
console.log(`   - Expected debt: ~${(testAmount / 42 * 0.119).toFixed(2)} BVIX`);
console.log(`   - Collateral Ratio: 119% (liquidatable)`);
console.log('Restart the server to see the new position in liquidation opportunities.');