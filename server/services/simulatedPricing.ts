/**
 * Server-side Simulated Pricing System
 * 
 * Mirrors the frontend's useRealTimeOracle system to provide consistent
 * pricing across frontend and backend APIs for testing purposes.
 */

interface PriceBounds {
  min: number;
  max: number;
  current: number;
}

class SimulatedPricingService {
  private static instance: SimulatedPricingService;
  private bvixPrice: number = 42.15;
  private evixPrice: number = 37.98;
  private lastUpdate: Date = new Date();
  private updateInterval: NodeJS.Timeout | null = null;

  // Price simulation parameters (matches frontend)
  private readonly PRICE_BOUNDS = {
    BVIX: { min: 15, max: 150, current: 42.15 },
    EVIX: { min: 20, max: 180, current: 37.98 }
  };

  private constructor() {
    this.startPriceSimulation();
  }

  public static getInstance(): SimulatedPricingService {
    if (!SimulatedPricingService.instance) {
      SimulatedPricingService.instance = new SimulatedPricingService();
    }
    return SimulatedPricingService.instance;
  }

  private generateRealisticPrice(currentPrice: number, bounds: PriceBounds): number {
    // Implement random walk with mean reversion (matches frontend logic)
    const volatility = 0.001; // 0.1% max movement per update (5 seconds)
    const meanReversion = 0.1; // Tendency to revert to mean
    const mean = (bounds.min + bounds.max) / 2;

    // Random walk component
    const randomChange = (Math.random() - 0.5) * volatility * currentPrice;

    // Mean reversion component
    const meanReversionChange = (mean - currentPrice) * meanReversion * 0.01;

    // Circuit breaker: max 0.1% price movement per 5-second interval
    const maxChange = currentPrice * 0.001;
    const totalChange = Math.max(-maxChange, Math.min(maxChange, randomChange + meanReversionChange));

    const newPrice = currentPrice + totalChange;

    // Ensure price stays within bounds
    return Math.max(bounds.min, Math.min(bounds.max, newPrice));
  }

  private startPriceSimulation(): void {
    // Update prices every 5 seconds (matches frontend)
    this.updateInterval = setInterval(() => {
      this.bvixPrice = this.generateRealisticPrice(this.bvixPrice, this.PRICE_BOUNDS.BVIX);
      this.evixPrice = this.generateRealisticPrice(this.evixPrice, this.PRICE_BOUNDS.EVIX);
      this.lastUpdate = new Date();


    }, 5000);
  }

  public getBvixPrice(): string {
    return this.bvixPrice.toFixed(2);
  }

  public getEvixPrice(): string {
    return this.evixPrice.toFixed(2);
  }

  public getPrices(): { bvix: string; evix: string; lastUpdate: Date } {
    return {
      bvix: this.getBvixPrice(),
      evix: this.getEvixPrice(),
      lastUpdate: this.lastUpdate
    };
  }

  // Method to sync with frontend prices if needed
  public syncPrices(bvixPrice: string, evixPrice: string): void {
    this.bvixPrice = parseFloat(bvixPrice);
    this.evixPrice = parseFloat(evixPrice);
    this.lastUpdate = new Date();

  }

  public destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}

export const simulatedPricing = SimulatedPricingService.getInstance();