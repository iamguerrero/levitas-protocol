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
  const [usdcInput, setUsdcInput] = useState(""); // User input amount
  const [tokensToReceive, setTokensToReceive] = useState(0);
  const [calculation, setCalculation] = useState<CollateralCalculation | null>(null);
  const { toast } = useToast();

  // Calculate tokens to receive based on USDC input and CR (matching contract logic)
  useEffect(() => {
    if (!vaultStats || !tokenPrice || !usdcInput) {
      setTokensToReceive(0);
      return;
    }

    const usdcAmount = parseFloat(usdcInput);
    if (isNaN(usdcAmount) || usdcAmount <= 0) {
      setTokensToReceive(0);
      return;
    }

    const currentVaultUSDC = parseFloat(vaultStats.usdc);
    const currentTokenSupply = parseFloat(vaultStats.bvix);
    const selectedCR = targetCR[0];

    // Calculate tokens based on USDC input and selected CR
    // Method 1: Direct calculation - Max token value at this CR from USDC
    const maxTokenValueFromUSDC = usdcAmount / (selectedCR / 100);
    const tokensFromCR = (maxTokenValueFromUSDC / tokenPrice) * 0.997; // After fee
    
    // Method 2: Simple division - what you'd get if just buying tokens
    const tokensFromDirect = (usdcAmount * 0.997) / tokenPrice;
    
    // Use the smaller amount (the constraint is the limiting factor)
    const tokensToMint = Math.min(tokensFromCR, tokensFromDirect);
    
    setTokensToReceive(tokensToMint);
  }, [usdcInput, targetCR, vaultStats, tokenPrice]);

  const handleSliderChange = (value: number[]) => {
    setTargetCR(value);
  };

  const handleSubmit = async () => {
    if (!usdcInput || parseFloat(usdcInput) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid USDC amount",
        variant: "destructive",
      });
      return;
    }

    if (parseFloat(usdcInput) > userBalance) {
      toast({
        title: "Insufficient Balance",
        description: `You need ${usdcInput} USDC but only have ${userBalance.toFixed(2)} USDC`,
        variant: "destructive",
      });
      return;
    }

    try {
      await onMint(usdcInput);
      // Reset after successful mint
      setUsdcInput("");
      setTargetCR([150]);
    } catch (error: any) {
      toast({
        title: "Minting Failed",
        description: error.message || "An error occurred while minting",
        variant: "destructive",
      });
    }
  };

  const canMint = parseFloat(usdcInput) > 0 && parseFloat(usdcInput) <= userBalance;

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

        {/* USDC Input */}
        <div className="space-y-2">
          <Label htmlFor="usdc-input" className="text-sm font-medium">
            USDC Amount to Spend
          </Label>
          <div className="relative">
            <Input
              id="usdc-input"
              type="number"
              placeholder="0.00"
              value={usdcInput}
              onChange={(e) => setUsdcInput(e.target.value)}
              className="pr-16"
              disabled={isLoading}
            />
            <div className="absolute right-3 top-2.5 text-sm text-gray-500">USDC</div>
          </div>
          <div className="text-xs text-gray-500">
            Balance: {userBalance.toFixed(2)} USDC
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
          {usdcInput && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm font-medium text-blue-900 mb-2">Mint Preview</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>You'll receive:</span>
                  <span className="font-medium">{tokensToReceive.toFixed(4)} {tokenSymbol}</span>
                </div>
                <div className="flex justify-between">
                  <span>{tokenSymbol} price:</span>
                  <span className="font-medium">${tokenPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Exchange rate:</span>
                  <span>1 USDC = {(1 / tokenPrice).toFixed(6)} {tokenSymbol}</span>
                </div>
                <div className="flex justify-between">
                  <span>Mint fee (0.3%):</span>
                  <span>${(parseFloat(usdcInput || '0') * 0.003).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Vault Status Info */}
        {vaultStats?.usdc === '0.0' && vaultStats.bvix !== '0' && (
          <Alert className="border-red-200 bg-red-50">
            <Info className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Vault Undercollateralized:</strong> The vault has {parseFloat(vaultStats.bvix).toFixed(2)} BVIX tokens (${(parseFloat(vaultStats.bvix) * tokenPrice).toFixed(2)} value) but no USDC collateral.
              <br />
              <strong>Minimum USDC needed:</strong> ${((parseFloat(vaultStats.bvix) * tokenPrice * targetCR[0]) / 100).toFixed(2)} for {targetCR[0]}% CR.
              <br />
              New minting is blocked until sufficient collateral is added via the addCollateral function.
            </AlertDescription>
          </Alert>
        )}
        
        {vaultStats?.usdc === '0.0' && vaultStats.bvix === '0' && (
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Fresh Vault:</strong> This is the first mint to the vault. You can mint tokens at your selected collateral ratio.
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
          ) : tokensToReceive > 0 ? (
            `Mint ${tokensToReceive.toFixed(4)} ${tokenSymbol}`
          ) : (
            `Mint ${tokenSymbol}`
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