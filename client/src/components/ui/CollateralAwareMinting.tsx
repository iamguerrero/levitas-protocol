import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Slider } from "@/components/ui/slider";
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
  const [targetCR, setTargetCR] = useState([150]); // Default to 150% CR
  const [usdcToAdd, setUsdcToAdd] = useState("");
  const [tokensToReceive, setTokensToReceive] = useState(0);
  const [calculation, setCalculation] = useState<CollateralCalculation | null>(null);
  const { toast } = useToast();

  // Calculate how much USDC needed for collateral and how much tokens to receive
  useEffect(() => {
    if (!vaultStats || !tokenPrice) {
      setTokensToReceive(0);
      setUsdcToAdd("");
      return;
    }

    const currentVaultUSDC = parseFloat(vaultStats.usdc);
    const currentTokenSupply = parseFloat(vaultStats.bvix);
    const selectedCR = targetCR[0];

    if (currentVaultUSDC === 0 && currentTokenSupply > 0) {
      // Vault has no USDC but has tokens - need to add collateral
      const currentTokenValueUSD = currentTokenSupply * tokenPrice;
      const minUsdcNeeded = (currentTokenValueUSD * selectedCR) / 100;
      
      // No new tokens can be minted until collateral is added
      setTokensToReceive(0);
      setUsdcToAdd(minUsdcNeeded.toFixed(2));
    } else if (currentVaultUSDC === 0 && currentTokenSupply === 0) {
      // Fresh vault - calculate for first mint
      // Start with $100 worth of tokens as example
      const targetTokenValueUSD = 100;
      const requiredUSDC = (targetTokenValueUSD * selectedCR) / 100;
      const tokensToMint = (targetTokenValueUSD / tokenPrice) * 0.997; // After fee
      
      setTokensToReceive(tokensToMint);
      setUsdcToAdd(requiredUSDC.toFixed(2));
    } else {
      // Normal operation with existing collateral
      const maxTokenValueAtCR = currentVaultUSDC / (selectedCR / 100);
      const currentTokenValueUSD = currentTokenSupply * tokenPrice;
      const additionalTokenValue = Math.max(0, maxTokenValueAtCR - currentTokenValueUSD);
      
      // Calculate tokens to receive (accounting for 0.3% fee)
      const tokensFromValue = additionalTokenValue / tokenPrice;
      const tokensAfterFee = tokensFromValue * 0.997;
      
      // Calculate USDC needed to mint these tokens
      const usdcNeededForTokens = tokensFromValue * tokenPrice;
      
      setTokensToReceive(Math.max(0, tokensAfterFee));
      setUsdcToAdd(usdcNeededForTokens > 0 ? usdcNeededForTokens.toFixed(2) : "0");
    }
  }, [targetCR, vaultStats, tokenPrice]);

  const handleSliderChange = (value: number[]) => {
    setTargetCR(value);
  };

  const handleSubmit = async () => {
    if (!usdcToAdd || parseFloat(usdcToAdd) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please select a valid collateral ratio",
        variant: "destructive",
      });
      return;
    }

    if (parseFloat(usdcToAdd) > userBalance) {
      toast({
        title: "Insufficient Balance",
        description: `You need ${usdcToAdd} USDC but only have ${userBalance.toFixed(2)} USDC`,
        variant: "destructive",
      });
      return;
    }

    try {
      await onMint(usdcToAdd);
      // Reset after successful mint
      setTargetCR([150]);
    } catch (error: any) {
      toast({
        title: "Minting Failed",
        description: error.message || "An error occurred while minting",
        variant: "destructive",
      });
    }
  };

  const canMint = tokensToReceive >= 0 && parseFloat(usdcToAdd) > 0 && parseFloat(usdcToAdd) <= userBalance;

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

        {/* Collateral Ratio Slider */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Target Collateral Ratio: {targetCR[0]}%
            </Label>
            <Slider
              value={targetCR}
              onValueChange={handleSliderChange}
              min={120}
              max={200}
              step={5}
              className="w-full"
              disabled={isLoading}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>120% (Minimum)</span>
              <span>150% (Optimal)</span>
              <span>200% (Safe)</span>
            </div>
          </div>

          {/* Mint Preview */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-sm font-medium text-blue-900 mb-2">Mint Preview</div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>You'll receive:</span>
                <span className="font-medium">{tokensToReceive.toFixed(4)} {tokenSymbol}</span>
              </div>
              <div className="flex justify-between">
                <span>USDC needed:</span>
                <span className="font-medium">${usdcToAdd}</span>
              </div>
              <div className="flex justify-between">
                <span>Exchange rate:</span>
                <span>1 USDC = {(1 / tokenPrice).toFixed(6)} {tokenSymbol}</span>
              </div>
              <div className="flex justify-between">
                <span>Mint fee (0.3%):</span>
                <span>${(parseFloat(usdcToAdd || '0') * 0.003).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Balance Check */}
          <div className="text-xs text-gray-500">
            Balance: {userBalance.toFixed(2)} USDC
            {parseFloat(usdcToAdd) > userBalance && (
              <span className="text-red-500 ml-2">
                (Need ${(parseFloat(usdcToAdd) - userBalance).toFixed(2)} more)
              </span>
            )}
          </div>
        </div>

        {/* Vault Status Info */}
        {vaultStats?.usdc === '0.0' && vaultStats.bvix !== '0' && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <Info className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Vault Needs Collateral:</strong> The vault has {parseFloat(vaultStats.bvix).toFixed(2)} BVIX tokens but no USDC collateral.
              The amount shown above is the minimum USDC needed to restore the selected collateral ratio.
            </AlertDescription>
          </Alert>
        )}
        
        {vaultStats?.usdc === '0.0' && vaultStats.bvix === '0' && (
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Fresh Vault:</strong> This is the first mint to the vault. The amount shown represents 
              minting $100 worth of {tokenSymbol} tokens at your selected collateral ratio.
            </AlertDescription>
          </Alert>
        )}

        {/* Submit Button */}
        <Button 
          onClick={handleSubmit}
          disabled={!canMint || isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Minting...
            </>
          ) : (
            `Mint ${tokensToReceive.toFixed(4)} ${tokenSymbol}`
          )}
        </Button>

        {/* Educational Note */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Slide to choose your target collateral ratio (120-200%)</p>
          <p>• Higher ratios = safer but fewer tokens received</p>
          <p>• Protocol-wide collateral protects all token holders</p>
        </div>
      </CardContent>
    </Card>
  );
}