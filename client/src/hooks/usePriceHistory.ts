
import { useState, useEffect } from 'react';

export interface PriceDataPoint {
  timestamp: number;
  price: number;
}

export interface PriceHistory {
  bvix: PriceDataPoint[];
  evix: PriceDataPoint[];
}

export function usePriceHistory() {
  const [history, setHistory] = useState<PriceHistory>({
    bvix: [],
    evix: []
  });

  const addPricePoint = (token: 'bvix' | 'evix', price: number) => {
    // Validate price data before adding
    if (!price || isNaN(price) || price <= 0 || price > 1000000) {

      return;
    }

    const now = Date.now();
    setHistory(prev => {
      // Check if we already have a recent price point (within last 30 seconds) to avoid duplicates
      const recentPoint = prev[token].find(point => now - point.timestamp < 30000);
      if (recentPoint && Math.abs(recentPoint.price - price) < 0.01) {
        return prev; // Skip if price hasn't changed significantly
      }

      const newPoint = { timestamp: now, price };
      const filteredPoints = prev[token]
        .filter(point => 
          point && 
          typeof point.price === 'number' && 
          !isNaN(point.price) && 
          point.price > 0 &&
          now - point.timestamp <= 24 * 60 * 60 * 1000 // Keep only last 24 hours
        );

      const updatedHistory = {
        ...prev,
        [token]: [...filteredPoints, newPoint]
          .sort((a, b) => a.timestamp - b.timestamp)
          .slice(-100) // Keep max 100 points to prevent memory issues
      };
      
      // Store in localStorage for persistence
      try {
        localStorage.setItem('priceHistory', JSON.stringify(updatedHistory));
      } catch (error) {

      }
      return updatedHistory;
    });
  };

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('priceHistory');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const now = Date.now();
        // Filter out old data and validate each point
        const filtered = {
          bvix: (parsed.bvix || [])
            .filter((p: PriceDataPoint) => 
              p && 
              typeof p.price === 'number' && 
              !isNaN(p.price) && 
              p.price > 0 &&
              p.timestamp &&
              !isNaN(p.timestamp) &&
              now - p.timestamp <= 24 * 60 * 60 * 1000
            ),
          evix: (parsed.evix || [])
            .filter((p: PriceDataPoint) => 
              p && 
              typeof p.price === 'number' && 
              !isNaN(p.price) && 
              p.price > 0 &&
              p.timestamp &&
              !isNaN(p.timestamp) &&
              now - p.timestamp <= 24 * 60 * 60 * 1000
            )
        };
        setHistory(filtered);
      } catch (e) {
        console.warn('Failed to parse stored price history, clearing data');
        localStorage.removeItem('priceHistory');
        setHistory({ bvix: [], evix: [] });
      }
    }
  }, []);

  return { history, addPricePoint };
}
