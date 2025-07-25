import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  TrendingDown, 
  AlertTriangle, 
  DollarSign, 
  Clock, 
  Zap, 
  Shield, 
  Info 
} from 'lucide-react';
import { 
  useLiquidatableVaults, 
  useLiquidation, 
  usePermissionlessLiquidation,
  useVaultHealth
} from '@/hooks/useLiquidationFeatures';
import { useWallet } from '@/hooks/use-wallet';

export default function LiquidationOpportunities() {
  const { address } = useWallet();
  const vaultsQuery = useLiquidatableVaults();
  const vaults = vaultsQuery.data;
  const vaultsLoading = vaultsQuery.isLoading;
  
  const liquidationMutation = useLiquidation();
  const liquidate = liquidationMutation.mutate;
  
  const permissionlessQuery = usePermissionlessLiquidation();
  const permissionless = permissionlessQuery.data;
  
  const { health } = useVaultHealth(address);
  
  const getRiskBadge = (cr: number) => {
    if (cr < 110) return <Badge variant="destructive">Critical</Badge>;
    if (cr < 120) return <Badge variant="destructive">Liquidatable</Badge>;
    if (cr < 130) return <Badge className="bg-orange-500">High Risk</Badge>;
    if (cr < 150) return <Badge className="bg-yellow-500">Medium Risk</Badge>;
    return <Badge variant="secondary">Low Risk</Badge>;
  };
  
  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Liquidation Center</h1>
          <p className="text-gray-500 mt-1">Monitor and execute liquidations</p>
        </div>
        {permissionless?.anyPermissionless && (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            Permissionless Active
          </Badge>
        )}
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Available Liquidations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{vaults?.length || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Vaults below 120% CR</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Bonus Available</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ${vaults?.reduce((sum: number, v: any) => sum + parseFloat(v.maxBonus), 0).toFixed(2) || '0.00'}
            </p>
            <p className="text-xs text-gray-500 mt-1">5% liquidation bonus</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Your Vault Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Progress value={health.avgHealthScore} className="flex-1" />
              <span className="text-sm font-medium">{health.avgHealthScore.toFixed(0)}%</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {health.isHealthy ? 'Healthy' : health.isAtRisk ? 'At Risk' : 'Critical'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Network Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-500" />
              <span className="text-sm">Protection Active</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">1 hour grace period</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Liquidation Opportunities */}
      {vaultsLoading ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            Loading liquidation opportunities...
          </CardContent>
        </Card>
      ) : vaults && vaults.length > 0 ? (
        <div className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Anyone can liquidate these positions when CR falls below 120%. Act quickly to claim 5% bonuses!
            </AlertDescription>
          </Alert>
          
          {vaults.map((vault: any) => (
            <Card key={`${vault.tokenType}-${vault.vaultId}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">Vault #{vault.vaultId}</h3>
                      <Badge>{vault.tokenType}</Badge>
                      {getRiskBadge(vault.currentCR)}
                    </div>
                    <p className="text-sm text-gray-500">
                      Owner: {formatAddress(vault.owner)}
                    </p>
                  </div>
                  
                  <div className="text-right space-y-1">
                    <div className="flex items-center gap-2 justify-end">
                      <TrendingDown className="h-4 w-4 text-red-500" />
                      <span className="font-semibold text-red-600">{vault.currentCR.toFixed(1)}% CR</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Liquidation at {vault.liquidationPrice}
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Collateral</p>
                    <p className="font-medium">{vault.collateral} USDC</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Debt</p>
                    <p className="font-medium">{vault.debt} {vault.tokenType}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Max Bonus</p>
                    <p className="font-medium text-green-600">${vault.maxBonus}</p>
                  </div>
                </div>
                
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span>Available in {vault.gracePeriodEnds}</span>
                  </div>
                  
                  <Button 
                    onClick={() => liquidate({ vault })}
                    className="bg-red-600 hover:bg-red-700"
                    disabled={vault.gracePeriodActive}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Liquidate
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">All Vaults Healthy</h3>
            <p className="text-gray-500">
              No liquidation opportunities available. All vaults are above 120% collateral ratio.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}