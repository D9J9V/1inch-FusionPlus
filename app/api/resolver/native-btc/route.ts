import { NextRequest, NextResponse } from 'next/server';
import * as bitcoin from 'bitcoinjs-lib';
import { crypto } from 'bitcoinjs-lib';

// This would typically be environment variables
const BITCOIN_NETWORK = process.env.BITCOIN_NETWORK === 'mainnet' 
  ? bitcoin.networks.bitcoin 
  : bitcoin.networks.testnet;

interface HTLCRequest {
  htlcHash: string;
  amount: number; // in satoshis
  recipientAddress: string;
  timeoutBlocks: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: HTLCRequest = await request.json();
    const { htlcHash, amount, recipientAddress, timeoutBlocks } = body;
    
    // Validate inputs
    if (!htlcHash || !amount || !recipientAddress || !timeoutBlocks) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Create the HTLC script
    const htlcScript = createHTLCScript(
      Buffer.from(htlcHash.slice(2), 'hex'), // Remove '0x' prefix
      recipientAddress,
      timeoutBlocks
    );
    
    // Create P2SH address from the script
    const p2sh = bitcoin.payments.p2sh({
      redeem: { output: htlcScript },
      network: BITCOIN_NETWORK
    });
    
    if (!p2sh.address) {
      throw new Error('Failed to generate P2SH address');
    }
    
    // In a real implementation, this would:
    // 1. Create and sign a Bitcoin transaction sending funds to the P2SH address
    // 2. Broadcast the transaction to the Bitcoin network
    // 3. Return the transaction ID
    
    return NextResponse.json({
      success: true,
      htlcAddress: p2sh.address,
      htlcScript: htlcScript.toString('hex'),
      amount: amount,
      message: 'HTLC created (transaction broadcast not implemented in demo)'
    });
  } catch (error) {
    console.error('Error creating Bitcoin HTLC:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create HTLC' },
      { status: 500 }
    );
  }
}

function createHTLCScript(
  htlcHash: Buffer,
  recipientAddress: string,
  timeoutBlocks: number
): Buffer {
  // Decode recipient address to get public key hash
  const recipientPubKeyHash = bitcoin.address.toOutputScript(
    recipientAddress,
    BITCOIN_NETWORK
  );
  
  // Build HTLC script
  // IF
  //   SHA256 <htlcHash> EQUALVERIFY
  //   DUP HASH160 <recipientPubKeyHash> EQUALVERIFY CHECKSIG
  // ELSE
  //   <timeoutBlocks> CHECKLOCKTIMEVERIFY DROP
  //   DUP HASH160 <resolverPubKeyHash> EQUALVERIFY CHECKSIG
  // ENDIF
  
  const opcodes = bitcoin.script.OPS;
  
  return bitcoin.script.compile([
    opcodes.OP_IF,
      opcodes.OP_SHA256,
      htlcHash,
      opcodes.OP_EQUALVERIFY,
      opcodes.OP_DUP,
      opcodes.OP_HASH160,
      recipientPubKeyHash.slice(3, 23), // Extract pubkey hash from P2PKH script
      opcodes.OP_EQUALVERIFY,
      opcodes.OP_CHECKSIG,
    opcodes.OP_ELSE,
      bitcoin.script.number.encode(timeoutBlocks),
      opcodes.OP_CHECKLOCKTIMEVERIFY,
      opcodes.OP_DROP,
      opcodes.OP_DUP,
      opcodes.OP_HASH160,
      // In production, this would be the resolver's pubkey hash
      Buffer.from('0000000000000000000000000000000000000000', 'hex'),
      opcodes.OP_EQUALVERIFY,
      opcodes.OP_CHECKSIG,
    opcodes.OP_ENDIF
  ]);
}