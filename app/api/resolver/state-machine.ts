import { createClient } from '@/utils/supabase/server';
import { monitorHTLC, redeemHTLC, reclaimHTLC, getCurrentBlockHeight } from './native-btc/monitor';

export enum SwapState {
  // Initial states
  CREATED = 'created',
  WAITING_FOR_DEPOSIT = 'waiting_for_deposit',
  
  // EVM side states
  EVM_DEPOSIT_DETECTED = 'evm_deposit_detected',
  EVM_DEPOSIT_CONFIRMED = 'evm_deposit_confirmed',
  
  // Bitcoin side states
  BTC_HTLC_CREATED = 'btc_htlc_created',
  BTC_DEPOSIT_DETECTED = 'btc_deposit_detected',
  BTC_DEPOSIT_CONFIRMED = 'btc_deposit_confirmed',
  
  // Secret revelation states
  SECRET_REQUESTED = 'secret_requested',
  SECRET_REVEALED = 'secret_revealed',
  
  // Completion states
  SWAP_COMPLETED = 'swap_completed',
  SWAP_FAILED = 'swap_failed',
  SWAP_TIMEOUT = 'swap_timeout',
  SWAP_RECLAIMED = 'swap_reclaimed'
}

export interface SwapStateData {
  htlc_hash: string;
  state: SwapState;
  evm_chain_id?: number;
  evm_tx_hash?: string;
  evm_escrow_address?: string;
  btc_htlc_address?: string;
  btc_htlc_script?: string;
  btc_tx_id?: string;
  btc_amount?: number;
  secret?: string;
  error_message?: string;
  created_at: Date;
  updated_at: Date;
  timeout_block?: number;
  confirmations_required: number;
  current_confirmations?: number;
}

export class SwapStateMachine {
  private supabase;
  
  constructor() {
    this.supabase = createClient();
  }
  
