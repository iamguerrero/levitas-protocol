import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { ethers } from 'ethers';
import { registerRoutes } from '../routes';

// Mock ethers
vi.mock('ethers', () => ({
  ethers: {
    JsonRpcProvider: vi.fn(),
    Contract: vi.fn(),
    formatUnits: vi.fn(),
    formatEther: vi.fn(),
  },
}));

describe('Vault API', () => {
  let app: express.Express;
  let mockProvider: any;
  let mockUsdcContract: any;
  let mockBvixContract: any;
  let mockOracleContract: any;

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create express app
    app = express();
    app.use(express.json());
    
    // Setup mocks
    mockProvider = {
      getNetwork: vi.fn().mockResolvedValue({ chainId: 84532 }),
    };
    
    mockUsdcContract = {
      balanceOf: vi.fn(),
    };
    
    mockBvixContract = {
      totalSupply: vi.fn(),
    };
    
    mockOracleContract = {
      getPrice: vi.fn(),
    };

    // Mock ethers methods
    (ethers.JsonRpcProvider as any).mockImplementation(() => mockProvider);
    (ethers.Contract as any).mockImplementation((address: string, abi: any) => {
      if (address === '0x79640e0F510A7C6d59737442649D9600C84B035f') {
        return mockUsdcContract;
      }
      if (address === '0xEA3d08A5A5bC48Fc984F0F773826693B7480bF48') {
        return mockBvixContract;
      }
      if (address === '0x8464135c8F25Da09e49BC8782676a84730C318bC') {
        return mockOracleContract;
      }
      return {};
    });

    // Register routes
    await registerRoutes(app);
  });

  it('should return vault statistics with correct collateral ratio calculation', async () => {
    // Mock contract responses
    const mockVaultBalance = BigInt('1000000000'); // 1000 USDC (6 decimals)
    const mockBvixSupply = BigInt('23809523809523809523'); // ~23.81 BVIX (18 decimals)
    const mockPrice = BigInt('42150000000000000000'); // $42.15 (18 decimals)

    mockUsdcContract.balanceOf.mockResolvedValue(mockVaultBalance);
    mockBvixContract.totalSupply.mockResolvedValue(mockBvixSupply);
    mockOracleContract.getPrice.mockResolvedValue(mockPrice);

    // Mock ethers formatting functions
    (ethers.formatUnits as any).mockImplementation((value: bigint, decimals: number) => {
      if (decimals === 6) return '1000.0'; // USDC
      return '1000.0';
    });
    
    (ethers.formatEther as any).mockImplementation((value: bigint) => {
      if (value === mockBvixSupply) return '23.809523809523809523'; // BVIX supply
      if (value === mockPrice) return '42.15'; // Price
      return '0.0';
    });

    const response = await request(app)
      .get('/api/v1/vault-stats')
      .expect(200);

    expect(response.body).toMatchObject({
      usdc: '1000.0',
      bvix: '23.809523809523809523',
      cr: expect.any(Number),
      price: '42.15',
    });

    // Verify collateral ratio calculation
    // CR = vaultUSDC / (bvixSupply * price) * 100
    const expectedCR = (1000.0 / (23.809523809523809523 * 42.15)) * 100;
    expect(response.body.cr).toBeCloseTo(expectedCR, 2);
  });

  it('should handle zero BVIX supply correctly', async () => {
    mockUsdcContract.balanceOf.mockResolvedValue(BigInt('1000000000')); // 1000 USDC
    mockBvixContract.totalSupply.mockResolvedValue(BigInt('0')); // 0 BVIX
    mockOracleContract.getPrice.mockResolvedValue(BigInt('42150000000000000000')); // $42.15

    (ethers.formatUnits as any).mockReturnValue('1000.0');
    (ethers.formatEther as any).mockImplementation((value: bigint) => {
      if (value === BigInt('0')) return '0.0';
      return '42.15';
    });

    const response = await request(app)
      .get('/api/v1/vault-stats')
      .expect(200);

    expect(response.body.cr).toBe(0);
  });

  it('should handle contract errors gracefully', async () => {
    mockUsdcContract.balanceOf.mockRejectedValue(new Error('Contract call failed'));

    const response = await request(app)
      .get('/api/v1/vault-stats')
      .expect(500);

    expect(response.body).toMatchObject({
      error: 'Failed to fetch vault statistics',
      details: expect.any(String),
    });
  });

  it('should calculate correct collateral ratio for various scenarios', async () => {
    // Test scenario: 150% collateral ratio
    const testCases = [
      {
        usdc: '1500.0',
        bvix: '23.809523809523809523',
        price: '42.15',
        expectedCR: 150.0,
      },
      {
        usdc: '1100.0',
        bvix: '23.809523809523809523',
        price: '42.15',
        expectedCR: 110.0,
      },
    ];

    for (const testCase of testCases) {
      mockUsdcContract.balanceOf.mockResolvedValue(
        BigInt(Math.floor(parseFloat(testCase.usdc) * 1000000))
      );
      mockBvixContract.totalSupply.mockResolvedValue(
        BigInt(Math.floor(parseFloat(testCase.bvix) * 1e18))
      );
      mockOracleContract.getPrice.mockResolvedValue(
        BigInt(Math.floor(parseFloat(testCase.price) * 1e18))
      );

      (ethers.formatUnits as any).mockReturnValue(testCase.usdc);
      (ethers.formatEther as any).mockImplementation((value: bigint) => {
        if (value.toString().includes('23')) return testCase.bvix;
        return testCase.price;
      });

      const response = await request(app)
        .get('/api/v1/vault-stats')
        .expect(200);

      expect(response.body.cr).toBeCloseTo(testCase.expectedCR, 1);
    }
  });
});