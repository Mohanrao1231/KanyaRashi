---
description: Repository Information Overview
alwaysApply: true
---

# Teleport Ledger Information

## Summary
Teleport Ledger is a blockchain-powered package tracking application that provides secure, tamper-proof logistics management. It combines a Next.js frontend with Supabase for authentication and database, and Ethereum smart contracts for package custody verification.

## Structure
- **app/**: Next.js application routes and pages
- **components/**: React components including UI elements and functional components
- **contracts/**: Solidity smart contracts for blockchain integration
- **lib/**: Utility functions, Supabase client, and Web3 integration
- **public/**: Static assets
- **scripts/**: SQL scripts for database setup
- **styles/**: Global CSS styles

## Language & Runtime
**Language**: TypeScript/JavaScript
**Version**: TypeScript 5.x
**Framework**: Next.js 14.x
**Build System**: Next.js build system
**Package Manager**: npm/pnpm

## Dependencies
**Main Dependencies**:
- Next.js (^14.2.33): React framework
- React (^18): UI library
- Supabase Auth Helpers (@supabase/auth-helpers-nextjs ^0.10.0): Authentication
- Ethers.js (latest): Ethereum interaction
- Hardhat (latest): Smart contract development
- Radix UI components: UI component library
- TailwindCSS (^4.1.9): CSS framework

**Development Dependencies**:
- TypeScript (^5): Type checking
- Hardhat toolbox: Smart contract testing and deployment

## Build & Installation
```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Start production server
npm run start
```

## Smart Contracts
**Language**: Solidity ^0.8.19
**Framework**: Hardhat
**Main Contract**: TeleportLedger.sol
**Networks**: Polygon, Mumbai Testnet, Local Development

**Contract Build & Deployment**:
```bash
# Navigate to contracts directory
cd contracts

# Install dependencies
npm install

# Compile contracts
npm run compile

# Deploy to local network
npm run deploy:localhost

# Deploy to Mumbai testnet
npm run deploy:mumbai

# Deploy to Polygon mainnet
npm run deploy:polygon
```

## Database
**Provider**: Supabase
**Tables**: users, packages, custody_transfers
**Setup**: SQL scripts in scripts/ directory for table creation and seeding

## Authentication
**Provider**: Supabase Auth
**Methods**: Email/password authentication
**Integration**: @supabase/auth-helpers-nextjs

## Web3 Integration
**Provider**: Ethers.js
**Contract Address**: Configured via environment variables
**Features**: Package creation, custody transfer, status updates

## Environment Variables
**Required Variables**:
- NEXT_PUBLIC_SUPABASE_URL: Supabase project URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY: Supabase anonymous key
- NEXT_PUBLIC_CONTRACT_ADDRESS: Deployed contract address
- NEXT_PUBLIC_POLYGON_RPC_URL: Polygon RPC URL