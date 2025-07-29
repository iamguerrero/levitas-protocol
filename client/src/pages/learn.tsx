import { useState } from "react";
import { CheckCircle, Circle, TrendingUp, Shield, Zap, Target, ArrowRight, BookOpen, X, ShoppingCart } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface LearningStep {
  id: number;
  title: string;
  description: string;
  content: React.ReactNode;
  icon: React.ReactNode;
  completed: boolean;
}

export default function LearnPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const completeStep = (stepId: number) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId]);
    }
  };

  const steps: LearningStep[] = [
    {
      id: 0,
      title: "What is Volatility?",
      description: "Understanding the foundation of crypto risk",
      icon: <TrendingUp className="w-6 h-6" />,
      completed: completedSteps.includes(0),
      content: (
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold">Volatility: The Market's Heartbeat</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What is Volatility?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground">
                  Volatility measures how much an asset's price swings up and down over time.
                </p>
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  <p className="text-sm font-medium mb-2">Example:</p>
                  <p className="text-sm text-muted-foreground">
                    If Bitcoin moves 5% daily, that's high volatility.
                    If it moves 0.1% daily, that's low volatility.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Why It Matters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground">
                  High volatility = Higher risk AND higher potential rewards
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm">Crypto crashes happen when vol spikes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Smart traders hedge against vol</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950 dark:to-blue-950 p-6 rounded-lg border">
            <div className="flex items-center gap-3 mb-3">
              <Shield className="w-5 h-5 text-cyan-600" />
              <h3 className="font-semibold">The Problem</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              Traditional crypto portfolios have no good way to hedge against volatility spikes. 
              When fear hits the market, everything crashes together.
            </p>
            <p className="font-medium text-cyan-700 dark:text-cyan-300">
              Until now. That's where BVIX and EVIX come in.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 1,
      title: "Meet BVIX & EVIX",
      description: "Tokenized volatility for Bitcoin and Ethereum",
      icon: <Zap className="w-6 h-6" />,
      completed: completedSteps.includes(1),
      content: (
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold">BVIX & EVIX: Volatility as ERC-20 Tokens</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-orange-200 dark:border-orange-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-orange-600">BVIX Token</CardTitle>
                  <Badge variant="outline" className="border-orange-200 text-orange-600">Bitcoin Vol</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Tracks Bitcoin's 30-day implied volatility
                </p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">When Bitcoin is calm:</span>
                    <span className="text-sm text-muted-foreground">BVIX price low</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">When Bitcoin is chaotic:</span>
                    <span className="text-sm text-muted-foreground">BVIX price high</span>
                  </div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-950 p-3 rounded-lg">
                  <p className="text-xs font-medium mb-1">Use Cases:</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Hedge BTC dumps</li>
                    <li>• Speculate on macro fear</li>
                    <li>• LP for yield</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-blue-600">EVIX Token</CardTitle>
                  <Badge variant="outline" className="border-blue-200 text-blue-600">Ethereum Vol</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Tracks Ethereum's 30-day implied volatility
                </p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">When ETH is stable:</span>
                    <span className="text-sm text-muted-foreground">EVIX price low</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">When ETH is volatile:</span>
                    <span className="text-sm text-muted-foreground">EVIX price high</span>
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                  <p className="text-xs font-medium mb-1">Use Cases:</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Hedge ETH positions</li>
                    <li>• Event-driven trades</li>
                    <li>• Structured products</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 p-6 rounded-lg border">
            <div className="flex items-center gap-3 mb-3">
              <Target className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold">The Innovation</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              For the first time, you can hold crypto volatility in your wallet as easily as holding USDC. 
              No complex derivatives, no liquidation risk.
            </p>
            <p className="font-medium text-purple-700 dark:text-purple-300">
              BVIX and EVIX are fully-backed, composable volatility assets.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: "The New Hedging Primitive",
      description: "How volatility tokens create better portfolio protection",
      icon: <Shield className="w-6 h-6" />,
      completed: completedSteps.includes(2),
      content: (
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold">A New Way to Hedge Risk</h2>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Traditional vs. Volatility Hedging</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-red-600">❌ Old Way: Shorting</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• High liquidation risk</li>
                      <li>• Complex margin management</li>
                      <li>• Limited upside protection</li>
                      <li>• Requires constant monitoring</li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-green-600">✅ New Way: Vol Tokens</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• No liquidation risk</li>
                      <li>• Simple buy-and-hold</li>
                      <li>• Automatic tail-risk protection</li>
                      <li>• Set-and-forget strategy</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How Volatility Hedging Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3">Example Portfolio Hedge:</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Your Portfolio:</span>
                      <span className="text-sm font-medium">90% BTC/ETH + 10% BVIX/EVIX</span>
                    </div>
                    <Separator />
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-red-500">Market crashes (-30%):</span>
                        <span>BVIX/EVIX surge (+200%)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-500">Net result:</span>
                        <span className="font-medium">Hedged losses</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    <strong>Key Insight:</strong> When crypto markets crash, fear spikes and volatility tokens gain value, 
                    protecting your portfolio automatically.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Beyond Hedging</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto">
                      <TrendingUp className="w-6 h-6 text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-sm">Speculation</h4>
                    <p className="text-xs text-muted-foreground">Trade on fear and greed cycles</p>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto">
                      <Zap className="w-6 h-6 text-purple-600" />
                    </div>
                    <h4 className="font-semibold text-sm">LP Rewards</h4>
                    <p className="text-xs text-muted-foreground">Earn fees from volatility trading</p>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mx-auto">
                      <Target className="w-6 h-6 text-orange-600" />
                    </div>
                    <h4 className="font-semibold text-sm">Composability</h4>
                    <p className="text-xs text-muted-foreground">Use as collateral in DeFi</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: "How Levitas Works",
      description: "The 4-step process that powers volatility tokens",
      icon: <Target className="w-6 h-6" />,
      completed: completedSteps.includes(3),
      content: (
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <div className="mx-auto">
              <img 
                src="/levi large.jpg" 
                alt="Levitas Finance Logo"
                className="w-16 h-16 object-cover rounded-lg mx-auto"
              />
            </div>
            <h2 className="text-2xl font-bold">How Levitas Works (30 Seconds)</h2>
          </div>

          <div className="space-y-6">
            <div className="grid gap-4">
              {[
                {
                  step: "1",
                  title: "Oracle",
                  description: "Hourly signed price feed of BVIX/EVIX → on-chain (3-feed median)",
                  color: "bg-blue-500",
                  detail: "Real-time volatility data from multiple sources ensures accurate pricing"
                },
                {
                  step: "2", 
                  title: "Vault",
                  description: "Users lock ≥ 120% collateral (USDC) → mint BVIX/EVIX at NAV",
                  color: "bg-green-500",
                  detail: "Over-collateralization ensures tokens are always fully backed"
                },
                {
                  step: "3",
                  title: "AMM Peg",
                  description: "Uniswap v3 pools + arbitrage keep price ≈ oracle",
                  color: "bg-orange-500", 
                  detail: "Market forces maintain tight peg between token price and volatility index"
                },
                {
                  step: "4",
                  title: "Redeem",
                  description: "Burn tokens anytime, unlock collateral (0.3% fee)",
                  color: "bg-purple-500",
                  detail: "Exit positions whenever you want with minimal fees"
                }
              ].map((item, index) => (
                <Card key={index} className="relative overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`${item.color} text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0`}>
                        {item.step}
                      </div>
                      <div className="space-y-2 flex-1">
                        <h3 className="text-lg font-semibold">{item.title}</h3>
                        <p className="text-muted-foreground">{item.description}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{item.detail}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950 dark:to-purple-950 p-6 rounded-lg border">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle className="w-5 h-5 text-violet-600" />
                <h3 className="font-semibold">Result</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                A fully-backed, composable volatility asset with no liquidations and no perps complexity.
              </p>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>150% target collateral ratio</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>≤ 0.3% mint/redeem fee</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Automatic pause &lt; 120%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: "Mint vs Buy: Critical Difference",
      description: "Understanding when you're long vol vs short vol",
      icon: <ShoppingCart className="w-6 h-6" />,
      completed: completedSteps.includes(4),
      content: (
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center">
              <ShoppingCart className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold">Mint vs Buy: The Critical Difference</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              This is the most important concept to understand before using volatility tokens
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-red-600">🏦 Minting in App = SHORT Vol</CardTitle>
                  <Badge variant="destructive">Net Short</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-red-100 dark:bg-red-900 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">What Happens When You Mint:</h4>
                  <ul className="text-sm space-y-2">
                    <li>• You deposit USDC (stable)</li>
                    <li>• You receive BVIX/EVIX tokens (volatile)</li>
                    <li>• Your debt is denominated in BVIX/EVIX</li>
                    <li>• Your collateral is USDC</li>
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-red-700 dark:text-red-300">You Profit When:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Volatility decreases (BVIX/EVIX price falls)</li>
                    <li>• You can redeem debt cheaper</li>
                    <li>• Markets become calm and stable</li>
                  </ul>
                </div>

                <div className="bg-red-200 dark:bg-red-800 p-3 rounded-lg">
                  <p className="text-xs font-medium text-red-800 dark:text-red-200">
                    ⚠️ Minting = You're betting volatility will decrease
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-green-600">🦄 Buying on Uniswap = LONG Vol</CardTitle>
                  <Badge className="bg-green-500 text-white">Net Long</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-green-100 dark:bg-green-900 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">What Happens When You Buy:</h4>
                  <ul className="text-sm space-y-2">
                    <li>• You swap USDC for BVIX/EVIX on Uniswap</li>
                    <li>• You hold the volatile token directly</li>
                    <li>• No debt or collateral involved</li>
                    <li>• Simple buy-and-hold strategy</li>
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-green-700 dark:text-green-300">You Profit When:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Volatility increases (BVIX/EVIX price rises)</li>
                    <li>• Markets become fearful and chaotic</li>
                    <li>• You want tail-risk protection</li>
                  </ul>
                </div>

                <div className="bg-green-200 dark:bg-green-800 p-3 rounded-lg">
                  <p className="text-xs font-medium text-green-800 dark:text-green-200">
                    ✅ Buying = You're betting volatility will increase
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Real-World Example</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Scenario: Market Crash (-30%)</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h5 className="font-medium text-red-600">Minter (Short Vol):</h5>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• BVIX price: $40 → $120 (+200%)</li>
                      <li>• Your debt gets more expensive</li>
                      <li>• Collateral ratio drops</li>
                      <li>• ❌ <strong>You lose money</strong></li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h5 className="font-medium text-green-600">Buyer (Long Vol):</h5>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• BVIX price: $40 → $120 (+200%)</li>
                      <li>• Your tokens become more valuable</li>
                      <li>• Perfect hedge against portfolio crash</li>
                      <li>• ✅ <strong>You make money</strong></li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-amber-700 dark:text-amber-300 mb-2">Key Takeaway</h4>
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      <strong>For Portfolio Hedging:</strong> Buy BVIX/EVIX on Uniswap to protect against crashes.
                      <br />
                      <strong>For Yield Farming:</strong> Mint BVIX/EVIX in the app if you think volatility will decrease.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Where to Execute</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    Minting (Short Vol)
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1 pl-5">
                    <li>• Use Levitas App directly</li>
                    <li>• Requires USDC collateral</li>
                    <li>• Monitor collateral ratio</li>
                    <li>• Can be liquidated if CR &lt; 120%</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    Buying (Long Vol)
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1 pl-5">
                    <li>• Uniswap pools on Base Sepolia</li>
                    <li>• Future CEX listings</li>
                    <li>• Simple token swap</li>
                    <li>• No liquidation risk</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }
  ];

  const progressPercentage = (completedSteps.length / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="container mx-auto px-4 py-8 relative">
        {/* Exit Button */}
        <div className="absolute top-4 left-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="hover:bg-gray-100 dark:hover:bg-gray-800">
              <X className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center space-y-4 mb-8">
          <div className="flex items-center justify-center gap-3">
            <BookOpen className="w-8 h-8 text-cyan-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              Learn Volatility Trading
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Master the fundamentals of volatility, understand BVIX & EVIX, and learn how to hedge like a pro
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">{completedSteps.length}/{steps.length} completed</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Step Navigation */}
        <div className="grid md:grid-cols-5 gap-4 mb-8">
          {steps.map((step, index) => (
            <Card 
              key={step.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                currentStep === index 
                  ? 'ring-2 ring-cyan-500 shadow-lg' 
                  : completedSteps.includes(step.id)
                    ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                    : ''
              }`}
              onClick={() => setCurrentStep(index)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    completedSteps.includes(step.id)
                      ? 'bg-green-500 text-white'
                      : currentStep === index
                        ? 'bg-cyan-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}>
                    {completedSteps.includes(step.id) ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      step.icon
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{step.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{step.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Current Step Content */}
        <Card className="mb-8">
          <CardContent className="p-8">
            {steps[currentStep].content}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
          >
            Previous
          </Button>

          <div className="flex gap-3">
            {!completedSteps.includes(steps[currentStep].id) && (
              <Button
                variant="outline"
                onClick={() => completeStep(steps[currentStep].id)}
                className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark Complete
              </Button>
            )}
            
            <Button
              onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
              disabled={currentStep === steps.length - 1}
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>

        {/* Completion Message */}
        {completedSteps.length === steps.length && (
          <div className="mt-8 text-center">
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-green-700 dark:text-green-300">
                    Congratulations! 🎉
                  </h2>
                  <p className="text-green-600 dark:text-green-400 max-w-2xl mx-auto">
                    You've mastered volatility trading fundamentals including the critical mint vs buy difference. 
                    You now understand how to hedge (buy tokens) vs yield farm (mint tokens) with BVIX and EVIX!
                  </p>
                  <Button 
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => window.location.href = '/app'}
                  >
                    Start Trading
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}