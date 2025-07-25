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
  const { positions } = useUserPositions();
  const [location] = useLocation();
  const [defaultTab, setDefaultTab] = useState("trading");
  
  useEffect(() => {
    // Check URL parameters for tab selection
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab && ["trading", "liquidation", "positions", "history"].includes(tab)) {
      setDefaultTab(tab);
    }
  }, [location]);

  return (
    <div className="container mx-auto py-8">
      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trading">Mint/Redeem</TabsTrigger>
          <TabsTrigger value="liquidation">Liquidation Center</TabsTrigger>
          <TabsTrigger value="positions">My Positions</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="trading" className="space-y-4">
          <TradingInterface />
        </TabsContent>
        
        <TabsContent value="liquidation" className="space-y-4">
          <LiquidationOpportunities />
        </TabsContent>
        
        <TabsContent value="positions" className="space-y-4">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">My Positions</h2>
            {positions?.bvix.cr > 0 || positions?.evix.cr > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {positions?.bvix.cr > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>BVIX Position</span>
                        <Badge className={positions.bvix.cr < 120 ? "bg-red-500" : positions.bvix.cr < 150 ? "bg-yellow-500" : "bg-green-500"}>
                          {positions.bvix.cr}% CR
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Collateral</span>
                          <span className="font-medium">{positions.bvix.collateral} USDC</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Debt</span>
                          <span className="font-medium">{positions.bvix.debt} BVIX</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {positions?.evix.cr > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>EVIX Position</span>
                        <Badge className={positions.evix.cr < 120 ? "bg-red-500" : positions.evix.cr < 150 ? "bg-yellow-500" : "bg-green-500"}>
                          {positions.evix.cr}% CR
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Collateral</span>
                          <span className="font-medium">{positions.evix.collateral} USDC</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Debt</span>
                          <span className="font-medium">{positions.evix.debt} EVIX</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  You don't have any open positions yet.
                </CardContent>
              </Card>
            )}
          </div>
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
                          <Badge>{item.tokenType}</Badge>
                          <span className="font-semibold">
                            {item.type === 'liquidation' ? 'Liquidated' : item.type}
                          </span>
                          <span className="text-sm text-gray-500">
                            Vault #{item.vaultId}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-green-600">+${item.bonusReceived}</p>
                          <p className="text-xs text-gray-500">{new Date(item.timestamp).toLocaleString()}</p>
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