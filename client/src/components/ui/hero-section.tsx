import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function HeroSection() {
  return (
    <section id="home" className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-black mb-6 leading-tight">
          Volatility<br />
          <span className="text-blue-600">Unlocked</span>
        </h1>
        
        <div className="mb-8">
          <p className="text-xl md:text-2xl text-gray-600 font-medium mb-4">
            The mean-reverting hedge asset
          </p>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Tokenized volatility - for the first time ever and on blockchain rails.
          </p>
        </div>

        <div className="mb-20">
          <Link href="/app">
            <Button size="lg" className="bg-blue-600 text-white px-8 py-4 text-lg font-semibold hover:bg-blue-700 transition-all transform hover:scale-105 shadow-lg">
              Launch App
            </Button>
          </Link>
        </div>

        {/* Floating geometric illustration */}
        <div className="relative flex justify-center mb-16">
          <div className="relative w-64 h-64 floating-animation">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg transform rotate-45 opacity-20"></div>
            <div className="absolute inset-4 bg-gradient-to-tr from-blue-400 to-cyan-400 rounded-lg transform rotate-12 opacity-30"></div>
            <div className="absolute inset-8 bg-blue-600 rounded-lg transform -rotate-12 opacity-40"></div>
            <div className="absolute inset-12 bg-white rounded-lg border-2 border-blue-600 flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
