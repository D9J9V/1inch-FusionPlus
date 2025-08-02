"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Star,
  Zap,
  Shield,
  Orbit,
  ArrowRight,
  Bitcoin,
  Layers,
  Lock,
  Unlock,
  Activity,
  ChevronDown,
} from "lucide-react";
import Button from "./components/ui/Button";
import { Card, CardContent, CardHeader } from "./components/ui/Card";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [activeRoute, setActiveRoute] = useState(0);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setActiveRoute((prev) => (prev + 1) % swapRoutes.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const swapRoutes = [
    {
      from: "Ethereum",
      to: "Lightning Network",
      href: "/swap/ethereum/lightning",
      icon: <Zap className="w-5 h-5" />,
      color: "from-blue-500 to-yellow-400",
      description: "Instant micro-payments",
    },
    {
      from: "Base",
      to: "Bitcoin",
      href: "/swap/base/btc",
      icon: <Bitcoin className="w-5 h-5" />,
      color: "from-blue-600 to-orange-500",
      description: "Layer 2 to native BTC",
    },
    {
      from: "Lightning",
      to: "Ethereum",
      href: "/swap/lightning/ethereum",
      icon: <Layers className="w-5 h-5" />,
      color: "from-yellow-400 to-blue-500",
      description: "Lightning to DeFi",
    },
    {
      from: "Unichain",
      to: "Lightning",
      href: "/swap/unichain/lightning",
      icon: <Orbit className="w-5 h-5" />,
      color: "from-purple-500 to-yellow-400",
      description: "Next-gen swaps",
    },
  ];

  const features = [
    {
      icon: <Lock className="w-8 h-8" />,
      title: "Trustless Atomic Swaps",
      description:
        "No intermediaries. Pure cryptographic guarantees using Hash Time-Locked Contracts.",
      color: "cyber-cyan",
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "MEV Protection",
      description:
        "Advanced protection against Maximum Extractable Value attacks and front-running.",
      color: "cyber-purple",
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Lightning Fast",
      description:
        "Support for both Bitcoin on-chain and Lightning Network for instant settlements.",
      color: "cyber-orange",
    },
    {
      icon: <Orbit className="w-8 h-8" />,
      title: "Cross-Chain Native",
      description:
        "Direct swaps between incompatible blockchains without bridges or wrapped tokens.",
      color: "nebula-green",
    },
  ];

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-cyber-cyan font-mono">
          <div className="animate-spin w-8 h-8 border-2 border-cyber-cyan border-t-transparent rounded-full mx-auto mb-4" />
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          {/* Large Polaris Star */}
          <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <span className="text-8xl opacity-85">✨</span>
          </div>

          {/* Orbital Rings */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div
              className="w-96 h-96 border border-cyber-cyan/20 rounded-full animate-spin"
              style={{ animationDuration: "20s" }}
            >
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-cyber-cyan rounded-full" />
            </div>
            <div
              className="w-80 h-80 border border-cyber-purple/20 rounded-full animate-spin absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              style={{
                animationDuration: "15s",
                animationDirection: "reverse",
              }}
            >
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-cyber-purple rounded-full" />
            </div>
          </div>

          {/* Constellation Pattern */}
          <div className="absolute inset-0 opacity-30">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Title */}
          <div className="mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="relative"></div>
            </div>

            <h1 className="pt-20 text-6xl md:text-8xl font-display font-bold mb-6 bg-gradient-to-r from-cyber-cyan via-cyber-purple to-cyber-cyan bg-clip-text text-transparent animate-hologram">
              POLARIS
            </h1>

            <div className="text-xl md:text-2xl font-space text-cyber-cyan/80 mb-4 uppercase tracking-widest">
              Cross-Chain Bridge Protocol
            </div>

            <p className="text-lg md:text-xl text-white/70 max-w-3xl mx-auto leading-relaxed">
              Trustless atomic swaps between
              <span className="text-cyber-orange font-semibold">
                {" "}
                Bitcoin/Lightning
              </span>{" "}
              and
              <span className="text-cyber-cyan font-semibold"> EVM chains</span>
              . Secure cross-chain transfers without intermediaries.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button
              size="xl"
              glow
              pulse
              rightIcon={<ArrowRight className="w-5 h-5" />}
              className="min-w-[200px]"
            >
              Start Swap
            </Button>

            <Button
              variant="secondary"
              size="xl"
              leftIcon={<Activity className="w-5 h-5" />}
              className="min-w-[200px]"
            >
              Dashboard
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card variant="hologram" className="text-center">
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-cyber-cyan mb-2">0</div>
                <div className="text-sm font-space uppercase tracking-wider text-white/70">
                  Trustless Swaps
                </div>
              </CardContent>
            </Card>

            <Card variant="hologram" className="text-center">
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-cyber-purple mb-2">
                  ⚡
                </div>
                <div className="text-sm font-space uppercase tracking-wider text-white/70">
                  Lightning Fast
                </div>
              </CardContent>
            </Card>

            <Card variant="hologram" className="text-center">
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-nebula-green mb-2">
                  🛡️
                </div>
                <div className="text-sm font-space uppercase tracking-wider text-white/70">
                  MEV Protected
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <ChevronDown className="w-6 h-6 text-cyber-cyan/60" />
          </div>
        </div>
      </section>

      {/* Swap Routes Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
              Supported Routes
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Available cross-chain swap routes with direct atomic swaps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {swapRoutes.map((route, index) => (
              <Link key={route.href} href={route.href}>
                <Card
                  variant="hologram"
                  className={`h-full transition-all duration-500 hover:scale-105 cursor-pointer ${
                    activeRoute === index
                      ? "ring-2 ring-cyber-cyan/50 shadow-glow-cyan"
                      : ""
                  }`}
                  glow={activeRoute === index}
                >
                  <CardHeader className="text-center">
                    <div
                      className={`w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-r ${route.color} p-3 flex items-center justify-center`}
                    >
                      {route.icon}
                    </div>
                    <h3 className="font-space font-semibold text-lg text-white uppercase tracking-wider">
                      {route.from}
                    </h3>
                    <div className="flex items-center justify-center my-2">
                      <ArrowRight className="w-4 h-4 text-cyber-cyan" />
                    </div>
                    <h3 className="font-space font-semibold text-lg text-cyber-cyan uppercase tracking-wider">
                      {route.to}
                    </h3>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-white/60 text-center font-mono">
                      {route.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-cosmic-dust/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
              Key Features
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Advanced technology powering the future of cross-chain
              transactions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card
                key={feature.title}
                variant="terminal"
                className="text-center h-full"
              >
                <CardContent className="p-8">
                  <div
                    className={`text-${feature.color} mb-6 flex justify-center`}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="font-space font-semibold text-lg text-white mb-4 uppercase tracking-wider">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-white/70 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
              How It Works
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              The atomic swap sequence that ensures trustless cross-chain
              transactions
            </p>
          </div>

          <div className="relative">
            {/* Connection Line */}
            <div className="absolute left-8 top-16 bottom-16 w-0.5 bg-gradient-to-b from-cyber-cyan via-cyber-purple to-cyber-cyan opacity-50 hidden md:block" />

            <div className="space-y-12">
              {[
                {
                  step: "01",
                  title: "Lock Initiation",
                  description:
                    "User locks tokens in an HTLC smart contract on the source chain with cryptographic hash",
                  icon: <Lock className="w-6 h-6" />,
                },
                {
                  step: "02",
                  title: "Cross-Chain HTLC",
                  description:
                    "Resolver creates corresponding HTLC on destination chain with same hash lock",
                  icon: <Orbit className="w-6 h-6" />,
                },
                {
                  step: "03",
                  title: "Secret Revelation",
                  description:
                    "User reveals secret to claim funds on destination chain, exposing the preimage",
                  icon: <Unlock className="w-6 h-6" />,
                },
                {
                  step: "04",
                  title: "Atomic Completion",
                  description:
                    "Resolver uses revealed secret to claim funds on source chain, completing the swap",
                  icon: <Zap className="w-6 h-6" />,
                },
              ].map((item, index) => (
                <div key={item.step} className="flex items-start space-x-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-r from-cyber-cyan/20 to-cyber-purple/20 border border-cyber-cyan/50 rounded-full flex items-center justify-center">
                      {item.icon}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <span className="text-2xl font-display font-bold text-cyber-cyan">
                        {item.step}
                      </span>
                      <h3 className="text-xl font-space font-semibold text-white uppercase tracking-wider">
                        {item.title}
                      </h3>
                    </div>
                    <p className="text-white/70 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-cyber-cyan/10 to-cyber-purple/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
            Ready to Start?
          </h2>
          <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
            Experience secure cross-chain swaps with no intermediaries.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/swap/ethereum/lightning">
              <Button
                size="xl"
                glow
                pulse
                rightIcon={<ArrowRight className="w-5 h-5" />}
                className="min-w-[250px]"
              >
                Start Cross-Chain Swap
              </Button>
            </Link>

            <Link href="/docs">
              <Button
                variant="secondary"
                size="xl"
                leftIcon={<Activity className="w-5 h-5" />}
                className="min-w-[250px]"
              >
                View Documentation
              </Button>
            </Link>
          </div>

          {/* Contract Address */}
          <div className="mt-12 p-6 bg-space-black/50 border border-cyber-cyan/30 rounded-space backdrop-blur-sm">
            <div className="text-sm font-space text-cyber-cyan uppercase tracking-wider mb-2">
              Smart Contract Address
            </div>
            <div className="font-mono text-white/80 break-all">
              {process.env.NEXT_PUBLIC_HTLC_CONTRACT_ADDRESS ||
                "Deploying to mainnet..."}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
