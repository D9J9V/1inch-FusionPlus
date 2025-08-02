import { NextRequest, NextResponse } from 'next/server';
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

    // Determine user-friendly status
    let status = 'unknown';
    let message = '';
    
    switch (swap.state) {
      case 'created':
        status = 'pending';
        message = 'Swap created, waiting for deposit';
        break;
      case 'waiting_for_deposit':
        status = 'pending';
        message = 'Waiting for EVM deposit';
        break;
      case 'evm_deposit_detected':
      case 'evm_deposit_confirmed':
        status = 'processing';
        message = 'EVM deposit confirmed, creating Bitcoin HTLC';
        break;
      case 'btc_htlc_created':
        status = 'processing';
        message = 'Bitcoin HTLC created, waiting for Bitcoin deposit';
        break;
      case 'btc_deposit_detected':
        status = 'processing';
        message = `Bitcoin deposit detected (${swap.current_confirmations}/${swap.confirmations_required} confirmations)`;
        break;
      case 'btc_deposit_confirmed':
      case 'secret_requested':
        status = 'ready_to_claim';
        message = 'Bitcoin deposit confirmed! You can now reveal the secret to claim your funds.';
        break;
      case 'secret_revealed':
        status = 'claiming';
        message = 'Secret revealed, claim your funds on the Bitcoin network';
        break;
      case 'swap_completed':
        status = 'completed';
        message = 'Swap completed successfully';
        break;
      case 'swap_failed':
        status = 'failed';
        message = swap.error_message || 'Swap failed';
        break;
      case 'swap_timeout':
        status = 'expired';
        message = 'Swap expired';
        break;
      case 'swap_reclaimed':
        status = 'reclaimed';
        message = 'Funds reclaimed due to timeout';
        break;
    }

    // Check if expired
    if (new Date(swap.expires_at) < new Date() && status !== 'completed') {
      status = 'expired';
      message = 'Swap has expired';
    }

    return NextResponse.json({
      success: true,
      htlc_hash: htlcHash,
      status,
      message,
      state: swap.state,
      swap_type: swap.swap_type,
      from_chain: swap.from_chain,
      to_chain: swap.to_chain,
      amount: swap.amount,
      evm_tx_hash: swap.evm_tx_hash,
      btc_tx_id: swap.btc_tx_id,
      lightning_invoice: swap.lightning_invoice,
      created_at: swap.created_at,
      expires_at: swap.expires_at,
      secret_revealed: !!swap.secret_revealed_at,
      current_confirmations: swap.current_confirmations,
      required_confirmations: swap.confirmations_required
    });

  } catch (error) {
    console.error('Error fetching swap status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch swap status' },
      { status: 500 }
    );
  }
}