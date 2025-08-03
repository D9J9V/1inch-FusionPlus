import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { createHash, randomBytes } from 'crypto';
import { SwapErrorHandler, ErrorCode } from '@/utils/error-handler';
import { SwapStateMachine } from "../resolver/state-machine";
import { createClient } from '@/utils/supabase/server';

interface ExecuteSwapRequest {
  from_token: string;
  to_token: string;
  amount: string;
  user_address: string;
  swap_type: 'native' | 'lightning';
  from_chain?: string;
  to_chain?: string;
}

// Import contract ABIs
import BitcoinResolverABI from '../../../../smart-contracts/out/BitcoinResolver.sol/BitcoinResolver.json';

const BITCOIN_RESOLVER_ADDRESS = process.env.BITCOIN_RESOLVER_ADDRESS || '';
const RESOLVER_PRIVATE_KEY = process.env.RESOLVER_PRIVATE_KEY || '';
const RPC_URL = process.env.EVM_RPC_URL || '';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const stateMachine = new SwapStateMachine();
  
  try {
    const body: ExecuteSwapRequest = await request.json();
    const { from_token, to_token, amount, user_address, swap_type, from_chain = 'ethereum', to_chain = 'bitcoin' } = body;

    // Validate inputs
    if (!from_token || !to_token || !amount || !user_address || !swap_type) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Generate secure secret and hash
    const secret = `0x${randomBytes(32).toString('hex')}`;
    const secretHash = `0x${createHash('sha256').update(Buffer.from(secret.slice(2), 'hex')).digest('hex')}`;
    const htlcHash = secretHash; // Using secretHash as htlcHash for consistency

    // Calculate timeout (24 hours from now)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Store swap in database first
    const { data: swapData, error: dbError } = await supabase
      .from('swaps')
      .insert({
        htlc_hash: htlcHash,
        secret: secret,
        secret_hash: secretHash,
        user_address: user_address,
        from_chain: from_chain,
        to_chain: to_chain,
        swap_type: swap_type,
        from_token: from_token,
        to_token: to_token,
        amount: amount,
        state: 'created',
        expires_at: expiresAt,
        timeout_timestamp: expiresAt,
        evm_chain_id: from_chain === 'ethereum' ? 1 : 11155111, // mainnet or sepolia
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { success: false, error: 'Failed to create swap record' },
        { status: 500 }
      );
    }

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
        user_address,
        htlcHash,
        from_token,
        amount,
        3600 // 1 hour timeout
      );

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      if (!receipt.status) {
        throw new Error('Transaction failed');
      }

      // Update swap state in database
      const { error: updateError } = await supabase
        .from('swaps')
        .update({
          evm_tx_hash: receipt.hash,
          evm_escrow_address: BITCOIN_RESOLVER_ADDRESS,
          evm_block_number: receipt.blockNumber,
          state: 'evm_deposit_detected',
          updated_at: new Date()
        })
        .eq('htlc_hash', htlcHash);

      if (updateError) {
        console.error('Failed to update swap state:', updateError);
      }
      
      // After EVM swap is initiated, trigger the appropriate Bitcoin handler
      let bitcoinResponse;
      try {
        if (swap_type === 'native') {
          bitcoinResponse = await triggerNativeBitcoinHandler(htlcHash, amount, to_token);
          
          await supabase
            .from('swaps')
            .update({
              btc_htlc_address: bitcoinResponse.htlc_address,
              btc_htlc_script: bitcoinResponse.htlc_script,
              state: 'btc_htlc_created',
              updated_at: new Date()
            })
            .eq('htlc_hash', htlcHash);
        } else {
          bitcoinResponse = await triggerLightningHandler(htlcHash, amount);
          
          await supabase
            .from('swaps')
            .update({
              lightning_invoice: bitcoinResponse.invoice?.payment_request,
              lightning_payment_hash: bitcoinResponse.invoice?.payment_hash,
              state: 'btc_htlc_created',
              updated_at: new Date()
            })
            .eq('htlc_hash', htlcHash);
        }
      } catch (btcError: any) {
        await supabase
          .from('swaps')
          .update({
            state: 'swap_failed',
            error_message: 'Failed to create Bitcoin HTLC',
            error_details: { error: btcError.message },
            updated_at: new Date()
          })
          .eq('htlc_hash', htlcHash);
        throw btcError;
      }

      return NextResponse.json({
        success: true,
        htlc_hash: htlcHash,
        evm_tx_hash: receipt.hash,
        bitcoin_details: bitcoinResponse,
        message: 'Swap initiated successfully',
        swap_id: swapData.id
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
      htlc_hash: htlcHash,
      amount: parseInt(amount) / 1e8, // Convert from satoshis
      recipient_address: recipientAddress,
      timeout_blocks: 144 // ~24 hours
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
      htlc_hash: htlcHash,
      amount_sats: parseInt(amount) / 1e8,
      description: 'Polaris cross-chain swap',
      expiry_seconds: 3600
    })
  });

  const data = await response.json();
  return data;
}