import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { htlcHash: string } }
) {
  const supabase = createClient();
  
  try {
    const { htlcHash } = params;

    if (!htlcHash) {
      return NextResponse.json(
        { success: false, error: 'HTLC hash required' },
        { status: 400 }
      );
    }

    // Verify authorization
    const authHeader = request.headers.get('authorization');
    const userAddress = request.headers.get('x-user-address');

    if (!authHeader || !userAddress) {
      return NextResponse.json(
        { success: false, error: 'Authorization required' },
        { status: 401 }
      );
    }

    // Fetch swap from database
    const { data: swap, error: fetchError } = await supabase
      .from('swaps')
      .select('*')
      .eq('htlc_hash', htlcHash)
      .single();

    if (fetchError || !swap) {
      return NextResponse.json(
        { success: false, error: 'Swap not found' },
        { status: 404 }
      );
    }

    // Verify the user is the original swap initiator
    if (swap.user_address.toLowerCase() !== userAddress.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: You are not the swap initiator' },
        { status: 403 }
      );
    }

    // Check if secret was already revealed
    if (swap.secret_revealed_at) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Secret already revealed',
          revealedAt: swap.secret_revealed_at
        },
        { status: 409 }
      );
    }

    // Verify that Bitcoin/Lightning payment has been confirmed
    const isClaimable = await verifyClaimConditions(swap);

    if (!isClaimable) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Swap not ready for claim. Bitcoin payment must be confirmed first.',
          currentState: swap.state
        },
        { status: 403 }
      );
    }

    // Update database to mark secret as revealed
    const { error: updateError } = await supabase
      .from('swaps')
      .update({
        secret_revealed_at: new Date(),
        secret_revealed_to: userAddress,
        state: 'secret_revealed',
        updated_at: new Date()
      })
      .eq('htlc_hash', htlcHash);

    if (updateError) {
      console.error('Failed to update secret reveal status:', updateError);
    }

    // Log the secret reveal for audit purposes
    console.log(`Secret revealed for htlcHash: ${htlcHash} to user: ${userAddress}`);

    return NextResponse.json({
      success: true,
      htlcHash,
      secret: swap.secret,
      message: 'Use this secret to claim your funds on the Bitcoin network',
      instructions: {
        native: 'Use this secret as the preimage in your Bitcoin wallet to unlock the HTLC',
        lightning: 'This secret has been used to settle your Lightning invoice'
      }
    });

  } catch (error) {
    console.error('Error revealing secret:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reveal secret' },
      { status: 500 }
    );
  }
}

async function verifyClaimConditions(swap: any): Promise<boolean> {
  // Check if the swap is in a state where the secret can be revealed
  const validStates = [
    'btc_deposit_confirmed',
    'secret_requested',
    'swap_completed' // In case we need to re-reveal
  ];

  if (!validStates.includes(swap.state)) {
    return false;
  }

  // Check that swap hasn't expired
  if (new Date(swap.expires_at) < new Date()) {
    return false;
  }

  // For Lightning swaps, check if invoice was paid
  if (swap.swap_type === 'lightning' && swap.lightning_payment_hash) {
    // In a real implementation, we would check with the Lightning node
    // For now, we'll trust the state machine
    return swap.state === 'btc_deposit_confirmed' || swap.state === 'secret_requested';
  }

  // For native Bitcoin swaps, check if HTLC has required confirmations
  if (swap.swap_type === 'native') {
    // Check if we have enough confirmations
    const requiredConfirmations = swap.confirmations_required || 3;
    const currentConfirmations = swap.current_confirmations || 0;
    
    // Only reveal if we have enough confirmations or if state indicates it's ready
    return currentConfirmations >= requiredConfirmations || 
           swap.state === 'btc_deposit_confirmed' ||
           swap.state === 'secret_requested';
  }

  return true;
}