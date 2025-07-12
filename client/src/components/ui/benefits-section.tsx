import { Box, Network, Shield, Eye, Users, Puzzle } from "lucide-react";

export default function BenefitsSection() {
  const benefits = [
    {
      title: "DeFi Native",
      description: "Built from the ground up for decentralized finance protocols and composability",
      icon: Box,
      gradient: "from-blue-400 to-cyan-400"
    },
    {
      title: "Decentralized", 
      description: "No central authority controls your assets. Pure blockchain-based governance",
      icon: Network,
      gradient: "from-purple-400 to-pink-400"
    },
    {
      title: "Non-custodial",
      description: "Your keys, your coins. Maintain full control of your digital assets", 
      icon: Shield,
      gradient: "from-green-400 to-emerald-400"
    },
    {
      title: "Transparent",
      description: "Open-source smart contracts audited and verifiable on-chain",
      icon: Eye,
      gradient: "from-yellow-400 to-orange-400"
    },
    {
      title: "Community Governed",
      description: "Token holders collectively decide the protocol's future direction",
      icon: Users, 
      gradient: "from-indigo-400 to-blue-400"
    },
    {
      title: "Composable",
      description: "Integrate with any DeFi protocol for advanced yield strategies",
      icon: Puzzle,
      gradient: "from-red-400 to-pink-400"
    }
  ];

  return (
    <section className="py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">Why Levitas Finance</h2>
          <p className="text-lg text-gray-600">Built for the decentralized future</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <div key={benefit.title} className="text-center p-6">
                <div className={`w-20 h-20 bg-gradient-to-br ${benefit.gradient} rounded-2xl mx-auto mb-6 flex items-center justify-center`}>
                  <Icon className="text-white text-2xl" size={32} />
                </div>
                <h3 className="text-xl font-bold text-black mb-3">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
