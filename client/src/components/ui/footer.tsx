import { Github, MessageCircle } from "lucide-react";
import { SiX, SiDiscord } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
const levitasLogoPath = "/levi large.jpg";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <img 
                src={levitasLogoPath} 
                alt="Levitas Finance Logo"
                className="w-8 h-8"
              />
              <div>
                <span className="text-lg font-bold text-black">Levitas Finance</span>
                <div className="text-xs text-gray-500">Composable Volatility</div>
              </div>
            </div>
            <p className="text-gray-600 text-sm">Tokenized volatility for the decentralized future.</p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-black mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="#tokens" className="hover:text-black transition-colors">Tokens</a></li>
              <li><a href="/Levitas Finance Whitepaper V1.pdf" target="_blank" rel="noopener noreferrer" className="hover:text-black transition-colors">Whitepaper</a></li>
              <li><a href="#" className="hover:text-black transition-colors">FAQs</a></li>
              <li><a href="#" className="hover:text-black transition-colors">Audit</a></li>
            </ul>
          </div>

          {/* Governance */}
          <div>
            <h4 className="font-semibold text-black mb-4">Governance</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="#governance" className="hover:text-black transition-colors">Governance</a></li>
              <li><a href="#" className="hover:text-black transition-colors">Proposals</a></li>
              <li><a href="#" className="hover:text-black transition-colors">Forum</a></li>
              <li><a href="#" className="hover:text-black transition-colors">Blog</a></li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="font-semibold text-black mb-4">Community</h4>
            <div className="flex space-x-4 mb-4">
              <a href="https://x.com/LevitasFinance" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-black transition-colors">
                <SiX className="w-5 h-5" />
              </a>
              <a href="https://discord.gg/dE5wV8Deya" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-black transition-colors" title="Join our Discord">
                <SiDiscord className="w-5 h-5" />
              </a>
              <a href="https://github.com/iamguerrero/levitas-protocol" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-black transition-colors">
                <Github className="w-5 h-5" />
              </a>
            </div>
            <Button className="bg-blue-600 text-white hover:bg-blue-700 text-sm">
              Join Early Access
            </Button>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-8 text-center text-sm text-gray-600">
          <p>&copy; 2024 Levitas Finance. All rights reserved. | Terms & Support</p>
        </div>
      </div>
    </footer>
  );
}
