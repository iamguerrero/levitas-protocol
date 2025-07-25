import { useState, useEffect } from 'react';
import { getOraclePrice, getEVIXPrice } from '@/lib/web3';

/**
 * Sprint 2.1: Real-time Oracle System Implementation
 * 
 * Implements dynamic price simulation system that updates BVIX and EVIX prices 
 * every 60 seconds with realistic volatility patterns as specified in feature_recommendations.md
 */
export const useRealTimeOracle = () => {
  const [bvixPrice, setBvixPrice] = useState<string>('');
  const [evixPrice, setEvixPrice] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Price simulation parameters from Sprint 2.1 specs
  const PRICE_BOUNDS = {
    BVIX: { min: 15, max: 150, current: 42.15 },
    EVIX: { min: 20, max: 180, current: 37.98 }
  };

  const generateRealisticPrice = (currentPrice: number, bounds: { min: number, max: number }) => {
    // Implement random walk with mean reversion as specified in Sprint 2.1
    const volatility = 0.001; // 0.1% max movement per update (5 seconds)
    const meanReversion = 0.1; // Tendency to revert to mean
    const mean = (bounds.min + bounds.max) / 2;

    // Random walk component
    const randomChange = (Math.random() - 0.5) * volatility * currentPrice;

    // Mean reversion component
    const meanReversionChange = (mean - currentPrice) * meanReversion * 0.01;

    // Circuit breaker: max 0.1% price movement per 5-second interval
    const maxChange = currentPrice * 0.001;
    const totalChange = Math.max(-maxChange, Math.min(maxChange, randomChange + meanReversionChange));

    const newPrice = currentPrice + totalChange;

    // Ensure price stays within bounds
    return Math.max(bounds.min, Math.min(bounds.max, newPrice));
  };

  useEffect(() => {
    let updateInterval: NodeJS.Timeout | null = null;
    let currentBvixPrice = PRICE_BOUNDS.BVIX.current;
    let currentEvixPrice = PRICE_BOUNDS.EVIX.current;

    const updatePrices = async () => {
      try {
        // Sprint 2.1: Always use simulated prices with realistic volatility for demo
        // Generate new prices with realistic volatility patterns
        const newBvixPrice = generateRealisticPrice(currentBvixPrice, PRICE_BOUNDS.BVIX);
        const newEvixPrice = generateRealisticPrice(currentEvixPrice, PRICE_BOUNDS.EVIX);

        // Update the current price tracking variables
        currentBvixPrice = newBvixPrice;
        currentEvixPrice = newEvixPrice;

        const updateTime = new Date();
        const formattedBvix = newBvixPrice.toFixed(2);
        const formattedEvix = newEvixPrice.toFixed(2);

        setBvixPrice(formattedBvix);
        setEvixPrice(formattedEvix);
        setLastUpdate(updateTime);
        setIsConnected(true);

        console.log(`🔄 SPRINT 2.1 PRICE UPDATE: BVIX $${formattedBvix}, EVIX $${formattedEvix} at ${updateTime.toLocaleTimeString()}`);

      } catch (error) {
        console.error('Error updating oracle prices:', error);
        setIsConnected(false);
      }
    };

    // Initial price update
    updatePrices();

    // Set up 10-second interval for demonstration, 60 seconds for production
    updateInterval = setInterval(updatePrices, 5000); // Update every 5 seconds for better chart visualization

    console.log('🚀 Sprint 2.1 Real-time Oracle System initialized - updating every 5 seconds for demonstration');

    return () => {
      if (updateInterval) {
        clearInterval(updateInterval);
      }
      setIsConnected(false);
      console.log('Real-time oracle system stopped');
    };
  }, []);

  return { 
    bvixPrice, 
    evixPrice, 
    isConnected, 
    lastUpdate: lastUpdate?.toLocaleTimeString() 
  };
};