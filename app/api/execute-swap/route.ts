import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { createHash, randomBytes } from 'crypto';

interface ExecuteSwapRequest {
  fromToken: string;
  toToken: string;
  amount: string;
  userAddress: string;
  swapType: 'native' | 'lightning';
}

// Import contract ABIs
import BitcoinResolverABI from '@/smart-contracts/out/BitcoinResolver.sol/BitcoinResolver.json';

const BITCOIN_RESOLVER_ADDRESS = process.env.BITCOIN_RESOLVER_ADDRESS || '';
const RESOLVER_PRIVATE_KEY = process.env.RESOLVER_PRIVATE_KEY || '';
const RPC_URL = process.env.EVM_RPC_URL || '';

export async function POST(request: NextRequest) {
  try {
    const body: ExecuteSwapRequest = await request.json();
    const { fromToken, toToken, amount, userAddress, swapType } = body;

    // Validate inputs
    if (!fromToken || !toToken || !amount || !userAddress || !swapType) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Generate secure secret and hash
    const secret = `0x${randomBytes(32).toString('hex')}`;
    const htlcHash = `0x${createHash('sha256').update(Buffer.from(secret.slice(2), 'hex')).digest('hex')}`;

    // Initialize ethers provider and signer
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(RESOLVER_PRIVATE_KEY, provider);

    // Initialize BitcoinResolver contract
    const bitcoinResolver = new ethers.Contract(
      BITCOIN_RESOLVER_ADDRESS,
      BitcoinResolverABI.abi,
      signer
    );

    try {
      // Call initiateEvmSwap on BitcoinResolver contract
      const tx = await bitcoinResolver.initiateEvmSwap(
        userAddress,
        htlcHash,
        fromToken,
        amount,
        3600 // 1 hour timeout
      );

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      if (!receipt.status) {
        throw new Error('Transaction failed');
      }

      // After EVM swap is initiated, trigger the appropriate Bitcoin handler
      let bitcoinResponse;
      if (swapType === 'native') {
        bitcoinResponse = await triggerNativeBitcoinHandler(htlcHash, amount, toToken);
      } else {
        bitcoinResponse = await triggerLightningHandler(htlcHash, amount);
      }

      // Store swap state (in production, this would be in a database)
      const swapState = {
        htlcHash,
        secret, // Store securely, only reveal when conditions are met
        userAddress,
        fromToken,
        toToken,
        amount,
        swapType,
        evmTxHash: receipt.hash,
        bitcoinDetails: bitcoinResponse,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      // In production, save swapState to database

      return NextResponse.json({
        success: true,
        htlcHash,
        evmTxHash: receipt.hash,
        bitcoinDetails: bitcoinResponse,
        message: 'Swap initiated successfully'
      });

    } catch (error: any) {
      console.error('Error initiating swap:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to initiate swap' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error processing swap request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process swap request' },
      { status: 500 }
    );
  }
}

async function triggerNativeBitcoinHandler(htlcHash: string, amount: string, recipientAddress: string) {
  // Call the native-btc API endpoint
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/resolver/native-btc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      htlcHash,
      amount: parseInt(amount) / 1e8, // Convert from satoshis
      recipientAddress,
      timeoutBlocks: 144 // ~24 hours
    })
  });

  const data = await response.json();
  return data;
}

async function triggerLightningHandler(htlcHash: string, amount: string) {
  // Call the lightning API endpoint
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/resolver/lightning`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      htlcHash,
      amountSats: parseInt(amount) / 1e8,
      description: 'Polaris cross-chain swap',
      expirySeconds: 3600
    })
  });

  const data = await response.json();
  return data;
}