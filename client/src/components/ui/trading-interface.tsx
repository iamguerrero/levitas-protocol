import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bitcoin, Zap, TrendingUp, Loader2 } from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";
import { useToast } from "@/hooks/use-toast";

export default function TradingInterface() {
  const { address } = useWallet();
  const { toast } = useToast();
  const [mintAmount, setMintAmount] = useState("");
  const [redeemAmount, setRedeemAmount] = useState("");
  const [isTransacting, setIsTransacting] = useState(false);

  // Mock balances and prices
  const mockData = {
    bvixPrice: 42.15,
    evixPrice: 37.98,
    usdcBalance: 1250.00,
    bvixBalance: 29.65,
    totalValue: 2498.94
  };

  const handleMint = async () => {
    if (!mintAmount || parseFloat(mintAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to mint.",
        variant: "destructive"
      });
      return;
    }

    setIsTransacting(true);
    
    // Simulate transaction
    setTimeout(() => {
      toast({
        title: "Mint Successful!",
        description: `Successfully minted ${(parseFloat(mintAmount) / mockData.bvixPrice).toFixed(4)} BVIX tokens.`,
      });
      setMintAmount("");
      setIsTransacting(false);
    }, 2000);
  };

  const handleRedeem = async () => {
    if (!redeemAmount || parseFloat(redeemAmount) <= 0) {
      toast({
        title: "Invalid Amount", 
        description: "Please enter a valid amount to redeem.",
        variant: "destructive"
      });
      return;
    }

    setIsTransacting(true);
    
    // Simulate transaction
    setTimeout(() => {
      toast({
        title: "Redeem Successful!",
        description: `Successfully redeemed ${(parseFloat(redeemAmount) * mockData.bvixPrice).toFixed(2)} USDC.`,
      });
      setRedeemAmount("");
      setIsTransacting(false);
    }, 2000);
  };

  return (
    <div className="space-y-8">
      {/* Price Display */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Bitcoin className="text-orange-500" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-black">BVIX</h3>
                  <p className="text-sm text-gray-600">Bitcoin Volatility Index</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-black">${mockData.bvixPrice}</div>
                <div className="text-sm text-green-600">+2.4%</div>
              </div>
            </div>
            <div className="text-xs text-gray-600">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Zap className="text-blue-500" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-black">EVIX</h3>
                  <p className="text-sm text-gray-600">Ethereum Volatility Index</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-black">${mockData.evixPrice}</div>
                <div className="text-sm text-green-600">+1.8%</div>
              </div>
            </div>
            <div className="text-xs text-gray-600">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trading Interface */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Mint Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Mint BVIX</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="mint-amount" className="text-sm font-medium text-gray-700">
                Deposit Amount
              </Label>
              <div className="relative mt-2">
                <Input
                  id="mint-amount"
                  type="number"
                  placeholder="0.00"
                  value={mintAmount}
                  onChange={(e) => setMintAmount(e.target.value)}
                  className="pr-16"
                />
                <div className="absolute right-3 top-3 text-gray-500">USDC</div>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                Balance: {mockData.usdcBalance.toFixed(2)} USDC
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">You'll receive:</span>
                <span className="font-medium text-black">
                  {mintAmount ? (parseFloat(mintAmount) / mockData.bvixPrice).toFixed(4) : "0.00"} BVIX
                </span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-600">Exchange rate:</span>
                <span className="text-gray-600">1 USDC = {(1 / mockData.bvixPrice).toFixed(6)} BVIX</span>
              </div>
            </div>

            <Button 
              onClick={handleMint}
              disabled={isTransacting || !mintAmount}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isTransacting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Minting...
                </>
              ) : (
                "Mint BVIX"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Redeem Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Redeem BVIX</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="redeem-amount" className="text-sm font-medium text-gray-700">
                Redeem Amount
              </Label>
              <div className="relative mt-2">
                <Input
                  id="redeem-amount"
                  type="number"
                  placeholder="0.00"
                  value={redeemAmount}
                  onChange={(e) => setRedeemAmount(e.target.value)}
                  className="pr-16"
                />
                <div className="absolute right-3 top-3 text-gray-500">BVIX</div>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                Balance: {mockData.bvixBalance.toFixed(2)} BVIX
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">You'll receive:</span>
                <span className="font-medium text-black">
                  {redeemAmount ? (parseFloat(redeemAmount) * mockData.bvixPrice).toFixed(2) : "0.00"} USDC
                </span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-600">Exchange rate:</span>
                <span className="text-gray-600">1 BVIX = {mockData.bvixPrice} USDC</span>
              </div>
            </div>

            <Button 
              onClick={handleRedeem}
              disabled={isTransacting || !redeemAmount}
              variant="destructive"
              className="w-full"
            >
              {isTransacting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Redeeming...
                </>
              ) : (
                "Redeem BVIX"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Wallet Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Wallet Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-black">{mockData.usdcBalance.toFixed(2)}</div>
              <div className="text-sm text-gray-600">USDC Balance</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-black">{mockData.bvixBalance.toFixed(2)}</div>
              <div className="text-sm text-gray-600">BVIX Balance</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">${mockData.totalValue.toFixed(2)}</div>
              <div className="text-sm text-gray-600">Total Value</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
