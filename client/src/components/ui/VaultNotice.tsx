import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Info } from "lucide-react";

export function VaultNotice() {
  return (
    <Alert className="border-blue-200 bg-blue-50">
      <Info className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-blue-800">
        <strong>Protocol Upgrade Notice:</strong> The vault is currently being migrated to V2 with proper collateral enforcement. 
        The old MintRedeem contract has 949 USDC but the new V2 contract (with 120% collateral ratio enforcement) needs funding.
        Use the "Get Test USDC" button and the addCollateral function to fund the new vault.
      </AlertDescription>
    </Alert>
  );
}