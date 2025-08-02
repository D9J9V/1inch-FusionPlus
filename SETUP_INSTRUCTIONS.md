# Polaris Setup Instructions for Hackathon

## Quick Start Guide

### 1. Database Setup (Supabase)

1. Create a new Supabase project at https://supabase.com
2. Once created, go to the SQL Editor in your Supabase dashboard
3. Run the migration file:
   ```sql
   -- Copy and paste the contents of:
   -- app/utils/supabase/migrations/001_COMPLETE_SWAPS_SCHEMA.sql
   ```

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
# Supabase (from your Supabase project settings)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# EVM Configuration (for testnet)
EVM_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
BITCOIN_RESOLVER_ADDRESS=0x... # Deploy BitcoinResolver.sol and add address
HTLC_ESCROW_ADDRESS=0x... # Deploy EVMHtlcEscrow.sol and add address
RESOLVER_PRIVATE_KEY=0x... # Private key for resolver (use a testnet key!)

# Bitcoin Configuration
BITCOIN_NETWORK=testnet
BITCOIN_RPC_URL=https://blockstream.info/testnet/api
BITCOIN_PRIVATE_KEY=your_bitcoin_testnet_private_key

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Lightning (if implementing Lightning support)
LND_HOST=localhost:10009
LND_MACAROON=
LND_CERT=
```

### 3. Deploy Smart Contracts

1. Navigate to the smart contracts directory:
   ```bash
   cd smart-contracts
   ```

2. Install dependencies:
   ```bash
   forge install
   ```

3. Deploy contracts to testnet:
   ```bash
   # Deploy EVMHtlcEscrow first
   forge create --rpc-url $EVM_RPC_URL \
     --private-key $RESOLVER_PRIVATE_KEY \
     bitcoin/EVMHtlcEscrow.sol:EVMHtlcEscrow \
     --constructor-args "0xYourTreasuryAddress"

   # Deploy BitcoinResolver
   forge create --rpc-url $EVM_RPC_URL \
     --private-key $RESOLVER_PRIVATE_KEY \
     bitcoin/BitcoinResolver.sol:BitcoinResolver \
     --constructor-args "0xHTLC_ESCROW_ADDRESS" "0xYourResolverAddress"
   ```

4. Update the deployed contract addresses in your `.env.local`

### 4. Run the Application

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Generate TypeScript types from Supabase:
   ```bash
   npx supabase link
   pnpm run typegen
   ```

3. Start the development server:
   ```bash
   pnpm dev
   ```

## Testing the Swap Flow

### 1. Initiate a Swap

```bash
curl -X POST http://localhost:3000/api/execute-swap \
  -H "Content-Type: application/json" \
  -d '{
    "fromToken": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    "toToken": "tb1qexampleaddress",
    "amount": "1000000",
    "userAddress": "0xYourAddress",
    "swapType": "native",
    "fromChain": "ethereum",
    "toChain": "bitcoin"
  }'
```

### 2. Check Swap Status

```bash
curl http://localhost:3000/api/swap-status/0xHTLC_HASH
```

### 3. Reveal Secret (after Bitcoin deposit)

```bash
curl http://localhost:3000/api/secret/0xHTLC_HASH \
  -H "authorization: Bearer your-auth-token" \
  -H "x-user-address: 0xYourAddress"
```

## Important Notes for Hackathon

1. **Use Testnet Only**: All testing should be done on testnets (Sepolia for Ethereum, Bitcoin testnet)
2. **Security**: The current implementation is for demonstration. Do not use real funds.
3. **State Updates**: The state machine requires manual updates for Bitcoin confirmations in this demo version
4. **Lightning**: Lightning support requires a running LND node. For demo purposes, you can skip Lightning.

## Troubleshooting

1. **Database Connection Issues**: 
   - Ensure your Supabase project is active
   - Check that all environment variables are correctly set
   - Run the migration script in the SQL editor

2. **Contract Deployment Failed**:
   - Ensure you have testnet ETH in your resolver account
   - Verify the RPC URL is correct
   - Check that Foundry is properly installed

3. **Swap Fails**:
   - Check that the user has approved the token for the BitcoinResolver contract
   - Ensure the resolver has enough balance to pay gas fees
   - Verify all contract addresses are correct in .env.local

## Demo Flow for Judges

1. Show the swap initiation with proper secret storage
2. Demonstrate the state machine transitions
3. Show how secrets are only revealed after Bitcoin confirmation
4. Explain the security measures implemented
5. Highlight the atomic nature of the swap

Good luck with your hackathon submission!