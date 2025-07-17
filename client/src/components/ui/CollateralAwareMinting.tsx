import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, AlertTriangle, TrendingUp, Loader2 } from "lucide-react";
import { calculateMaxMintable, calculateSuggestedMint, formatCRWithStatus, type CollateralCalculation } from "@/lib/collateral-utils";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface CollateralAwareMintingProps {
  tokenSymbol: 'BVIX' | 'EVIX';
  tokenPrice: number;
  vaultStats: any;
  userBalance: number;
  onMint: (amount: string) => Promise<void>;
  isLoading: boolean;
}

export function CollateralAwareMinting({ 
  tokenSymbol, 
  tokenPrice, 
  vaultStats, 
  userBalance, 
  onMint, 
  isLoading 
}: CollateralAwareMintingProps) {
  const [usdcAmount, setUsdcAmount] = useState("");
  const [calculation, setCalculation] = useState<CollateralCalculation | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (usdcAmount && vaultStats && tokenPrice) {
      const amount = parseFloat(usdcAmount);
      if (!isNaN(amount) && amount > 0) {
        const calc = calculateMaxMintable(amount, tokenPrice, vaultStats);
        setCalculation(calc);
      } else {
        setCalculation(null);
      }
    } else {
      setCalculation(null);
    }
  }, [usdcAmount, vaultStats, tokenPrice]);

  const handleMaxClick = () => {
    if (vaultStats && tokenPrice) {
      const maxAmount = calculateSuggestedMint(vaultStats, tokenPrice, 150);
      setUsdcAmount(Math.min(maxAmount, userBalance).toFixed(2));
    }
  };

  const handleSafeClick = () => {
    if (vaultStats && tokenPrice) {
      const safeAmount = calculateSuggestedMint(vaultStats, tokenPrice, 180);
      setUsdcAmount(Math.min(safeAmount, userBalance).toFixed(2));
    }
  };

  const handleSubmit = async () => {
    if (!calculation?.isValid || !usdcAmount) {
      toast({
        title: "Invalid Amount",
        description: calculation?.warningMessage || "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    try {
      await onMint(usdcAmount);
      setUsdcAmount("");
      setCalculation(null);
    } catch (error: any) {
      toast({
        title: "Minting Failed",
        description: error.message || "An error occurred while minting",
        variant: "destructive",
      });
    }
  };

  const suggestedAmount = vaultStats && tokenPrice ? calculateSuggestedMint(vaultStats, tokenPrice, 150) : 0;
  const crStatus = calculation ? formatCRWithStatus(calculation.futureCR) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Mint {tokenSymbol} (Collateral-Aware)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Vault Status */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Current Vault Status</div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">USDC in Vault:</span> ${parseFloat(vaultStats?.usdc || '0').toFixed(2)}
            </div>
            <div>
              <span className="font-medium">Current CR:</span> 
              <span className={cn("ml-1", vaultStats?.cr >= 120 ? "text-green-600" : "text-red-600")}>
                {vaultStats?.cr ? `${vaultStats.cr.toFixed(1)}%` : '0%'}
              </span>
            </div>
          </div>
        </div>

        {/* Smart Suggestions */}
        {vaultStats?.usdc !== '0.0' && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Smart Suggestions</Label>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSafeClick}
                disabled={isLoading}
              >
                Safe (180% CR)
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleMaxClick}
                disabled={isLoading}
              >
                Optimal (150% CR)
              </Button>
            </div>
          </div>
        )}

        {/* Input Field */}
        <div className="space-y-2">
          <Label htmlFor="usdc-amount">USDC Amount to Deposit</Label>
          <div className="relative">
            <Input
              id="usdc-amount"
              type="number"
              placeholder="0.00"
              value={usdcAmount}
              onChange={(e) => setUsdcAmount(e.target.value)}
              className="pr-16"
              disabled={isLoading}
            />
            <div className="absolute right-3 top-2.5 text-sm text-gray-500">USDC</div>
          </div>
          <div className="text-xs text-gray-500">
            Balance: {userBalance.toFixed(2)} USDC
          </div>
        </div>

        {/* Calculation Results */}
        {calculation && (
          <div className="space-y-3">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm font-medium text-blue-900 mb-2">Mint Preview</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>You'll receive:</span>
                  <span className="font-medium">{(calculation.maxMintableTokens).toFixed(4)} {tokenSymbol}</span>
                </div>
                <div className="flex justify-between">
                  <span>Exchange rate:</span>
                  <span>1 USDC = {(1 / tokenPrice).toFixed(6)} {tokenSymbol}</span>
                </div>
                <div className="flex justify-between">
                  <span>Mint fee (0.3%):</span>
                  <span>${(parseFloat(usdcAmount) * 0.003).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm font-medium mb-2">Collateral Impact</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Current CR:</span>
                  <span className={calculation.currentCR >= 120 ? "text-green-600" : "text-red-600"}>
                    {calculation.currentCR.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Future CR:</span>
                  <span className={crStatus?.color}>
                    {crStatus?.text}
                  </span>
                </div>
              </div>
            </div>

            {calculation.warningMessage && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {calculation.warningMessage}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* No Collateral Warning */}
        {vaultStats?.usdc === '0.0' && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <Info className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>No Collateral in Vault:</strong> Before minting, someone needs to add USDC collateral to the vault. 
              Use the "Get Test USDC" button and the addCollateral function to fund the vault.
            </AlertDescription>
          </Alert>
        )}

        {/* Submit Button */}
        <Button 
          onClick={handleSubmit}
          disabled={!calculation?.isValid || isLoading || !usdcAmount}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Minting...
            </>
          ) : (
            `Mint ${tokenSymbol}`
          )}
        </Button>

        {/* Educational Note */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Minimum collateral ratio: 120%</p>
          <p>• Recommended safe range: 150-200%</p>
          <p>• Protocol-wide collateral protects all token holders</p>
        </div>
      </CardContent>
    </Card>
  );
}