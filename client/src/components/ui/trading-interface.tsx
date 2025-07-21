import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bitcoin, TrendingUp, Loader2, AlertCircle, ArrowUp, ArrowDown } from "lucide-react";
import { SiEthereum } from "react-icons/si";
import { VaultHealth } from "@/components/ui/VaultHealth";
import { NetworkHelpers } from "@/components/ui/NetworkHelpers";
// VaultNotice removed - V4 contracts work without collateral enforcement
import { CollateralAwareMinting } from "@/components/ui/CollateralAwareMinting";
import { useWallet } from "@/hooks/use-wallet";
import { useToast } from "@/hooks/use-toast";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useVault } from "@/hooks/useVault";
import {
  getBVIXBalance,
  getEVIXBalance,
  getUSDCBalance,
  getOraclePrice,
  getEVIXPrice,
  getCollateralRatio,
  mintBVIX,
  redeemBVIX,
  mintEVIX,
  redeemEVIX,
  switchToBaseSepolia,
  getContractDebugInfo,
  getTestUSDC,
  BVIX_ADDRESS,
  EVIX_ADDRESS,
  ORACLE_ADDRESS,
  MINT_REDEEM_ADDRESS,
  MOCK_USDC_ADDRESS,
} from "@/lib/web3";
import { getUserPosition, getUserCollateralRatio, getUserPositionEVIX, getUserCollateralRatioEVIX } from "@/lib/web3";

