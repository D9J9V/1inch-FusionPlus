"use client";

import React, { useEffect, useState } from "react";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Lock,
  Unlock,
  Bitcoin,
  Link2,
  Activity,
  Zap,
  Shield,
  Orbit,
  Star,
  ExternalLink,
  Layers,
} from "lucide-react";
import { formatEther } from "ethers";
import { Card, CardContent, CardHeader } from "../ui/Card";
import Button from "../ui/Button";
import { cn } from "../../utils/cn";

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
  created: "Swap initiated",
  waiting_for_deposit: "Waiting for EVM deposit",
  evm_deposit_detected: "EVM deposit detected",
  evm_deposit_confirmed: "EVM deposit confirmed",
  btc_htlc_created: "Bitcoin HTLC created",
  btc_deposit_detected: "Bitcoin deposit detected",
  btc_deposit_confirmed: "Bitcoin deposit confirmed",
  secret_requested: "Waiting for secret revelation",
  secret_revealed: "Secret revealed",
  swap_completed: "Swap completed successfully",
  swap_failed: "Swap failed",
  swap_timeout: "Swap timed out",
  swap_reclaimed: "Funds reclaimed",
};

const STATE_ICONS: Record<string, React.ReactNode> = {
  created: <Clock className="w-5 h-5 text-blue-500" />,
  waiting_for_deposit: (
    <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />
  ),
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
  swap_reclaimed: <CheckCircle className="w-5 h-5 text-blue-500" />,
};

