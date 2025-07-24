import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const SIMULATOR_ADDRESS = '0xd77c6Aa166064ADddE20A3F382e621b91F980De7';
const BASE_SEPOLIA_RPC = 'https://sepolia.base.org';
const WS_URL = 'wss://base-sepolia.publicnode.com';

const ABI = [
  'event PriceUpdated(string indexed token, uint256 oldPrice, uint256 newPrice, uint256 timestamp)',
  'function getSimulationStatus() external view returns (bool active, uint256 bvixPrice, uint256 evixPrice, uint256 lastUpdate, uint256 nextUpdateTime)'
];

export const useRealTimeOracle = () => {
  const [bvixPrice, setBvixPrice] = useState<string>('');
  const [evixPrice, setEvixPrice] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    let provider: ethers.WebSocketProvider | null = null;
    let contract: ethers.Contract | null = null;
    let pollInterval: NodeJS.Timeout | null = null;
    let httpProvider: ethers.JsonRpcProvider | null = null;
    let connectionRetries = 0;
    const maxRetries = 3;

    const setupWebSocket = async () => {
      if (connectionRetries >= maxRetries) {
        console.log('Max WebSocket retries reached, using polling fallback');
        setupPolling();
        return;
      }

      try {
        console.log(`Setting up WebSocket connection for real-time oracle (attempt ${connectionRetries + 1}/${maxRetries})...`);
        provider = new ethers.WebSocketProvider(WS_URL);
        
        // Test the connection first
        await provider.getNetwork();
        
        contract = new ethers.Contract(SIMULATOR_ADDRESS, ABI, provider);

        const onPriceUpdated = (token: string, oldPrice: bigint, newPrice: bigint, timestamp: bigint) => {
          const formatted = ethers.formatUnits(newPrice, 8);
          const updateTime = new Date();
          
          if (token === 'BVIX') {
            setBvixPrice(formatted);
          } else if (token === 'EVIX') {
            setEvixPrice(formatted);
          }
          
          setLastUpdate(updateTime);
          console.log(`🔴 REAL-TIME UPDATE: ${token} = $${formatted} at ${updateTime.toLocaleTimeString()}`);
        };

        const onError = (error: any) => {
          console.error('WebSocket error:', error);
          setIsConnected(false);
          connectionRetries++;
          setTimeout(() => setupWebSocket(), 5000);
        };

        provider.on('error', onError);
        contract.on('PriceUpdated', onPriceUpdated);
        
        setIsConnected(true);
        console.log('✅ WebSocket connected and listening for price updates');

        // Initial price fetch
        await fetchCurrentPrices();

      } catch (error) {
        console.error('Failed to setup WebSocket:', error);
        setIsConnected(false);
        connectionRetries++;
        
        if (connectionRetries < maxRetries) {
          console.log(`Retrying WebSocket connection in 5 seconds...`);
          setTimeout(() => setupWebSocket(), 5000);
        } else {
          setupPolling();
        }
      }
    };

    const setupPolling = () => {
      console.log('🔄 Setting up polling fallback for oracle prices (every 15 seconds)...');
      httpProvider = new ethers.JsonRpcProvider(BASE_SEPOLIA_RPC);
      
      const poll = async () => {
        await fetchCurrentPrices();
      };

      // Poll every 15 seconds as fallback
      pollInterval = setInterval(poll, 15000);
      poll(); // Initial fetch
    };

    const fetchCurrentPrices = async () => {
      try {
        const currentProvider = provider || httpProvider;
        if (!currentProvider) return;

        const simulatorContract = new ethers.Contract(SIMULATOR_ADDRESS, ABI, currentProvider);
        const status = await simulatorContract.getSimulationStatus();
        
        const bvixFormatted = ethers.formatUnits(status.bvixPrice, 8);
        const evixFormatted = ethers.formatUnits(status.evixPrice, 8);
        
        setBvixPrice(bvixFormatted);
        setEvixPrice(evixFormatted);
        setLastUpdate(new Date());
        
        console.log(`📊 Polled prices: BVIX $${bvixFormatted}, EVIX $${evixFormatted}`);
        
        if (!isConnected && !provider) {
          setIsConnected(true); // Mark as connected via polling
        }
      } catch (error) {
        console.error('Error fetching current prices:', error);
        setIsConnected(false);
      }
    };

    // Try WebSocket first, fallback to polling
    setupWebSocket();

    return () => {
      if (contract) {
        contract.removeAllListeners('PriceUpdated');
      }
      if (provider) {
        provider.removeAllListeners('error');
        provider.destroy();
      }
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      setIsConnected(false);
      console.log('Oracle connection cleaned up');
    };
  }, []);

  return { 
    bvixPrice, 
    evixPrice, 
    isConnected, 
    lastUpdate: lastUpdate?.toLocaleTimeString() 
  };
}; 