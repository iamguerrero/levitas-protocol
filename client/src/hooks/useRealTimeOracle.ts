import { useState, useEffect } from 'react';

export function useRealTimeOracle() {
  const [bvixPrice, setBvixPrice] = useState<string>("0.00");
  const [evixPrice, setEvixPrice] = useState<string>("0.00");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🚀 Sprint 2.1 Real-time Oracle System initialized - updating every 10 seconds for demonstration');

    // Simulate price updates every 10 seconds
    const updatePrices = () => {
      try {
        // Generate realistic BVIX price (15-150 range)
        const newBvixPrice = (Math.random() * (50 - 35) + 35).toFixed(2);
        // Generate realistic EVIX price (20-180 range)  
        const newEvixPrice = (Math.random() * (45 - 30) + 30).toFixed(2);

        setBvixPrice(newBvixPrice);
        setEvixPrice(newEvixPrice);
        setLastUpdate(new Date());
        setIsConnected(true);
        setError(null);

        console.log(`🔄 SPRINT 2.1 PRICE UPDATE: BVIX $${newBvixPrice}, EVIX $${newEvixPrice} at ${new Date().toLocaleTimeString()}`);
      } catch (err) {
        console.error('Error updating prices:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsConnected(false);
      }
    };

    // Initial price update
    updatePrices();

    // Set up interval for regular updates
    const updateInterval = setInterval(updatePrices, 10000);

    return () => {
      if (updateInterval) {
        clearInterval(updateInterval);
      }
      setIsConnected(false);
      console.log('Real-time oracle system stopped');
    };
  }, []); // Empty dependency array ensures this effect runs once

  return { 
    bvixPrice, 
    evixPrice, 
    isConnected, 
    lastUpdate: lastUpdate?.toLocaleTimeString(),
    error
  };
}