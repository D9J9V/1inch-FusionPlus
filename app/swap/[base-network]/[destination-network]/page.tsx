"use client";

import React, { useState, useEffect } from "react";
import { chains, ChainId, ChainType } from "@/types/chains";
import { assets, AssetId, isAssetAvailable } from "@/types/assets";
import { ethers } from "ethers";
import { useRouter } from "next/navigation";
import SwapStatusDashboard from "@/components/swap/SwapStatusDashboard";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import {
  ArrowRight,
  ArrowLeftRight,
  Zap,
  Bitcoin,
  Layers,
  Settings,
  Copy,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Orbit,
  Star,
  Activity,
  Lock,
  Unlock,
  Wallet,
  QrCode,
} from "lucide-react";

export default function SwapPage({
  params,
}: {
  params: Promise<{ "base-network": ChainId; "destination-network": ChainId }>;
}) {
  const router = useRouter();
  const [baseNetwork, setBaseNetwork] = useState<ChainId | null>(null);
  const [destinationNetwork, setDestinationNetwork] = useState<ChainId | null>(
    null,
  );
  const [amount, setAmount] = useState("");
  const [swapMethod, setSwapMethod] = useState<"native" | "lightning">(
    "lightning",
  );
  const [priceQuote, setPriceQuote] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [secret, setSecret] = useState("");
  const [htlcHash, setHtlcHash] = useState("");
  const [invoice, setInvoice] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [swapState, setSwapState] = useState<
    "idle" | "processing" | "polling" | "ready" | "claimed"
  >("idle");
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [feeAmount, setFeeAmount] = useState<number>(0);
  const [selectedAsset, setSelectedAsset] = useState<AssetId>(AssetId.ETH);
  const [destinationAsset, setDestinationAsset] = useState<AssetId>(AssetId.ETH);

  useEffect(() => {
    params.then((p) => {
      setBaseNetwork(p["base-network"]);
      setDestinationNetwork(p["destination-network"]);
    });
  }, [params]);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  useEffect(() => {
    if (amount && baseNetwork && destinationNetwork) {
      fetchPriceQuote();
    }
  }, [amount, selectedAsset, destinationAsset, baseNetwork, destinationNetwork]);

  if (
    !baseNetwork ||
    !destinationNetwork ||
    !chains[baseNetwork] ||
    !chains[destinationNetwork]
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card variant="terminal" className="p-8">
          <CardContent>
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-supernova-yellow mx-auto mb-4" />
              <h2 className="text-xl font-display text-white mb-2">
                INVALID NAVIGATION ROUTE
              </h2>
              <p className="text-white/70 font-mono">
                Chain selection parameters are invalid
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isBitcoinDestination =
    destinationNetwork === ChainId.LIGHTNING ||
    destinationNetwork === ChainId.BTC;

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
    setSwapState("polling");

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/swap-status/${htlcHash}`);
        const data = await response.json();

        if (!data.success) {
          console.error("Failed to fetch status:", data.error);
          return;
        }

        // Update status based on response
        switch (data.status) {
          case "pending":
            setStatus("Waiting for Bitcoin confirmation...");
            break;
          case "ready_to_claim":
            setStatus("Ready to claim! Bitcoin payment confirmed.");
            setSwapState("ready");
            if (data.swapDetails?.invoice) {
              setInvoice(data.swapDetails.invoice);
            }
            // Stop polling once ready
            clearInterval(interval);
            break;
          case "claimed":
            setStatus("Swap completed successfully!");
            setSwapState("claimed");
            clearInterval(interval);
            break;
          case "expired":
            setStatus("Swap expired. Please try again.");
            setSwapState("idle");
            clearInterval(interval);
            break;
        }
      } catch (error) {
        console.error("Error polling status:", error);
      }
    }, 5000); // Poll every 5 seconds

    setPollingInterval(interval);
  };

  // Fetch price quote
  const fetchPriceQuote = async () => {
    if (!amount || parseFloat(amount) <= 0) return;

    setLoading(true);
    try {
      // Mock price calculation for demo
      const mockRates: Record<string, number> = {
        ETH: 3800,
        BTC: 65000,
        USDC: 1,
      };

      // Determine the from asset based on network and selection
      let fromAssetKey = "ETH";
      if (baseNetwork === ChainId.LIGHTNING || baseNetwork === ChainId.BTC) {
        fromAssetKey = "BTC";
      } else if (isBaseNetworkEVM) {
        fromAssetKey = selectedAsset === AssetId.USDC ? "USDC" : "ETH";
      }

      // Determine the to asset based on destination network
      let toAssetKey = "ETH";
      if (destinationNetwork === ChainId.LIGHTNING || destinationNetwork === ChainId.BTC) {
        toAssetKey = "BTC";
      } else if (isDestinationNetworkEVM) {
        toAssetKey = destinationAsset === AssetId.USDC ? "USDC" : "ETH";
      }

      const fromRate = mockRates[fromAssetKey] || 1;
      const toRate = mockRates[toAssetKey] || 1;

      const quote = parseFloat(amount) * (fromRate / toRate);
      setPriceQuote(quote);

      // Calculate fee (0.3%)
      const fee = quote * 0.003;
      setFeeAmount(fee);
    } catch (error) {
      console.error("Error fetching price:", error);
      setStatus("Error fetching price quote");
    } finally {
      setLoading(false);
    }
  };

  const claimWithSecret = async () => {
    if (!htlcHash) {
      setStatus("No active swap to claim");
      return;
    }

    setLoading(true);
    setStatus("Revealing secret...");

    try {
      const response = await fetch(`/api/secret/${htlcHash}`, {
        method: "GET",
        headers: {
          Authorization: "Bearer user-token", // TODO: Add proper auth
          "X-User-Address": "0x...", // TODO: Get from wallet
        },
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to reveal secret");
      }

      setSecret(data.secret);
      setStatus("Secret revealed! Use it to claim your Bitcoin.");
      setSwapState("claimed");
    } catch (error) {
      console.error("Error revealing secret:", error);
      setStatus(
        `Error: ${error instanceof Error ? error.message : "Failed to reveal secret"}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const initiateSwap = async () => {
    if (!amount || !priceQuote) {
      setStatus("Please enter an amount");
      return;
    }

    if (swapMethod === "native" && !recipientAddress) {
      setStatus("Please enter your Bitcoin address");
      return;
    }

    setLoading(true);
    setSwapState("processing");
    setStatus("Initiating automated swap...");

    try {
      // Get user's address (in production, this would come from wallet connection)
      const userAddress = "0x..."; // TODO: Connect wallet

      // Get the from token address
      const fromAssetId = isBaseNetworkEVM ? selectedAsset : AssetId.BTC;
      const fromAsset = assets[fromAssetId];
      const fromTokenAddress = fromAsset.addresses[baseNetwork] || "0x...";
      const decimals = fromAsset.decimals;

      // Call the unified execute-swap endpoint
      const response = await fetch("/api/execute-swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_token: fromTokenAddress,
          to_token: swapMethod === "lightning" ? "LN-BTC" : recipientAddress,
          amount: ethers.parseUnits(amount, decimals).toString(),
          user_address: userAddress,
          swap_type: swapMethod,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to execute swap");
      }

      setHtlcHash(data.htlc_hash || data.htlcHash); // Support both field names for backward compatibility
      setStatus("Swap initiated! Monitoring progress...");

      // Start polling for status
      startStatusPolling(data.htlc_hash || data.htlcHash);
    } catch (error) {
      console.error("Swap error:", error);
      setStatus(
        `Error: ${error instanceof Error ? error.message : "Failed to initiate swap"}`,
      );
      setSwapState("idle");
    } finally {
      setLoading(false);
    }
  };

  const getChainIcon = (chainId: ChainId) => {
    switch (chainId) {
      case ChainId.LIGHTNING:
        return <Zap className="w-6 h-6 text-supernova-yellow" />;
      case ChainId.BTC:
        return <Bitcoin className="w-6 h-6 text-cyber-orange" />;
      default:
        return <Layers className="w-6 h-6 text-cyber-cyan" />;
    }
  };

  const getChainColor = (chainId: ChainId) => {
    switch (chainId) {
      case ChainId.LIGHTNING:
        return "supernova-yellow";
      case ChainId.BTC:
        return "cyber-orange";
      default:
        return "cyber-cyan";
    }
  };

  // Available networks for selection
  const networkOptions = Object.entries(chains).map(([chainId, chain]) => ({
    value: chainId,
    label: chain.name,
    icon: getChainIcon(chainId as ChainId),
  }));

  // Handle network changes
  const handleBaseNetworkChange = (newNetwork: string) => {
    if (newNetwork !== destinationNetwork) {
      router.push(`/swap/${newNetwork}/${destinationNetwork}`);
    }
  };

  const handleDestinationNetworkChange = (newNetwork: string) => {
    if (newNetwork !== baseNetwork) {
      router.push(`/swap/${baseNetwork}/${newNetwork}`);
    }
  };

  // Get available assets for the base network
  const getAvailableAssets = (chainId: ChainId) => {
    return Object.entries(assets)
      .filter(([assetId]) => isAssetAvailable(assetId as AssetId, chainId))
      .map(([assetId, asset]) => ({
        value: assetId,
        label: asset.symbol,
        icon: null, // You can add asset icons here if needed
      }));
  };

  // Check if base network is EVM
  const isBaseNetworkEVM = baseNetwork && chains[baseNetwork].type === ChainType.EVM;
  
  // Check if destination network is EVM
  const isDestinationNetworkEVM = destinationNetwork && chains[destinationNetwork].type === ChainType.EVM;

  // Handle swapping networks
  const handleSwapNetworks = () => {
    router.push(`/swap/${destinationNetwork}/${baseNetwork}`);
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Main Swap Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Source Chain Terminal */}
          <Card variant="terminal" className="lg:col-span-1">
            <CardHeader>
              <div className="space-y-3">
                <h3 className="font-display font-semibold text-lg text-white uppercase">
                  Source Network
                </h3>
                <Select
                  value={baseNetwork}
                  onChange={handleBaseNetworkChange}
                  options={networkOptions}
                  variant="terminal"
                  className="w-full"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Asset Selection for EVM Networks */}
                {isBaseNetworkEVM && (
                  <div>
                    <label className="block text-sm font-space font-medium text-cyber-cyan mb-2 uppercase tracking-wider">
                      Select Asset
                    </label>
                    <Select
                      value={selectedAsset}
                      onChange={(value) => setSelectedAsset(value as AssetId)}
                      options={getAvailableAssets(baseNetwork)}
                      variant="terminal"
                      className="w-full"
                    />
                  </div>
                )}

                <Input
                  variant="terminal"
                  label="Amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.0"
                  step="0.000001"
                  leftIcon={<Wallet className="w-4 h-4" />}
                  glow
                />
              </div>
            </CardContent>
          </Card>

          {/* Bridge Connection */}
          <div className="lg:col-span-1 flex flex-col items-center justify-center">
            {/* Connection Visualization */}
            <div className="relative w-full max-w-sm">
              {/* Animated Bridge */}
              <div className="relative h-32 flex items-center justify-center">
                {/* Connection Line */}
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full h-0.5 bg-gradient-to-r from-cyber-cyan via-cyber-purple to-cyber-cyan opacity-50" />
                  {/* Animated particles */}
                  <div className="absolute left-0 w-2 h-2 bg-cyber-cyan rounded-full animate-pulse" />
                  <div
                    className="absolute left-1/4 w-1 h-1 bg-cyber-purple rounded-full animate-pulse"
                    style={{ animationDelay: "0.5s" }}
                  />
                  <div
                    className="absolute left-1/2 w-1 h-1 bg-cyber-cyan rounded-full animate-pulse"
                    style={{ animationDelay: "1s" }}
                  />
                  <div
                    className="absolute left-3/4 w-1 h-1 bg-cyber-purple rounded-full animate-pulse"
                    style={{ animationDelay: "1.5s" }}
                  />
                  <div
                    className="absolute right-0 w-2 h-2 bg-cyber-orange rounded-full animate-pulse"
                    style={{ animationDelay: "2s" }}
                  />
                </div>

                {/* Bridge Icon - Clickable to swap networks */}
                <button
                  onClick={handleSwapNetworks}
                  className="relative z-10 p-4 bg-space-black border-2 border-cyber-cyan/50 rounded-full hover:border-cyber-cyan hover:shadow-glow-cyan transition-all duration-300 group"
                  aria-label="Swap networks"
                >
                  <ArrowLeftRight className="w-8 h-8 text-cyber-cyan group-hover:rotate-180 transition-transform duration-300" />
                </button>
              </div>

              {/* Price Quote Display */}
              {priceQuote !== null && (
                <Card variant="hologram" className="mt-6">
                  <CardContent className="p-4">
                    <div className="text-center space-y-2">
                      <div className="text-sm font-space text-cyber-cyan uppercase tracking-wider">
                        Navigation Quote
                      </div>
                      <div className="text-lg font-mono text-white">
                        {(priceQuote - feeAmount).toFixed(8)}{" "}
                        {destinationNetwork === ChainId.LIGHTNING
                          ? "BTC"
                          : "tokens"}
                      </div>
                      <div className="text-xs text-white/60 space-y-1">
                        <div>Protocol fee (0.3%): {feeAmount.toFixed(8)}</div>
                        <div>Total: {priceQuote.toFixed(8)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Initiate Button */}
              <div className="mt-6">
                <Button
                  size="lg"
                  glow
                  pulse={!!amount && !!priceQuote}
                  onClick={initiateSwap}
                  disabled={loading || !amount || swapState !== "idle"}
                  isLoading={loading}
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                  className="w-full"
                >
                  {loading ? "Initializing..." : "Initiate Cross-Chain Swap"}
                </Button>
              </div>
            </div>
          </div>

          {/* Destination Chain Terminal */}
          <Card variant="terminal" className="lg:col-span-1">
            <CardHeader>
              <div className="space-y-3">
                <h3 className="font-display font-semibold text-lg text-white uppercase">
                  Destination Network
                </h3>
                <Select
                  value={destinationNetwork}
                  onChange={handleDestinationNetworkChange}
                  options={networkOptions}
                  variant="terminal"
                  className="w-full"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Asset Selection for EVM Networks */}
                {isDestinationNetworkEVM && (
                  <div>
                    <label className="block text-sm font-space font-medium text-cyber-cyan mb-2 uppercase tracking-wider">
                      Select Asset
                    </label>
                    <Select
                      value={destinationAsset}
                      onChange={(value) => setDestinationAsset(value as AssetId)}
                      options={getAvailableAssets(destinationNetwork)}
                      variant="terminal"
                      className="w-full"
                    />
                  </div>
                )}

                {/* Transfer Protocol for Bitcoin destinations */}
                {isBitcoinDestination && (
                  <div>
                    <label className="block text-sm font-space font-medium text-cyber-cyan mb-2 uppercase tracking-wider">
                      Transfer Protocol
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={
                          swapMethod === "lightning" ? "primary" : "ghost"
                        }
                        size="sm"
                        onClick={() => setSwapMethod("lightning")}
                        leftIcon={<Zap className="w-4 h-4" />}
                        className="w-full"
                      >
                        Lightning
                      </Button>
                      <Button
                        variant={swapMethod === "native" ? "primary" : "ghost"}
                        size="sm"
                        onClick={() => setSwapMethod("native")}
                        leftIcon={<Bitcoin className="w-4 h-4" />}
                        className="w-full"
                      >
                        Native
                      </Button>
                    </div>
                  </div>
                )}

                {/* Destination Address for native Bitcoin */}
                {swapMethod === "native" && isBitcoinDestination && (
                  <Input
                    variant="terminal"
                    label="Destination Address"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    placeholder="bc1q..."
                    leftIcon={<Bitcoin className="w-4 h-4" />}
                  />
                )}

                {/* Expected Output */}
                <div className="p-4 bg-cosmic-void/50 border border-cyber-cyan/30 rounded-space">
                  <div className="text-sm font-space text-cyber-cyan uppercase tracking-wider mb-2">
                    Expected Output
                  </div>
                  <div className="text-xl font-mono text-white">
                    {priceQuote
                      ? (priceQuote - feeAmount).toFixed(8)
                      : "0.00000000"}
                  </div>
                  <div className="text-sm text-white/60">
                    {destinationNetwork === ChainId.LIGHTNING || destinationNetwork === ChainId.BTC
                      ? "BTC"
                      : isDestinationNetworkEVM
                        ? destinationAsset
                        : "tokens"}
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="flex items-center space-x-3 p-3 bg-cosmic-dust/30 border border-cyber-cyan/20 rounded-space">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      swapState === "idle"
                        ? "bg-white/50"
                        : swapState === "processing" || swapState === "polling"
                          ? "bg-supernova-yellow animate-pulse"
                          : swapState === "ready"
                            ? "bg-nebula-green animate-pulse"
                            : "bg-cyber-cyan"
                    }`}
                  />
                  <span className="text-sm font-mono text-white/80">
                    {swapState === "idle"
                      ? "Standby"
                      : swapState === "processing"
                        ? "Processing..."
                        : swapState === "polling"
                          ? "Monitoring..."
                          : swapState === "ready"
                            ? "Ready to Claim"
                            : "Completed"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Dashboard */}
        {htlcHash &&
          (swapState === "polling" || swapState === "processing") && (
            <div className="mt-12">
              <SwapStatusDashboard htlcHash={htlcHash} />
            </div>
          )}

        {/* Status Messages */}
        {status && swapState !== "polling" && swapState !== "processing" && (
          <Card variant="terminal" className="mt-8">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Activity className="w-5 h-5 text-cyber-cyan" />
                <h3 className="font-display font-semibold text-white uppercase">
                  System Status
                </h3>
              </div>
              <p className="mt-2 font-mono text-cyber-cyan">{status}</p>
            </CardContent>
          </Card>
        )}

        {/* Ready to Claim */}
        {swapState === "ready" && (
          <Card variant="hologram" className="mt-8 border-nebula-green/50" glow>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-6 h-6 text-nebula-green" />
                <h3 className="font-display font-semibold text-nebula-green uppercase">
                  Ready to Claim
                </h3>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-white/80 mb-6">
                Your Bitcoin payment has been confirmed. You can now claim your
                funds.
              </p>

              {swapMethod === "lightning" && invoice && (
                <div className="space-y-4">
                  <div className="text-sm font-space text-cyber-cyan uppercase tracking-wider">
                    Lightning Invoice
                  </div>
                  <div className="p-4 bg-space-black/80 border border-cyber-cyan/30 rounded-space font-mono text-sm break-all">
                    {invoice}
                  </div>
                  <div className="flex space-x-3">
                    <Button
                      variant="secondary"
                      leftIcon={<Copy className="w-4 h-4" />}
                      onClick={() => navigator.clipboard.writeText(invoice)}
                    >
                      Copy Invoice
                    </Button>
                    <Button
                      variant="ghost"
                      leftIcon={<QrCode className="w-4 h-4" />}
                    >
                      Show QR Code
                    </Button>
                  </div>
                  <p className="text-sm text-white/60">
                    Pay this invoice with your Lightning wallet to receive your
                    BTC.
                  </p>
                </div>
              )}

              {swapMethod === "native" && (
                <div className="space-y-4">
                  <Button
                    glow
                    onClick={claimWithSecret}
                    leftIcon={<Unlock className="w-4 h-4" />}
                    disabled={loading}
                    isLoading={loading}
                  >
                    Reveal Secret & Claim
                  </Button>
                  <p className="text-sm text-white/60">
                    Click to get the secret needed to claim your Bitcoin.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Secret Display */}
        {secret && swapMethod === "native" && (
          <Card variant="terminal" className="mt-8 border-cyber-cyan/50">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Lock className="w-6 h-6 text-cyber-cyan" />
                <h3 className="font-display font-semibold text-cyber-cyan uppercase">
                  Cryptographic Secret
                </h3>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-white/80">
                  Use this secret to claim your Bitcoin:
                </p>
                <div className="p-4 bg-space-black/80 border border-cyber-cyan/30 rounded-space font-mono text-sm break-all text-cyber-cyan">
                  {secret}
                </div>
                <Button
                  variant="secondary"
                  leftIcon={<Copy className="w-4 h-4" />}
                  onClick={() => navigator.clipboard.writeText(secret)}
                >
                  Copy Secret
                </Button>
                <p className="text-sm text-white/60">
                  Instructions: Use this secret as the preimage in your Bitcoin
                  wallet to unlock the HTLC.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* How It Works */}
        <Card variant="glass" className="mt-12">
          <CardHeader>
            <h3 className="font-display font-semibold text-white uppercase text-center">
              Mission Protocol
            </h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                {
                  step: "01",
                  title: "Lock Tokens",
                  description: `Lock your tokens in the smart contract on ${chains[baseNetwork].name}`,
                  icon: <Lock className="w-5 h-5" />,
                },
                {
                  step: "02",
                  title: "Create HTLC",
                  description: `Resolver creates corresponding HTLC on ${chains[destinationNetwork].name}`,
                  icon: <Orbit className="w-5 h-5" />,
                },
                {
                  step: "03",
                  title: "Reveal Secret",
                  description:
                    "Reveal the secret to claim your funds on the destination chain",
                  icon: <Unlock className="w-5 h-5" />,
                },
                {
                  step: "04",
                  title: "Complete Swap",
                  description:
                    "Resolver uses the revealed secret to claim funds on source",
                  icon: <CheckCircle className="w-5 h-5" />,
                },
              ].map((item, index) => (
                <div key={item.step} className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-cyber-cyan/20 to-cyber-purple/20 border border-cyber-cyan/50 rounded-full flex items-center justify-center">
                    {item.icon}
                  </div>
                  <div className="text-lg font-display font-bold text-cyber-cyan mb-2">
                    {item.step}
                  </div>
                  <h4 className="font-space font-semibold text-white uppercase text-sm mb-2">
                    {item.title}
                  </h4>
                  <p className="text-xs text-white/60 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
