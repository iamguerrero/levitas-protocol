import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HapticButton } from "@/components/ui/haptic-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bitcoin, TrendingUp, Loader2, AlertCircle, ArrowUp, ArrowDown, Clock, Wifi } from "lucide-react";
import { SiEthereum } from "react-icons/si";
import { VaultHealth } from "@/components/ui/VaultHealth";
import { NetworkHelpers } from "@/components/ui/NetworkHelpers";
import { PriceDisplay } from "@/components/ui/PriceDisplay";
// VaultNotice removed - V4 contracts work without collateral enforcement
import { CollateralAwareMinting } from "@/components/ui/CollateralAwareMinting";
import { useWallet } from "@/hooks/use-wallet";
import { useToast } from "@/hooks/use-toast";
import { useRealTimeOracle } from '@/hooks/useRealTimeOracle';
import { usePriceHistory } from '@/hooks/usePriceHistory';
import { PriceChart } from '@/components/ui/PriceChart';

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useVault } from "@/hooks/useVault";
import { useUserPositions } from "@/hooks/useUserPositions";
import {
  getBVIXBalance,
  getEVIXBalance,
  getUSDCBalance,
  getAllBalances,
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
  formatPrice,
  BVIX_ADDRESS,
  EVIX_ADDRESS,
  ORACLE_ADDRESS,
  BVIX_MINT_REDEEM_V8_ADDRESS,
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

  // Real-time oracle data
  const { bvixPrice: realtimeBvixPrice, evixPrice: realtimeEvixPrice, isConnected: oracleConnected, lastUpdate: oracleLastUpdate } = useRealTimeOracle();

  // Price history tracking (Sprint 2.1)
  const { history, addPricePoint } = usePriceHistory();

  // Import vault refresh functions
  const { refetch: refetchVault } = useVault();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [collateralRatio, setCollateralRatio] = useState<number | null>(null);
  const [vaultStats, setVaultStats] = useState<{
    price?: string;
    evixPrice?: string;
    usdc?: string;
    bvix?: string;
    evix?: string;
    cr?: number;
  } | null>(null);

  // Use liquidation-aware user positions hook instead of raw blockchain data
  const { data: userPositions, isLoading: userPositionLoading } = useUserPositions();
  
  // Fallback: fetch positions directly from API if hook fails
  const [apiUserPositions, setApiUserPositions] = useState(null);
  
  useEffect(() => {
    if (address && !userPositions && !userPositionLoading) {
      fetch(`/api/v1/user-positions/${address}`)
        .then(res => res.json())
        .then(data => {
          setApiUserPositions(data);
        })
        .catch(err => {});
    }
  }, [address, userPositions, userPositionLoading]);
  
  // Use either hook data or API data
  const effectiveUserPositions = userPositions || apiUserPositions;
  


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

  // Change initial state to avoid hardcoded defaults
  const [contractData, setContractData] = useState({
    bvixPrice: "",
    evixPrice: "",
    usdcBalance: "0.00",
    bvixBalance: "0.00",
    evixBalance: "0.00",
    totalValue: "0.00",
  });

  // Check if contracts are deployed
  // ✅ treat both sides as plain strings
  const contractsDeployed = String(BVIX_ADDRESS) !== "0xBVIXAddressHere";

  // Load vault stats with user address for mock USDC balance
  const { data: vaultData } = useQuery<{
    price?: string;
    evixPrice?: string;
    usdc?: string;
    bvix?: string;
    evix?: string;
    cr?: number;
  }>({
    queryKey: ['/api/v1/vault-stats', address],
    queryFn: async () => {
      const response = await fetch(`/api/v1/vault-stats${address ? `?address=${address}` : ''}`);
      if (!response.ok) throw new Error('Failed to fetch vault stats');
      return response.json();
    },
    refetchInterval: 20000,
    enabled: true,
  });

  useEffect(() => {
    if (vaultData) {
      setVaultStats(vaultData);

      // Use backend API prices for consistency with user-positions and liquidatable-positions APIs
      // This ensures frontend and backend use the same pricing source
      setContractData(prev => ({
        ...prev,
        bvixPrice: vaultData.price || realtimeBvixPrice || prev.bvixPrice,
        evixPrice: vaultData.evixPrice || realtimeEvixPrice || prev.evixPrice,
        // Update BVIX balance from API when liquidated (shows 0.0)
        bvixBalance: vaultData.bvix !== undefined ? vaultData.bvix : prev.bvixBalance,
        evixBalance: vaultData.evix !== undefined ? vaultData.evix : prev.evixBalance,
        usdcBalance: vaultData.usdc !== undefined ? vaultData.usdc : prev.usdcBalance,
      }));
    }
  }, [vaultData, realtimeBvixPrice, realtimeEvixPrice]);

  // Use real-time prices only as fallback when API data is unavailable
  useEffect(() => {
    if ((realtimeBvixPrice || realtimeEvixPrice) && (!vaultData?.price || !vaultData?.evixPrice)) {
      // Real-time price fallback active
      setContractData(prev => ({
        ...prev,
        bvixPrice: vaultData?.price || realtimeBvixPrice || prev.bvixPrice,
        evixPrice: vaultData?.evixPrice || realtimeEvixPrice || prev.evixPrice,
      }));

      // Track price history for charts
      if (realtimeBvixPrice && parseFloat(realtimeBvixPrice) > 0) {
        addPricePoint('bvix', parseFloat(realtimeBvixPrice));
      }
      if (realtimeEvixPrice && parseFloat(realtimeEvixPrice) > 0) {
        addPricePoint('evix', parseFloat(realtimeEvixPrice));
      }
    }
  }, [realtimeBvixPrice, realtimeEvixPrice, oracleConnected, addPricePoint]);

  // In the useEffect for address change
  useEffect(() => {
    if (address && contractsDeployed) {
      // Clear any mock balances when loading the trading interface  
      localStorage.removeItem('mockBalances');
      setIsLoading(true);
      setContractData(prev => ({
        ...prev,
        usdcBalance: "0.00",
        bvixBalance: "0.00",
        evixBalance: "0.00",
        totalValue: "0.00",
      }));
      loadContractData();
    } else {
      setIsLoading(false);
    }
  }, [address, contractsDeployed]);

  // Auto-refresh contract data every 30 seconds (reduced frequency)
  useEffect(() => {
    if (!address || !contractsDeployed) return;

    const interval = setInterval(() => {
      // Only refresh if not currently loading to avoid overlapping calls
      if (!isLoading) {
        loadContractData();
      }
    }, 90000); // Increased to 90s to further reduce violations

    return () => clearInterval(interval);
  }, [address, contractsDeployed]);

  const loadContractData = async () => {
    if (!address) return;

    setIsLoading(true);
    try {
      // Loading contract data
      
      // Only get wallet balances from blockchain - use API for prices to avoid 800ms violations
      const balances = await getAllBalances(address);
      const { bvixBalance, evixBalance, usdcBalance } = balances;

      // Use real-time API prices instead of expensive Web3 oracle calls  
      const apiPrice = realtimeBvixPrice || vaultData?.price || "42.15";
      const apiEvixPrice = realtimeEvixPrice || vaultData?.evixPrice || "37.98";

      const totalValue = (
        parseFloat(bvixBalance) * parseFloat(apiPrice) +
        parseFloat(evixBalance) * parseFloat(apiEvixPrice) +
        parseFloat(usdcBalance)
      ).toFixed(2);

      setContractData({
        bvixPrice: apiPrice,
        evixPrice: apiEvixPrice,
        usdcBalance,
        bvixBalance,
        evixBalance,
        totalValue,
      });
    } catch (error) {
      console.error("Error loading contract data:", error);

      // Fallback to API prices if web3 calls fail
      if (vaultData) {
        // Falling back to API prices
        setContractData(prev => ({
          ...prev,
          bvixPrice: vaultData.price || prev.bvixPrice,
          evixPrice: vaultData.evixPrice || prev.evixPrice,
        }));
      }

      toast({
        title: "Contract Error",
        description:
          "Failed to load contract data. Using API prices as fallback.",
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

      // Only invalidate queries, don't double-load
      refetchVault();
      queryClient.invalidateQueries({ queryKey: ['userPositions', address] });
      queryClient.invalidateQueries({ queryKey: ['/api/v1/vault-stats'] });
      
      // Single refresh after invalidation
      setTimeout(() => loadContractData(), 1000);
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
      // Only invalidate queries, don't double-load
      refetchVault();
      queryClient.invalidateQueries({ queryKey: ['userPositions', address] });
      queryClient.invalidateQueries({ queryKey: ['/api/v1/vault-stats'] });
      
      // Single refresh after invalidation
      setTimeout(() => loadContractData(), 1000);
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

      // Only invalidate queries, don't double-load
      refetchVault();
      queryClient.invalidateQueries({ queryKey: ['userPositions', address] });
      queryClient.invalidateQueries({ queryKey: ['/api/v1/vault-stats'] });
      
      // Single refresh after invalidation
      setTimeout(() => loadContractData(), 1000);
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
      // Only invalidate queries, don't double-load
      refetchVault();
      queryClient.invalidateQueries({ queryKey: ['userPositions', address] });
      queryClient.invalidateQueries({ queryKey: ['/api/v1/vault-stats'] });
      
      // Single refresh after invalidation
      setTimeout(() => loadContractData(), 1000);
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
        setTimeout(() => loadContractData(), 1000); // Refresh balances after delay
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
                    <strong>MintRedeem:</strong> {BVIX_MINT_REDEEM_V8_ADDRESS}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedPosition = selectedToken === 'bvix' ? userPositions?.bvix : userPositions?.evix;
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
    const price = parseFloat(selectedToken === 'bvix' ? formatPrice(contractData.bvixPrice) : formatPrice(contractData.evixPrice));
    expectedRefund = (redeemNum * price * 0.997).toFixed(2);
    ratePerToken = (price * 0.997).toFixed(4);
  }

  const { bvixPrice: realTimeBvix, evixPrice: realTimeEvix } = useRealTimeOracle();

  // Add effects to update contractData on real-time changes
  useEffect(() => {
    if (realTimeBvix && parseFloat(realTimeBvix) > 0) {
      setContractData(prev => ({ ...prev, bvixPrice: realTimeBvix }));
    }
  }, [realTimeBvix]);

  useEffect(() => {
    if (realTimeEvix && parseFloat(realTimeEvix) > 0) {
      setContractData(prev => ({ ...prev, evixPrice: realTimeEvix }));
    }
  }, [realTimeEvix]);

  return (
    <div className="space-y-8">

      {/* Price Display - Clickable Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card 
          className={`hover:shadow-lg transition-shadow cursor-pointer ${selectedToken === 'bvix' ? 'ring-2 ring-orange-500 shadow-lg' : ''}`}
          onClick={() => setSelectedToken('bvix')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Bitcoin className="text-orange-500" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">BVIX</h3>
                  <p className="text-sm text-muted-foreground">
                    Bitcoin Volatility Index
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-foreground">
                  ${parseFloat(realtimeBvixPrice || contractData.bvixPrice || "0").toFixed(2)}
                </div>
              </div>
            </div>
            {selectedToken === 'bvix' && (
              <div className="mt-2 text-xs text-orange-600 font-medium">
                Selected for trading
              </div>
            )}
          </CardContent>
        </Card>

        <Card 
          className={`hover:shadow-lg transition-shadow cursor-pointer ${selectedToken === 'evix' ? 'ring-2 ring-blue-500 shadow-lg' : ''}`}
          onClick={() => setSelectedToken('evix')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <SiEthereum className="text-blue-500" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">EVIX</h3>
                  <p className="text-sm text-muted-foreground">
                    Ethereum Volatility Index
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-foreground">
                  ${parseFloat(realtimeEvixPrice || contractData.evixPrice || "0").toFixed(2)}
                </div>
              </div>
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
          tokenPrice={selectedToken === 'bvix' ? parseFloat(formatPrice(contractData.bvixPrice)) : parseFloat(formatPrice(contractData.evixPrice))}
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
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-green-600">${realtimeBvixPrice || formatPrice(contractData.bvixPrice)}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Portfolio Value</span>
                  <span className="font-mono font-semibold text-blue-600">${(parseFloat(contractData.bvixBalance) * parseFloat(realtimeBvixPrice || formatPrice(contractData.bvixPrice))).toFixed(2)}</span>
                </div>
                {effectiveUserPositions?.bvix && parseFloat(effectiveUserPositions.bvix.collateral) > 0 && (
                  <div className="pt-4">
                    <div className="text-xs text-black font-bold mb-2">Active Position</div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Collateral (USDC)</span>
                      <span className="font-mono font-semibold text-gray-900 dark:text-white">{Number(effectiveUserPositions.bvix.collateral).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Debt (BVIX)</span>
                      <span className="font-mono font-semibold text-gray-900 dark:text-white">{Number(effectiveUserPositions.bvix.debt).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600">Position CR</span>
                      {(() => {
                        // Calculate real-time CR: (Collateral / (Debt * Current Price)) * 100
                        const collateral = parseFloat(effectiveUserPositions.bvix.collateral);
                        const debt = parseFloat(effectiveUserPositions.bvix.debt);
                        const currentPrice = parseFloat(realtimeBvixPrice || formatPrice(contractData.bvixPrice));
                        const realtimeCR = debt > 0 ? (collateral / (debt * currentPrice)) * 100 : 0;

                        return (
                          <span className={`font-mono font-semibold ${getRiskColor(realtimeCR)}`}>
                            {realtimeCR.toFixed(2)}% ({getRiskLevel(realtimeCR)})
                          </span>
                        );
                      })()}
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
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-green-600">${realtimeEvixPrice || formatPrice(contractData.evixPrice)}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Portfolio Value</span>
                  <span className="font-mono font-semibold text-blue-600">${(parseFloat(contractData.evixBalance) * parseFloat(realtimeEvixPrice || formatPrice(contractData.evixPrice))).toFixed(2)}</span>
                </div>
                {effectiveUserPositions?.evix && parseFloat(effectiveUserPositions.evix.collateral) > 0 && (
                  <div className="pt-4">
                    <div className="text-xs text-black font-bold mb-2">Active Position</div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Collateral (USDC)</span>
                      <span className="font-mono font-semibold text-gray-900 dark:text-white">{Number(effectiveUserPositions.evix.collateral).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Debt (EVIX)</span>
                      <span className="font-mono font-semibold text-gray-900 dark:text-white">{Number(effectiveUserPositions.evix.debt).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600">Position CR</span>
                      {(() => {
                        // Calculate real-time CR: (Collateral / (Debt * Current Price)) * 100
                        const collateral = parseFloat(effectiveUserPositions.evix.collateral);
                        const debt = parseFloat(effectiveUserPositions.evix.debt);
                        const currentPrice = parseFloat(realtimeEvixPrice || formatPrice(contractData.evixPrice));
                        const realtimeCR = debt > 0 ? (collateral / (debt * currentPrice)) * 100 : 0;

                        return (
                          <span className={`font-mono font-semibold ${getRiskColor(realtimeCR)}`}>
                            {realtimeCR.toFixed(2)}% ({getRiskLevel(realtimeCR)})
                          </span>
                        );
                      })()}
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
                // Calculate combined vault metrics using real data
                let totalCollateral = 0;
                let bvixDebt = 0;
                let evixDebt = 0;
                let totalDebtValue = 0;

                // Use real-time prices for accurate calculations
                const currentBvixPrice = parseFloat(realtimeBvixPrice || formatPrice(contractData.bvixPrice));
                const currentEvixPrice = parseFloat(realtimeEvixPrice || formatPrice(contractData.evixPrice));

                // Debug logging removed for performance

                // Only count active positions (vaults), not wallet balances
                // BVIX vault
                if (effectiveUserPositions?.bvix && parseFloat(effectiveUserPositions.bvix.collateral) > 0) {
                  totalCollateral += parseFloat(effectiveUserPositions.bvix.collateral);
                  bvixDebt = parseFloat(effectiveUserPositions.bvix.debt);
                  totalDebtValue += bvixDebt * currentBvixPrice;
                }

                // EVIX vault  
                if (effectiveUserPositions?.evix && parseFloat(effectiveUserPositions.evix.collateral) > 0) {
                  totalCollateral += parseFloat(effectiveUserPositions.evix.collateral);
                  evixDebt = parseFloat(effectiveUserPositions.evix.debt);
                  totalDebtValue += evixDebt * currentEvixPrice;
                }

                // If no active vaults, don't show any CR
                const hasActiveVaults = (effectiveUserPositions?.bvix && parseFloat(effectiveUserPositions.bvix.collateral) > 0) || 
                                      (effectiveUserPositions?.evix && parseFloat(effectiveUserPositions.evix.collateral) > 0);
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
                        {hasActiveVaults ? (
                          <span className={getRiskColor(vaultCR)}>
                            {vaultCR.toFixed(1)}% ({getRiskLevel(vaultCR)})
                          </span>
                        ) : (
                          <span className="text-gray-500">No active vaults</span>
                        )}
                      </div>
                      {/* Health Bar - only show if there are active vaults */}
                      {hasActiveVaults && (
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
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sprint 2.1: Price History Charts */}
      <div className="grid md:grid-cols-2 gap-8 mt-8">
        <PriceChart
          token="bvix"
          data={history.bvix}
          currentPrice={realtimeBvixPrice || formatPrice(contractData.bvixPrice)}
          isConnected={oracleConnected}
        />
        <PriceChart
          token="evix"
          data={history.evix}
          currentPrice={realtimeEvixPrice || formatPrice(contractData.evixPrice)}
          isConnected={oracleConnected}
        />
      </div>

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