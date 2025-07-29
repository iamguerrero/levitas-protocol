import { useState, useEffect } from 'react';

/**
 * Sprint 2.2: Consistent Pricing System
 * 
 * Uses backend simulated pricing service to ensure consistent pricing
 * across frontend and backend APIs for testing purposes.
 */
export const useRealTimeOracle = () => {
  const [bvixPrice, setBvixPrice] = useState<string>('');
  const [evixPrice, setEvixPrice] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    let updateInterval: NodeJS.Timeout | null = null;

    const updatePrices = async () => {
      try {
        // Sprint 2.2: Fetch prices from backend simulated pricing service for consistency
        const response = await fetch('/api/v1/simulated-prices');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch simulated prices: ${response.status}`);
        }
        
        const data = await response.json();
        const updateTime = new Date();
        
        setBvixPrice(data.bvix.toFixed(2));
        setEvixPrice(data.evix.toFixed(2));
        setLastUpdate(updateTime);
        setIsConnected(true);



      } catch (error) {
        setIsConnected(false);
      }
    };

    // Initialize pricing system - fetch immediately then update every 5 seconds
    updatePrices(); // Initial fetch
    
    // Set up 5-second interval to match backend simulated pricing updates
    updateInterval = setInterval(updatePrices, 5000);

    return () => {
      if (updateInterval) {
        clearInterval(updateInterval);
      }
      setIsConnected(false);
    };
  }, []);

  return { 
    bvixPrice, 
    evixPrice, 
    isConnected, 
    lastUpdate: lastUpdate?.toLocaleTimeString() 
  };
};