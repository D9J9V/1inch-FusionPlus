import * as bitcoin from 'bitcoinjs-lib';
import { ECPairFactory } from 'ecpair';
import * as ecc from 'tiny-secp256k1';

const ECPair = ECPairFactory(ecc);

const BITCOIN_NETWORK = process.env.BITCOIN_NETWORK === 'mainnet' 
  ? bitcoin.networks.bitcoin 
  : bitcoin.networks.testnet;

const BITCOIN_RPC_URL = process.env.BITCOIN_RPC_URL || 'https://blockstream.info/testnet/api';

interface HTLCMonitorResult {
  funded: boolean;
  confirmations: number;
  amount?: number;
  txid?: string;
  vout?: number;
}

interface RedeemHTLCParams {
  htlcAddress: string;
  htlcScript: Buffer;
  secret: Buffer;
  recipientAddress: string;
  privateKey: string;
}

export async function monitorHTLC(htlcAddress: string): Promise<HTLCMonitorResult> {
  try {
    // Fetch UTXOs for the HTLC address
    const response = await fetch(`${BITCOIN_RPC_URL}/address/${htlcAddress}/utxo`);
    if (!response.ok) {
      return { funded: false, confirmations: 0 };
    }
    
    const utxos = await response.json();
    if (utxos.length === 0) {
      return { funded: false, confirmations: 0 };
    }
    
    // Get the UTXO with most confirmations
    const bestUtxo = utxos.reduce((best: any, current: any) => 
      current.status.confirmed && (!best || current.status.block_height < best.status.block_height) 
        ? current : best
    , null);
    
    if (!bestUtxo) {
      return { funded: false, confirmations: 0 };
    }
    
    // Get current block height for confirmation calculation
    const statsResponse = await fetch(`${BITCOIN_RPC_URL}/blocks/tip/height`);
    const currentHeight = parseInt(await statsResponse.text());
    const confirmations = bestUtxo.status.confirmed 
      ? currentHeight - bestUtxo.status.block_height + 1 
      : 0;
    
    return {
      funded: true,
      confirmations,
      amount: bestUtxo.value,
      txid: bestUtxo.txid,
      vout: bestUtxo.vout
    };
  } catch (error) {
    console.error('Error monitoring HTLC:', error);
    return { funded: false, confirmations: 0 };
  }
}

export async function redeemHTLC(params: RedeemHTLCParams): Promise<string> {
  const { htlcAddress, htlcScript, secret, recipientAddress, privateKey } = params;
  
  // Monitor HTLC to get funding details
  const htlcStatus = await monitorHTLC(htlcAddress);
  if (!htlcStatus.funded || !htlcStatus.txid || htlcStatus.vout === undefined) {
    throw new Error('HTLC not funded');
  }
  
  // Create key pair from private key
  const keyPair = ECPair.fromPrivateKey(
    Buffer.from(privateKey.replace('0x', ''), 'hex'),
    { network: BITCOIN_NETWORK }
  );
  
  // Create the transaction
  const psbt = new bitcoin.Psbt({ network: BITCOIN_NETWORK });
  
  // Fetch the full transaction to get the witness script
  const txResponse = await fetch(`${BITCOIN_RPC_URL}/tx/${htlcStatus.txid}/hex`);
  const txHex = await txResponse.text();
  const fundingTx = bitcoin.Transaction.fromHex(txHex);
  
  // Add the HTLC input
  psbt.addInput({
    hash: htlcStatus.txid,
    index: htlcStatus.vout,
    sequence: 0xfffffffe, // Enable RBF
    witnessUtxo: {
      script: fundingTx.outs[htlcStatus.vout].script,
      value: htlcStatus.amount!
    },
    redeemScript: htlcScript
  });
  
  // Calculate fee (conservative estimate)
  const estimatedSize = 300; // bytes for a P2SH redemption
  const feeRate = 10; // sats/byte
  const fee = estimatedSize * feeRate;
  
  // Add output to recipient
  const outputValue = htlcStatus.amount! - fee;
  if (outputValue < 546) { // Dust limit
    throw new Error('Output would be below dust limit after fees');
  }
  
  psbt.addOutput({
    address: recipientAddress,
    value: outputValue
  });
  
  // Sign the input with custom sighash
  const sighash = bitcoin.Transaction.SIGHASH_ALL;
  psbt.signInput(0, keyPair, [sighash]);
  
  // Manually construct the witness script for HTLC redemption
  const signature = psbt.data.inputs[0].partialSig![0].signature;
  const publicKey = keyPair.publicKey;
  
  // Build the script witness for successful redemption (with secret)
  const witnessScript = bitcoin.script.compile([
    signature,
    publicKey,
    secret,
    bitcoin.opcodes.OP_TRUE, // Select the IF branch
    htlcScript
  ]);
  
  // Update the input with the witness
  psbt.updateInput(0, {
    finalScriptSig: witnessScript
  });
  
  // Extract and broadcast the transaction
  const tx = psbt.extractTransaction();
  const broadcastResponse = await fetch(`${BITCOIN_RPC_URL}/tx`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: tx.toHex()
  });
  
  if (!broadcastResponse.ok) {
    const error = await broadcastResponse.text();
    throw new Error(`Failed to broadcast redemption: ${error}`);
  }
  
  return await broadcastResponse.text();
}

