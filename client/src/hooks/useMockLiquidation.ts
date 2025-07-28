import { ethers } from 'ethers';
import { getSigner } from '@/lib/web3';

// Mock liquidation wallet that holds USDC for liquidation payments
// In a real system, this would be the vault contract itself
const MOCK_LIQUIDATION_WALLET = '0x4EdC2EEbaB31C40ACc0a17f8E2F1E41aFa6BF221'; // Wallet with lots of USDC for testing

export async function executeMockLiquidation({
  vaultOwner,
  liquidatorAddress,
  liquidatorPayment,
  ownerRefund,
  tokenType,
  debtAmount
}: {
  vaultOwner: string;
  liquidatorAddress: string; 
  liquidatorPayment: number; // USDC amount liquidator receives (debt value + bonus)
  ownerRefund: number; // USDC amount owner gets back
  tokenType: string;
  debtAmount: string; // Token amount in wei
}) {
  const signer = await getSigner();
  
  // Get USDC contract
  const usdcContract = new ethers.Contract(
    '0x9CC37B36FDd8CF5c0297BE15b75663Bf2a193297', // MockUSDC
    [
      'function transfer(address to, uint256 amount) external returns (bool)',
      'function balanceOf(address account) external view returns (uint256)'
    ],
    signer
  );

  // Convert USDC amounts to wei (6 decimals)
  const liquidatorPaymentWei = ethers.parseUnits(liquidatorPayment.toFixed(2), 6);
  const ownerRefundWei = ethers.parseUnits(Math.max(0, ownerRefund).toFixed(2), 6);

  console.log('💰 Mock Liquidation USDC Transfers:', {
    liquidatorPayment: `$${liquidatorPayment.toFixed(2)}`,
    ownerRefund: `$${ownerRefund.toFixed(2)}`,
    mockWallet: MOCK_LIQUIDATION_WALLET
  });

  // In a real V8 contract, these transfers would be done by the contract
  // For mock, we need a wallet with USDC to simulate
  // The liquidator already transferred tokens to owner, now we handle USDC
  
  // Note: Since we can't actually transfer from MOCK_LIQUIDATION_WALLET without its private key,
  // we'll track the expected transfers in localStorage for UI display
  
  const mockTransfers = {
    liquidatorPayment: liquidatorPayment.toFixed(2),
    ownerRefund: ownerRefund.toFixed(2),
    timestamp: Date.now()
  };
  
  // Store mock transfers
  const existingTransfers = JSON.parse(localStorage.getItem('mock-liquidation-transfers') || '[]');
  existingTransfers.push(mockTransfers);
  localStorage.setItem('mock-liquidation-transfers', JSON.stringify(existingTransfers));
  
  // Update mock balances in localStorage for UI display
  const mockBalances = JSON.parse(localStorage.getItem('mock-usdc-balances') || '{}');
  
  // Initialize if not exists
  if (!mockBalances[liquidatorAddress]) mockBalances[liquidatorAddress] = 0;
  if (!mockBalances[vaultOwner]) mockBalances[vaultOwner] = 0;
  
  // Apply transfers
  mockBalances[liquidatorAddress] += liquidatorPayment;
  mockBalances[vaultOwner] += ownerRefund;
  
  localStorage.setItem('mock-usdc-balances', JSON.stringify(mockBalances));
  
  console.log('✅ Mock liquidation transfers recorded:', {
    liquidator: `+$${liquidatorPayment.toFixed(2)} USDC`,
    owner: `+$${ownerRefund.toFixed(2)} USDC`
  });
  
  return mockTransfers;
}