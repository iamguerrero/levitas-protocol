# Levitas Protocol

[![Mock USDC – verified](https://img.shields.io/badge/Mock%20USDC-verified-brightgreen?labelColor=212121&logo=data:image/svg+xml;base64,PHN2ZyBmaWxsPSJ3aGl0ZSIgaGVpZ2h...)](https://sepolia.basescan.org/address/0x79640e0F510A7C6d59737442649D9600C84B035f)
[![BVIX – verified](https://img.shields.io/badge/BVIX-verified-brightgreen?labelColor=212121&logo=data:image/svg+xml;base64,PHN2ZyBmaWxsPSJ3aGl0ZSIgaGVpZ2h...)](https://sepolia.basescan.org/address/0xEA3d08A5A5bC48Fc984F0F773826693B7480bF48)
[![MintRedeem – verified](https://img.shields.io/badge/MintRedeem-verified-brightgreen?labelColor=212121&logo=data:image/svg+xml;base64,PHN2ZyBmaWxsPSJ3aGl0ZSIgaGVpZ2h...)](https://sepolia.basescan.org/address/0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2)

> **Mission** – Build the volatility layer of DeFi. Tokenize crypto-native, fully collateralized and composable volatility indices on-chain.  
> Mint synthetic volatility, trade it permissionlessly, and earn fees by supplying liquidity – all on **Base Sepolia** today.

---

## Architecture

```mermaid
flowchart LR
  %% ---------- Front-end ----------
  subgraph Client ["Client (React + Vite)"]
    A[Browser SPA]
  end

  %% ---------- Back-end ----------
  subgraph Server ["Server (Node / Express)"]
    B[REST + Auth]
  end

  %% ---------- Blockchain ----------
  subgraph "Base Sepolia"
    C["BVIX • EVIX • MockUSDC<br/>MintRedeem"]
    D["Uniswap V3 Pool"]
  end

  A -- ethers.js --> C
  A -- fetch/axios --> B
  B -- JSON-RPC --> C
  C -- liquidity --> D
```

### Deployed contracts

| Name | Address | Explorer |
|------|---------|----------|
| Mock USDC | `0x79640e0F510A7C6d59737442649D9600C84B035f` | https://sepolia.basescan.org/address/0x79640e0F510A7C6d59737442649D9600C84B035f |
| BVIX | `0xEA3d08A5A5bC48Fc984F0F773826693B7480bF48` | https://sepolia.basescan.org/address/0xEA3d08A5A5bC48Fc984F0F773826693B7480bF48 |
| EVIX | `0x37e3b45fEF91D54Ef4992B71382EC36307908463` | https://sepolia.basescan.org/address/0x37e3b45fEF91D54Ef4992B71382EC36307908463 |
| EVIX Oracle | `0xCd7441A771a7F84E58d98E598B7Ff23A3688094F` | https://sepolia.basescan.org/address/0xCd7441A771a7F84E58d98E598B7Ff23A3688094F |
| EVIX MintRedeem | `0xe521441B10F5b9a28499Ae37d1C93b42223eCff6` | https://sepolia.basescan.org/address/0xe521441B10F5b9a28499Ae37d1C93b42223eCff6 |
| MintRedeem | `0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2` | https://sepolia.basescan.org/address/0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2 |
| Uniswap V3 Pool (0.05 %) | `0x7883Ba215Bd4C8d81Ed8643e6CA7F15659fDD190` | https://sepolia.basescan.org/address/0x7883Ba215Bd4C8d81Ed8643e6CA7F15659fDD190 |

---

### Quick-start (local)

```bash
git clone https://github.com/iamguerrero/levitas-protocol.git
cd levitas-protocol
pnpm install            # or yarn / npm i
pnpm dev                # Express + Vite on http://localhost:5000
```

© 2025 Levitas Labs – MIT

🌐 dApp&nbsp; <https://levitas.replit.app>  
📝 White-paper&nbsp; <https://levitas.replit.app/Levitas%20Finance%20Whitepaper%20V1.pdf>  
🐦 X&nbsp; [@levitasfinance](https://twitter.com/levitasfinance)  
💬 Discord&nbsp; <https://discord.gg/dE5wV8Deya>

