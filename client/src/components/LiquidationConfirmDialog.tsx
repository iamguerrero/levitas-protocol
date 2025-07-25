import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Info } from "lucide-react";
import { LiquidatableVault } from '@/hooks/useLiquidationFeatures';

interface LiquidationConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vault: LiquidatableVault | null;
  onConfirm: () => void;
  isLiquidating?: boolean;
}

export function LiquidationConfirmDialog({
  open,
  onOpenChange,
  vault,
  onConfirm,
  isLiquidating = false
}: LiquidationConfirmDialogProps) {
  if (!vault) return null;

  // Calculate liquidation amounts
  const tokenPrice = vault.tokenType === 'EVIX' ? 38.02 : 42.19;
  const debtValue = parseFloat(vault.debt) * tokenPrice;
  const bonusAmount = debtValue * 0.05;
  const totalCollateralSeized = debtValue + bonusAmount;
  const remainingCollateral = parseFloat(vault.collateral) - totalCollateralSeized;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Confirm Liquidation
          </DialogTitle>
          <DialogDescription>
            You are about to liquidate Vault #{vault.vaultId} ({vault.tokenType})
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              To liquidate this position, you will need to provide {vault.debt} {vault.tokenType} tokens to repay the debt.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Vault Owner</span>
              <span className="text-sm font-medium">{vault.owner.slice(0, 6)}...{vault.owner.slice(-4)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Current CR</span>
              <span className="text-sm font-semibold text-red-600">{vault.currentCR.toFixed(1)}%</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Debt to Repay</span>
              <span className="text-sm font-medium">{vault.debt} {vault.tokenType}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">{vault.tokenType} Price</span>
              <span className="text-sm font-medium">${tokenPrice.toFixed(2)}</span>
            </div>
            
            <div className="border-t pt-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Debt Value</span>
                <span className="text-sm font-medium">${debtValue.toFixed(2)} USDC</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Liquidation Bonus (5%)</span>
                <span className="text-sm font-medium text-green-600">+${bonusAmount.toFixed(2)} USDC</span>
              </div>
              
              <div className="flex justify-between items-center mt-2 pt-2 border-t">
                <span className="font-medium">You Will Receive</span>
                <span className="font-semibold text-green-600">${totalCollateralSeized.toFixed(2)} USDC</span>
              </div>
              
              <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                <span>Remaining to Owner</span>
                <span>${remainingCollateral.toFixed(2)} USDC</span>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLiquidating}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700"
            disabled={isLiquidating}
          >
            {isLiquidating ? 'Processing...' : 'Confirm Liquidation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}