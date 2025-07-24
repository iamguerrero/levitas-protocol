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
    const volatility = 0.02; // 2% max movement per update
    const meanReversion = 0.1; // Tendency to revert to mean
    const mean = (bounds.min + bounds.max) / 2;
    
    // Random walk component
    const randomChange = (Math.random() - 0.5) * volatility * currentPrice;
    
    // Mean reversion component
    const meanReversionChange = (mean - currentPrice) * meanReversion * 0.01;
    
    // Circuit breaker: max 1% price movement per minute as specified
    const maxChange = currentPrice * 0.01;
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
        // First try to get real oracle prices
        const [realBvixPrice, realEvixPrice] = await Promise.all([
          getOraclePrice().catch(() => null),
          getEVIXPrice().catch(() => null)
        ]);

        let newBvixPrice: number;
        let newEvixPrice: number;

        // If real oracle prices are available and reasonable, use them as base
        if (realBvixPrice && parseFloat(realBvixPrice) > 0 && parseFloat(realBvixPrice) < 1000) {
          currentBvixPrice = parseFloat(realBvixPrice);
          newBvixPrice = currentBvixPrice;
        } else {
          // Generate simulated price with realistic volatility
          newBvixPrice = generateRealisticPrice(currentBvixPrice, PRICE_BOUNDS.BVIX);
          currentBvixPrice = newBvixPrice;
        }

        if (realEvixPrice && parseFloat(realEvixPrice) > 0 && parseFloat(realEvixPrice) < 1000) {
          currentEvixPrice = parseFloat(realEvixPrice);
          newEvixPrice = currentEvixPrice;
        } else {
          // Generate simulated price with realistic volatility
          newEvixPrice = generateRealisticPrice(currentEvixPrice, PRICE_BOUNDS.EVIX);
          currentEvixPrice = newEvixPrice;
        }

        const updateTime = new Date();
        const formattedBvix = newBvixPrice.toFixed(2);
        const formattedEvix = newEvixPrice.toFixed(2);

        setBvixPrice(formattedBvix);
        setEvixPrice(formattedEvix);
        setLastUpdate(updateTime);
        setIsConnected(true);

        console.log(`🔄 REAL-TIME ORACLE UPDATE: BVIX $${formattedBvix}, EVIX $${formattedEvix} at ${updateTime.toLocaleTimeString()}`);

      } catch (error) {
        console.error('Error updating oracle prices:', error);
        setIsConnected(false);
      }
    };

    // Initial price update
    updatePrices();

    // Set up 60-second interval as specified in Sprint 2.1
    updateInterval = setInterval(updatePrices, 60000); // 60 seconds = 1 minute

    console.log('🚀 Sprint 2.1 Real-time Oracle System initialized - updating every 60 seconds');

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