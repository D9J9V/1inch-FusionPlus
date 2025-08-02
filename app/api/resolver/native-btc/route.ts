import { NextRequest, NextResponse } from 'next/server';
import * as bitcoin from 'bitcoinjs-lib';
import { crypto } from 'bitcoinjs-lib';
import { ECPairFactory } from 'ecpair';
import * as ecc from 'tiny-secp256k1';

const ECPair = ECPairFactory(ecc);

// Network configuration
const BITCOIN_NETWORK = process.env.BITCOIN_NETWORK === 'mainnet' 
  ? bitcoin.networks.bitcoin 
  : bitcoin.networks.testnet;

const BITCOIN_RPC_URL = process.env.BITCOIN_RPC_URL || 'https://blockstream.info/testnet/api';
const RESOLVER_BITCOIN_PRIVATE_KEY = process.env.BITCOIN_PRIVATE_KEY;

// Resolver's key pair - initialized once
let RESOLVER_KEYPAIR: any = null;
let RESOLVER_PUBKEY_HASH: Buffer | null = null;

function getResolverKeyPair() {
  if (!RESOLVER_KEYPAIR && RESOLVER_BITCOIN_PRIVATE_KEY) {
    RESOLVER_KEYPAIR = ECPair.fromPrivateKey(
      Buffer.from(RESOLVER_BITCOIN_PRIVATE_KEY.replace('0x', ''), 'hex'),
      { network: BITCOIN_NETWORK }
    );
    // Extract public key hash for the resolver
    const p2pkh = bitcoin.payments.p2pkh({
      pubkey: RESOLVER_KEYPAIR.publicKey,
      network: BITCOIN_NETWORK
    });
    RESOLVER_PUBKEY_HASH = p2pkh.hash!;
  }
  return { keyPair: RESOLVER_KEYPAIR, pubKeyHash: RESOLVER_PUBKEY_HASH };
}

interface HTLCRequest {
  htlc_hash: string;
  amount: number; // in satoshis
  recipient_address: string;
  timeout_blocks: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: HTLCRequest = await request.json();
    const { htlc_hash, amount, recipient_address, timeout_blocks } = body;
    
    // Validate inputs
    if (!htlc_hash || !amount || !recipient_address || !timeout_blocks) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Get resolver's Bitcoin key pair
    const { keyPair, pubKeyHash } = getResolverKeyPair();
    
    if (!keyPair || !pubKeyHash) {
      throw new Error('Bitcoin private key not configured');
    }
    
    // Create the HTLC script
    const htlcScript = createHTLCScript(
      Buffer.from(htlc_hash.slice(2), 'hex'), // Remove '0x' prefix
      recipient_address,
      timeout_blocks,
      pubKeyHash // Pass resolver's pubkey hash
    );
    
    // Create P2SH address from the script
    const p2sh = bitcoin.payments.p2sh({
      redeem: { output: htlcScript },
      network: BITCOIN_NETWORK
    });
    
    if (!p2sh.address) {
      throw new Error('Failed to generate P2SH address');
    }
    
    const resolverAddress = bitcoin.payments.p2wpkh({
      pubkey: keyPair.publicKey,
      network: BITCOIN_NETWORK
    });
    
    // Fetch UTXOs for the resolver's address
    const utxos = await fetchUTXOs(resolverAddress.address!);
    
    if (utxos.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No UTXOs available. Please fund the resolver address: ' + resolverAddress.address
      }, { status: 400 });
    }
    
    // Build and sign transaction
    const psbt = new bitcoin.Psbt({ network: BITCOIN_NETWORK });
    
    let totalInput = 0;
    for (const utxo of utxos) {
      psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        witnessUtxo: {
          script: resolverAddress.output!,
          value: utxo.value
        }
      });
      totalInput += utxo.value;
      if (totalInput >= amount + 1000) break; // 1000 sats for fee
    }
    
    // Add HTLC output
    psbt.addOutput({
      address: p2sh.address!,
      value: amount
    });
    
    // Add change output if needed
    const fee = 1000; // Simple fixed fee
    const change = totalInput - amount - fee;
    if (change > 546) { // Dust limit
      psbt.addOutput({
        address: resolverAddress.address!,
        value: change
      });
    }
    
    // Sign all inputs
    for (let i = 0; i < psbt.inputCount; i++) {
      psbt.signInput(i, keyPair);
    }
    
    psbt.finalizeAllInputs();
    const tx = psbt.extractTransaction();
    const txHex = tx.toHex();
    
    // Broadcast transaction
    const txId = await broadcastTransaction(txHex);
    
    return NextResponse.json({
      success: true,
      htlc_address: p2sh.address,
      htlc_script: htlcScript.toString('hex'),
      amount: amount,
      tx_id: txId,
      message: 'HTLC transaction broadcast successfully'
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
  timeoutBlocks: number,
  resolverPubKeyHash: Buffer
): Buffer {
  // Decode recipient address to get public key hash
  const recipientOutput = bitcoin.address.toOutputScript(
    recipientAddress,
    BITCOIN_NETWORK
  );
  
  // Extract pubkey hash based on address type
  let recipientPubKeyHash: Buffer;
  if (recipientOutput[0] === 0x76 && recipientOutput[1] === 0xa9) {
    // P2PKH: OP_DUP OP_HASH160 <20 bytes> OP_EQUALVERIFY OP_CHECKSIG
    recipientPubKeyHash = recipientOutput.slice(3, 23);
  } else if (recipientOutput[0] === 0x00 && recipientOutput[1] === 0x14) {
    // P2WPKH: OP_0 <20 bytes>
    recipientPubKeyHash = recipientOutput.slice(2, 22);
  } else {
    throw new Error('Unsupported recipient address type');
  }
  
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
      recipientPubKeyHash,
      opcodes.OP_EQUALVERIFY,
      opcodes.OP_CHECKSIG,
    opcodes.OP_ELSE,
      bitcoin.script.number.encode(timeoutBlocks),
      opcodes.OP_CHECKLOCKTIMEVERIFY,
      opcodes.OP_DROP,
      opcodes.OP_DUP,
      opcodes.OP_HASH160,
      resolverPubKeyHash,
      opcodes.OP_EQUALVERIFY,
      opcodes.OP_CHECKSIG,
    opcodes.OP_ENDIF
  ]);
}

async function fetchUTXOs(address: string): Promise<any[]> {
  try {
    const response = await fetch(`${BITCOIN_RPC_URL}/address/${address}/utxo`);
    if (!response.ok) {
      throw new Error('Failed to fetch UTXOs');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching UTXOs:', error);
    return [];
  }
}

async function broadcastTransaction(txHex: string): Promise<string> {
  try {
    const response = await fetch(`${BITCOIN_RPC_URL}/tx`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: txHex
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to broadcast transaction: ${error}`);
    }
    
    return await response.text();
  } catch (error) {
    console.error('Error broadcasting transaction:', error);
    throw error;
  }
}