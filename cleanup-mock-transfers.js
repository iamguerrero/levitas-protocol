// Clean up old mock transfers to prevent accumulation
const fs = require('fs');

// Read current transfers
const transfers = JSON.parse(fs.readFileSync('mock-transfers.json', 'utf8'));

// Keep only the most recent transfer for each unique recipient
const recentTransfers = {};
transfers.forEach(transfer => {
  const key = `${transfer.to}-${transfer.reason}`;
  if (!recentTransfers[key] || transfer.timestamp > recentTransfers[key].timestamp) {
    recentTransfers[key] = transfer;
  }
});

// Convert back to array
const cleanedTransfers = Object.values(recentTransfers);

// Save cleaned transfers
fs.writeFileSync('mock-transfers.json', JSON.stringify(cleanedTransfers, null, 2));

console.log(`Cleaned mock transfers: ${transfers.length} -> ${cleanedTransfers.length}`);