import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function Navigation() {
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-50 glass-effect border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/">
            <div className="flex items-center space-x-2 cursor-pointer">
              {/* Levitas Logo */}
              <div className="w-8 h-8 bg-black flex items-center justify-center transform rotate-45">
                <div className="transform -rotate-45 text-white text-xs font-bold">
                  <span className="text-xs">le</span>
                  <svg className="w-2 h-2 inline-block ml-0.5" fill="currentColor" viewBox="0 0 8 8">
                    <path d="M4 0L0 4h2v4h4V4h2L4 0z"/>
                  </svg>
                </div>
              </div>
              <div>
                <span className="text-xl font-bold text-black">Levitas Finance</span>
                <div className="text-xs text-gray-500 -mt-1">Composable Volatility</div>
              </div>
            </div>
          </Link>
          
          <div className="hidden md:flex items-center space-x-8">
            <a href="#home" className="text-gray-600 hover:text-black transition-colors">Home</a>
            <a href="#tokens" className="text-gray-600 hover:text-black transition-colors">Tokens</a>
            <a href="#whitepaper" className="text-gray-600 hover:text-black transition-colors">Whitepaper</a>
            <a href="#governance" className="text-gray-600 hover:text-black transition-colors">Governance</a>
            <Link href="/app">
              <Button className="bg-blue-600 text-white hover:bg-blue-700">
                Launch App
              </Button>
            </Link>
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
            <a href="#home" className="block py-2 text-gray-600 hover:text-black">Home</a>
            <a href="#tokens" className="block py-2 text-gray-600 hover:text-black">Tokens</a>
            <a href="#whitepaper" className="block py-2 text-gray-600 hover:text-black">Whitepaper</a>
            <a href="#governance" className="block py-2 text-gray-600 hover:text-black">Governance</a>
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
