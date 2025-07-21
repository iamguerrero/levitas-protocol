import { useQuery } from '@tanstack/react-query';

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

export function useVault() {
  const { data, error, isLoading, isError, refetch } = useQuery<VaultStats>({
    queryKey: ['/api/v1/vault-stats'],
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