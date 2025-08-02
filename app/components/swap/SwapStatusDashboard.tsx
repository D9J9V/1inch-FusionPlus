'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle, Clock, AlertCircle, Loader2, Lock, Unlock, Bitcoin, Link2 } from 'lucide-react';
import { formatEther } from 'ethers';

interface SwapStatusDashboardProps {
  htlcHash: string;
}

interface SwapStatus {
  state: string;
  evm_chain_id?: number;
  evm_tx_hash?: string;
  evm_escrow_address?: string;
  btc_htlc_address?: string;
  btc_tx_id?: string;
  btc_amount?: number;
  current_confirmations?: number;
  required_confirmations?: number;
  secret?: string;
  error_message?: string;
  created_at?: string;
  updated_at?: string;
}

const STATE_DESCRIPTIONS: Record<string, string> = {
  created: 'Swap initiated',
  waiting_for_deposit: 'Waiting for EVM deposit',
  evm_deposit_detected: 'EVM deposit detected',
  evm_deposit_confirmed: 'EVM deposit confirmed',
  btc_htlc_created: 'Bitcoin HTLC created',
  btc_deposit_detected: 'Bitcoin deposit detected',
  btc_deposit_confirmed: 'Bitcoin deposit confirmed',
  secret_requested: 'Waiting for secret revelation',
  secret_revealed: 'Secret revealed',
  swap_completed: 'Swap completed successfully',
  swap_failed: 'Swap failed',
  swap_timeout: 'Swap timed out',
  swap_reclaimed: 'Funds reclaimed'
};

const STATE_ICONS: Record<string, React.ReactNode> = {
  created: <Clock className="w-5 h-5 text-blue-500" />,
  waiting_for_deposit: <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />,
  evm_deposit_detected: <AlertCircle className="w-5 h-5 text-yellow-500" />,
  evm_deposit_confirmed: <CheckCircle className="w-5 h-5 text-green-500" />,
  btc_htlc_created: <Lock className="w-5 h-5 text-blue-500" />,
  btc_deposit_detected: <Bitcoin className="w-5 h-5 text-orange-500" />,
  btc_deposit_confirmed: <CheckCircle className="w-5 h-5 text-green-500" />,
  secret_requested: <Clock className="w-5 h-5 text-yellow-500" />,
  secret_revealed: <Unlock className="w-5 h-5 text-green-500" />,
  swap_completed: <CheckCircle className="w-5 h-5 text-green-600" />,
  swap_failed: <AlertCircle className="w-5 h-5 text-red-500" />,
  swap_timeout: <Clock className="w-5 h-5 text-red-500" />,
  swap_reclaimed: <CheckCircle className="w-5 h-5 text-blue-500" />
};

