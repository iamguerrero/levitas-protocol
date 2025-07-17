import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, TrendingUp, Shield } from 'lucide-react';
import { useVault } from '@/hooks/useVault';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export function VaultHealth() {
  const { data, status, isLoading, isError } = useVault();
  const { toast } = useToast();

  // Show toast warning when collateral ratio is below 110%
  useEffect(() => {
    if (data && status.level === 'red') {
      toast({
        title: "⚠️ Vault Health Warning",
        description: "Collateral ratio below 110%. Consider adding more collateral.",
        variant: "destructive",
      });
    }
  }, [data, status.level, toast]);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Vault Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Vault Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">Unable to load vault statistics</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (level: string) => {
    switch (level) {
      case 'green': return 'text-green-600';
      case 'yellow': return 'text-yellow-600';
      case 'red': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBgColor = (level: string) => {
    switch (level) {
      case 'green': return 'bg-green-100 border-green-200';
      case 'yellow': return 'bg-yellow-100 border-yellow-200';
      case 'red': return 'bg-red-100 border-red-200';
      default: return 'bg-gray-100 border-gray-200';
    }
  };

  const getStatusIcon = (level: string) => {
    switch (level) {
      case 'green': return <Shield className="w-5 h-5" />;
      case 'yellow': return <TrendingUp className="w-5 h-5" />;
      case 'red': return <AlertTriangle className="w-5 h-5" />;
      default: return <Shield className="w-5 h-5" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Vault Health
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Big collateral ratio display */}
        <div className={cn(
          "p-4 rounded-lg border-2 text-center",
          getStatusBgColor(status.level)
        )}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className={getStatusColor(status.level)}>
              {getStatusIcon(status.level)}
            </span>
            <span className="text-sm font-medium text-gray-700">
              {status.message}
            </span>
          </div>
          <div className={cn(
            "text-3xl font-bold",
            getStatusColor(status.level)
          )}>
            {data.cr.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600 mt-1">
            Collateral Ratio
          </div>
        </div>

        {/* Mini bars showing USDC, BVIX, and breakdown */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">USDC in Vault</span>
            <span className="text-sm font-mono">
              ${parseFloat(data.usdc).toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">BVIX Supply</span>
            <span className="text-sm font-mono">
              {parseFloat(data.bvix).toLocaleString(undefined, { maximumFractionDigits: 4 })} BVIX
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">BVIX Value (USD)</span>
            <span className="text-sm font-mono">
              ${data.bvixValueInUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">BVIX Price</span>
            <span className="text-sm font-mono">
              ${parseFloat(data.price).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Visual health bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Risk Level</span>
            <span>Safe (≥120%)</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                status.level === 'green' && "bg-green-500",
                status.level === 'yellow' && "bg-yellow-500",
                status.level === 'red' && "bg-red-500"
              )}
              style={{ 
                width: `${Math.min(Math.max((data.cr / 150) * 100, 10), 100)}%` 
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>110%</span>
            <span>120%</span>
            <span>150%+</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}