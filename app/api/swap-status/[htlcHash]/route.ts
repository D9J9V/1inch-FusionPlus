import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

// Import contract ABIs
import EVMHtlcEscrowABI from '@/smart-contracts/out/EVMHtlcEscrow.sol/EVMHtlcEscrow.json';

const HTLC_ESCROW_ADDRESS = process.env.HTLC_ESCROW_ADDRESS || '';
const RPC_URL = process.env.EVM_RPC_URL || '';

interface SwapStatus {
  htlcHash: string;
  status: 'pending' | 'ready_to_claim' | 'claimed' | 'refunded' | 'expired';
  evmStatus: any;
  bitcoinStatus: any;
  swapDetails?: any;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { htlcHash: string } }
) {
  try {
    const { htlcHash } = params;

    if (!htlcHash) {
      return NextResponse.json(
        { success: false, error: 'HTLC hash required' },
        { status: 400 }
      );
    }

    // Initialize ethers provider
    const provider = new ethers.JsonRpcProvider(RPC_URL);

    // Initialize EVMHtlcEscrow contract
    const htlcEscrow = new ethers.Contract(
      HTLC_ESCROW_ADDRESS,
      EVMHtlcEscrowABI.abi,
      provider
    );

    // Check on-chain swap status
    const swap = await htlcEscrow.swaps(htlcHash);
    
    // In production, also fetch swap details from database
    // const swapDetails = await getSwapFromDatabase(htlcHash);

    let status: SwapStatus['status'] = 'pending';
    let evmStatus = {
      exists: swap.amount > 0n,
      amount: swap.amount.toString(),
      token: swap.token,
      recipient: swap.recipient,
      timeout: swap.timeout.toString(),
      isExpired: false,
      isClaimed: false
    };

    if (swap.amount === 0n) {
      // Swap doesn't exist or has been claimed/refunded
      status = 'claimed'; // In production, check logs to determine if claimed or refunded
      evmStatus.isClaimed = true;
    } else if (swap.timeout < Math.floor(Date.now() / 1000)) {
      status = 'expired';
      evmStatus.isExpired = true;
    }

    // Check Bitcoin/Lightning status
    // In production, this would check actual Bitcoin/Lightning network status
    const bitcoinStatus = await checkBitcoinStatus(htlcHash);

    // Determine overall status
    if (evmStatus.exists && bitcoinStatus.confirmed) {
      status = 'ready_to_claim';
    }

    // Mock swap details (in production, fetch from database)
    const swapDetails = {
      swapType: 'native', // or 'lightning'
      fromToken: swap.token,
      toToken: 'BTC',
      amount: swap.amount.toString(),
      userAddress: swap.recipient,
      createdAt: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
      invoice: bitcoinStatus.invoice
    };

    return NextResponse.json({
      success: true,
      htlcHash,
      status,
      evmStatus,
      bitcoinStatus,
      swapDetails
    });

  } catch (error) {
    console.error('Error checking swap status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check swap status' },
      { status: 500 }
    );
  }
}

async function checkBitcoinStatus(htlcHash: string) {
  // In production, this would check actual Bitcoin/Lightning status
  // For now, return mock data
  
  // Check Lightning invoice status
  try {
    const lightningResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/resolver/lightning?paymentHash=${htlcHash}`
    );
    
    if (lightningResponse.ok) {
      const data = await lightningResponse.json();
      if (data.status === 'settled') {
        return {
          confirmed: true,
          type: 'lightning',
          invoice: data.paymentRequest,
          settledAt: data.settledAt
        };
      }
    }
  } catch (error) {
    console.error('Error checking Lightning status:', error);
  }

  // For native Bitcoin, in production would check blockchain
  return {
    confirmed: false,
    type: 'unknown',
    invoice: null,
    txId: null
  };
}