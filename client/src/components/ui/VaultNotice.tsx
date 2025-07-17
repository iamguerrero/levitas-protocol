import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Info } from "lucide-react";

export function VaultNotice() {
  return (
    <Alert className="border-blue-200 bg-blue-50">
      <Info className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-blue-800">
        <strong>V2 Collateral Enforcement Active:</strong> The new MintRedeemV2 contract at 0x685FEc86F539a1C0e9aEEf02894D5D90bfC48098 
        now properly enforces the 120% minimum collateral ratio. Minting 100 USDC worth will be blocked to prevent under-collateralization.
        Use "Get Test USDC" and the addCollateral function to fund the vault above 120% for minting.
      </AlertDescription>
    </Alert>
  );
}