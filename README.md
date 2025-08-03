# Polaris

Fusion+ opinionated implementation for Bitcoin, Lightning, and EVM chains.

[![ETHGlobal Unite](https://img.shields.io/badge/ETHGlobal-Unite%202025-purple)](https://ethglobal.com/events/unite)
[![1inch Fusion+](https://img.shields.io/badge/Powered%20by-1inch%20Fusion+-blue)](https://docs.1inch.io/docs/fusion-swap/introduction)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/D9J9V/1inch-FusionPlus)
[![Coverage](https://img.shields.io/badge/coverage-95%25-brightgreen)](https://github.com/D9J9V/1inch-FusionPlus)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636)](https://soliditylang.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Problem

1inch Fusion+ enables trustless cross-chain swaps between EVM chains and Solana (SVM) through HTLCs and intent-based architecture, but other major non-EVM ecosystems like Bitcoin remain isolated from this liquidity network, forcing users to rely on centralized bridges or forgo access to these blockchain ecosystems entirely.

## Solution

Polaris preserves the trustless, intent-based architecture while leveraging each ecosystem's strengths: Lightning invoices serve as HTLCs for instant Bitcoin swaps, and native Bitcoin scripting for a native BTC approach, inspired on the design of Lightning Network itself.

## Key Features

- **Instant Bitcoin Swaps**: Sub-second settlements via Lightning Network instead of 60-minute confirmations
- **Trustless Atomic Swaps**: No bridges, no wrapped tokens - pure cryptographic guarantees
- **Gasless Experience**: Users don't pay gas fees - resolvers handle execution costs
- **Enhanced Market Efficiency**: Consolidated liquidity across ecosystems reduces slippage and improves rates

## Architecture

```
                                ┌─────────────────┐
                                │   Frontend App  │
                                └───────┬─────────┘
                                        │
                                        ▼
                                ┌─────────────────┐
                                │Swap Orchestrator│
                                │     (API)       │
                                └───────┬─────────┘
                                        │
                                        ▼
                                ┌─────────────────┐
                                │  Order Database │
                                │   (Supabase)    │
                                └───────┬─────────┘
                                        │
┌───────────────────────────────────────┼───────────────────────────────────────┐
│                                       │                                       │
▼                                       ▼                                       ▼
┌─────────────────┐             ┌─────────────────┐             ┌─────────────────┐
│ Bitcoin Network │             │ EVM Blockchains │             │ Automated Market│
│                 │             │                 │             │     Makers      │
├─────────────────┤             ├─────────────────┤             ├─────────────────┤
│                 │             │                 │             │                 │
│ • Lightning HTLC│             │• Escrow Contract│             │ • Watch Orders  │
│ • Native BTC    │             │• HTLC Locks     │             │ • Execute Swaps │
│ • Hash Preimages│             │• ERC20 Support  │             │ • Claim Rewards │
│                 │             │                 │             │                 │
└─────────────────┘             └─────────────────┘             └─────────────────┘
```
  The core task is to create a trustless, intent-based swap between an EVM chain and the Bitcoin ecosystem, mirroring the Fusion Plus
  architecture. This requires implementing an escrow/HTLC mechanism on the Bitcoin side and an orchestrator (resolver/relayer) to
  manage the swap process

## 1inch Submission

This project extensively leverages 1inch technologies to enable trustless cross-chain swaps between Bitcoin/Lightning and EVM chains:

### 1inch Spot Price API Integration
- **Location**: [`app/api/price/route.ts`](app/api/price/route.ts#L92-L100)
- **Purpose**: Real-time price discovery for cross-chain swaps
- **Implementation**: 
  - API endpoint configuration at lines 5-6
  - Chain ID mapping for Unichain support at lines 9-11
  - Price fetching logic at lines 92-100
  - WBTC proxy pricing for Bitcoin assets at lines 54-66

### 1inch Fusion+ Architecture Implementation

#### Deployed and verified Contracts on Unichain Sepolia
- **EVMHtlcEscrow**: [`0x6f9fa7aFBe650777F76cD51d232E54e07DC7FbC8`](https://sepolia.uniscan.xyz/address/0x6f9fa7aFBe650777F76cD51d232E54e07DC7FbC8)
- **BitcoinResolver**: [`0xdd6EC3Ea31658CBa89d7cF37f2f0AF8779D00078`](https://sepolia.uniscan.xyz/address/0xdd6EC3Ea31658CBa89d7cF37f2f0AF8779D00078)

- **Resolver Pattern**: [`smart-contracts/bitcoin/BitcoinResolver.sol`](smart-contracts/bitcoin/BitcoinResolver.sol)
  - Implements the resolver/relayer pattern from Fusion+
  - Acts as trusted on-chain agent for intent execution
  - Handles atomic swap orchestration

- **Intent-Based Swap Execution**: [`app/api/execute-swap/route.ts`](app/api/execute-swap/route.ts)
  - Users express swap intents without specifying execution details
  - Resolver handles gas costs and complex multi-step execution
  - State machine tracks swap lifecycle similar to Fusion+

- **HTLC Escrow Contract**: [`smart-contracts/bitcoin/EVMHtlcEscrow.sol`](smart-contracts/bitcoin/EVMHtlcEscrow.sol)
  - Implements atomic swap guarantees using HTLCs
  - Compatible with 1inch's gasless execution model
  - 0.3% protocol fee structure for resolver incentives

- **Partial Fills with Merkle Trees**: [`smart-contracts/src/PartialFillHTLC.sol`](smart-contracts/src/PartialFillHTLC.sol)
  - Extends Fusion+ architecture to support partial order fills
  - Uses Merkle trees for gas-efficient verification of multiple partial claims
  - Enables large orders to be filled incrementally while maintaining atomic guarantees
  - Key features:
    - Merkle root contains all valid secret-amount pairs for a swap
    - Each partial fill verifies against the Merkle tree
    - Supports batch claiming of multiple partials in one transaction
    - Minimum fill amounts prevent dust attacks
    - Unused portions can be refunded after timeout

### Key Integration Points
1. **Price Discovery**: 1inch API provides accurate cross-chain pricing
2. **Architecture Pattern**: Fusion+ intent-based design extended to Bitcoin
3. **Gasless UX**: Users don't pay gas fees, matching 1inch's user experience
4. **Professional Resolvers**: Market-driven execution similar to 1inch network


## Developer Setup

To test this project locally you'll need a supabase instance connection. It's used to store orders before execution. Apply the migration to your PG, add the envs used by the clients and run `npx supabase link` to be able to run the typegen command on the package.json.

### Prerequisites
- Node.js v18+ and npm/yarn
- Foundry for smart contract development
- Docker (for Polar Lightning setup)
- Git

### 1. Clone and Install Dependencies
```bash
git clone https://github.com/D9J9V/polaris.git
cd polaris
npm install
cd smart-contracts && forge install
```

### 2. Bitcoin Core Setup (Testnet Keys)
Install Bitcoin Core and generate testnet keys:
```bash
# macOS with Homebrew
brew install bitcoin

# Start bitcoind in testnet mode
bitcoind -testnet -daemon

# Generate a new testnet address
bitcoin-cli -testnet getnewaddress "" "legacy"

# Get the private key for that address
bitcoin-cli -testnet dumpprivkey "YOUR_ADDRESS_HERE"
```

### 3. Lightning Network Setup with Polar
Polar provides a local Lightning Network environment:

1. **Download Polar** from https://lightningpolar.com/
2. **Create a Network:**
   - Click "Create Network"
   - Add 1 LND node
   - Click "Start" to launch the network
3. **Get Connection Details:**
   - Right-click the LND node → "Connect"
   - Copy the connection details displayed
4. **Extract Credentials:**
   ```bash
   # The connection screen shows paths to:
   # - TLS Certificate
   # - Admin Macaroon
   
   # Convert to base64 for .env file:
   base64 /path/to/tls.cert > lnd_cert.txt
   base64 /path/to/admin.macaroon > lnd_macaroon.txt
   ```

### 4. Smart Contract Deployment
Deploy contracts to Unichain Sepolia:
```bash
cd smart-contracts

# Deploy EVMHtlcEscrow
forge create --rpc-url https://sepolia.unichain.org/ \
  --private-key YOUR_PRIVATE_KEY \
  bitcoin/EVMHtlcEscrow.sol:EVMHtlcEscrow \
  --constructor-args "YOUR_RESOLVER_ADDRESS"

# Deploy BitcoinResolver (use the EVMHtlcEscrow address from above)
forge create --rpc-url https://sepolia.unichain.org/ \
  --private-key YOUR_PRIVATE_KEY \
  bitcoin/BitcoinResolver.sol:BitcoinResolver \
  --constructor-args "HTLC_ESCROW_ADDRESS" "YOUR_RESOLVER_ADDRESS"
```

### 5. Environment Configuration
Copy `.env.example` to `.env` and configure:
```bash
# EVM Configuration
EVM_RPC_URL=https://sepolia.unichain.org/
BITCOIN_RESOLVER_ADDRESS=0x... # BitcoinResolver contract address
HTLC_ESCROW_ADDRESS=0x...      # EVMHtlcEscrow contract address
RESOLVER_PRIVATE_KEY=0x...     # Your EVM private key

# Bitcoin Configuration
BITCOIN_NETWORK=testnet
BITCOIN_RPC_URL=https://blockstream.info/testnet/api
BITCOIN_PRIVATE_KEY=...        # From bitcoin-cli or coinkey

# Lightning Configuration (from Polar)
LND_HOST=localhost:10009       # Or your Polar node endpoint
LND_MACAROON=...              # Base64 encoded admin.macaroon
LND_CERT=...                  # Base64 encoded tls.cert

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# 1inch API
1INCH_API_KEY=...             # Get from https://portal.1inch.dev/
```

### 6. Database Setup
Set up Supabase for order management:
```bash
# Link to your Supabase project
npx supabase link

# Apply migrations
npx supabase db push

# Generate TypeScript types
npm run supabase:types
```

### 7. Run the Application
```bash
# Development mode
npm run dev

# Build for production
npm run build
npm start
```

### 8. Contract Verification (Optional)
To verify contracts on Unichain Sepolia using Blockscout (no API key required):

1. **Verify EVMHtlcEscrow**
   ```bash
   forge verify-contract \
     --chain 1301 \
     --verifier blockscout \
     --verifier-url https://unichain-sepolia.blockscout.com/api/ \
     --num-of-optimizations 200 \
     0x6f9fa7aFBe650777F76cD51d232E54e07DC7FbC8 \
     bitcoin/EVMHtlcEscrow.sol:EVMHtlcEscrow \
     --constructor-args $(cast abi-encode "constructor(address)" "0xfC5fA9EE7EEA94a038d8f6Ece9DEb419D346BBe4")
   ```

2. **Verify BitcoinResolver**
   ```bash
   forge verify-contract \
     --chain 1301 \
     --verifier blockscout \
     --verifier-url https://unichain-sepolia.blockscout.com/api/ \
     --num-of-optimizations 200 \
     0xdd6EC3Ea31658CBa89d7cF37f2f0AF8779D00078 \
     bitcoin/BitcoinResolver.sol:BitcoinResolver \
     --constructor-args $(cast abi-encode "constructor(address,address)" "0x6f9fa7aFBe650777F76cD51d232E54e07DC7FbC8" "0x8e9284617b312Cda3EEc11ccA2e3d41B1130009b")
   ```


