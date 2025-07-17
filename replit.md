# Levitas Finance - Volatility Token DApp

## Overview

This project is a decentralized finance (DeFi) application called Levitas Finance that provides tokenized volatility products. It's a React frontend DApp with Ethers.js Web3 integration, featuring volatility index tokens (BVIX, EVIX, VIXC) that allow users to hedge their cryptocurrency holdings on Base Sepolia testnet.

## Recent Changes (January 2025)

✓ **V5 FINAL CONTRACTS WITH PROPER OWNERSHIP** - Deployed fresh tokens and V5 contracts: Fresh BVIX (0xa60289981b67139fb7a9F3d31dD2D2BaA414A263), Fresh EVIX (0x4dEaB86baa7CBDb7859665a7FE9766f22fB799C1), BVIX MintRedeem (0xa0133C6380bf9618e97Ab9a855aF2035e9498829), EVIX MintRedeem (0x667e594bD7B994c492cd973C805CEdd971a5F163)
✓ **TRUE COLLATERAL RATIO ENFORCEMENT** - V5 contracts implement mintWithCollateralRatio(amount, targetCR) where users spend full USDC but receive proportional tokens based on selected CR
✓ **FRONTEND UPDATED FOR V5** - Updated all mint functions to use V5 contracts, removed V4 warnings, added proper CR parameter passing
✓ **VAULT STATS API UPDATED** - Backend now queries V5 contracts for accurate collateral ratio monitoring
✓ **CONTRACT INTERFACE SIMPLIFIED** - Removed "Stack too deep" compilation errors by creating simplified V5Simple contracts
✓ **PROPER DeFi MECHANICS** - 150% CR = 67% token value, 200% CR = 50% token value, exactly as required by users
✓ **OWNERSHIP STRUCTURE FIXED** - Fresh BVIX token owned by V5 contract from deployment, eliminating previous ownership conflicts
✓ **EVIX DECIMAL HANDLING FIXED** - Fixed EVIX contract decimal handling to resolve "Amount too small" error
✓ **CR DISPLAY CLARIFICATION** - UI now clearly shows Target CR (user's selection) vs Vault CR (actual collateral ratio)
✓ **Vault Health Real-Time Updates** - Updated vault stats API to use V4 contracts and reduced refresh interval to 5 seconds for faster updates
✓ **Post-Transaction Cache Invalidation** - Added automatic vault cache refresh after BVIX transactions for immediate collateral ratio updates (EVIX transactions don't affect BVIX vault)
✓ **Comprehensive Debug Logging** - Added detailed console logging for mint process troubleshooting
✓ **Fresh Contract Architecture** - Clean deployment eliminating legacy ownership conflicts from previous versions
✓ **Collateral Ratio Slider Fixed** - Slider now properly calculates token amounts based on selected CR (150% CR = fewer tokens, 200% CR = even fewer)
✓ **USDC Balance Error Handling** - Added clear guidance when users have 0 USDC balance with faucet links for Base Sepolia test USDC
✓ **Industry-Standard Collateral-Aware Minting** - Complete DeFi-standard interface with safe mint amounts, smart suggestions, and clear collateral impact visualization
✓ **V2 Collateral Enforcement Fixed** - Deployed MintRedeemV2 (0x685FEc86...) with proper 120% collateral ratio enforcement that actually works
✓ **Network Setup UI** - Added Base Sepolia network helper and testnet ETH faucet buttons 
✓ **Live Vault Health Dashboard** - Complete collateral ratio monitoring with real-time API endpoint and UI widget
✓ **EVIX UI Token Switching** - Fixed clickable token cards that properly switch between BVIX/EVIX trading interfaces
✓ **EVIX Price Integration** - Corrected Oracle price format conversion for accurate $37.98 display
✓ **EVIX Ecosystem Complete** - Deployed EVIX Oracle (0xCd7441A...) and MintRedeem (0xe521441B...) contracts with full trading functionality
✓ **EVIX Trading Interface** - Complete mint/redeem UI for EVIX tokens with real-time price feeds from deployed oracle
✓ **Dual Token Support** - Added EVIX balance tracking, pricing, and wallet overview integration alongside BVIX
✓ **EVIX Token Deployment** - Successfully deployed EVIX token contract to Base Sepolia at 0x37e3b45fEF91D54Ef4992B71382EC36307908463
✓ **Collateral Ratio Integration** - Added real-time collateral ratio display in wallet overview with helper function
✓ **Enhanced Logo & Branding** - Updated navigation with new Levitas logo (cyan circle design) and proper scaling  
✓ **Whitepaper Integration** - Connected whitepaper header to PDF file for easy access
✓ **Advanced Debugging Tools** - Comprehensive contract debugging with balance checks, allowance verification, and test USDC faucet
✓ **Improved Error Handling** - Enhanced minting process with pre-flight checks for USDC balance and approval
✓ **Real Contract Integration** - Full Web3 functionality with actual smart contract calls replacing all mock data

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state and React hooks for local state
- **Web3 Integration**: Custom wallet provider using MetaMask/window.ethereum

### Web3 Architecture
- **Blockchain**: Base Sepolia testnet for development
- **Web3 Library**: Ethers.js v6 for blockchain interactions
- **Wallet Integration**: MetaMask browser extension with automatic network switching
- **Smart Contracts**: Custom Solidity contracts (BVIXToken, MockOracle, MintRedeem)
- **Contract ABIs**: Generated JSON ABIs stored in `client/src/contracts/`

### Backend Architecture
- **Runtime**: Node.js with Express.js framework 
- **Language**: TypeScript with ESM modules
- **Development Server**: Custom Vite integration for hot reloading
- **API Endpoints**: `/api/v1/vault-stats` for real-time collateral ratio monitoring
- **Blockchain Integration**: Ethers.js for contract interaction with Base Sepolia RPC

## Key Components

### Wallet Integration
- MetaMask wallet connection with automatic network switching to Base Sepolia
- Wallet context provider for managing connection state across the app
- Real smart contract integration for BVIX token, Oracle, and MintRedeem contracts

### Trading Interface
- Real mint/redeem functionality using smart contracts via Ethers.js
- Live BVIX balance reading from blockchain
- Oracle price feeds from MockOracle contract
- Automatic USDC approval and transaction handling
- Form validation and error handling with toast notifications

### Landing Page
- Hero section with call-to-action
- Token showcase displaying BVIX, EVIX, and VIXC tokens
- Benefits section highlighting DeFi native features
- Problem/solution narrative explaining the hedging use case

### UI Components
- Comprehensive design system using Shadcn/ui
- Dark/light theme support with CSS variables
- Responsive design with mobile-first approach
- Toast notifications for user feedback
- **VaultHealth Component**: Live collateral ratio monitoring with color-coded risk levels
- **Dynamic Token Interface**: Clickable cards switch between BVIX/EVIX trading modes

## Data Flow

1. **User Authentication**: Wallet-based authentication through MetaMask
2. **Token Operations**: Real mint/redeem operations via smart contracts using Ethers.js
3. **Price Data**: Live oracle price feeds from deployed MockOracle contract
4. **State Management**: React hooks manage Web3 state, wallet context manages connection
5. **Blockchain Interactions**: Direct contract calls for balances, minting, and redeeming

## External Dependencies

### Blockchain Integration
- **Network**: Base Sepolia testnet for development
- **Wallet**: MetaMask browser extension required
- **Smart Contracts**: Ready for deployment - BVIXToken.sol, MockOracle.sol, MintRedeem.sol
- **Contract Integration**: Ethers.js v6 with generated ABIs and helper functions

### Third-Party Services
- **Database**: Neon PostgreSQL (serverless Postgres)
- **UI Components**: Radix UI primitives for accessibility
- **Icons**: Lucide React icon library
- **Styling**: Tailwind CSS framework

### Development Tools
- **Build**: Vite with React plugin and TypeScript support
- **Linting**: TypeScript compiler for type checking
- **Development**: Replit-specific plugins for runtime error handling

## Deployment Strategy

### Production Build
- Frontend builds to `dist/public` directory
- Backend builds with esbuild to `dist/index.js`
- Single-server deployment serving both frontend and API

### Environment Configuration
- Database URL required via `DATABASE_URL` environment variable
- Development/production modes controlled via `NODE_ENV`
- Replit-specific features enabled in development environment

### Database Management
- Schema changes managed through Drizzle migrations
- Database push command for development schema updates
- Session storage requires PostgreSQL connection

The application is structured as a monorepo with shared TypeScript types between frontend and backend, enabling full-stack type safety. The architecture supports both development with hot reloading and production deployment as a single server application.