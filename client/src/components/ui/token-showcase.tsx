import { Card, CardContent } from "@/components/ui/card";
import { Bitcoin, Zap, TrendingUp, Vote } from "lucide-react";

export default function TokenShowcase() {
  const tokens = [
    {
      symbol: "BVIX",
      name: "Bitcoin volatility index token (crypto-native VIX for BTC)",
      price: "$42.15",
      change: "+2.4%",
      icon: Bitcoin,
      iconColor: "text-orange-500",
      bgColor: "bg-orange-100",
      available: true
    },
    {
      symbol: "EVIX", 
      name: "Ether volatility index token (crypto native VIX for ETH)",
      price: "$37.98",
      change: "+1.8%",
      icon: Zap,
      iconColor: "text-blue-500", 
      bgColor: "bg-blue-100",
      available: true
    },
    {
      symbol: "VIXC",
      name: "S&P 500 Volatility Index token (traditional market VIX)",
      price: "$16.49",
      change: "Coming Soon",
      icon: TrendingUp,
      iconColor: "text-gray-400",
      bgColor: "bg-gray-100",
      available: false
    },
    {
      symbol: "LEVI",
      name: "Governance, voting, fee share",
      price: "$8.25",
      change: "Coming Soon",
      icon: Vote,
      iconColor: "text-gray-400",
      bgColor: "bg-gray-100",
      available: false
    }
  ];

  return (
    <section id="tokens" className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">Tokens</h2>
          <p className="text-lg text-gray-600">Hedge your crypto holdings with tokenized volatility</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {tokens.map((token) => {
            const Icon = token.icon;
            return (
              <Card 
                key={token.symbol}
                className={`hover:shadow-xl transition-all transform hover:-translate-y-2 ${!token.available ? 'opacity-60 relative overflow-hidden' : ''}`}
              >
                {!token.available && (
                  <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium z-10">
                    Coming Soon
                  </div>
                )}
                <CardContent className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-12 h-12 ${token.bgColor} rounded-xl flex items-center justify-center`}>
                      <Icon className={`${token.iconColor} text-xl`} size={24} />
                    </div>
                    <span className={`text-2xl font-bold ${token.available ? token.iconColor : 'text-gray-400'}`}>
                      {token.price}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-black mb-2">{token.symbol}</h3>
                  <p className="text-gray-600 mb-4">{token.name}</p>
                  <div className="pt-4 border-t border-gray-100">
                    <span className={`text-sm font-medium ${token.available && token.change.includes('+') ? 'text-green-600' : 'text-gray-400'}`}>
                      {token.available && token.change.includes('+') && (
                        <svg className="w-3 h-3 inline mr-1" fill="currentColor" viewBox="0 0 8 8">
                          <path d="M4 0L0 4h2v4h4V4h2L4 0z"/>
                        </svg>
                      )}
                      {token.change} {token.available && !token.change.includes('Soon') && '(24h)'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
