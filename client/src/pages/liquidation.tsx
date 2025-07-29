import { useEffect } from "react";
import { useLocation } from "wouter";

export default function LiquidationPage() {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    // Redirect to app with liquidation tab selected
    setLocation("/app?tab=liquidation");
  }, [setLocation]);
  
  return null;
}