import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bitcoin, Zap, TrendingUp, Loader2, AlertCircle } from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";
import { useToast } from "@/hooks/use-toast";
import { 
  getBVIXBalance, 
  getUSDCBalance, 
  getOraclePrice, 
  mintBVIX, 
  redeemBVIX,
  switchToBaseSepolia,
  getContractDebugInfo,
  getTestUSDC,
  BVIX_ADDRESS,
  ORACLE_ADDRESS,
  MINT_REDEEM_ADDRESS,
  MOCK_USDC_ADDRESS
} from "@/lib/web3";

export default function TradingInterface() {
  const { address } = useWallet();
  const { toast } = useToast();
  const [mintAmount, setMintAmount] = useState("");
  const [redeemAmount, setRedeemAmount] = useState("");
  const [isTransacting, setIsTransacting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  
  // Real contract data
  const [contractData, setContractData] = useState({
    bvixPrice: "42.15",
    evixPrice: "37.98", // EVIX not implemented yet
    usdcBalance: "0.00",
    bvixBalance: "0.00",
    totalValue: "0.00"
  });

  // Check if contracts are deployed
  const contractsDeployed = BVIX_ADDRESS !== "0xBVIXAddressHere";

  // Load contract data
  useEffect(() => {
    if (address && contractsDeployed) {
      loadContractData();
    } else {
      setIsLoading(false);
    }
  }, [address, contractsDeployed]);

  const loadContractData = async () => {
    if (!address) return;
    
    setIsLoading(true);
    try {
      const [bvixBalance, usdcBalance, oraclePrice] = await Promise.all([
        getBVIXBalance(address),
        getUSDCBalance(address),
        getOraclePrice()
      ]);

      const totalValue = (parseFloat(bvixBalance) * parseFloat(oraclePrice) + parseFloat(usdcBalance)).toFixed(2);

      setContractData({
        bvixPrice: oraclePrice,
        evixPrice: "37.98", // EVIX not implemented yet
        usdcBalance,
        bvixBalance,
        totalValue
      });
    } catch (error) {
      console.error('Error loading contract data:', error);
      toast({
        title: "Contract Error",
        description: "Failed to load contract data. Please check your network connection.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMint = async () => {
    if (!contractsDeployed) {
      toast({
        title: "Contracts Not Deployed",
        description: "Smart contracts are not yet deployed. Please wait for deployment.",
        variant: "destructive"
      });
      return;
    }

    if (!mintAmount || parseFloat(mintAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to mint.",
        variant: "destructive"
      });
      return;
    }

    setIsTransacting(true);
    
    try {
      // Ensure user is on Base Sepolia
      await switchToBaseSepolia();
      
      const tx = await mintBVIX(mintAmount);
      
      toast({
        title: "Transaction Submitted",
        description: "Your mint transaction has been submitted. Please wait for confirmation.",
      });
      
      await tx.wait();
      
      toast({
        title: "Mint Successful!",
        description: `Successfully minted BVIX tokens!`,
      });
      
      setMintAmount("");
      await loadContractData(); // Refresh balances
      
    } catch (error: any) {
      console.error('Mint error:', error);
      toast({
        title: "Mint Failed",
        description: error.message || "Failed to mint BVIX tokens. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsTransacting(false);
    }
  };

  const handleRedeem = async () => {
    if (!contractsDeployed) {
      toast({
        title: "Contracts Not Deployed",
        description: "Smart contracts are not yet deployed. Please wait for deployment.",
        variant: "destructive"
      });
      return;
    }

    if (!redeemAmount || parseFloat(redeemAmount) <= 0) {
      toast({
        title: "Invalid Amount", 
        description: "Please enter a valid amount to redeem.",
        variant: "destructive"
      });
      return;
    }

    setIsTransacting(true);
    
    try {
      // Ensure user is on Base Sepolia
      await switchToBaseSepolia();
      
      const tx = await redeemBVIX(redeemAmount);
      
      toast({
        title: "Transaction Submitted",
        description: "Your redeem transaction has been submitted. Please wait for confirmation.",
      });
      
      await tx.wait();
      
      toast({
        title: "Redeem Successful!",
        description: `Successfully redeemed BVIX tokens for USDC!`,
      });
      
      setRedeemAmount("");
      await loadContractData(); // Refresh balances
      
    } catch (error: any) {
      console.error('Redeem error:', error);
      toast({
        title: "Redeem Failed",
        description: error.message || "Failed to redeem BVIX tokens. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsTransacting(false);
    }
  };

  const handleDebug = async () => {
    try {
      const info = await getContractDebugInfo();
      setDebugInfo(info);
      console.log('Debug Info:', info);
      
      toast({
        title: "Debug Info Retrieved",
        description: "Check the browser console for detailed contract information.",
      });
    } catch (error) {
      toast({
        title: "Debug Failed",
        description: "Failed to retrieve debug information.",
        variant: "destructive"
      });
    }
  };

  const handleGetTestUSDC = async () => {
    setIsTransacting(true);
    try {
      const tx = await getTestUSDC("1000"); // Get 1000 test USDC
      if (tx) {
        toast({
          title: "Getting Test USDC",
          description: "Transaction submitted. Please wait for confirmation.",
        });
        await tx.wait();
        toast({
          title: "Test USDC Received!",
          description: "Successfully received 1000 test USDC tokens.",
        });
        await loadContractData(); // Refresh balances
      } else {
        toast({
          title: "No Faucet Available",
          description: "This USDC contract doesn't have a mint function. You'll need to get USDC another way.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Failed to Get Test USDC",
        description: error.message || "The USDC contract doesn't support minting test tokens.",
        variant: "destructive"
      });
    } finally {
      setIsTransacting(false);
    }
  };

  if (!contractsDeployed) {
    return (
      <div className="space-y-8">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
              <div>
                <h3 className="font-bold text-yellow-800">Contracts Not Deployed</h3>
                <p className="text-yellow-700">Smart contracts are not yet deployed to Base Sepolia. Please update contract addresses in web3.ts after deployment.</p>
                <div className="mt-4 space-y-2 text-sm">
                  <p><strong>BVIX Token:</strong> {BVIX_ADDRESS}</p>
                  <p><strong>Oracle:</strong> {ORACLE_ADDRESS}</p>
                  <p><strong>MintRedeem:</strong> {MINT_REDEEM_ADDRESS}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                <div className="text-2xl font-bold text-black">
                  ${isLoading ? "..." : contractData.bvixPrice}
                </div>
                <div className="text-sm text-green-600">Live Price</div>
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
                <div className="text-2xl font-bold text-black">
                  ${contractData.evixPrice}
                </div>
                <div className="text-sm text-gray-500">Coming Soon</div>
              </div>
            </div>
            <div className="text-xs text-gray-600">
              EVIX implementation pending
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
                Balance: {isLoading ? "..." : parseFloat(contractData.usdcBalance).toFixed(2)} USDC
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">You'll receive:</span>
                <span className="font-medium text-black">
                  {mintAmount && contractData.bvixPrice ? (parseFloat(mintAmount) / parseFloat(contractData.bvixPrice)).toFixed(4) : "0.00"} BVIX
                </span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-600">Exchange rate:</span>
                <span className="text-gray-600">1 USDC = {contractData.bvixPrice ? (1 / parseFloat(contractData.bvixPrice)).toFixed(6) : "..."} BVIX</span>
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
                Balance: {isLoading ? "..." : parseFloat(contractData.bvixBalance).toFixed(2)} BVIX
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">You'll receive:</span>
                <span className="font-medium text-black">
                  {redeemAmount && contractData.bvixPrice ? (parseFloat(redeemAmount) * parseFloat(contractData.bvixPrice)).toFixed(2) : "0.00"} USDC
                </span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-600">Exchange rate:</span>
                <span className="text-gray-600">1 BVIX = {contractData.bvixPrice || "..."} USDC</span>
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
              <div className="text-2xl font-bold text-black">
                {isLoading ? "..." : parseFloat(contractData.usdcBalance).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">USDC Balance</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-black">
                {isLoading ? "..." : parseFloat(contractData.bvixBalance).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">BVIX Balance</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                ${isLoading ? "..." : contractData.totalValue}
              </div>
              <div className="text-sm text-gray-600">Total Value</div>
            </div>
          </div>
          
          {/* Debug Section */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleDebug}
                variant="outline"
                size="sm"
                disabled={!address}
              >
                Debug Contract Info
              </Button>
              <Button
                onClick={handleGetTestUSDC}
                variant="outline"
                size="sm"
                disabled={!address || isTransacting}
              >
                {isTransacting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Getting USDC...
                  </>
                ) : (
                  "Get Test USDC"
                )}
              </Button>
              <div className="text-xs text-gray-500 flex items-center">
                Contract: {MOCK_USDC_ADDRESS.slice(0, 10)}...
              </div>
            </div>
            
            {debugInfo && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg text-xs space-y-2">
                <div><strong>Address:</strong> {debugInfo.userAddress}</div>
                <div><strong>USDC Balance:</strong> {debugInfo.usdcBalance}</div>
                <div><strong>BVIX Balance:</strong> {debugInfo.bvixBalance}</div>
                <div><strong>Oracle Price:</strong> ${debugInfo.oraclePrice}</div>
                <div><strong>USDC Allowance:</strong> {debugInfo.usdcAllowance}</div>
                {debugInfo.error && <div className="text-red-600"><strong>Error:</strong> {debugInfo.error}</div>}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
