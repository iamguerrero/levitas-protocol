import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

export interface VaultStats {
  usdc: string;
  bvix: string;
  cr: number;
  price: string;
  usdcValue: number;
  bvixValueInUsd: number;
}

export interface VaultStatus {
  level: 'green' | 'yellow' | 'red';
  message: string;
}

function getProvider() {
  if (typeof window !== 'undefined' && window.ethereum) {
    return window.ethereum;
  }
  throw new Error('MetaMask not found');
}

export function useVault() {
  const [userAddress, setUserAddress] = useState<string | null>(null);
  
  useEffect(() => {
    const loadAddress = async () => {
      try {
        const provider = getProvider();
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        if (accounts.length > 0) {
          setUserAddress(accounts[0]);
        }
      } catch (error) {
        console.error('Failed to load address:', error);
      }
    };
    loadAddress();
  }, []);

  const { data, error, isLoading, isError, refetch } = useQuery<VaultStats>({
    queryKey: ['/api/v1/vault-stats', userAddress],
    queryFn: async () => {
      const url = userAddress 
        ? `/api/v1/vault-stats?address=${userAddress}`
        : '/api/v1/vault-stats';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!userAddress,
    refetchInterval: 3000, // Refetch every 3 seconds for real-time updates
    staleTime: 1000, // Consider data stale after 1 second
    retry: 3,
    retryDelay: 1000,
  });

  // Derive status based on collateral ratio
  const getStatus = (cr: number): VaultStatus => {
    if (cr >= 120) {
      return { level: 'green', message: 'Healthy' };
    } else if (cr >= 110) {
      return { level: 'yellow', message: 'Moderate risk' };
    } else {
      return { level: 'red', message: 'High risk - Below 110%' };
    }
  };

  const status = data ? getStatus(data.cr) : { level: 'green', message: 'Loading...' };

  return {
    data,
    status,
    error,
    isLoading,
    isError,
    refetch,
  };
}