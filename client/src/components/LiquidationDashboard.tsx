import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  TrendingDown, 
  DollarSign, 
  Clock, 
  Info,
  Zap,
  Shield,
  Users
} from 'lucide-react';
import { useEffect, useState as useStateEffect } from 'react';
import { getProvider } from '@/lib/web3';
import { 
  useLiquidatableVaults, 
  useLiquidation, 
  usePermissionlessLiquidation,
  useVaultHealth,
  useLiquidationHistory 
} from '@/hooks/useLiquidationFeatures';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

interface LiquidationModalProps {
  vault: any;
  isOpen: boolean;
  onClose: () => void;
}

function LiquidationModal({ vault, isOpen, onClose }: LiquidationModalProps) {
  const [repayAmount, setRepayAmount] = useState('');
  const [isPartial, setIsPartial] = useState(false);
  const liquidation = useLiquidation();
  const { toast } = useToast();
  
  const handleLiquidate = async () => {
    try {
      await liquidation.mutateAsync({
        vault,
        repayAmount: isPartial ? repayAmount : undefined
      });
      onClose();
    } catch (error: any) {
      toast({
        title: "Liquidation Failed",
        description: error.message || "Failed to liquidate position",
        variant: "destructive",
      });
    }
  };
  
  const estimatedPayout = isPartial && repayAmount
    ? (parseFloat(repayAmount) * parseFloat(vault.liquidationPrice) * 1.05).toFixed(2)
    : (parseFloat(vault.debt) * parseFloat(vault.liquidationPrice) * 1.05).toFixed(2);
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Liquidate {vault.tokenType} Position</DialogTitle>
          <DialogDescription>
            Repay debt to claim collateral with bonus
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Owner</p>
              <p className="font-mono">{vault.owner.slice(0, 6)}...{vault.owner.slice(-4)}</p>
            </div>
            <div>
              <p className="text-gray-500">Current CR</p>
              <p className="font-semibold text-red-600">{vault.currentCR}%</p>
            </div>
            <div>
              <p className="text-gray-500">Total Debt</p>
              <p className="font-semibold">{parseFloat(vault.debt).toFixed(2)} {vault.tokenType}</p>
            </div>
            <div>
              <p className="text-gray-500">Total Collateral</p>
              <p className="font-semibold">${parseFloat(vault.collateral).toFixed(2)}</p>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Liquidation Type</Label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={!isPartial ? "default" : "outline"}
                  onClick={() => setIsPartial(false)}
                >
                  Full
                </Button>
                <Button
                  size="sm"
                  variant={isPartial ? "default" : "outline"}
                  onClick={() => setIsPartial(true)}
                >
                  Partial
                </Button>
              </div>
            </div>
            
            {isPartial && (
              <div className="space-y-2">
                <Label htmlFor="repay-amount">Amount to Repay</Label>
                <Input
                  id="repay-amount"
                  type="number"
                  placeholder="0.00"
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  max={vault.debt}
                />
                <p className="text-xs text-gray-500">
                  Max: {parseFloat(vault.debt).toFixed(2)} {vault.tokenType}
                </p>
              </div>
            )}
          </div>
          
          <Alert>
            <DollarSign className="h-4 w-4" />
            <AlertDescription>
              <p className="font-semibold">Estimated Payout</p>
              <p className="text-lg">${estimatedPayout} USDC</p>
              <p className="text-sm text-gray-500">Includes 5% liquidation bonus</p>
              <p className="text-xs text-gray-500 mt-2">
                Note: You need {isPartial ? repayAmount || '0' : vault.debt} {vault.tokenType} tokens to execute this liquidation
              </p>
            </AlertDescription>
          </Alert>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleLiquidate}
            disabled={liquidation.isPending || (isPartial && (!repayAmount || parseFloat(repayAmount) <= 0))}
          >
            {liquidation.isPending ? "Processing..." : "Liquidate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function LiquidationDashboard() {
  const [address, setAddress] = useState<string | null>(null);
  const { data: vaults, isLoading: vaultsLoading } = useLiquidatableVaults();
  const { data: permissionless } = usePermissionlessLiquidation();
  const { health, isLoading: healthLoading } = useVaultHealth(address);
  const { data: history } = useLiquidationHistory();
  const [selectedVault, setSelectedVault] = useState<any>(null);
  
  useEffect(() => {
    const loadAddress = async () => {
      try {
        const provider = getProvider();
        const accounts = await provider.send('eth_requestAccounts', []);
        if (accounts.length > 0) {
          setAddress(accounts[0]);
        }
      } catch (error) {
        console.error('Failed to load address:', error);
      }
    };
    loadAddress();
  }, []);
  
  const getRiskBadge = (cr: number) => {
    if (cr < 110) return <Badge variant="destructive">Critical</Badge>;
    if (cr < 120) return <Badge variant="destructive">Liquidatable</Badge>;
    if (cr < 130) return <Badge className="bg-orange-500">High Risk</Badge>;
    if (cr < 150) return <Badge className="bg-yellow-500">Medium Risk</Badge>;
    return <Badge variant="secondary">Low Risk</Badge>;
  };
  
  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  
  return (
    <div className="container mx-auto py-8 space-y-6">
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
              ${vaults?.reduce((sum, v) => sum + parseFloat(v.maxBonus), 0).toFixed(2) || '0.00'}
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
      
      {/* Main Content */}
      <Tabs defaultValue="opportunities" className="space-y-4">
        <TabsList>
          <TabsTrigger value="opportunities">Liquidation Opportunities</TabsTrigger>
          <TabsTrigger value="my-positions">My Positions</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="opportunities" className="space-y-4">
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
              
              {vaults.map((vault) => (
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
                        <p className="text-2xl font-bold text-green-600">
                          +${parseFloat(vault.maxBonus).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">Liquidation Bonus</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t">
                      <div>
                        <p className="text-xs text-gray-500">Collateral</p>
                        <p className="font-medium">${parseFloat(vault.collateral).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Debt</p>
                        <p className="font-medium">{parseFloat(vault.debt).toFixed(2)} {vault.tokenType}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Current CR</p>
                        <p className="font-medium text-red-600">{vault.currentCR}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Liq. Price</p>
                        <p className="font-medium">${parseFloat(vault.liquidationPrice).toFixed(2)}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex justify-end">
                      <Button
                        onClick={() => setSelectedVault(vault)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <TrendingDown className="h-4 w-4 mr-2" />
                        Liquidate Position
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">No Liquidations Available</h3>
                <p className="text-gray-500">
                  All vaults are currently healthy with CR above 120%
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="my-positions" className="space-y-4">
          {health.positions.length > 0 ? (
            <div className="space-y-4">
              {health.positions.map((position) => (
                <Card key={position.token}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">{position.token} Position</h3>
                          {getRiskBadge(position.currentCR)}
                        </div>
                        <p className="text-sm text-gray-500">
                          Health Score: {position.healthScore.toFixed(0)}%
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Liquidation Price</p>
                        <p className="text-xl font-bold">${position.liquidationPrice}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Collateral Ratio</span>
                        <span className="font-medium">{position.currentCR}%</span>
                      </div>
                      <Progress 
                        value={Math.min(100, (position.currentCR / 200) * 100)} 
                        className="h-2"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>120% (Min)</span>
                        <span>150% (Safe)</span>
                        <span>200%+</span>
                      </div>
                    </div>
                    
                    {position.isAtRisk && (
                      <Alert className="mt-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Your position is approaching liquidation threshold. Consider adding collateral or reducing debt.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">No Active Positions</h3>
                <p className="text-gray-500">
                  You don't have any active vault positions
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="history" className="space-y-4">
          {history && history.length > 0 ? (
            <div className="space-y-4">
              {history.map((item: any, index: number) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">Success</Badge>
                        <Badge>{item.vault.tokenType}</Badge>
                        <span className="text-sm text-gray-500">
                          {new Date(item.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        +${item.bonus} Bonus
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Debt Repaid</p>
                        <p className="font-medium">{item.debtRepaid} {item.vault.tokenType}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Collateral Seized</p>
                        <p className="font-medium">${item.collateralSeized}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Previous CR</p>
                        <p className="font-medium">{item.vault.currentCR}%</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Transaction</p>
                        <p className="font-medium text-blue-600">
                          <a href={`https://sepolia.basescan.org/tx/${item.txHash}`} target="_blank" rel="noopener noreferrer">
                            {item.txHash.slice(0, 8)}...
                          </a>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">No Liquidation History</h3>
                <p className="text-gray-500">
                  Your liquidation history will appear here
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Liquidation Modal */}
      {selectedVault && (
        <LiquidationModal
          vault={selectedVault}
          isOpen={!!selectedVault}
          onClose={() => setSelectedVault(null)}
        />
      )}
    </div>
  );
}