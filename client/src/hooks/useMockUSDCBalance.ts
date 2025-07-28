import { useEffect, useState } from 'react';
import { useWallet } from './use-wallet';

export function useMockUSDCBalance() {
  const { address } = useWallet();
  const [mockBalance, setMockBalance] = useState<number>(0);

  useEffect(() => {
    if (!address) return;

    const checkMockBalance = () => {
      const mockBalances = JSON.parse(localStorage.getItem('mock-usdc-balances') || '{}');
      const balance = mockBalances[address] || 0;
      setMockBalance(balance);
    };

    // Check initially
    checkMockBalance();

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'mock-usdc-balances') {
        checkMockBalance();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically in case localStorage changes from same tab
    const interval = setInterval(checkMockBalance, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [address]);

  return mockBalance;
}

export function getMockUSDCBalanceDisplay(realBalance: string, mockBalance: number): string {
  const realBalanceNum = parseFloat(realBalance || '0');
  const totalBalance = realBalanceNum + mockBalance;
  
  if (mockBalance > 0) {
    return `${totalBalance.toFixed(2)} (+${mockBalance.toFixed(2)} from liquidations)`;
  }
  
  return realBalanceNum.toFixed(2);
}