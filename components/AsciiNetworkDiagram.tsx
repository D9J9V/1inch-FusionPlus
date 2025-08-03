"use client";

import React, { useEffect, useState } from "react";

interface AsciiNetworkDiagramProps {
  activeNetwork?: string;
}

const AsciiNetworkDiagram: React.FC<AsciiNetworkDiagramProps> = ({
  activeNetwork = "unichain",
}) => {
  const [sparkleFrame, setSparkleFrame] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSparkleFrame((prev) => (prev + 1) % 3);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  const sparkles = [
    ["  ·  ", " · · ", "· · ·", " · · ", "  ·  "],
    [" · · ", "· · ·", "  ·  ", "· · ·", " · · "],
    ["· · ·", "  ·  ", " · · ", "  ·  ", "· · ·"],
  ];

  const asciiArt = `
╔═════════════════════════════════════════════════════════════════════════════╗
║                                                                             ║
║                   CROSS-CHAIN ATOMIC SWAP ARCHITECTURE                      ║
║                                                                             ║
║                     ${sparkles[sparkleFrame][1]}     ${sparkles[sparkleFrame][2]}     ${sparkles[sparkleFrame][3]}                               ║
║                                                                             ║
║                           ┌──────────────┐             ┌──────────────┐                        ║
║                           │   ██████╗    │             │    ██│                       ║
║                           │   ██╔══██╗   │  BITCOIN        █████████╗    LIGHTNING    ║
║                           │   ██████╔╝   │  NETWORK              ███    NETWORK    ║
║                           │   ██╔══██╗   │                                  ║
║                           │   ██████╔╝   │                                  ║
║                           └──────┬───────┘             └──────┬───────┘                     ║
║                                  │                             │
                                   └───────────────────────┴─────┘ 
║                                  │                                          ║
║                    ╔═════════════╧═════════════╗                            ║
║                    ║    ATOMIC SWAP BRIDGE     ║                            ║
║                    ╚═════════════╤═════════════╝                            ║
║                                  │                                          ║
║         ┌────────────────────────┴────────────────────────┐                ║
║         │                        │                        │                ║
║   ┌─────┴─────┐           ┌─────┴─────┐           ┌─────┴─────┐           ║
║   │ UNICHAIN  │           │ ETHEREUM  │           │   BASE    │           ║
║   │  ██   ██  │           │   ████        │           │  ██     │           ║
║   │  ██   ██  │           │  ███  ██   │           │  █████   │           ║
║   │  ██   ██  │           │  ███   │           │  ██   ██  │           ║
║   │   ████    │           │   ██████  │           │  █████  │           ║
║   │ ┌──────┐  │           │ ┌──────┐  │           │ ┌──────┐  │           ║
║   │ │ LIVE │  │           │ │COMING│  │           │ │COMING│  │           ║
║   │ └──────┘  │           │ └──────┘  │           │ └──────┘  │           ║
║   └───────────┘           └───────────┘           └───────────┘           ║
║                                                                             ║
║   ─────────────────────────────────────────────────────────────────────    ║
║                                                                             ║
║   ┌─────────────────────────────────────────────────────────────────┐      ║
║   │  • Direct BTC ↔ EVM swaps without wrapped tokens                │      ║
║   │  • Lightning Network support for instant settlements             │      ║
║   │  • No intermediaries - pure cryptographic guarantees            │      ║
║   │  • MEV-resistant atomic swap protocol                           │      ║
║   └─────────────────────────────────────────────────────────────────┘      ║
║                                                                             ║
╚═════════════════════════════════════════════════════════════════════════════╝
`;

  return (
    <div className="font-mono text-xs sm:text-sm lg:text-base whitespace-pre text-center">
      <div className="inline-block text-left">
        <pre className="bg-gradient-to-r from-cyber-cyan via-cyber-purple to-cyber-cyan bg-clip-text text-transparent">
          {asciiArt}
        </pre>
      </div>
    </div>
  );
};

export default AsciiNetworkDiagram;
