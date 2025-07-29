// Mock USDC transfer service for liquidation simulation
// In production, this would be handled by smart contracts

interface MockTransfer {
  from: string;
  to: string;
  amount: string;
  reason: string;
  timestamp: number;
}

// Persistent storage for mock USDC transfers using JSON file
import fs from 'fs';
import path from 'path';

const TRANSFERS_FILE = path.join(process.cwd(), 'mock-transfers.json');

// Load transfers from file on startup
function loadTransfers(): MockTransfer[] {
  try {
    if (fs.existsSync(TRANSFERS_FILE)) {
      const data = fs.readFileSync(TRANSFERS_FILE, 'utf8');
      const transfers = JSON.parse(data);
      console.log(`📂 Loaded ${transfers.length} mock USDC transfer records from file`);
      return transfers;
    }
  } catch (error) {
    console.error('Error loading transfers file:', error);
  }
  return [];
}

// Save transfers to file
function saveTransfers(transfers: MockTransfer[]) {
  try {
    fs.writeFileSync(TRANSFERS_FILE, JSON.stringify(transfers, null, 2));
    console.log(`💾 Saved ${transfers.length} mock USDC transfer records to file`);
  } catch (error) {
    console.error('Error saving transfers file:', error);
  }
}

// Persistent storage for mock USDC transfers
const mockTransfers = loadTransfers();

export function recordMockTransfer(from: string, to: string, amount: string, reason: string) {
  const transfer: MockTransfer = {
    from: from.toLowerCase(),
    to: to.toLowerCase(),
    amount,
    reason,
    timestamp: Date.now()
  };
  
  mockTransfers.push(transfer);
  saveTransfers(mockTransfers);
  console.log(`💸 Mock USDC Transfer: ${amount} USDC from ${from} to ${to} (${reason})`);
  
  return transfer;
}

export function getMockTransfers(address: string): MockTransfer[] {
  const lowercaseAddress = address.toLowerCase();
  return mockTransfers.filter(t => 
    t.from === lowercaseAddress || t.to === lowercaseAddress
  );
}

export function getMockUsdcBalance(address: string, baseBalance: string): string {
  const lowercaseAddress = address.toLowerCase();
  let balance = parseFloat(baseBalance);
  
  console.log(`🔍 Calculating mock USDC for ${address}: base=${baseBalance}`);
  
  // Calculate balance changes from mock transfers
  mockTransfers.forEach(transfer => {
    if (transfer.to === lowercaseAddress) {
      balance += parseFloat(transfer.amount);
      console.log(`  ➕ Received ${transfer.amount} USDC (${transfer.reason})`);
    }
    if (transfer.from === lowercaseAddress && transfer.from !== 'vault_collateral_pool') {
      balance -= parseFloat(transfer.amount);
      console.log(`  ➖ Sent ${transfer.amount} USDC (${transfer.reason})`);
    }
  });
  
  console.log(`💰 Final balance for ${address}: ${balance.toFixed(4)} USDC`);
  return balance.toFixed(4);
}

export function clearMockTransfers() {
  mockTransfers.length = 0;
}