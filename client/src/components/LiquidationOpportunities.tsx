import { useState, useEffect } from 'react';
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
  useVaultHealth,
  type LiquidatableVault
} from '@/hooks/useLiquidationFeatures';
import { useWallet } from '@/hooks/use-wallet';
import { LiquidationConfirmDialog } from './LiquidationConfirmDialog';
import { useQuery } from '@tanstack/react-query';
import { getBVIXBalance, getEVIXBalance, getAllBalances, formatPrice } from '@/lib/web3';
import { useRealTimeOracle } from '@/hooks/useRealTimeOracle';

export default function LiquidationOpportunities() {
  const { address } = useWallet();
  const [selectedVault, setSelectedVault] = useState<LiquidatableVault | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  
  const vaultsQuery = useLiquidatableVaults();
  const vaults = vaultsQuery.data;
  const vaultsLoading = vaultsQuery.isLoading;
  
  const liquidationMutation = useLiquidation();
  const liquidate = liquidationMutation.mutate;
  
  const permissionlessQuery = usePermissionlessLiquidation();
  const permissionless = permissionlessQuery.data;
  
  const { health } = useVaultHealth(address);
  
  // Get real-time oracle prices for accurate CR calculation
  const { bvixPrice: realtimeBvixPrice, evixPrice: realtimeEvixPrice } = useRealTimeOracle();
  
  // Get vault stats and contract data for liquidation info cards
  const { data: vaultStats } = useQuery({
    queryKey: ['/api/v1/vault-stats'],
    refetchInterval: 12000, // Reduced from 5000ms to 12000ms for better performance
    staleTime: 6000
  });
  
  // Get user-specific positions for accurate CR display
  const { data: userPositions } = useQuery({
    queryKey: ['userPositionsAPI', address],
    queryFn: async () => {
      if (!address) return null;
      const response = await fetch(`/api/v1/user-positions/${address}`);
      if (!response.ok) throw new Error('Failed to fetch user positions');
      return response.json();
    },
    refetchInterval: 12000, // Reduced from 5000ms to 12000ms for better performance
    staleTime: 6000,
    enabled: !!address
  });
  
  // Load wallet balances directly
  const [walletBalances, setWalletBalances] = useState({
    bvixBalance: "0",
    evixBalance: "0"
  });

  const loadWalletBalances = async () => {
    if (!address) return;
    
    try {
      const balances = await getAllBalances(address);
      
      setWalletBalances({
        bvixBalance: balances.bvixBalance,
        evixBalance: balances.evixBalance
      });
    } catch (error) {
      console.error("Error loading wallet balances:", error);
    }
  };

  useEffect(() => {
    if (address) {
      loadWalletBalances();
      
      // Refresh every 30 seconds to match trading interface
      const interval = setInterval(loadWalletBalances, 30000);
      return () => clearInterval(interval);
    }
  }, [address]);
  
  const handleLiquidateClick = (vault: LiquidatableVault) => {
    setSelectedVault(vault);
    setConfirmDialogOpen(true);
  };
  
  const handleConfirmLiquidation = () => {
    if (selectedVault) {
      liquidate({ vault: selectedVault });
      setConfirmDialogOpen(false);
    }
  };
  
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
          <p className="text-gray-500 mt-1">Earn 5% instantly to protect the protocol</p>
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
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-100 rounded flex items-center justify-center">
                <span className="text-xs text-orange-600 font-bold">B</span>
              </div>
              BVIX Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Wallet Balance</span>
                <span className="text-sm font-medium text-orange-600">
                  {walletBalances.bvixBalance && parseFloat(walletBalances.bvixBalance) > 0 ? `${parseFloat(walletBalances.bvixBalance).toFixed(2)} BVIX` : '0 BVIX'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 rounded flex items-center justify-center">
                <span className="text-xs text-blue-600 font-bold">E</span>
              </div>
              EVIX Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Wallet Balance</span>
                <span className="text-sm font-medium text-blue-600">
                  {walletBalances.evixBalance && parseFloat(walletBalances.evixBalance) > 0 ? `${parseFloat(walletBalances.evixBalance).toFixed(1)} EVIX` : '0 EVIX'}
                </span>
              </div>
            </div>
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
                      <h3 className="font-semibold">Vault #{vault.tokenType.toLowerCase()}-{vault.owner.slice(-4)}</h3>
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
                      {vault.tokenType} Price: ${vault.tokenType === 'EVIX' ? '38.02' : '42.19'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Liquidation at ${vault.liquidationPrice}
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
                    <p className="font-medium">{parseFloat(vault.debt).toFixed(2)} {vault.tokenType}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Max Bonus</p>
                    <p className="font-medium text-green-600">${vault.maxBonus}</p>
                  </div>
                </div>
                
                <div className="mt-4 flex items-center justify-end">
                  <Button 
                    onClick={() => handleLiquidateClick(vault)}
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
      
      <LiquidationConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        vault={selectedVault}
        onConfirm={handleConfirmLiquidation}
        isLiquidating={liquidationMutation.isPending}
      />
    </div>
  );
}