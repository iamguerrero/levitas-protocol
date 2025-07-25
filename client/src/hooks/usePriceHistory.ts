
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
    const now = Date.now();
    setHistory(prev => {
      const newPoint = { timestamp: now, price };
      const updatedHistory = {
        ...prev,
        [token]: [...prev[token], newPoint]
          .filter(point => now - point.timestamp <= 24 * 60 * 60 * 1000) // Keep only last 24 hours
          .sort((a, b) => a.timestamp - b.timestamp)
      };
      
      // Store in localStorage for persistence
      localStorage.setItem('priceHistory', JSON.stringify(updatedHistory));
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
        // Filter out old data
        const filtered = {
          bvix: parsed.bvix?.filter((p: PriceDataPoint) => now - p.timestamp <= 24 * 60 * 60 * 1000) || [],
          evix: parsed.evix?.filter((p: PriceDataPoint) => now - p.timestamp <= 24 * 60 * 60 * 1000) || []
        };
        setHistory(filtered);
      } catch (e) {
        console.warn('Failed to parse stored price history');
      }
    }
  }, []);

  return { history, addPricePoint };
}
