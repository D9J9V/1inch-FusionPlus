-- Complete database schema for Polaris cross-chain swaps
-- This migration combines all necessary tables and fields

-- Create the main swaps table
CREATE TABLE IF NOT EXISTS swaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core swap identifiers
  htlc_hash TEXT UNIQUE NOT NULL,
  secret TEXT NOT NULL, -- The actual secret (preimage) - stored securely
  secret_hash TEXT NOT NULL, -- SHA256(secret) for verification
  
  -- User and network information
  user_address TEXT NOT NULL,
  from_chain TEXT NOT NULL, -- 'ethereum', 'base', 'arbitrum', etc.
  to_chain TEXT NOT NULL, -- 'bitcoin', 'lightning'
  swap_type TEXT NOT NULL CHECK (swap_type IN ('native', 'lightning')),
  
  -- Token information
  from_token TEXT NOT NULL, -- Token address on source chain
  to_token TEXT NOT NULL, -- BTC address or LN invoice
  amount TEXT NOT NULL, -- Amount in smallest unit (wei/sats)
  
  -- State machine
  state TEXT NOT NULL DEFAULT 'created' CHECK (state IN (
    'created',
    'waiting_for_deposit',
    'evm_deposit_detected',
    'evm_deposit_confirmed',
    'btc_htlc_created',
    'btc_deposit_detected',
    'btc_deposit_confirmed',
    'secret_requested',
    'secret_revealed',
    'swap_completed',
    'swap_failed',
    'swap_timeout',
    'swap_reclaimed'
  )),
  
  -- EVM side data
  evm_chain_id INTEGER,
  evm_tx_hash TEXT,
  evm_escrow_address TEXT,
  evm_block_number INTEGER,
  
  -- Bitcoin side data
  btc_htlc_address TEXT,
  btc_htlc_script TEXT,
  btc_tx_id TEXT,
  btc_amount BIGINT, -- Amount in satoshis
  btc_block_height INTEGER,
  
  -- Lightning specific data
  lightning_invoice TEXT,
  lightning_payment_hash TEXT,
  lightning_preimage TEXT,
  
  -- Security and verification
  secret_revealed_at TIMESTAMPTZ,
  secret_revealed_to TEXT, -- Address that received the secret
  claim_tx_hash TEXT, -- Transaction that claimed the funds
  
  -- Timeout and confirmation tracking
  timeout_block INTEGER,
  timeout_timestamp TIMESTAMPTZ,
  confirmations_required INTEGER DEFAULT 3,
  current_confirmations INTEGER DEFAULT 0,
  
  -- Error tracking
  error_message TEXT,
  error_details JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_swaps_htlc_hash ON swaps(htlc_hash);
CREATE INDEX IF NOT EXISTS idx_swaps_state ON swaps(state);
CREATE INDEX IF NOT EXISTS idx_swaps_user_address ON swaps(user_address);
CREATE INDEX IF NOT EXISTS idx_swaps_created_at ON swaps(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_swaps_secret_hash ON swaps(secret_hash);
CREATE INDEX IF NOT EXISTS idx_swaps_evm_tx_hash ON swaps(evm_tx_hash);
CREATE INDEX IF NOT EXISTS idx_swaps_btc_tx_id ON swaps(btc_tx_id);

-- Create swap events table for audit trail
CREATE TABLE IF NOT EXISTS swap_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swap_id UUID NOT NULL REFERENCES swaps(id) ON DELETE CASCADE,
  htlc_hash TEXT NOT NULL,
  event_type TEXT NOT NULL,
  from_state TEXT,
  to_state TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_swap_events_swap_id ON swap_events(swap_id);
CREATE INDEX IF NOT EXISTS idx_swap_events_htlc_hash ON swap_events(htlc_hash);
CREATE INDEX IF NOT EXISTS idx_swap_events_created_at ON swap_events(created_at DESC);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_swaps_updated_at ON swaps;
CREATE TRIGGER update_swaps_updated_at 
  BEFORE UPDATE ON swaps
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Function to log state transitions
CREATE OR REPLACE FUNCTION log_state_transition()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.state IS DISTINCT FROM NEW.state THEN
        INSERT INTO swap_events (swap_id, htlc_hash, event_type, from_state, to_state, details)
        VALUES (
            NEW.id,
            NEW.htlc_hash,
            'state_change',
            OLD.state,
            NEW.state,
            jsonb_build_object(
                'timestamp', NOW(),
                'old_record', to_jsonb(OLD),
                'new_record', to_jsonb(NEW)
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Create trigger for state change logging
DROP TRIGGER IF EXISTS log_swap_state_changes ON swaps;
CREATE TRIGGER log_swap_state_changes
  AFTER UPDATE ON swaps
  FOR EACH ROW
  EXECUTE FUNCTION log_state_transition();

-- Row Level Security (RLS) policies
ALTER TABLE swaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE swap_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own swaps
CREATE POLICY "Users can view own swaps" ON swaps
  FOR SELECT
  USING (auth.uid()::TEXT = user_address OR auth.role() = 'service_role');

-- Policy: Only service role can insert swaps
CREATE POLICY "Service role can insert swaps" ON swaps
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Policy: Only service role can update swaps
CREATE POLICY "Service role can update swaps" ON swaps
  FOR UPDATE
  USING (auth.role() = 'service_role');

-- Policy: Only service role can delete swaps
CREATE POLICY "Service role can delete swaps" ON swaps
  FOR DELETE
  USING (auth.role() = 'service_role');

-- Policy: Users can view events for their swaps
CREATE POLICY "Users can view own swap events" ON swap_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM swaps 
      WHERE swaps.id = swap_events.swap_id 
      AND (swaps.user_address = auth.uid()::TEXT OR auth.role() = 'service_role')
    )
  );

-- Policy: Only service role can insert events
CREATE POLICY "Service role can insert events" ON swap_events
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Add comments for documentation
COMMENT ON TABLE swaps IS 'Main table storing cross-chain swap information';
COMMENT ON TABLE swap_events IS 'Audit trail of all state changes and events for swaps';
COMMENT ON COLUMN swaps.secret IS 'The actual secret/preimage - must be kept secure and only revealed when conditions are met';
COMMENT ON COLUMN swaps.secret_hash IS 'SHA256 hash of the secret, used as the HTLC hash';
COMMENT ON COLUMN swaps.state IS 'Current state of the swap in the state machine';

-- Drop old tables if they exist (be careful with this in production!)
DROP TABLE IF EXISTS orders CASCADE;

-- Grant necessary permissions
GRANT ALL ON swaps TO service_role;
GRANT ALL ON swap_events TO service_role;
GRANT SELECT ON swaps TO authenticated;
GRANT SELECT ON swap_events TO authenticated;