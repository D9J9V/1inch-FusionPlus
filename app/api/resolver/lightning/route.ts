import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { authenticatedLndGrpc, createHodlInvoice, settleHodlInvoice, getInvoice } from 'ln-service';

// Lightning node configuration
const LND_CONFIG = {
  cert: process.env.LND_CERT,
  macaroon: process.env.LND_MACAROON,
  socket: process.env.LND_HOST || 'localhost:10009'
};

interface LightningHTLCRequest {
  htlc_hash: string;
  amount_sats: number;
  description?: string;
  expiry_seconds?: number;
}

interface HODLInvoice {
  payment_request: string;
  payment_hash: string;
  expires_at: number;
  amount_sats: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: LightningHTLCRequest = await request.json();
    const { htlc_hash, amount_sats, description = 'Cross-chain swap', expiry_seconds = 3600 } = body;
    
    // Validate inputs
    if (!htlc_hash || !amount_sats) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Connect to LND node
    const { lnd } = await getLndConnection();
    
    // Create HODL invoice with the provided hash
    try {
      const invoice = await createHodlInvoice({
        lnd,
        id: htlc_hash.replace('0x', ''), // Remove 0x prefix
        tokens: amount_sats,
        description,
        expires_at: new Date(Date.now() + expiry_seconds * 1000).toISOString()
      });
      
      const hodlInvoice: HODLInvoice = {
        payment_request: invoice.request,
        payment_hash: htlc_hash,
        expires_at: Math.floor(Date.now() / 1000) + expiry_seconds,
        amount_sats
      };
    
      // Store invoice details (in production, this would be in a database)
      // This allows the resolver to track and settle the invoice when the secret is revealed
      
      return NextResponse.json({
        success: true,
        invoice: hodlInvoice,
        message: 'HODL invoice created successfully'
      });
    } catch (error: any) {
      console.error('Error creating HODL invoice:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to create HODL invoice' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in Lightning handler:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

// GET endpoint to check invoice status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentHash = searchParams.get('paymentHash');
    
    if (!paymentHash) {
      return NextResponse.json(
        { success: false, error: 'Payment hash required' },
        { status: 400 }
      );
    }
    
    // Connect to LND node
    const { lnd } = await getLndConnection();
    
    try {
      const invoice = await getInvoice({
        lnd,
        id: paymentHash.replace('0x', '')
      });
      
      let status = 'pending';
      if (invoice.is_confirmed) {
        status = 'settled';
      } else if (invoice.is_canceled) {
        status = 'cancelled';
      } else if (new Date(invoice.expires_at) < new Date()) {
        status = 'expired';
      }
      
      return NextResponse.json({
        success: true,
        status,
        paymentHash,
        settledAt: invoice.confirmed_at || null,
        preimage: invoice.secret || null
      });
    } catch (error: any) {
      console.error('Error checking invoice status:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to check invoice status' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error checking invoice status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check invoice status' },
      { status: 500 }
    );
  }
}

async function getLndConnection() {
  if (!LND_CONFIG.cert || !LND_CONFIG.macaroon) {
    throw new Error('Lightning node configuration missing. Please set LND_CERT and LND_MACAROON environment variables.');
  }
  
  try {
    const { lnd } = authenticatedLndGrpc({
      cert: LND_CONFIG.cert,
      macaroon: LND_CONFIG.macaroon,
      socket: LND_CONFIG.socket
    });
    
    return { lnd };
  } catch (error) {
    console.error('Failed to connect to LND:', error);
    throw new Error('Failed to connect to Lightning node');
  }
}

// Additional endpoint to settle HODL invoice when secret is revealed
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentHash, preimage } = body;
    
    if (!paymentHash || !preimage) {
      return NextResponse.json(
        { success: false, error: 'Payment hash and preimage required' },
        { status: 400 }
      );
    }
    
    // Verify that sha256(preimage) === paymentHash
    const calculatedHash = createHash('sha256')
      .update(Buffer.from(preimage.slice(2), 'hex'))
      .digest('hex');
    
    if (`0x${calculatedHash}` !== paymentHash) {
      return NextResponse.json(
        { success: false, error: 'Invalid preimage' },
        { status: 400 }
      );
    }
    
    // Connect to LND node
    const { lnd } = await getLndConnection();
    
    try {
      // Settle the HODL invoice with the preimage
      await settleHodlInvoice({
        lnd,
        secret: preimage.replace('0x', '')
      });
      
      return NextResponse.json({
        success: true,
        message: 'HODL invoice settled',
        paymentHash,
        preimage,
        settledAt: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Error settling HODL invoice:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to settle invoice' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error settling HODL invoice:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to settle invoice' },
      { status: 500 }
    );
  }
}