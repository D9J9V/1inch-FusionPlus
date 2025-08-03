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
import Button from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import AsciiHero from "@/components/AsciiHero";
import AsciiNetworkDiagram from "@/components/AsciiNetworkDiagram";

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
      from: "Unichain",
      to: "Lightning",
      href: "/swap/unichain/lightning",
      icon: <Orbit className="w-5 h-5" />,
      color: "from-purple-500 to-yellow-400",
      description: "EVM to Lightning Network",
      active: true,
    },
    {
      from: "Unichain",
      to: "Bitcoin",
      href: "/swap/unichain/btc",
      icon: <Bitcoin className="w-5 h-5" />,
      color: "from-purple-500 to-orange-500",
      description: "EVM to native BTC",
      active: true,
    },
    {
      from: "Ethereum",
      to: "Lightning",
      href: "/swap/ethereum/lightning",
      icon: <Zap className="w-5 h-5" />,
      color: "from-blue-500 to-yellow-400",
      description: "Coming soon",
      active: false,
    },
    {
      from: "Base",
      to: "Bitcoin",
      href: "/swap/base/btc",
      icon: <Bitcoin className="w-5 h-5" />,
      color: "from-blue-600 to-orange-500",
      description: "Coming soon",
      active: false,
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
        {/* Hero Content */}
        <div className="relative z-10 text-center max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Title */}
          <div className="mb-8">
            <AsciiHero />
          </div>

          {/* Swap Button */}
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
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 animate-bounce">
            <ChevronDown className="w-6 h-6 text-cyber-cyan/60" />
          </div>
        </div>
      </section>

      {/* Swap Routes Section */}
      <section className="py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
              Cross-Chain Trading Routes
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto mb-2">
              Trade directly between Bitcoin, Lightning Network and any EVM chain
            </p>
            <p className="text-lg text-cyber-cyan/80 font-mono">
              No wrapped tokens. No bridges. Pure atomic swaps.
            </p>
          </div>

          {/* ASCII Network Diagram */}
          <div className="mb-16 flex justify-center">
            <Card variant="terminal" className="p-6 max-w-4xl w-full">
              <AsciiNetworkDiagram activeNetwork="unichain" />
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {swapRoutes.map((route, index) => (
              <div key={route.href} className={route.active ? "" : "opacity-40"}>
                <Link 
                  href={route.active ? route.href : "#"} 
                  className={!route.active ? "cursor-not-allowed" : ""}
                  onClick={(e) => !route.active && e.preventDefault()}
                >
                  <Card
                    variant="hologram"
                    className={`h-full transition-all duration-500 ${
                      route.active ? "hover:scale-105 cursor-pointer" : "cursor-not-allowed"
                    } ${
                      activeRoute === index && route.active
                        ? "ring-2 ring-cyber-cyan/50 shadow-glow-cyan"
                        : ""
                    }`}
                    glow={activeRoute === index && route.active}
                  >
                    <CardHeader className="text-center">
                      <div
                        className={`w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-r ${route.color} p-3 flex items-center justify-center ${
                          !route.active ? "grayscale" : ""
                        }`}
                      >
                        {route.icon}
                      </div>
                      <h3 className={`font-space font-semibold text-lg uppercase tracking-wider ${
                        route.active ? "text-white" : "text-gray-500"
                      }`}>
                        {route.from}
                      </h3>
                      <div className="flex items-center justify-center my-2">
                        <ArrowRight className={`w-4 h-4 ${
                          route.active ? "text-cyber-cyan" : "text-gray-600"
                        }`} />
                      </div>
                      <h3 className={`font-space font-semibold text-lg uppercase tracking-wider ${
                        route.active ? "text-cyber-cyan" : "text-gray-500"
                      }`}>
                        {route.to}
                      </h3>
                    </CardHeader>
                    <CardContent>
                      <p className={`text-sm text-center font-mono ${
                        route.active ? "text-white/60" : "text-gray-600"
                      }`}>
                        {route.description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </div>
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

            <Link href="https://github.com/D9J9V/polaris">
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
