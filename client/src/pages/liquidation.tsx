import { LiquidationDashboard } from "@/components/LiquidationDashboard";
import Navigation from "@/components/ui/navigation";

export default function LiquidationPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <div className="pt-16">
        <LiquidationDashboard />
      </div>
    </div>
  );
}