export default function SwapStatusDashboard({ htlcHash }: SwapStatusDashboardProps) {
  const [status, setStatus] = useState<SwapStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/swap-status/${htlcHash}`);
        if (!response.ok) throw new Error('Failed to fetch status');
        
        const data = await response.json();
        setStatus(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    };

    // Initial fetch
    fetchStatus();

    // Poll every 2 seconds
    const interval = setInterval(fetchStatus, 2000);

    return () => clearInterval(interval);
  }, [htlcHash]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-700">{error || 'Swap not found'}</p>
        </div>
      </div>
    );
  }

  const isCompleted = status.state === 'swap_completed';
  const isFailed = status.state === 'swap_failed' || status.state === 'swap_timeout';
  const isInProgress = !isCompleted && !isFailed && status.state !== 'swap_reclaimed';

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Swap Status</h2>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          isCompleted ? 'bg-green-100 text-green-800' :
          isFailed ? 'bg-red-100 text-red-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {STATE_DESCRIPTIONS[status.state] || status.state}
        </div>
      </div>

      {/* Progress Timeline */}
      <div className="relative">
        <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-200"></div>
        <div className="space-y-6">
          {getTimelineSteps(status).map((step, index) => (
            <div key={index} className="flex items-start gap-4">
              <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full ${
                step.completed ? 'bg-green-500' :
                step.active ? 'bg-blue-500' :
                step.failed ? 'bg-red-500' :
                'bg-gray-300'
              }`}>
                {step.completed ? <CheckCircle className="w-4 h-4 text-white" /> :
                 step.active ? <Loader2 className="w-4 h-4 text-white animate-spin" /> :
                 step.failed ? <AlertCircle className="w-4 h-4 text-white" /> :
                 <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
              <div className="flex-1">
                <h4 className={`font-medium ${
                  step.completed || step.active ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {step.title}
                </h4>
                {step.subtitle && (
                  <p className="text-sm text-gray-600 mt-1">{step.subtitle}</p>
                )}
                {step.link && (
                  <a
                    href={step.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mt-1"
                  >
                    View on explorer
                    <Link2 className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Details Section */}
      <div className="border-t pt-4 space-y-3">
        <h3 className="font-semibold text-gray-900">Transaction Details</h3>
        
        {status.evm_tx_hash && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">EVM Transaction</span>
            <a
              href={getEvmExplorerUrl(status.evm_chain_id, status.evm_tx_hash)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 font-mono"
            >
              {status.evm_tx_hash.slice(0, 10)}...{status.evm_tx_hash.slice(-8)}
            </a>
          </div>
        )}

        {status.btc_htlc_address && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Bitcoin HTLC</span>
            <a
              href={getBtcExplorerUrl(status.btc_htlc_address)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 font-mono"
            >
              {status.btc_htlc_address.slice(0, 10)}...{status.btc_htlc_address.slice(-8)}
            </a>
          </div>
        )}

        {status.btc_amount && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Bitcoin Amount</span>
            <span className="font-mono">{(status.btc_amount / 100000000).toFixed(8)} BTC</span>
          </div>
        )}

        {status.current_confirmations !== undefined && status.required_confirmations && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Confirmations</span>
            <span className={`font-mono ${
              status.current_confirmations >= status.required_confirmations ? 'text-green-600' : 'text-yellow-600'
            }`}>
              {status.current_confirmations} / {status.required_confirmations}
            </span>
          </div>
        )}
      </div>

      {/* Error Message */}
      {status.error_message && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{status.error_message}</p>
          </div>
        </div>
      )}

      {/* Secret Display (if revealed) */}
      {status.secret && isCompleted && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-2">Swap Completed</h4>
          <p className="text-sm text-green-700">
            The atomic swap has been completed successfully. Both parties have received their funds.
          </p>
        </div>
      )}
    </div>
  );
}

function getTimelineSteps(status: SwapStatus) {
  const steps = [
    {
      title: 'Swap Created',
      subtitle: 'Initializing cross-chain swap',
      completed: true,
      active: false,
      failed: false
    },
    {
      title: 'EVM Deposit',
      subtitle: status.evm_tx_hash ? `Transaction: ${status.evm_tx_hash.slice(0, 10)}...` : 'Waiting for deposit',
      completed: ['evm_deposit_confirmed', 'btc_htlc_created', 'btc_deposit_detected', 'btc_deposit_confirmed', 'secret_requested', 'secret_revealed', 'swap_completed'].includes(status.state),
      active: status.state === 'waiting_for_deposit' || status.state === 'evm_deposit_detected',
      failed: false,
      link: status.evm_tx_hash ? getEvmExplorerUrl(status.evm_chain_id, status.evm_tx_hash) : undefined
    },
    {
      title: 'Bitcoin HTLC',
      subtitle: status.btc_htlc_address ? `Address: ${status.btc_htlc_address.slice(0, 10)}...` : 'Creating HTLC',
      completed: ['btc_deposit_detected', 'btc_deposit_confirmed', 'secret_requested', 'secret_revealed', 'swap_completed'].includes(status.state),
      active: status.state === 'btc_htlc_created',
      failed: false,
      link: status.btc_htlc_address ? getBtcExplorerUrl(status.btc_htlc_address) : undefined
    },
    {
      title: 'Bitcoin Deposit',
      subtitle: status.current_confirmations !== undefined ? 
        `${status.current_confirmations}/${status.required_confirmations} confirmations` : 
        'Waiting for Bitcoin deposit',
      completed: ['btc_deposit_confirmed', 'secret_requested', 'secret_revealed', 'swap_completed'].includes(status.state),
      active: status.state === 'btc_deposit_detected',
      failed: false
    },
    {
      title: 'Secret Exchange',
      subtitle: status.secret ? 'Secret revealed' : 'Exchanging cryptographic secrets',
      completed: ['secret_revealed', 'swap_completed'].includes(status.state),
      active: status.state === 'secret_requested',
      failed: false
    },
    {
      title: 'Completion',
      subtitle: getCompletionSubtitle(status),
      completed: status.state === 'swap_completed',
      active: status.state === 'secret_revealed',
      failed: status.state === 'swap_failed' || status.state === 'swap_timeout'
    }
  ];

  return steps;
}

function getCompletionSubtitle(status: SwapStatus): string {
  switch (status.state) {
    case 'swap_completed':
      return 'Swap completed successfully';
    case 'swap_failed':
      return status.error_message || 'Swap failed';
    case 'swap_timeout':
      return 'Swap timed out';
    case 'swap_reclaimed':
      return 'Funds reclaimed';
    default:
      return 'Finalizing swap';
  }
}

function getEvmExplorerUrl(chainId?: number, txHash?: string): string {
  if (!chainId || !txHash) return '#';
  
  const explorers: Record<number, string> = {
    1: 'https://etherscan.io/tx/',
    5: 'https://goerli.etherscan.io/tx/',
    8453: 'https://basescan.org/tx/',
    84532: 'https://sepolia.basescan.org/tx/',
  };
  
  return (explorers[chainId] || 'https://etherscan.io/tx/') + txHash;
}

function getBtcExplorerUrl(address: string): string {
  const isMainnet = process.env.NEXT_PUBLIC_BITCOIN_NETWORK === 'mainnet';
  return isMainnet 
    ? `https://blockstream.info/address/${address}`
    : `https://blockstream.info/testnet/address/${address}`;
}