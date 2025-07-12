import { CheckCircle, XCircle } from "lucide-react";

export default function ProblemSolution() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">Understanding the Problem & Solution</h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Problem Narrative */}
          <div>
            <h3 className="text-2xl font-bold text-black mb-6">The Hedging Dilemma</h3>
            <div className="space-y-4 text-gray-600">
              <p><strong>Meet Morty:</strong> A crypto investor sitting on large unrealized gains, feeling the market is over-extended.</p>
              
              <div className="bg-white p-4 rounded-lg border-l-4 border-red-400">
                <p className="font-medium text-red-600 flex items-center mb-2">
                  <XCircle className="w-4 h-4 mr-2" />
                  Traditional Options:
                </p>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• Taking profits = Capital gains tax</li>
                  <li>• Borrowing against position = Debt & liquidation risk</li>
                  <li>• Short positions = Leverage & borrow costs</li>
                  <li>• Fiat hedging = Inflation exposure</li>
                </ul>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-600">
                <p className="font-medium text-blue-600 flex items-center mb-2">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Levitas Solution:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-gray-700">
                  <li>• Buy cheap volatility when markets are calm</li>
                  <li>• Profit from fear spikes during corrections</li>
                  <li>• No debt, margin, or fiat exposure</li>
                  <li>• Mean-reverting with limited downside</li>
                </ul>
              </div>
            </div>
          </div>

          {/* VIX Correlation Chart */}
          <div className="bg-white p-8 rounded-2xl shadow-lg">
            <h4 className="text-lg font-bold text-black mb-4">VIX Inverse Correlation</h4>
            <div className="relative h-64 bg-gray-50 rounded-lg p-4">
              <div className="absolute inset-4 border-l-2 border-b-2 border-gray-300">
                {/* Chart visualization */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 200">
                  {/* Market line (declining) */}
                  <polyline 
                    points="0,40 50,45 100,50 150,60 200,80 250,140 300,160" 
                    fill="none" 
                    stroke="#ef4444" 
                    strokeWidth="3"
                    opacity="0.8"
                  />
                  {/* VIX line (spiking) */}
                  <polyline 
                    points="0,160 50,155 100,150 150,140 200,120 250,60 300,40" 
                    fill="none" 
                    stroke="#3b82f6" 
                    strokeWidth="3"
                  />
                  {/* Market crash annotation */}
                  <circle cx="250" cy="140" r="4" fill="#ef4444" />
                  <text x="260" y="145" fontSize="10" fill="#ef4444">Market Crash</text>
                  {/* VIX spike annotation */}
                  <circle cx="250" cy="60" r="4" fill="#3b82f6" />
                  <text x="260" y="55" fontSize="10" fill="#3b82f6">VIX Spike</text>
                </svg>
                
                {/* Legend */}
                <div className="absolute top-2 left-2 text-xs text-red-500 font-medium">Market Price</div>
                <div className="absolute bottom-8 left-2 text-xs text-blue-600 font-medium">VIX Level</div>
                <div className="absolute bottom-2 right-8 bg-blue-600 text-white px-2 py-1 rounded text-xs">
                  Buy cheap vol for protection →
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              When markets crash, VIX spikes. Buy volatility cheap during calm periods to hedge against sudden downturns.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
