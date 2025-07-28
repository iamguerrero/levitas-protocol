// Mock USDC transfer service for liquidation simulation
// In production, this would be handled by smart contracts

interface MockTransfer {
  from: string;
  to: string;
  amount: string;
  reason: string;
  timestamp: number;
}

// Store mock transfers in memory
const mockTransfers: MockTransfer[] = [];

export function recordMockTransfer(from: string, to: string, amount: string, reason: string) {
  const transfer: MockTransfer = {
    from: from.toLowerCase(),
    to: to.toLowerCase(),
    amount,
    reason,
    timestamp: Date.now()
  };
  
  mockTransfers.push(transfer);
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