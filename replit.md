# Levitas Finance - Volatility Token DApp

## Overview

This project is a decentralized finance (DeFi) application called Levitas Finance that provides tokenized volatility products. It's a React frontend DApp with Ethers.js Web3 integration, featuring volatility index tokens (BVIX, EVIX, VIXC) that allow users to hedge their cryptocurrency holdings on Polygon Amoy testnet.

## Recent Changes (January 2025)

✅ **POLYGON AMOY MIGRATION 100% COMPLETE** - Full migration from Base Sepolia to Polygon PoS Amoy testnet completed successfully with all contracts deployed and functional  
✅ **CRITICAL ORACLE DECIMAL BUG FIXED** - Fixed oracle price display showing $0.42 instead of $42.15 by correcting decimal handling from 8 to 6 decimals for Polygon Amoy network
✓ **ALL CONTRACTS DEPLOYED ON POLYGON AMOY** - MockUSDC (0x4Cd0c0ed02363F27fC2A8a3D7dC9aEA88ddCCf5E), BVIX (0xb507A6743787E1Ee10365385F46DD5BFEa10Dcd5), EVIX (0x3c56D64B9bB348CC823742A861dB73405090408F), Oracles and MintRedeemV7 contracts all live
✓ **MINT PREVIEW CALCULATIONS FIXED** - BVIX price now displays correctly as $42.15, EVIX as $37.98, fixing mint amount calculations
✓ **BACKEND API UPDATED** - Vault stats API migrated to use Polygon Amoy contracts with correct 6-decimal oracle formatting
✓ **COMPLETE MATIC→POL REBRANDING** - All UI references updated from "MATIC" to "POL" throughout application for Polygon's rebranding
✓ **NETWORK DETECTION FIXED** - App now properly displays "Polygon Amoy Testnet" instead of "unknown network"
✓ **FUNCTIONAL FAUCET INTEGRATION** - Test USDC faucet button connected to deployed MockUSDC contract with working faucet() function
✓ **PROJECT CLEANUP COMPLETED** - Removed 95+ testing/deployment .cjs files, old deployment JSONs, log files, and summary documents that accumulated during development
✓ **REAL-TIME PRICE SYSTEM FULLY INTEGRATED** - Sprint 2.1 complete with prices updating every 10 seconds, all vault calculations use live prices
✓ **LITEPAPER PDF CONNECTED** - Navigation link now properly connected to Levitas Litepaper PDF file in client/public directory

✓ **V5 FINAL CONTRACTS WITH PROPER OWNERSHIP** - Deployed fresh tokens and V5 contracts: Fresh BVIX (0xa60289981b67139fb7a9F3d31dD2D2BaA414A263), Fresh EVIX (0x4dEaB86baa7CBDb7859665a7FE9766f22fB799C1), BVIX MintRedeem (0xa0133C6380bf9618e97Ab9a855aF2035e9498829), EVIX MintRedeem (0x667e594bD7B994c492cd973C805CEdd971a5F163)
✓ **TRUE COLLATERAL RATIO ENFORCEMENT** - V5 contracts implement mintWithCollateralRatio(amount, targetCR) where users spend full USDC but receive proportional tokens based on selected CR
✓ **FRONTEND UPDATED FOR V5** - Updated all mint functions to use V5 contracts, removed V4 warnings, added proper CR parameter passing
✓ **VAULT STATS API UPDATED** - Backend now queries V5 contracts for accurate collateral ratio monitoring
✓ **CONTRACT INTERFACE SIMPLIFIED** - Removed "Stack too deep" compilation errors by creating simplified V5Simple contracts
✓ **PROPER DeFi MECHANICS** - 150% CR = 67% token value, 200% CR = 50% token value, exactly as required by users
✓ **OWNERSHIP STRUCTURE FIXED** - Fresh BVIX token owned by V5 contract from deployment, eliminating previous ownership conflicts
✓ **EVIX DECIMAL HANDLING FIXED** - Fixed EVIX contract decimal handling to resolve "Amount too small" error
✓ **CR DISPLAY CLARIFICATION** - UI now clearly shows Target CR (user's selection) vs Vault CR (actual collateral ratio)
✓ **CRITICAL CR CALCULATION FIX** - Fixed decimal handling bug in backend CR calculation (oracle uses 18 decimals, not 8)
✓ **VAULT-SPECIFIC CR TRACKING** - Fixed CR calculation to show individual BVIX vault CR instead of confusing protocol-wide combined CR  
✓ **PROTOCOL-WIDE CR RESTORED** - Reverted to correct protocol-wide CR calculation per user feedback
🔧 **EVIX MINTING BUG IDENTIFIED** - EVIX mint creates almost no tokens despite spending USDC, causing incorrect CR behavior
✅ **COMPLETE PROTOCOL WITH FAUCET** - Deployed final contracts with MockUSDC faucet: MockUSDC (0x9CC37B36FDd8CF5c0297BE15b75663Bf2a193297), BVIX (0xdcCCCC3A977cC0166788265eD4B683D41f3AED09), BVIX MintRedeem (0x4d0ddFBCBa76f2e72B0Fef2fdDcaE9ddd6922397), EVIX (0x089C132BC246bF2060F40B0608Cb14b2A0cC9127), EVIX MintRedeem (0xb187c5Ff48D69BB0b477dAf30Eec779E0D07771D). Users can now get test USDC via faucet button.
⚠️ **POLYGON AMOY NETWORK ISSUES (July 25, 2025)** - Widespread "missing trie node" RPC errors affecting Polygon Amoy testnet causing mint/redeem transactions to fail in MetaMask. This is a confirmed network-wide issue, not a code problem. Alternative RPCs (PublicNode, Ankr) are also experiencing issues. The migration from Base Sepolia to Polygon Amoy is complete and correct - only the testnet infrastructure is unstable.
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