export default function TradingInterface() {
  const { address } = useWallet();
  const { toast } = useToast();
  const [mintAmount, setMintAmount] = useState("");
  const [redeemAmount, setRedeemAmount] = useState("");
  const [evixMintAmount, setEvixMintAmount] = useState("");
  const [evixRedeemAmount, setEvixRedeemAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState<'bvix' | 'evix'>('bvix');
  const [isTransacting, setIsTransacting] = useState(false);
  const [mintingBVIX, setMintingBVIX] = useState(false);
  const [redeemingBVIX, setRedeemingBVIX] = useState(false);
  const [mintingEVIX, setMintingEVIX] = useState(false);
  const [redeemingEVIX, setRedeemingEVIX] = useState(false);
  
  // Import vault refresh functions
  const { refetch: refetchVault } = useVault();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [collateralRatio, setCollateralRatio] = useState<number | null>(null);
  const [vaultStats, setVaultStats] = useState<any>(null);

  const { data: userPosition, refetch: refetchUserPosition } = useQuery({
    queryKey: ['userPosition', address],
    queryFn: async () => {
      if (!address) return null;
      console.log('🔄 Fetching user positions for address:', address);
      
      const [bvixPos, evixPos] = await Promise.all([
        getUserPosition(address),
        getUserPositionEVIX(address)
      ]);
      const [bvixCR, evixCR] = await Promise.all([
        getUserCollateralRatio(address),
        getUserCollateralRatioEVIX(address)
      ]);
      
      console.log('📊 User position data:', {
        bvixPos,
        evixPos,
        bvixCR,
        evixCR
      });
      
      const result = {
        bvix: bvixPos ? { ...bvixPos, cr: bvixCR } : null,
        evix: evixPos ? { ...evixPos, cr: evixCR } : null
      };
      
      console.log('📊 Final user position result:', result);
      return result;
    },
    enabled: !!address,
    refetchInterval: 5000, // Refresh every 5 seconds for real-time updates
    staleTime: 2000, // Consider data stale after 2 seconds
  });

  function explorerLink(hash: string) {
    return (
      <a
        href={`https://sepolia.basescan.org/tx/${hash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline"
      >
        View on Basescan
      </a>
    );
  }

  // Real contract data
  const [contractData, setContractData] = useState({
    bvixPrice: "42.15",
    evixPrice: "37.98",
    usdcBalance: "0.00",
    bvixBalance: "0.00",
    evixBalance: "0.00",
    totalValue: "0.00",
  });

  // Check if contracts are deployed
  // ✅ treat both sides as plain strings
  const contractsDeployed = String(BVIX_ADDRESS) !== "0xBVIXAddressHere";

  // Load vault stats
  const { data: vaultData } = useQuery({
    queryKey: ['/api/v1/vault-stats'],
    refetchInterval: 15000,
    enabled: true,
  });

  useEffect(() => {
    if (vaultData) {
      setVaultStats(vaultData);
    }
  }, [vaultData]);

  // Load contract data with forced refresh
  useEffect(() => {
    if (address && contractsDeployed) {
      // Clear any cached data
      setContractData({
        bvixPrice: "42.15",
        evixPrice: "37.98", 
        usdcBalance: "0.00",
        bvixBalance: "0.00",
        evixBalance: "0.00",
        totalValue: "0.00",
      });
      loadContractData();
    } else {
      setIsLoading(false);
    }
  }, [address, contractsDeployed]);

  // Auto-refresh contract data every 10 seconds
  useEffect(() => {
    if (!address || !contractsDeployed) return;
    
    const interval = setInterval(() => {
      loadContractData();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [address, contractsDeployed]);

  const loadContractData = async () => {
    if (!address) return;

    setIsLoading(true);
    try {
      console.log("🔄 Loading contract data for address:", address);
      const [bvixBalance, evixBalance, usdcBalance, oraclePrice, evixPrice, ratio] = await Promise.all([
        getBVIXBalance(address),
        getEVIXBalance(address),
        getUSDCBalance(address),
        getOraclePrice(),
        getEVIXPrice(),
        getCollateralRatio(),
      ]);
      
      console.log("📊 Contract data loaded:", { bvixBalance, evixBalance, usdcBalance, oraclePrice, evixPrice, ratio });
      
      setCollateralRatio(ratio);

      const totalValue = (
        parseFloat(bvixBalance) * parseFloat(oraclePrice) +
        parseFloat(evixBalance) * parseFloat(evixPrice) +
        parseFloat(usdcBalance)
      ).toFixed(2);

      setContractData({
        bvixPrice: oraclePrice,
        evixPrice,
        usdcBalance,
        bvixBalance,
        evixBalance,
        totalValue,
      });
    } catch (error) {
      console.error("Error loading contract data:", error);
      toast({
        title: "Contract Error",
        description:
          "Failed to load contract data. Please check your network connection.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMint = async (amount: string, targetCR: number = 150) => {
    if (!contractsDeployed) {
      toast({
        title: "Contracts Not Deployed",
        description:
          "Smart contracts are not yet deployed. Please wait for deployment.",
        variant: "destructive",
      });
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to mint.",
        variant: "destructive",
      });
      return;
    }

    setIsTransacting(true);
    setMintingBVIX(true);

    try {
      // Ensure user is on Base Sepolia
      await switchToBaseSepolia();

      const tx = await mintBVIX(amount, targetCR);

      toast({
        title: "Transaction Submitted",
        description:
          "Your mint transaction has been submitted. Please wait for confirmation.",
      });

      await tx.wait();
      const hash = tx.hash;
      await new Promise((res) => setTimeout(res, 2_000));
      await loadContractData();

      toast({
        title: "Mint Successful!",
        description: (
          <>
            Successfully minted BVIX tokens!;
            {explorerLink(hash)}
          </>
        ),
      });

      // Immediate refresh of all data
      await loadContractData();
      refetchUserPosition();
      refetchVault();
      
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['userPosition', address] });
      queryClient.invalidateQueries({ queryKey: ['/api/v1/vault-stats'] });
    } catch (error: any) {
      console.error("Mint error:", error);
      toast({
        title: "Mint Failed",
        description:
          error.message || "Failed to mint BVIX tokens. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTransacting(false);
      setMintingBVIX(false);
    }
  };

  const handleRedeem = async () => {
    if (!contractsDeployed) {
      toast({
        title: "Contracts Not Deployed",
        description:
          "Smart contracts are not yet deployed. Please wait for deployment.",
        variant: "destructive",
      });
      return;
    }

    if (!redeemAmount || parseFloat(redeemAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to redeem.",
        variant: "destructive",
      });
      return;
    }

    setIsTransacting(true);
    setRedeemingBVIX(true);

    try {
      // Ensure user is on Base Sepolia
      await switchToBaseSepolia();

      const tx = await redeemBVIX(redeemAmount);

      toast({
        title: "Transaction Submitted",
        description:
          "Your redeem transaction has been submitted. Please wait for confirmation.",
      });

      await tx.wait();
      const hash = tx.hash;
      await new Promise((res) => setTimeout(res, 4_000));
      await loadContractData();

      toast({
        title: "Redeeem Successful!",
        description: (
          <>
            Successfully redeemed USDC for BVIX!;
            {explorerLink(hash)}
          </>
        ),
      });

      setRedeemAmount("");
      // Immediate refresh of all data
      await loadContractData();
      refetchUserPosition();
      refetchVault();
      
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['userPosition', address] });
      queryClient.invalidateQueries({ queryKey: ['/api/v1/vault-stats'] });
    } catch (error: any) {
      console.error("Redeem error:", error);
      toast({
        title: "Redeem Failed",
        description:
          error.message || "Failed to redeem BVIX tokens. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTransacting(false);
      setRedeemingBVIX(false);
    }
  };

  const handleMintEVIX = async (amount: string, targetCR: number = 150) => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to mint EVIX.",
        variant: "destructive",
      });
      return;
    }

    setIsTransacting(true);
    setMintingEVIX(true);
    try {
      await switchToBaseSepolia();
      const tx = await mintEVIX(amount, targetCR);
      
      toast({
        title: "Transaction Submitted",
        description: (
          <div>
            EVIX minting transaction submitted. {explorerLink(tx.hash)}
          </div>
        ),
      });

      await tx.wait();
      
      toast({
        title: "EVIX Minted!",
        description: `Successfully minted EVIX tokens for ${amount} USDC`,
      });
      
      // Immediate refresh of all data
      await loadContractData();
      refetchUserPosition();
      refetchVault();
      
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['userPosition', address] });
      queryClient.invalidateQueries({ queryKey: ['/api/v1/vault-stats'] });
    } catch (error: any) {
      toast({
        title: "Mint Failed",
        description: error.message || "Failed to mint EVIX tokens",
        variant: "destructive",
      });
    } finally {
      setIsTransacting(false);
      setMintingEVIX(false);
    }
  };

  const handleRedeemEVIX = async () => {
    if (!evixRedeemAmount || parseFloat(evixRedeemAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to redeem EVIX.",
        variant: "destructive",
      });
      return;
    }

    setIsTransacting(true);
    setRedeemingEVIX(true);
    try {
      await switchToBaseSepolia();
      const tx = await redeemEVIX(evixRedeemAmount);
      
      toast({
        title: "Transaction Submitted",
        description: (
          <div>
            EVIX redemption transaction submitted. {explorerLink(tx.hash)}
          </div>
        ),
      });

      await tx.wait();
      
      toast({
        title: "EVIX Redeemed!",
        description: `Successfully redeemed ${evixRedeemAmount} EVIX tokens`,
      });
      
      setEvixRedeemAmount("");
      // Immediate refresh of all data
      await loadContractData();
      refetchUserPosition();
      refetchVault();
      
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['userPosition', address] });
      queryClient.invalidateQueries({ queryKey: ['/api/v1/vault-stats'] });
    } catch (error: any) {
      toast({
        title: "Redeem Failed",
        description: error.message || "Failed to redeem EVIX tokens",
        variant: "destructive",
      });
    } finally {
      setIsTransacting(false);
      setRedeemingEVIX(false);
    }
  };

  const handleDebug = async () => {
    try {
      const info = await getContractDebugInfo();
      setDebugInfo(info);
      console.log("Debug Info:", info);

      toast({
        title: "Debug Info Retrieved",
        description:
          "Check the browser console for detailed contract information.",
      });
    } catch (error) {
      toast({
        title: "Debug Failed",
        description: "Failed to retrieve debug information.",
        variant: "destructive",
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
          description:
            "This USDC contract doesn't have a mint function. You'll need to get USDC another way.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Failed to Get Test USDC",
        description:
          error.message ||
          "The USDC contract doesn't support minting test tokens.",
        variant: "destructive",
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
                <h3 className="font-bold text-yellow-800">
                  Contracts Not Deployed
                </h3>
                <p className="text-yellow-700">
                  Smart contracts are not yet deployed to Base Sepolia. Please
                  update contract addresses in web3.ts after deployment.
                </p>
                <div className="mt-4 space-y-2 text-sm">
                  <p>
                    <strong>BVIX Token:</strong> {BVIX_ADDRESS}
                  </p>
                  <p>
                    <strong>Oracle:</strong> {ORACLE_ADDRESS}
                  </p>
                  <p>
                    <strong>MintRedeem:</strong> {MINT_REDEEM_ADDRESS}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedPosition = selectedToken === 'bvix' ? userPosition?.bvix : userPosition?.evix;
  let expectedRefund = "0.00";
  let ratePerToken = "0.00";
  const redeemNum = parseFloat(selectedToken === 'bvix' ? redeemAmount : evixRedeemAmount) || 0;

  if (selectedPosition && parseFloat(selectedPosition.debt) > 0) {
    const debtNum = parseFloat(selectedPosition.debt);
    const collateralNum = parseFloat(selectedPosition.collateral);
    
    const refundBeforeFee = (redeemNum * collateralNum) / debtNum;
    expectedRefund = (refundBeforeFee * 0.997).toFixed(2);
    
    const singleBeforeFee = (1 * collateralNum) / debtNum;
    ratePerToken = (singleBeforeFee * 0.997).toFixed(4);
  } else if (redeemNum > 0) {
    // Fallback to price-based if no position (though shouldn't happen)
    const price = parseFloat(selectedToken === 'bvix' ? contractData.bvixPrice : contractData.evixPrice);
    expectedRefund = (redeemNum * price * 0.997).toFixed(2);
    ratePerToken = (price * 0.997).toFixed(4);
  }

  return (
    <div className="space-y-8">
      {/* Price Display - Clickable Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card 
          className={`hover:shadow-lg transition-all cursor-pointer ${selectedToken === 'bvix' ? 'ring-2 ring-orange-500 shadow-lg' : ''}`}
          onClick={() => setSelectedToken('bvix')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Bitcoin className="text-orange-500" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-black">BVIX</h3>
                  <p className="text-sm text-gray-600">
                    Bitcoin Volatility Index
                  </p>
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
            {selectedToken === 'bvix' && (
              <div className="mt-2 text-xs text-orange-600 font-medium">
                Selected for trading
              </div>
            )}
          </CardContent>
        </Card>

        <Card 
          className={`hover:shadow-lg transition-all cursor-pointer ${selectedToken === 'evix' ? 'ring-2 ring-blue-500 shadow-lg' : ''}`}
          onClick={() => setSelectedToken('evix')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <SiEthereum className="text-blue-500" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-black">EVIX</h3>
                  <p className="text-sm text-gray-600">
                    Ethereum Volatility Index
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-black">
                  ${isLoading ? "..." : contractData.evixPrice}
                </div>
                <div className="text-sm text-green-600">Live Price</div>
              </div>
            </div>
            <div className="text-xs text-gray-600">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
            {selectedToken === 'evix' && (
              <div className="mt-2 text-xs text-blue-600 font-medium">
                Selected for trading
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Trading Interface */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Collateral-Aware Mint Section */}
        <CollateralAwareMinting
          tokenSymbol={selectedToken === 'bvix' ? 'BVIX' : 'EVIX'}
          tokenPrice={selectedToken === 'bvix' ? parseFloat(contractData.bvixPrice) : parseFloat(contractData.evixPrice)}
          vaultStats={vaultStats}
          userBalance={parseFloat(contractData.usdcBalance)}
          onMint={async (amount: string, cr: number = 150) => selectedToken === 'bvix' ? await handleMint(amount, cr) : await handleMintEVIX(amount, cr)}
          isLoading={selectedToken === 'bvix' ? mintingBVIX : mintingEVIX}
        />

        {/* Redeem Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <ArrowDown className="w-5 h-5 text-black" />
              Redeem USDC
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label
                htmlFor="redeem-amount"
                className="text-sm font-medium text-gray-700"
              >
                Redeem Amount
              </Label>
              <div className="relative mt-2">
                <Input
                  id="redeem-amount"
                  type="number"
                  placeholder="0.00"
                  value={selectedToken === 'bvix' ? redeemAmount : evixRedeemAmount}
                  onChange={(e) => selectedToken === 'bvix' ? setRedeemAmount(e.target.value) : setEvixRedeemAmount(e.target.value)}
                  className="pr-16"
                />
                <div className="absolute right-3 top-3 text-gray-500">
                  {selectedToken === 'bvix' ? 'BVIX' : 'EVIX'}
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                <span
                  className="cursor-pointer hover:underline"
                  title="Click to use max"
                  onClick={() => selectedToken === 'bvix' ? setRedeemAmount(contractData.bvixBalance) : setEvixRedeemAmount(contractData.evixBalance)}
                >
                  Balance:&nbsp;
                  {isLoading
                    ? "..."
                    : Number(selectedToken === 'bvix' ? contractData.bvixBalance : contractData.evixBalance).toPrecision(6)}{" "}
                  {selectedToken === 'bvix' ? 'BVIX' : 'EVIX'}
                </span>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">You'll receive:</span>
                <span className="font-medium text-black">
                  {expectedRefund} USDC
                </span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-600">Rate:</span>
                <span className="text-gray-600">
                  1 {selectedToken.toUpperCase()} ≈ {ratePerToken} USDC
                </span>
              </div>
            </div>

            <Button
              onClick={selectedToken === 'bvix' ? handleRedeem : handleRedeemEVIX}
              disabled={(selectedToken === 'bvix' ? redeemingBVIX : redeemingEVIX) || (selectedToken === 'bvix' ? !redeemAmount : !evixRedeemAmount)}
              variant="destructive"
              className="w-full"
            >
              {(selectedToken === 'bvix' ? redeemingBVIX : redeemingEVIX) ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Redeeming...
                </>
              ) : (
                `Redeem USDC`
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Vault Dashboard */}
      <Card className="mt-8 col-span-2 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 border shadow-xl">
        <CardHeader className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                <TrendingUp className="text-white" size={20} />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">Vault Dashboard</CardTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400">Real-time portfolio monitoring</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                loadContractData();
                refetchUserPosition();
                refetchVault();
              }}
              disabled={isLoading}
              className="border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* BVIX Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-orange-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Bitcoin className="text-orange-500" size={24} />
                </div>
                <div>
                  <h4 className="font-semibold text-lg text-gray-900 dark:text-white">BVIX Vault</h4>
                  <p className="text-sm text-gray-500">Bitcoin Volatility Index</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Wallet Balance</span>
                  <span className="font-mono font-semibold text-gray-900 dark:text-white">{parseFloat(contractData.bvixBalance).toFixed(2)} BVIX</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Current Price</span>
                  <span className="font-mono font-semibold text-green-600">${contractData.bvixPrice}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Portfolio Value</span>
                  <span className="font-mono font-semibold text-blue-600">${(parseFloat(contractData.bvixBalance) * parseFloat(contractData.bvixPrice)).toFixed(2)}</span>
                </div>
                {userPosition?.bvix && parseFloat(userPosition.bvix.collateral) > 0 && (
                  <div className="pt-2 border-t border-gray-200">
                    <div className="text-xs text-gray-500 mb-2">Active Position</div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Collateral (USDC)</span>
                      <span className="font-mono font-semibold text-gray-900 dark:text-white">{Number(userPosition.bvix.collateral).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Debt (BVIX)</span>
                      <span className="font-mono font-semibold text-gray-900 dark:text-white">{Number(userPosition.bvix.debt).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600">Position CR</span>
                      <span className={`font-mono font-semibold ${getRiskColor(userPosition.bvix.cr)}`}>
                        {userPosition.bvix.cr.toFixed(2)}% ({getRiskLevel(userPosition.bvix.cr)})
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* EVIX Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-blue-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <SiEthereum className="text-blue-500" size={24} />
                </div>
                <div>
                  <h4 className="font-semibold text-lg text-gray-900 dark:text-white">EVIX Vault</h4>
                  <p className="text-sm text-gray-500">Ethereum Volatility Index</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Wallet Balance</span>
                  <span className="font-mono font-semibold text-gray-900 dark:text-white">{parseFloat(contractData.evixBalance).toFixed(2)} EVIX</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Current Price</span>
                  <span className="font-mono font-semibold text-green-600">${contractData.evixPrice}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Portfolio Value</span>
                  <span className="font-mono font-semibold text-blue-600">${(parseFloat(contractData.evixBalance) * parseFloat(contractData.evixPrice)).toFixed(2)}</span>
                </div>
                {userPosition?.evix && parseFloat(userPosition.evix.collateral) > 0 && (
                  <div className="pt-2 border-t border-gray-200">
                    <div className="text-xs text-gray-500 mb-2">Active Position</div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Collateral (USDC)</span>
                      <span className="font-mono font-semibold text-gray-900 dark:text-white">{Number(userPosition.evix.collateral).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Debt (EVIX)</span>
                      <span className="font-mono font-semibold text-gray-900 dark:text-white">{Number(userPosition.evix.debt).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600">Position CR</span>
                      <span className={`font-mono font-semibold ${getRiskColor(userPosition.evix.cr)}`}>
                        {userPosition.evix.cr.toFixed(2)}% ({getRiskLevel(userPosition.evix.cr)})
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6">
            <h4 className="font-semibold text-lg mb-6 text-gray-900 dark:text-white">Vault Summary</h4>
            <div className="space-y-4">
              {(() => {
                // Calculate combined vault metrics
                let totalCollateral = 0;
                let bvixDebt = 0;
                let evixDebt = 0;
                let totalDebtValue = 0;
                
                if (userPosition?.bvix && parseFloat(userPosition.bvix.collateral) > 0) {
                  totalCollateral += parseFloat(userPosition.bvix.collateral);
                  bvixDebt = parseFloat(userPosition.bvix.debt);
                  totalDebtValue += bvixDebt * parseFloat(contractData.bvixPrice);
                }
                
                if (userPosition?.evix && parseFloat(userPosition.evix.collateral) > 0) {
                  totalCollateral += parseFloat(userPosition.evix.collateral);
                  evixDebt = parseFloat(userPosition.evix.debt);
                  totalDebtValue += evixDebt * parseFloat(contractData.evixPrice);
                }
                
                const vaultCR = totalDebtValue > 0 ? (totalCollateral / totalDebtValue) * 100 : 0;
                
                return (
                  <>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Collateral (USDC)</span>
                        <span className="font-mono font-semibold text-green-600">${totalCollateral.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">BVIX Debt</span>
                        <span className="font-mono font-semibold text-orange-600">{bvixDebt.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">EVIX Debt</span>
                        <span className="font-mono font-semibold text-blue-600">{evixDebt.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex justify-between mb-3">
                        <span className="font-medium">Vault CR%:</span>
                        <span className={getRiskColor(vaultCR)}>
                          {vaultCR.toFixed(1)}% ({getRiskLevel(vaultCR)})
                        </span>
                      </div>
                      {/* Health Bar */}
                      <div className="space-y-2">
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div 
                            className={`h-3 rounded-full transition-all duration-300 ${
                              vaultCR >= 150 ? 'bg-green-500' :
                              vaultCR >= 120 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ 
                              width: `${Math.min(100, Math.max(0, (vaultCR / 250) * 100))}%` 
                            }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>120% (Min)</span>
                          <span>150% (Safe)</span>
                          <span>200%+ (Optimal)</span>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6">
        <NetworkHelpers />
      </div>
    </div>
  );
}

// Add helper functions:
const getRiskColor = (cr: number) => {
  if (cr < 120) return 'text-red-600';
  if (cr < 150) return 'text-yellow-600';
  return 'text-green-600';
};
const getRiskLevel = (cr: number) => {
  if (cr < 120) return 'High Risk';
  if (cr < 150) return 'Medium Risk';
  return 'Low Risk';
};
