import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Link, useLocation } from "wouter";
import WalletConnect from "@/components/ui/wallet-connect";
import { useWallet } from "@/hooks/use-wallet";
const levitasLogoPath = "/levi large.jpg";

export default function Navigation() {
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isConnected } = useWallet();

  return (
    <nav className="fixed top-0 w-full z-50 glass-effect border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/">
            <div className="flex items-center space-x-3 cursor-pointer">
              {/* Levitas Logo */}
              <img 
                src={levitasLogoPath} 
                alt="Levitas Finance Logo"
                className="w-10 h-8 object-cover rounded-md"
              />
              <div>
                <span className="text-xl font-bold text-black">
                  Levitas Finance
                </span>
                <div className="text-xs text-gray-500 -mt-1">
                  Composable Volatility
                </div>
              </div>
            </div>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link href="/">
              <span className="text-gray-600 hover:text-black transition-colors cursor-pointer">
                Home
              </span>
            </Link>
            <a
              href="#tokens"
              className="text-gray-600 hover:text-black transition-colors"
            >
              Tokens
            </a>
            <a
              href="/Levitas Finance Whitepaper V1.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-black transition-colors"
            >
              Whitepaper
            </a>
            <a
              href="/levitas-litepaper.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-black transition-colors"
            >
              Litepaper
            </a>
            <Link href="/learn">
              <span className={`transition-colors cursor-pointer ${
                location === "/learn" 
                  ? "text-cyan-600 font-semibold" 
                  : "text-gray-600 hover:text-black"
              }`}>
                Learn
              </span>
            </Link>
            <a
              href="https://app.uniswap.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-black transition-colors"
            >
              Liquidity
            </a>
            {/* Only show WalletConnect on app pages when connected */}
            {(location === "/app" || location === "/trading") && isConnected ? (
              <WalletConnect />
            ) : location !== "/app" && location !== "/trading" && location !== "/learn" ? (
              <Link href="/app">
                <Button className="bg-blue-600 text-white hover:bg-blue-700">
                  Launch App
                </Button>
              </Link>
            ) : location === "/learn" ? (
              <Link href="/app">
                <Button className="bg-cyan-600 text-white hover:bg-cyan-700">
                  Try it Live
                </Button>
              </Link>
            ) : null}
          </div>

          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-2 space-y-2">
            <Link href="/">
              <span className="block py-2 text-gray-600 hover:text-black cursor-pointer">
                Home
              </span>
            </Link>
            <a
              href="#tokens"
              className="block py-2 text-gray-600 hover:text-black"
            >
              Tokens
            </a>
            <a
              href="/Levitas Finance Whitepaper V1.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="block py-2 text-gray-600 hover:text-black"
            >
              Whitepaper
            </a>
            <a
              href="/Levitas Litepaper_1753091498988.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="block py-2 text-gray-600 hover:text-black"
            >
              Litepaper
            </a>
            <Link href="/learn">
              <span className="block py-2 text-gray-600 hover:text-black cursor-pointer">
                Learn
              </span>
            </Link>
            <a
              href="https://app.uniswap.org"
              target="_blank"
              rel="noopener noreferrer"
              className="block py-2 text-gray-600 hover:text-black"
            >
              Liquidity
            </a>
            <a
              href="#governance"
              className="block py-2 text-gray-600 hover:text-black"
            >
              Governance
            </a>
            <Link href="/app">
              <Button className="w-full mt-2 bg-blue-600 text-white hover:bg-blue-700">
                Launch App
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
