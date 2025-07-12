# Levitas Finance - Volatility Token DApp

## Overview

This project is a decentralized finance (DeFi) application called Levitas Finance that provides tokenized volatility products. It's a full-stack web application with a React frontend and Express.js backend, featuring volatility index tokens (BVIX, EVIX, VIXC) that allow users to hedge their cryptocurrency holdings.

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

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful API with `/api` prefix for all endpoints
- **Development Server**: Custom Vite integration for hot reloading

### Data Storage Solutions
- **Database**: PostgreSQL (configured for Neon database)
- **ORM**: Drizzle ORM with schema defined in TypeScript
- **Migrations**: Drizzle Kit for database migrations
- **Session Storage**: PostgreSQL sessions using connect-pg-simple
- **Development Storage**: In-memory storage implementation for development

## Key Components

### Wallet Integration
- MetaMask wallet connection with automatic network switching to Base Sepolia
- Wallet context provider for managing connection state across the app
- Smart contract integration placeholders for BVIX, EVIX tokens and USDC

### Trading Interface
- Mint/redeem functionality for volatility tokens
- Real-time balance display and transaction history
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
2. **Token Operations**: Mint/redeem operations interface with smart contracts
3. **Price Data**: Mock data currently, intended for oracle integration
4. **State Management**: React Query handles API state, wallet context manages Web3 state
5. **Database Operations**: Drizzle ORM provides type-safe database interactions

## External Dependencies

### Blockchain Integration
- **Network**: Base Sepolia testnet for development
- **Wallet**: MetaMask browser extension required
- **Smart Contracts**: Placeholder addresses for BVIX/EVIX tokens, Mock Oracle, and Mock USDC

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