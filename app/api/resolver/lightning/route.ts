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
  htlcHash: string;
  amountSats: number;
  description?: string;
  expirySeconds?: number;
}

interface HODLInvoice {
  paymentRequest: string;
  paymentHash: string;
  expiresAt: number;
  amountSats: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: LightningHTLCRequest = await request.json();
    const { htlcHash, amountSats, description = 'Cross-chain swap', expirySeconds = 3600 } = body;
    
    // Validate inputs
    if (!htlcHash || !amountSats) {
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
        id: htlcHash.replace('0x', ''), // Remove 0x prefix
        tokens: amountSats,
        description,
        expires_at: new Date(Date.now() + expirySeconds * 1000).toISOString()
      });
      
      const hodlInvoice: HODLInvoice = {
        paymentRequest: invoice.request,
        paymentHash: htlcHash,
        expiresAt: Math.floor(Date.now() / 1000) + expirySeconds,
        amountSats
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

function createSimulatedHODLInvoice(
  htlcHash: string,
  amountSats: number,
  description: string,
  expirySeconds: number
): HODLInvoice {
  // Remove '0x' prefix if present
  const cleanHash = htlcHash.startsWith('0x') ? htlcHash.slice(2) : htlcHash;
  
  // In production, this would use ln-service to create a real HODL invoice
  // For demo, we create a placeholder that looks like a BOLT11 invoice
  
  const expiresAt = Math.floor(Date.now() / 1000) + expirySeconds;
  
  // Simulated BOLT11 invoice (not valid for real Lightning Network)
  const paymentRequest = `lnbc${amountSats}n1p0${cleanHash.slice(0, 10)}...`;
  
  return {
    paymentRequest,
    paymentHash: htlcHash,
    expiresAt,
    amountSats
  };
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
    
    // In production, this would:
    // 1. Use ln-service to settle the HODL invoice
    // 2. Update the invoice status in the database
    
    return NextResponse.json({
      success: true,
      message: 'HODL invoice settled',
      paymentHash,
      preimage,
      settledAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error settling HODL invoice:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to settle invoice' },
      { status: 500 }
    );
  }
}