export default function SwapStatusDashboard({
  htlcHash,
}: SwapStatusDashboardProps) {
  const [status, setStatus] = useState<SwapStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/swap-status/${htlcHash}`);
        if (!response.ok) throw new Error("Failed to fetch status");

        const data = await response.json();
        setStatus(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
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
      <Card variant="terminal" className="p-8">
        <CardContent>
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <Loader2 className="w-12 h-12 animate-spin text-cyber-cyan" />
              <div className="absolute inset-0 animate-ping">
                <Orbit className="w-12 h-12 text-cyber-purple/50" />
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-display text-cyber-cyan uppercase tracking-wider mb-2">
                Initializing Mission Control
              </div>
              <div className="text-sm font-mono text-white/60 loading-dots">
                Scanning blockchain networks
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !status) {
    return (
      <Card variant="terminal" className="border-red-500/50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 text-red-400 animate-pulse" />
            <div>
              <h3 className="font-display font-semibold text-red-400 uppercase">
                System Error
              </h3>
              <p className="text-red-300 font-mono text-sm">
                {error || "Swap data not found in navigation logs"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isCompleted = status.state === "swap_completed";
  const isFailed =
    status.state === "swap_failed" || status.state === "swap_timeout";
  const isInProgress =
    !isCompleted && !isFailed && status.state !== "swap_reclaimed";

  return (
    <div className="space-y-6">
      {/* Mission Control Header */}
      <Card variant="terminal" glow>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Activity className="w-8 h-8 text-cyber-cyan animate-pulse-glow" />
                <div
                  className="absolute inset-0 animate-spin"
                  style={{ animationDuration: "3s" }}
                >
                  <Orbit className="w-8 h-8 text-cyber-purple/30" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold text-white uppercase tracking-wider">
                  Mission Control
                </h2>
                <p className="text-sm font-mono text-cyber-cyan">
                  Cross-chain navigation status
                </p>
              </div>
            </div>
            <div
              className={cn(
                "px-4 py-2 rounded-space text-sm font-space font-medium uppercase tracking-wider border",
                isCompleted
                  ? "bg-nebula-green/20 text-nebula-green border-nebula-green/50"
                  : isFailed
                    ? "bg-red-500/20 text-red-400 border-red-500/50"
                    : "bg-cyber-cyan/20 text-cyber-cyan border-cyber-cyan/50",
              )}
            >
              <div className="flex items-center space-x-2">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full animate-pulse",
                    isCompleted
                      ? "bg-nebula-green"
                      : isFailed
                        ? "bg-red-400"
                        : "bg-cyber-cyan",
                  )}
                />
                <span>{STATE_DESCRIPTIONS[status.state] || status.state}</span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Mission Timeline */}
      <Card variant="hologram">
        <CardHeader>
          <h3 className="font-display font-semibold text-white uppercase tracking-wider">
            Mission Timeline
          </h3>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Timeline connector */}
            <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-cyber-cyan via-cyber-purple to-cyber-cyan opacity-30"></div>

            <div className="space-y-8">
              {getTimelineSteps(status).map((step, index) => (
                <div key={index} className="flex items-start gap-6">
                  <div
                    className={cn(
                      "relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300",
                      step.completed
                        ? "bg-nebula-green/20 border-nebula-green text-nebula-green shadow-glow-green"
                        : step.active
                          ? "bg-cyber-cyan/20 border-cyber-cyan text-cyber-cyan shadow-glow-cyan animate-pulse-glow"
                          : step.failed
                            ? "bg-red-500/20 border-red-500 text-red-400"
                            : "bg-cosmic-dust/20 border-white/20 text-white/40",
                    )}
                  >
                    {step.completed ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : step.active ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : step.failed ? (
                      <AlertCircle className="w-5 h-5" />
                    ) : (
                      <div className="w-3 h-3 bg-current rounded-full opacity-50" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4
                        className={cn(
                          "font-space font-semibold uppercase tracking-wider",
                          step.completed || step.active
                            ? "text-white"
                            : "text-white/50",
                        )}
                      >
                        {step.title}
                      </h4>
                      {step.completed && (
                        <Star className="w-4 h-4 text-nebula-green animate-pulse" />
                      )}
                    </div>

                    {step.subtitle && (
                      <p
                        className={cn(
                          "text-sm font-mono mb-2",
                          step.completed || step.active
                            ? "text-white/80"
                            : "text-white/40",
                        )}
                      >
                        {step.subtitle}
                      </p>
                    )}

                    {step.link && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(step.link, "_blank")}
                        rightIcon={<ExternalLink className="w-3 h-3" />}
                        className="mt-2"
                      >
                        View on Explorer
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Details */}
      <Card variant="terminal">
        <CardHeader>
          <h3 className="font-display font-semibold text-cyber-cyan uppercase tracking-wider">
            Navigation Data
          </h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {status.evm_tx_hash && (
              <div className="flex items-center justify-between p-3 bg-cosmic-void/50 border border-cyber-cyan/20 rounded-space">
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-cyber-cyan" />
                  <span className="text-sm font-space text-white/80 uppercase tracking-wider">
                    EVM Transaction
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    window.open(
                      getEvmExplorerUrl(
                        status.evm_chain_id,
                        status.evm_tx_hash,
                      ),
                      "_blank",
                    )
                  }
                  rightIcon={<ExternalLink className="w-3 h-3" />}
                  className="font-mono text-xs"
                >
                  {status.evm_tx_hash.slice(0, 10)}...
                  {status.evm_tx_hash.slice(-8)}
                </Button>
              </div>
            )}

            {status.btc_htlc_address && (
              <div className="flex items-center justify-between p-3 bg-cosmic-void/50 border border-cyber-orange/20 rounded-space">
                <div className="flex items-center space-x-2">
                  <Bitcoin className="w-4 h-4 text-cyber-orange" />
                  <span className="text-sm font-space text-white/80 uppercase tracking-wider">
                    Bitcoin HTLC
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    window.open(
                      getBtcExplorerUrl(status.btc_htlc_address),
                      "_blank",
                    )
                  }
                  rightIcon={<ExternalLink className="w-3 h-3" />}
                  className="font-mono text-xs"
                >
                  {status.btc_htlc_address.slice(0, 10)}...
                  {status.btc_htlc_address.slice(-8)}
                </Button>
              </div>
            )}

            {status.btc_amount && (
              <div className="flex items-center justify-between p-3 bg-cosmic-void/50 border border-cyber-purple/20 rounded-space">
                <span className="text-sm font-space text-white/80 uppercase tracking-wider">
                  Bitcoin Amount
                </span>
                <span className="font-mono text-cyber-purple font-semibold">
                  {(status.btc_amount / 100000000).toFixed(8)} BTC
                </span>
              </div>
            )}

            {status.current_confirmations !== undefined &&
              status.required_confirmations && (
                <div className="flex items-center justify-between p-3 bg-cosmic-void/50 border border-supernova-yellow/20 rounded-space">
                  <span className="text-sm font-space text-white/80 uppercase tracking-wider">
                    Confirmations
                  </span>
                  <div className="flex items-center space-x-2">
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full animate-pulse",
                        status.current_confirmations >=
                          status.required_confirmations
                          ? "bg-nebula-green"
                          : "bg-supernova-yellow",
                      )}
                    />
                    <span
                      className={cn(
                        "font-mono font-semibold",
                        status.current_confirmations >=
                          status.required_confirmations
                          ? "text-nebula-green"
                          : "text-supernova-yellow",
                      )}
                    >
                      {status.current_confirmations} /{" "}
                      {status.required_confirmations}
                    </span>
                  </div>
                </div>
              )}
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {status.error_message && (
        <Card variant="terminal" className="border-red-500/50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5 animate-pulse" />
              <div>
                <h4 className="font-display font-semibold text-red-400 uppercase mb-2">
                  System Malfunction
                </h4>
                <p className="text-sm text-red-300 font-mono leading-relaxed">
                  {status.error_message}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mission Completed */}
      {status.secret && isCompleted && (
        <Card variant="hologram" className="border-nebula-green/50" glow>
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-6 h-6 text-nebula-green flex-shrink-0 mt-0.5 animate-pulse-glow" />
              <div>
                <h4 className="font-display font-semibold text-nebula-green uppercase mb-2">
                  Mission Accomplished
                </h4>
                <p className="text-sm text-white/80 leading-relaxed">
                  The atomic swap has been completed successfully. Both parties
                  have received their funds. Navigation systems are now in
                  standby mode.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function getTimelineSteps(status: SwapStatus) {
  const steps = [
    {
      title: "Swap Created",
      subtitle: "Initializing cross-chain swap",
      completed: true,
      active: false,
      failed: false,
    },
    {
      title: "EVM Deposit",
      subtitle: status.evm_tx_hash
        ? `Transaction: ${status.evm_tx_hash.slice(0, 10)}...`
        : "Waiting for deposit",
      completed: [
        "evm_deposit_confirmed",
        "btc_htlc_created",
        "btc_deposit_detected",
        "btc_deposit_confirmed",
        "secret_requested",
        "secret_revealed",
        "swap_completed",
      ].includes(status.state),
      active:
        status.state === "waiting_for_deposit" ||
        status.state === "evm_deposit_detected",
      failed: false,
      link: status.evm_tx_hash
        ? getEvmExplorerUrl(status.evm_chain_id, status.evm_tx_hash)
        : undefined,
    },
    {
      title: "Bitcoin HTLC",
      subtitle: status.btc_htlc_address
        ? `Address: ${status.btc_htlc_address.slice(0, 10)}...`
        : "Creating HTLC",
      completed: [
        "btc_deposit_detected",
        "btc_deposit_confirmed",
        "secret_requested",
        "secret_revealed",
        "swap_completed",
      ].includes(status.state),
      active: status.state === "btc_htlc_created",
      failed: false,
      link: status.btc_htlc_address
        ? getBtcExplorerUrl(status.btc_htlc_address)
        : undefined,
    },
    {
      title: "Bitcoin Deposit",
      subtitle:
        status.current_confirmations !== undefined
          ? `${status.current_confirmations}/${status.required_confirmations} confirmations`
          : "Waiting for Bitcoin deposit",
      completed: [
        "btc_deposit_confirmed",
        "secret_requested",
        "secret_revealed",
        "swap_completed",
      ].includes(status.state),
      active: status.state === "btc_deposit_detected",
      failed: false,
    },
    {
      title: "Secret Exchange",
      subtitle: status.secret
        ? "Secret revealed"
        : "Exchanging cryptographic secrets",
      completed: ["secret_revealed", "swap_completed"].includes(status.state),
      active: status.state === "secret_requested",
      failed: false,
    },
    {
      title: "Completion",
      subtitle: getCompletionSubtitle(status),
      completed: status.state === "swap_completed",
      active: status.state === "secret_revealed",
      failed: status.state === "swap_failed" || status.state === "swap_timeout",
    },
  ];

  return steps;
}

function getCompletionSubtitle(status: SwapStatus): string {
  switch (status.state) {
    case "swap_completed":
      return "Swap completed successfully";
    case "swap_failed":
      return status.error_message || "Swap failed";
    case "swap_timeout":
      return "Swap timed out";
    case "swap_reclaimed":
      return "Funds reclaimed";
    default:
      return "Finalizing swap";
  }
}

function getEvmExplorerUrl(chainId?: number, txHash?: string): string {
  if (!chainId || !txHash) return "#";

  const explorers: Record<number, string> = {
    1: "https://etherscan.io/tx/",
    5: "https://goerli.etherscan.io/tx/",
    8453: "https://basescan.org/tx/",
    84532: "https://sepolia.basescan.org/tx/",
  };

  return (explorers[chainId] || "https://etherscan.io/tx/") + txHash;
}

function getBtcExplorerUrl(address: string): string {
  const isMainnet = process.env.NEXT_PUBLIC_BITCOIN_NETWORK === "mainnet";
  return isMainnet
    ? `https://blockstream.info/address/${address}`
    : `https://blockstream.info/testnet/address/${address}`;
}
