# Levitas Finance - Volatility Token DApp

## Overview

This project is a decentralized finance (DeFi) application called Levitas Finance that provides tokenized volatility products. It's a React frontend DApp with Ethers.js Web3 integration, featuring volatility index tokens (BVIX, EVIX, VIXC) that allow users to hedge their cryptocurrency holdings on Base Sepolia testnet.

## Recent Changes (January 2025)

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

### Backend Architecture (Minimal)
- **Runtime**: Node.js with Express.js framework (minimal, mostly serves frontend)
- **Language**: TypeScript with ESM modules
- **Development Server**: Custom Vite integration for hot reloading

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