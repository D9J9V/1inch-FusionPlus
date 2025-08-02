'use client';

import { useState, useEffect } from 'react';
import { chains, ChainId } from "../../../types/chains";
import { ethers } from 'ethers';

export default function SwapPage({
  params,
}: {
  params: Promise<{ "base-network": ChainId; "destination-network": ChainId }>;
}) {
  const [baseNetwork, setBaseNetwork] = useState<ChainId | null>(null);
  const [destinationNetwork, setDestinationNetwork] = useState<ChainId | null>(null);
  const [amount, setAmount] = useState('');
  const [swapMethod, setSwapMethod] = useState<'native' | 'lightning'>('lightning');
  const [priceQuote, setPriceQuote] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [secret, setSecret] = useState('');
  const [htlcHash, setHtlcHash] = useState('');
  const [invoice, setInvoice] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [swapState, setSwapState] = useState<'idle' | 'processing' | 'polling' | 'ready' | 'claimed'>('idle');
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    params.then(p => {
      setBaseNetwork(p["base-network"]);
      setDestinationNetwork(p["destination-network"]);
    });
  }, [params]);

  if (!baseNetwork || !destinationNetwork || !chains[baseNetwork] || !chains[destinationNetwork]) {
    return <div>Invalid chain selection</div>;
  }

  const isBitcoinInvolved = 
    destinationNetwork === ChainId.LIGHTNING || 
    baseNetwork === ChainId.LIGHTNING ||
    destinationNetwork === ChainId.BTC || 
    baseNetwork === ChainId.BTC;

  // Generate random secret and calculate hash
  const generateSecret = () => {
    const randomBytes = ethers.randomBytes(32);
    const secretHex = ethers.hexlify(randomBytes);
    const hash = ethers.sha256(randomBytes);
    setSecret(secretHex);
    setHtlcHash(hash);
    return { secret: secretHex, hash };
  };

  // Fetch price quote
  const fetchPriceQuote = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    
    setLoading(true);
    try {
      // Mock price calculation for demo
      const mockRates: Record<string, number> = {
        'ETH': 3800,
        'BTC': 65000,
        'USDC': 1
      };
      
      const fromRate = mockRates[baseNetwork === ChainId.LIGHTNING ? 'BTC' : 'ETH'] || 1;
      const toRate = mockRates[destinationNetwork === ChainId.LIGHTNING ? 'BTC' : 'ETH'] || 1;
      
      setPriceQuote(parseFloat(amount) * (fromRate / toRate));
    } catch (error) {
      console.error('Error fetching price:', error);
      setStatus('Error fetching price quote');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (amount) {
      fetchPriceQuote();
    }
  }, [amount]);

  const initiateSwap = async () => {
    if (!amount || !priceQuote) {
      setStatus('Please enter an amount');
      return;
    }

    if (swapMethod === 'native' && !recipientAddress) {
      setStatus('Please enter your Bitcoin address');
      return;
    }

    setLoading(true);
    setStatus('Initiating swap...');

    try {
      // Step 1: Generate secret and hash
      const { secret: newSecret, hash } = generateSecret();
      
      // Step 2: For EVM to Bitcoin swaps
      if (destinationNetwork === ChainId.LIGHTNING || destinationNetwork === ChainId.BTC) {
        setStatus('Creating cross-chain swap...');
        
        // Call the appropriate API based on swap method
        if (swapMethod === 'lightning') {
          setStatus('Creating Lightning invoice...');
          const response = await fetch('/api/resolver/lightning', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              htlcHash: hash,
              amountSats: Math.floor(priceQuote * 100000000),
              description: `Swap from ${chains[baseNetwork].name} to ${chains[destinationNetwork].name}`
            })
          });
          
          const data = await response.json();
          if (data.success) {
            setInvoice(data.invoice.paymentRequest);
            setStatus('Lightning invoice created! Lock your tokens on the source chain, then pay the invoice to complete the swap.');
          } else {
            throw new Error(data.error || 'Failed to create Lightning invoice');
          }
        } else {
          setStatus('Creating Bitcoin HTLC...');
          const response = await fetch('/api/resolver/native-btc', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              htlcHash: hash,
              amount: Math.floor(priceQuote * 100000000),
              recipientAddress: recipientAddress,
              timeoutBlocks: 144
            })
          });
          
          const data = await response.json();
          if (data.success) {
            setStatus(`Bitcoin HTLC created at address: ${data.htlcAddress}`);
          } else {
            throw new Error(data.error || 'Failed to create Bitcoin HTLC');
          }
        }
      } else {
        setStatus('This demo currently supports EVM to Bitcoin swaps only');
      }
    } catch (error) {
      console.error('Swap error:', error);
      setStatus(`Error: ${error instanceof Error ? error.message : 'Failed to initiate swap'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <h1>Cross-Chain Swap</h1>
      <h2>{chains[baseNetwork].name} → {chains[destinationNetwork].name}</h2>
      
      <form onSubmit={(e) => { e.preventDefault(); initiateSwap(); }}>
        <div>
          <label htmlFor="amount">Amount:</label>
          <input 
            id="amount"
            type="number" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            step="0.000001"
          />
        </div>
        
        {isBitcoinInvolved && (
          <div>
            <label htmlFor="swapMethod">Bitcoin Transfer Method:</label>
            <select 
              id="swapMethod"
              value={swapMethod} 
              onChange={(e) => setSwapMethod(e.target.value as 'native' | 'lightning')}
            >
              <option value="lightning">Lightning Network (Instant)</option>
              <option value="native">Native Bitcoin (On-chain)</option>
            </select>
          </div>
        )}
        
        {swapMethod === 'native' && isBitcoinInvolved && (
          <div>
            <label htmlFor="recipientAddress">Your Bitcoin Address:</label>
            <input 
              id="recipientAddress"
              type="text" 
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              placeholder="bc1q..."
            />
          </div>
        )}
        
        {priceQuote !== null && (
          <div>
            <p>You will receive: ~{priceQuote.toFixed(8)} {destinationNetwork === ChainId.LIGHTNING ? 'BTC' : 'tokens'}</p>
          </div>
        )}
        
        <button type="submit" disabled={loading || !amount}>
          {loading ? 'Processing...' : 'Initiate Swap'}
        </button>
      </form>
      
      {status && (
        <div>
          <h3>Status</h3>
          <p>{status}</p>
        </div>
      )}
      
      {secret && (
        <div>
          <h3>Swap Details</h3>
          <p><strong>Secret (Keep this safe!):</strong></p>
          <code>{secret}</code>
          <p><strong>HTLC Hash:</strong></p>
          <code>{htlcHash}</code>
        </div>
      )}
      
      {invoice && (
        <div>
          <h3>Lightning Invoice</h3>
          <code>{invoice}</code>
          <p>Pay this invoice with your Lightning wallet to complete the swap.</p>
        </div>
      )}
      
      <div>
        <h3>How it works:</h3>
        <ol>
          <li>Enter the amount you want to swap</li>
          <li>The system generates a cryptographic secret and its hash</li>
          <li>Lock your tokens in the smart contract on {chains[baseNetwork].name}</li>
          <li>The resolver creates a corresponding HTLC on {chains[destinationNetwork].name}</li>
          <li>Reveal the secret to claim your funds on the destination chain</li>
        </ol>
      </div>
    </main>
  );
}
