import * as bitcoin from 'bitcoinjs-lib';
import { crypto } from 'bitcoinjs-lib';

const BITCOIN_NETWORK = process.env.BITCOIN_NETWORK === 'mainnet' 
  ? bitcoin.networks.bitcoin 
  : bitcoin.networks.testnet;

interface PartialFillConfig {
  masterHash: Buffer;
  secretHashes: Buffer[];
  amounts: number[];
  recipientPubKeyHash: Buffer;
  resolverPubKeyHash: Buffer;
  timeoutBlocks: number;
}

/**
 * Creates a Bitcoin script that supports partial fills with multiple secrets
 * This uses a more complex script structure that validates against multiple possible secrets
 */
export function createPartialFillHTLCScript(config: PartialFillConfig): Buffer {
  const {
    masterHash,
    secretHashes,
    amounts,
    recipientPubKeyHash,
    resolverPubKeyHash,
    timeoutBlocks
  } = config;
  
  const opcodes = bitcoin.script.OPS;
  
  // Build the script that checks multiple secrets
  // The script structure:
  // OP_DEPTH OP_1 OP_EQUAL
  // OP_IF
  //   (timeout path)
  //   <timeoutBlocks> OP_CHECKLOCKTIMEVERIFY OP_DROP
  //   OP_DUP OP_HASH160 <resolverPubKeyHash> OP_EQUALVERIFY OP_CHECKSIG
  // OP_ELSE
  //   (secret paths)
  //   OP_DUP OP_SHA256
  //   For each secret:
  //     OP_DUP <secretHash> OP_EQUAL
  //     OP_IF
  //       OP_DROP
  //       <amount> OP_CHECKVALUE (custom opcode simulation)
  //       OP_DUP OP_HASH160 <recipientPubKeyHash> OP_EQUALVERIFY OP_CHECKSIG
  //       OP_RETURN
  //     OP_ENDIF
  //   OP_DROP OP_FALSE
  // OP_ENDIF
  
  const scriptElements: any[] = [];
  
  // Check if timeout path (1 item on stack) or secret path (2 items)
  scriptElements.push(
    opcodes.OP_DEPTH,
    opcodes.OP_1,
    opcodes.OP_EQUAL,
    opcodes.OP_IF,
      // Timeout path
      bitcoin.script.number.encode(timeoutBlocks),
      opcodes.OP_CHECKLOCKTIMEVERIFY,
      opcodes.OP_DROP,
      opcodes.OP_DUP,
      opcodes.OP_HASH160,
      resolverPubKeyHash,
      opcodes.OP_EQUALVERIFY,
      opcodes.OP_CHECKSIG,
    opcodes.OP_ELSE,
      // Secret paths
      opcodes.OP_DUP,
      opcodes.OP_SHA256
  );
  
  // Add checks for each secret
  secretHashes.forEach((secretHash, index) => {
    scriptElements.push(
      opcodes.OP_DUP,
      secretHash,
      opcodes.OP_EQUAL,
      opcodes.OP_IF,
        opcodes.OP_DROP,
        // Note: Bitcoin Script doesn't have OP_CHECKVALUE
        // In practice, this would need to be enforced off-chain
        // by the resolver only funding HTLCs with correct amounts
        opcodes.OP_DUP,
        opcodes.OP_HASH160,
        recipientPubKeyHash,
        opcodes.OP_EQUALVERIFY,
        opcodes.OP_CHECKSIG,
        opcodes.OP_RETURN,
      opcodes.OP_ENDIF
    );
  });
  
  scriptElements.push(
    opcodes.OP_DROP,
    opcodes.OP_FALSE,
    opcodes.OP_ENDIF
  );
  
  return bitcoin.script.compile(scriptElements);
}

/**
 * Creates multiple P2SH addresses for partial fills
 * Each address represents a portion of the total swap amount
 */
export function createPartialFillAddresses(
  masterHash: Buffer,
  secretHashes: Buffer[],
  amounts: number[],
  recipientPubKeyHash: Buffer,
  resolverPubKeyHash: Buffer,
  timeoutBlocks: number
): Array<{ address: string; amount: number; secretHash: Buffer; script: Buffer }> {
  
  return secretHashes.map((secretHash, index) => {
    // Create a simpler HTLC for each partial amount
    const script = createSingleSecretHTLC(
      secretHash,
      recipientPubKeyHash,
      resolverPubKeyHash,
      timeoutBlocks
    );
    
    const p2sh = bitcoin.payments.p2sh({
      redeem: { output: script },
      network: BITCOIN_NETWORK
    });
    
    return {
      address: p2sh.address!,
      amount: amounts[index],
      secretHash,
      script
    };
  });
}

/**
 * Creates a standard HTLC script for a single secret
 */
function createSingleSecretHTLC(
  secretHash: Buffer,
  recipientPubKeyHash: Buffer,
  resolverPubKeyHash: Buffer,
  timeoutBlocks: number
): Buffer {
  const opcodes = bitcoin.script.OPS;
  
  return bitcoin.script.compile([
    opcodes.OP_IF,
      opcodes.OP_SHA256,
      secretHash,
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

/**
 * Generates multiple secrets for partial fills
 */
export function generatePartialFillSecrets(count: number): Array<{ secret: Buffer; hash: Buffer }> {
  const secrets = [];
  
  for (let i = 0; i < count; i++) {
    const secret = crypto.randomBytes(32);
    const hash = crypto.sha256(secret);
    secrets.push({ secret, hash });
  }
  
  return secrets;
}

/**
 * Splits an amount into partial fill amounts
 */
export function calculatePartialFillAmounts(
  totalAmount: number,
  partCount: number,
  minAmount: number = 10000 // 10k sats minimum
): number[] {
  if (partCount <= 0) throw new Error('Part count must be positive');
  
  const baseAmount = Math.floor(totalAmount / partCount);
  if (baseAmount < minAmount) {
    throw new Error(`Each part would be below minimum amount of ${minAmount} sats`);
  }
  
  const amounts = new Array(partCount).fill(baseAmount);
  const remainder = totalAmount - (baseAmount * partCount);
  
  // Add remainder to first part
  if (remainder > 0) {
    amounts[0] += remainder;
  }
  
  return amounts;
}