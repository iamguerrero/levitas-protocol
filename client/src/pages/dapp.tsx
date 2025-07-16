import { useState } from "react";
import Navigation from "@/components/ui/navigation";
import WalletConnect from "@/components/ui/wallet-connect";
import TradingInterface from "@/components/ui/trading-interface";
import { useWallet } from "@/hooks/use-wallet";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function DAppPage() {
  const { isConnected, address, connectWallet, disconnect } = useWallet();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* DApp Header */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-black">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <span className="text-sm text-gray-500">Base Sepolia Testnet</span>
            </div>
            <WalletConnect />
          </div>
        </div>
      </div>

      {/* DApp Content */}
      <div className="pt-6 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {isConnected ? (
            <TradingInterface />
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
