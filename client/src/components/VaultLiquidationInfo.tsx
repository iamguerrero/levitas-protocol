import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  AlertTriangle, 
  TrendingDown,
  Info,
  DollarSign,
  Shield
} from 'lucide-react';
import { useLiquidationPrice } from '@/hooks/useLiquidationFeatures';
import { getProvider } from '@/lib/web3';

interface VaultLiquidationInfoProps {
  tokenType: 'BVIX' | 'EVIX';
  userAddress?: string;
  collateral: string;
  debt: string;
  currentPrice: string;
  className?: string;
  onLiquidate?: () => void;
}

export function VaultLiquidationInfo({ 
  tokenType, 
  userAddress,
  collateral,
  debt,
  currentPrice,
  className = "",
  onLiquidate
}: VaultLiquidationInfoProps) {
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const displayAddress = userAddress || connectedAddress;
  const { data: liquidationData, isLoading } = useLiquidationPrice(displayAddress, tokenType);
  
  useEffect(() => {
    const loadAddress = async () => {
      try {
        const provider = getProvider();
        const accounts = await provider.send('eth_requestAccounts', []);
        if (accounts.length > 0) {
          setConnectedAddress(accounts[0]);
        }
      } catch (error) {
        console.error('Failed to load address:', error);
      }
    };
    loadAddress();
  }, []);
  
  if (isLoading || !liquidationData) {
    return null;
  }
  
  const { liquidationPrice, currentCR, isAtRisk, canBeLiquidated } = liquidationData;
  
  // Calculate price distance to liquidation
  const priceDistance = ((parseFloat(currentPrice) - parseFloat(liquidationPrice)) / parseFloat(currentPrice)) * 100;
  
  const getRiskColor = (cr: number) => {
    if (cr < 120) return 'text-red-600';
    if (cr < 125) return 'text-orange-600';
    if (cr < 150) return 'text-yellow-600';
    return 'text-green-600';
  };
  
  const getRiskBadge = () => {
    if (canBeLiquidated) return <Badge variant="destructive">Liquidatable</Badge>;
    if (isAtRisk) return <Badge className="bg-orange-500">At Risk</Badge>;
    return <Badge variant="secondary">Safe</Badge>;
  };
  
  return (
    <div className={`space-y-3 ${className}`}>
      <Separator />
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Liquidation Info</span>
          {getRiskBadge()}
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-500">Current CR</p>
            <p className={`font-semibold ${getRiskColor(currentCR)}`}>
              {currentCR.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-gray-500">Liquidation Price</p>
            <p className="font-semibold">
              ${parseFloat(liquidationPrice).toFixed(2)}
            </p>
          </div>
        </div>
        
        {priceDistance < 20 && (
          <div className="mt-2">
            <div className="flex justify-between text-xs mb-1">
              <span>Distance to Liquidation</span>
              <span className="font-medium">{priceDistance.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${
                  priceDistance < 5 ? 'bg-red-600' : 
                  priceDistance < 10 ? 'bg-orange-500' : 'bg-yellow-500'
                }`}
                style={{ width: `${Math.max(5, priceDistance)}%` }}
              />
            </div>
          </div>
        )}
      </div>
      
      {canBeLiquidated && (
        <>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-semibold mb-1">Position Can Be Liquidated!</p>
              <p className="text-xs">
                Your collateral ratio is below 120%. Anyone can liquidate this position.
              </p>
            </AlertDescription>
          </Alert>
          
          {onLiquidate && userAddress !== connectedAddress && (
            <Button 
              onClick={onLiquidate}
              className="w-full bg-red-600 hover:bg-red-700"
              size="sm"
            >
              <TrendingDown className="h-4 w-4 mr-2" />
              Liquidate This Position
            </Button>
          )}
        </>
      )}
      
      {isAtRisk && !canBeLiquidated && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Position approaching liquidation threshold. Consider adding collateral.
          </AlertDescription>
        </Alert>
      )}
      
      {!isAtRisk && !canBeLiquidated && currentCR < 150 && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Shield className="h-3 w-3" />
          <span>Maintain CR above 150% for safety</span>
        </div>
      )}
      
      {/* Liquidation calculation breakdown */}
      {parseFloat(debt) > 0 && (
        <div className="pt-2 space-y-1 text-xs text-gray-500">
          <p>Liquidation Formula: P_liq = Collateral / (Debt × 1.2)</p>
          <p>= ${parseFloat(collateral).toFixed(2)} / ({parseFloat(debt).toFixed(2)} × 1.2)</p>
          <p>= ${parseFloat(liquidationPrice).toFixed(2)}</p>
        </div>
      )}
    </div>
  );
}

// Simplified component for displaying just the liquidation price
export function LiquidationPriceBadge({ 
  tokenType, 
  userAddress 
}: { 
  tokenType: 'BVIX' | 'EVIX'; 
  userAddress?: string;
}) {
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const displayAddress = userAddress || connectedAddress;
  const { data: liquidationData } = useLiquidationPrice(displayAddress, tokenType);
  
  useEffect(() => {
    const loadAddress = async () => {
      try {
        const provider = getProvider();
        const accounts = await provider.send('eth_requestAccounts', []);
        if (accounts.length > 0) {
          setConnectedAddress(accounts[0]);
        }
      } catch (error) {
        console.error('Failed to load address:', error);
      }
    };
    loadAddress();
  }, []);
  
  if (!liquidationData) return null;
  
  const { liquidationPrice, canBeLiquidated, isAtRisk } = liquidationData;
  
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500">Liq. Price:</span>
      <span className={`text-sm font-medium ${
        canBeLiquidated ? 'text-red-600' : 
        isAtRisk ? 'text-orange-600' : 'text-gray-700'
      }`}>
        ${parseFloat(liquidationPrice).toFixed(2)}
      </span>
      {canBeLiquidated && <TrendingDown className="h-3 w-3 text-red-600" />}
    </div>
  );
}