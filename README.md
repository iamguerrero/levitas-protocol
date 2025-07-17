# Levitas Protocol

> **Mission** – Bring on-chain volatility indices (BVIX, EVIX, …) and fully-collateralised vaults to every blockchain user.  
> Mint synthetic volatility, trade it permissionlessly, and earn fees by supplying liquidity – all on Base Sepolia today.

---

## Architecture

```mermaid
flowchart LR
  subgraph Client (React + Vite)
    A1[WalletConnect] --> A2[Trading Interface]
  end
  subgraph Express API
    B1[Positions RPC] --> B2[Collateral Stats]
  end
  subgraph Smart Contracts
    C1[mUSDC] --transfer--> C3[MintRedeem]
    C2[BVIX]  --mint/burn--> C3
    C3 --vault--> C4[Uniswap V3 Pool]
  end
  A2 <--ethers.js--> C3
  A2 <--ethers.js--> C4
  B1 <--pg-->  DB[(Neon Serverless Postgres)]

### Deployed contracts (Base Sepolia)

| Name | Address | Explorer |
|------|---------|----------|
| Mock USDC | `0x79640e0F510A7C6d59737442649D9600C84B035f` | https://sepolia.basescan.org/address/0x79640e0F510A7C6d59737442649D9600C84B035f |
| BVIX | `0xEA3d08A5A5bC48Fc984F0F773826693B7480bF48` | https://sepolia.basescan.org/address/0xEA3d08A5A5bC48Fc984F0F773826693B7480bF48 |
| MintRedeem | `0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2` | https://sepolia.basescan.org/address/0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2 |
| Uniswap V3 Pool (0.05 %) | `0x7883Ba215Bd4C8d81Ed8643e6CA7F15659fDD190` | https://sepolia.basescan.org/address/0x7883Ba215Bd4C8d81Ed8643e6CA7F15659fDD190 |

---

### Quick-start (local)

```bash
git clone https://github.com/iamguerrero/levitas-protocol.git
cd levitas-protocol
pnpm install          # or: yarn / npm i
pnpm dev              # Express + Vite on http://localhost:5000

© 2025 Levitas Labs – MIT

🌐 dApp: https://levitas.replit.app
📝 White-paper: https://levitas.replit.app/Levitas%20Finance%20Whitepaper%20V1.pdf
🐦 X: @levitasfinance
💬 Discord:https://discord.gg/dE5wV8Deya