export async function reclaimHTLC(
  htlcAddress: string,
  htlcScript: Buffer,
  resolverAddress: string,
  resolverPrivateKey: string,
  currentBlockHeight: number
): Promise<string> {
  // Similar to redeemHTLC but uses the ELSE branch (timeout path)
  const htlcStatus = await monitorHTLC(htlcAddress);
  if (!htlcStatus.funded || !htlcStatus.txid || htlcStatus.vout === undefined) {
    throw new Error('HTLC not funded');
  }
  
  const keyPair = ECPair.fromPrivateKey(
    Buffer.from(resolverPrivateKey.replace('0x', ''), 'hex'),
    { network: BITCOIN_NETWORK }
  );
  
  const psbt = new bitcoin.Psbt({ network: BITCOIN_NETWORK });
  
  // Fetch the funding transaction
  const txResponse = await fetch(`${BITCOIN_RPC_URL}/tx/${htlcStatus.txid}/hex`);
  const txHex = await txResponse.text();
  const fundingTx = bitcoin.Transaction.fromHex(txHex);
  
  psbt.addInput({
    hash: htlcStatus.txid,
    index: htlcStatus.vout,
    sequence: 0xfffffffe,
    witnessUtxo: {
      script: fundingTx.outs[htlcStatus.vout].script,
      value: htlcStatus.amount!
    },
    redeemScript: htlcScript,
    locktime: currentBlockHeight // Set locktime for CLTV
  });
  
  // Calculate fee and add output
  const fee = 300 * 10; // 300 bytes * 10 sats/byte
  const outputValue = htlcStatus.amount! - fee;
  
  psbt.addOutput({
    address: resolverAddress,
    value: outputValue
  });
  
  // Set transaction locktime
  psbt.setLocktime(currentBlockHeight);
  
  // Sign the input
  psbt.signInput(0, keyPair);
  
  // Build witness for timeout path
  const signature = psbt.data.inputs[0].partialSig![0].signature;
  const publicKey = keyPair.publicKey;
  
  const witnessScript = bitcoin.script.compile([
    signature,
    publicKey,
    bitcoin.opcodes.OP_FALSE, // Select the ELSE branch
    htlcScript
  ]);
  
  psbt.updateInput(0, {
    finalScriptSig: witnessScript
  });
  
  const tx = psbt.extractTransaction();
  const broadcastResponse = await fetch(`${BITCOIN_RPC_URL}/tx`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: tx.toHex()
  });
  
  if (!broadcastResponse.ok) {
    const error = await broadcastResponse.text();
    throw new Error(`Failed to broadcast reclaim: ${error}`);
  }
  
  return await broadcastResponse.text();
}

// Get current Bitcoin block height
export async function getCurrentBlockHeight(): Promise<number> {
  try {
    const response = await fetch(`${BITCOIN_RPC_URL}/blocks/tip/height`);
    return parseInt(await response.text());
  } catch (error) {
    console.error('Error fetching block height:', error);
    throw error;
  }
}