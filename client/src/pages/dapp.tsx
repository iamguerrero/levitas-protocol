import { useState, useEffect } from "react";
import Navigation from "@/components/ui/navigation";
import AppDashboard from "@/components/AppDashboard";
import { useWallet } from "@/hooks/use-wallet";
import { Button } from "@/components/ui/button";
import { getNetworkName } from "@/lib/web3";
import { useRealTimeOracle } from "@/hooks/useRealTimeOracle";

export default function DAppPage() {
  const { isConnected, address, connectWallet, disconnect } = useWallet();
  const [networkName, setNetworkName] = useState("Base Sepolia Testnet");
  const { isConnected: oracleConnected } = useRealTimeOracle();

  useEffect(() => {
    const updateNetworkName = async () => {
      try {
        const name = await getNetworkName();
        setNetworkName(name);
      } catch (error) {
        console.error("Failed to get network name:", error);
      }
    };

    updateNetworkName();

    // Listen for network changes
    if (window.ethereum) {
      window.ethereum.on('chainChanged', updateNetworkName);
      return () => {
        window.ethereum?.removeListener('chainChanged', updateNetworkName);
      };
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      

      {/* DApp Content */}
      <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {isConnected ? (
            <AppDashboard />
          ) : (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Wallet</h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Connect your MetaMask wallet to start minting and redeeming volatility tokens.
              </p>
              <Button onClick={connectWallet} size="lg" className="bg-blue-600 hover:bg-blue-700">
                Connect MetaMask
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}