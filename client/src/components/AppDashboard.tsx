import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TradingInterface from "@/components/ui/trading-interface";
import LiquidationOpportunities from "@/components/LiquidationOpportunities";
import { useLiquidationHistory } from "@/hooks/useLiquidationFeatures";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp, TrendingDown } from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";
import { useUserPositions } from "@/hooks/useUserPositions";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export default function AppDashboard() {
  const historyResult = useLiquidationHistory();
  const history = historyResult.data || [];
  const { address } = useWallet();
  const { data: userPositions } = useUserPositions();
  const [location] = useLocation();
  const [defaultTab, setDefaultTab] = useState("trading");
  
  // Debug logging
  useEffect(() => {
    if (address && history) {
      console.log(`🎨 AppDashboard - Current user: ${address}`);
      console.log(`🎨 AppDashboard - History length: ${history.length}`);
      console.log(`🎨 AppDashboard - History items:`, history);
    }
  }, [address, history]);
  
  useEffect(() => {
    // Check URL parameters for tab selection
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab && ["trading", "liquidation", "history"].includes(tab)) {
      setDefaultTab(tab);
    }
  }, [location]);

  return (
    <div className="container mx-auto py-8">
      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trading">Mint/Redeem</TabsTrigger>
          <TabsTrigger value="liquidation">Liquidation Center</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="trading" className="space-y-4">
          <TradingInterface />
        </TabsContent>
        
        <TabsContent value="liquidation" className="space-y-4">
          <LiquidationOpportunities />
        </TabsContent>
        

        
        <TabsContent value="history" className="space-y-4">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Transaction History</h2>
            {history && history.length > 0 ? (
              <div className="space-y-4">
                {history.map((item: any, index: number) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge className={item.isLiquidator === true ? 'bg-green-600 hover:bg-green-700' : item.isLiquidator === false ? 'bg-red-600 hover:bg-red-700' : ''}>
                            {item.tokenType || item.vault?.tokenType || 'UNKNOWN'}
                          </Badge>
                          <span className="font-semibold">
                            {item.isLiquidator === true ? 'You Liquidated' : item.isLiquidator === false ? 'You Got Liquidated' : item.type === 'liquidation' ? 'Liquidated' : item.type === 'liquidated' ? 'Got Liquidated' : 'Liquidation'}
                          </span>
                          <span className="text-sm text-gray-500">
                            Vault {item.vault?.vaultId ? `#${item.vault.vaultId}` : '#001'}
                          </span>
                        </div>
                        <div className="text-right">
                          {item.isLiquidator === true ? (
                            <p className="font-medium text-green-600">+${parseFloat(item.bonus || '0').toFixed(2)} USDC Bonus</p>
                          ) : item.isLiquidator === false ? (
                            <p className="font-medium text-red-600">-${parseFloat(item.bonus || '0').toFixed(2)} USDC Fee</p>
                          ) : (
                            <p className="font-medium text-green-600">+${parseFloat(item.bonus || '0').toFixed(2)} USDC</p>
                          )}
                          <p className="text-xs text-gray-500">{new Date(item.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">{item.isLiquidator === false ? 'Debt Repaid On Your Behalf' : 'Debt Repaid'}</p>
                          <p className="font-medium">{item.amount || item.debtRepaid || '0'} {item.tokenType || item.vault?.tokenType || 'UNKNOWN'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Debt Value</p>
                          <p className="font-medium">${(() => {
                            const debt = parseFloat(item.amount || item.debtRepaid || '0');
                            const price = (item.tokenType || item.vault?.tokenType) === 'BVIX' ? 42.15 : 37.98;
                            return (debt * price).toFixed(2);
                          })()} USDC</p>
                        </div>
                        <div>
                          <p className="text-gray-500">{item.isLiquidator === false ? 'Collateral Lost' : 'Total Received'}</p>
                          <p className="font-medium">${parseFloat(item.collateralSeized || '0').toFixed(2)} USDC</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Transaction</p>
                          <p className="font-mono text-xs">{item.txHash ? `${item.txHash.slice(0, 10)}...` : 'Pending...'}</p>
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
                  <h3 className="font-semibold text-lg mb-2">No Transaction History</h3>
                  <p className="text-gray-500">
                    Your transaction history will appear here
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}