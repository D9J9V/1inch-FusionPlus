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

  // Poll for swap status
  const startStatusPolling = (htlcHash: string) => {
    setSwapState('polling');
    
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/swap-status/${htlcHash}`);
        const data = await response.json();
        
        if (!data.success) {
          console.error('Failed to fetch status:', data.error);
          return;
        }
        
        // Update status based on response
        switch (data.status) {
          case 'pending':
            setStatus('Waiting for Bitcoin confirmation...');
            break;
          case 'ready_to_claim':
            setStatus('Ready to claim! Bitcoin payment confirmed.');
            setSwapState('ready');
            if (data.swapDetails?.invoice) {
              setInvoice(data.swapDetails.invoice);
            }
            // Stop polling once ready
            clearInterval(interval);
            break;
          case 'claimed':
            setStatus('Swap completed successfully!');
            setSwapState('claimed');
            clearInterval(interval);
            break;
          case 'expired':
            setStatus('Swap expired. Please try again.');
            setSwapState('idle');
            clearInterval(interval);
            break;
        }
      } catch (error) {
        console.error('Error polling status:', error);
      }
    }, 5000); // Poll every 5 seconds
    
    setPollingInterval(interval);
  };

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

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

  const claimWithSecret = async () => {
    if (!htlcHash) {
      setStatus('No active swap to claim');
      return;
    }
    
    setLoading(true);
    setStatus('Revealing secret...');
    
    try {
      const response = await fetch(`/api/secret/${htlcHash}`, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer user-token', // TODO: Add proper auth
          'X-User-Address': '0x...' // TODO: Get from wallet
        }
      });
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to reveal secret');
      }
      
      setSecret(data.secret);
      setStatus('Secret revealed! Use it to claim your Bitcoin.');
      setSwapState('claimed');
      
    } catch (error) {
      console.error('Error revealing secret:', error);
      setStatus(`Error: ${error instanceof Error ? error.message : 'Failed to reveal secret'}`);
    } finally {
      setLoading(false);
    }
  };

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
    setSwapState('processing');
    setStatus('Initiating automated swap...');

    try {
      // Get user's address (in production, this would come from wallet connection)
      const userAddress = '0x...'; // TODO: Connect wallet
      
      // Call the unified execute-swap endpoint
      const response = await fetch('/api/execute-swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromToken: '0x...', // TODO: Get actual token address
          toToken: swapMethod === 'lightning' ? 'LN-BTC' : recipientAddress,
          amount: ethers.parseUnits(amount, 18).toString(), // Assuming 18 decimals
          userAddress,
          swapType: swapMethod
        })
      });
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to execute swap');
      }
      
      setHtlcHash(data.htlcHash);
      setStatus('Swap initiated! Monitoring progress...');
      
      // Start polling for status
      startStatusPolling(data.htlcHash);
      
    } catch (error) {
      console.error('Swap error:', error);
      setStatus(`Error: ${error instanceof Error ? error.message : 'Failed to initiate swap'}`);
      setSwapState('idle');
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
          {swapState === 'polling' && (
            <div>
              <p>⏳ Monitoring blockchain activity...</p>
              <a 
                href={`https://sepolia.etherscan.io/`} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                View on Etherscan →
              </a>
            </div>
          )}
        </div>
      )}
      
      {swapState === 'ready' && (
        <div style={{ border: '2px solid green', padding: '20px', margin: '20px 0' }}>
          <h3>✅ Ready to Claim!</h3>
          <p>Your Bitcoin payment has been confirmed. You can now claim your funds.</p>
          
          {swapMethod === 'lightning' && invoice && (
            <div>
              <h4>Lightning Invoice (QR Code):</h4>
              <code style={{ wordBreak: 'break-all' }}>{invoice}</code>
              <p>Pay this invoice with your Lightning wallet to receive your BTC.</p>
              <button onClick={() => navigator.clipboard.writeText(invoice)}>
                Copy Invoice
              </button>
            </div>
          )}
          
          {swapMethod === 'native' && (
            <div>
              <button onClick={claimWithSecret}>
                Reveal Secret & Claim
              </button>
              <p>Click to get the secret needed to claim your Bitcoin.</p>
            </div>
          )}
        </div>
      )}
      
      {secret && swapMethod === 'native' && (
        <div style={{ border: '2px solid blue', padding: '20px', margin: '20px 0' }}>
          <h3>🔐 Your Secret</h3>
          <p>Use this secret to claim your Bitcoin:</p>
          <code style={{ wordBreak: 'break-all' }}>{secret}</code>
          <button onClick={() => navigator.clipboard.writeText(secret)}>
            Copy Secret
          </button>
          <p>Instructions: Use this secret as the preimage in your Bitcoin wallet to unlock the HTLC.</p>
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