  async createSwap(htlc_hash: string, evm_chain_id: number, confirmations_required: number = 3): Promise<SwapStateData> {
    const swapData: SwapStateData = {
      htlc_hash,
      state: SwapState.CREATED,
      evm_chain_id,
      confirmations_required,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const { error } = await this.supabase
      .from('swaps')
      .insert({
        htlc_hash: htlc_hash,
        state: swapData.state,
        evm_chain_id: evm_chain_id,
        confirmations_required: confirmations_required,
        created_at: swapData.created_at,
        updated_at: swapData.updated_at
      });
      
    if (error) throw error;
    
    return swapData;
  }
  
  async getSwapState(htlc_hash: string): Promise<SwapStateData | null> {
    const { data, error } = await this.supabase
      .from('swaps')
      .select('*')
      .eq('htlc_hash', htlc_hash)
      .single();
      
    if (error || !data) return null;
    
    return {
      htlc_hash: data.htlc_hash,
      state: data.state as SwapState,
      evm_chain_id: data.evm_chain_id,
      evm_tx_hash: data.evm_tx_hash,
      evm_escrow_address: data.evm_escrow_address,
      btc_htlc_address: data.btc_htlc_address,
      btc_htlc_script: data.btc_htlc_script,
      btc_tx_id: data.btc_tx_id,
      btc_amount: data.btc_amount,
      secret: data.secret,
      error_message: data.error_message,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
      timeout_block: data.timeout_block,
      confirmations_required: data.confirmations_required,
      current_confirmations: data.current_confirmations
    };
  }
  
  async updateSwapState(htlc_hash: string, updates: Partial<SwapStateData>): Promise<void> {
    const { error } = await this.supabase
      .from('swaps')
      .update({
        state: updates.state,
        evm_tx_hash: updates.evm_tx_hash,
        evm_escrow_address: updates.evm_escrow_address,
        btc_htlc_address: updates.btc_htlc_address,
        btc_htlc_script: updates.btc_htlc_script,
        btc_tx_id: updates.btc_tx_id,
        btc_amount: updates.btc_amount,
        secret: updates.secret,
        error_message: updates.error_message,
        timeout_block: updates.timeout_block,
        current_confirmations: updates.current_confirmations,
        updated_at: new Date()
      })
      .eq('htlc_hash', htlc_hash);
      
    if (error) throw error;
  }
  
  async transitionState(htlc_hash: string, newState: SwapState): Promise<void> {
    const currentSwap = await this.getSwapState(htlc_hash);
    if (!currentSwap) throw new Error('Swap not found');
    
    // Validate state transition
    if (!this.isValidTransition(currentSwap.state, newState)) {
      throw new Error(`Invalid state transition from ${currentSwap.state} to ${newState}`);
    }
    
    await this.updateSwapState(htlc_hash, { state: newState });
  }
  
  private isValidTransition(from: SwapState, to: SwapState): boolean {
    const validTransitions: Record<SwapState, SwapState[]> = {
      [SwapState.CREATED]: [SwapState.WAITING_FOR_DEPOSIT, SwapState.SWAP_FAILED],
      [SwapState.WAITING_FOR_DEPOSIT]: [SwapState.EVM_DEPOSIT_DETECTED, SwapState.SWAP_TIMEOUT],
      [SwapState.EVM_DEPOSIT_DETECTED]: [SwapState.EVM_DEPOSIT_CONFIRMED, SwapState.SWAP_FAILED],
      [SwapState.EVM_DEPOSIT_CONFIRMED]: [SwapState.BTC_HTLC_CREATED, SwapState.SWAP_FAILED],
      [SwapState.BTC_HTLC_CREATED]: [SwapState.BTC_DEPOSIT_DETECTED, SwapState.SWAP_TIMEOUT],
      [SwapState.BTC_DEPOSIT_DETECTED]: [SwapState.BTC_DEPOSIT_CONFIRMED, SwapState.SWAP_FAILED],
      [SwapState.BTC_DEPOSIT_CONFIRMED]: [SwapState.SECRET_REQUESTED, SwapState.SWAP_TIMEOUT],
      [SwapState.SECRET_REQUESTED]: [SwapState.SECRET_REVEALED, SwapState.SWAP_TIMEOUT],
      [SwapState.SECRET_REVEALED]: [SwapState.SWAP_COMPLETED, SwapState.SWAP_FAILED],
      [SwapState.SWAP_COMPLETED]: [],
      [SwapState.SWAP_FAILED]: [],
      [SwapState.SWAP_TIMEOUT]: [SwapState.SWAP_RECLAIMED],
      [SwapState.SWAP_RECLAIMED]: []
    };
    
    return validTransitions[from]?.includes(to) || false;
  }
  
  // Monitor and process swaps
  async processSwap(htlc_hash: string): Promise<void> {
    const swap = await this.getSwapState(htlc_hash);
    if (!swap) throw new Error('Swap not found');
    
    try {
      switch (swap.state) {
        case SwapState.BTC_HTLC_CREATED:
          await this.monitorBitcoinHTLC(swap);
          break;
          
        case SwapState.BTC_DEPOSIT_DETECTED:
          await this.checkBitcoinConfirmations(swap);
          break;
          
        case SwapState.SECRET_REVEALED:
          await this.completeBitcoinRedemption(swap);
          break;
          
        case SwapState.SWAP_TIMEOUT:
          await this.reclaimBitcoinHTLC(swap);
          break;
          
        default:
          // Handle other states as needed
          break;
      }
    } catch (error) {
      console.error(`Error processing swap ${htlc_hash}:`, error);
      await this.updateSwapState(htlc_hash, {
        state: SwapState.SWAP_FAILED,
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  private async monitorBitcoinHTLC(swap: SwapStateData): Promise<void> {
    if (!swap.btc_htlc_address) return;
    
    const status = await monitorHTLC(swap.btc_htlc_address);
    
    if (status.funded && status.amount && status.txid) {
      await this.updateSwapState(swap.htlc_hash, {
        state: SwapState.BTC_DEPOSIT_DETECTED,
        btc_tx_id: status.txid,
        btc_amount: status.amount,
        current_confirmations: status.confirmations
      });
    }
  }
  
  private async checkBitcoinConfirmations(swap: SwapStateData): Promise<void> {
    if (!swap.btc_htlc_address) return;
    
    const status = await monitorHTLC(swap.btc_htlc_address);
    
    await this.updateSwapState(swap.htlc_hash, {
      current_confirmations: status.confirmations
    });
    
    if (status.confirmations >= swap.confirmations_required) {
      await this.transitionState(swap.htlc_hash, SwapState.BTC_DEPOSIT_CONFIRMED);
    }
  }
  
  private async completeBitcoinRedemption(swap: SwapStateData): Promise<void> {
    if (!swap.btc_htlc_address || !swap.btc_htlc_script || !swap.secret) {
      throw new Error('Missing required data for Bitcoin redemption');
    }
    
    // This would be called by the resolver to claim their Bitcoin
    const recipientAddress = process.env.RESOLVER_BITCOIN_ADDRESS!;
    const privateKey = process.env.BITCOIN_PRIVATE_KEY!;
    
    const txId = await redeemHTLC({
      htlcAddress: swap.btc_htlc_address,
      htlcScript: Buffer.from(swap.btc_htlc_script, 'hex'),
      secret: Buffer.from(swap.secret, 'hex'),
      recipientAddress,
      privateKey
    });
    
    await this.updateSwapState(swap.htlc_hash, {
      state: SwapState.SWAP_COMPLETED,
      btc_tx_id: txId
    });
  }
  
  private async reclaimBitcoinHTLC(swap: SwapStateData): Promise<void> {
    if (!swap.btc_htlc_address || !swap.btc_htlc_script) {
      throw new Error('Missing required data for Bitcoin reclaim');
    }
    
    const currentHeight = await getCurrentBlockHeight();
    if (!swap.timeout_block || currentHeight < swap.timeout_block) {
      throw new Error('Timeout not reached yet');
    }
    
    const resolverAddress = process.env.RESOLVER_BITCOIN_ADDRESS!;
    const privateKey = process.env.BITCOIN_PRIVATE_KEY!;
    
    const txId = await reclaimHTLC(
      swap.btc_htlc_address,
      Buffer.from(swap.btc_htlc_script, 'hex'),
      resolverAddress,
      privateKey,
      currentHeight
    );
    
    await this.updateSwapState(swap.htlc_hash, {
      state: SwapState.SWAP_RECLAIMED,
      btc_tx_id: txId
    });
  }
  
  // Check all active swaps for timeouts
  async checkTimeouts(): Promise<void> {
    const activeStates = [
      SwapState.WAITING_FOR_DEPOSIT,
      SwapState.BTC_HTLC_CREATED,
      SwapState.BTC_DEPOSIT_DETECTED,
      SwapState.SECRET_REQUESTED
    ];
    
    const { data: activeSwaps } = await this.supabase
      .from('swaps')
      .select('*')
      .in('state', activeStates);
      
    if (!activeSwaps) return;
    
    const currentTime = new Date();
    const TIMEOUT_MINUTES = 30; // 30 minute timeout
    
    for (const swap of activeSwaps) {
      const swapAge = (currentTime.getTime() - new Date(swap.created_at).getTime()) / 1000 / 60;
      
      if (swapAge > TIMEOUT_MINUTES) {
        await this.transitionState(swap.htlc_hash, SwapState.SWAP_TIMEOUT);
      }
    }
  }
}