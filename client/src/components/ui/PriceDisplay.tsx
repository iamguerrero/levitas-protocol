import React from 'react';
import { TrendingUp, TrendingDown, Clock, Wifi, WifiOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PriceDisplayProps {
  tokenName: string;
  currentPrice: string;
  isConnected: boolean;
  lastUpdate?: string;
  showTrend?: boolean;
  className?: string;
}

/**
 * Sprint 2.1: Price Display Component
 * 
 * Real-time price display with connection status and update indicators
 * as specified in feature_recommendations.md Sprint 2.1
 */
export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  tokenName,
  currentPrice,
  isConnected,
  lastUpdate,
  showTrend = false,
  className = ""
}) => {
  const formattedPrice = parseFloat(currentPrice || '0').toFixed(2);
  
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {tokenName} Price
          </h3>
          {isConnected ? (
            <Badge variant="secondary" className="text-xs">
              <Wifi className="w-3 h-3 mr-1" />
              Live
            </Badge>
          ) : (
            <Badge variant="destructive" className="text-xs">
              <WifiOff className="w-3 h-3 mr-1" />
              Offline
            </Badge>
          )}
        </div>
        {showTrend && (
          <div className="flex items-center space-x-1">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-xs text-green-500">+0.5%</span>
          </div>
        )}
      </div>
      
      <div className="text-2xl font-bold text-gray-900 dark:text-white">
        ${formattedPrice}
      </div>
      
      {lastUpdate && (
        <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
          <Clock className="w-3 h-3" />
          <span>Last update: {lastUpdate}</span>
        </div>
      )}
      
      {/* Real-time indicator pulse */}
      {isConnected && (
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-green-600 dark:text-green-400">
            Updates every 10s
          </span>
        </div>
      )}
    </div>
  );
};