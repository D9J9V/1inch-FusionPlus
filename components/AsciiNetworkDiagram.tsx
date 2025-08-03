"use client";

import React from "react";

interface AsciiNetworkDiagramProps {
  activeNetwork?: string;
}

const AsciiNetworkDiagram: React.FC<AsciiNetworkDiagramProps> = ({
  activeNetwork = "unichain",
}) => {
  const isActive = (network: string) =>
    network.toLowerCase() === activeNetwork.toLowerCase();

  return (
    <div className="font-mono text-xs sm:text-sm leading-relaxed whitespace-pre overflow-x-auto">
      <div className="inline-block">
        <div className="text-cyber-cyan">
          {`
    ┌─────────────────────────────────────────────────────────────────────┐
    │                     CROSS-CHAIN ATOMIC SWAPS                        │
    └─────────────────────────────────────────────────────────────────────┘
    
                              ┌──────────────┐
                              │              │
                              │   BITCOIN    │
                              │   NETWORK    │
                              │              │
                              └──────┬───────┘
                                     │
                              ┌──────┴───────┐
                              │              │
                              │  LIGHTNING   │
                              │   NETWORK    │
                              │              │
                              └──────┬───────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                    │        ATOMIC SWAP HUB         │
                    │                │                │
                    └────────────────┼────────────────┘
                                     │
       ┌─────────────────────────────┼─────────────────────────────┐
       │                             │                             │
       │                             │                             │`}
        </div>

        <div className="flex justify-center">
          <div className="flex space-x-4">
            <div
              className={
                isActive("unichain") ? "text-cyber-cyan" : "text-gray-600"
              }
            >
              {`┌─────────────┐`}
            </div>
            <div className="text-gray-600">{`┌─────────────┐`}</div>
            <div className="text-gray-600">{`┌─────────────┐`}</div>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="flex space-x-4">
            <div
              className={
                isActive("unichain") ? "text-cyber-cyan" : "text-gray-600"
              }
            >
              {`│  UNICHAIN   │`}
            </div>
            <div className="text-gray-600">{`│  ETHEREUM   │`}</div>
            <div className="text-gray-600">{`│    BASE     │`}</div>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="flex space-x-4">
            <div
              className={
                isActive("unichain") ? "text-cyber-cyan" : "text-gray-600"
              }
            >
              {`│   [LIVE]    │`}
            </div>
            <div className="text-gray-600">{`│  [COMING]   │`}</div>
            <div className="text-gray-600">{`│  [COMING]   │`}</div>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="flex space-x-4">
            <div
              className={
                isActive("unichain") ? "text-cyber-cyan" : "text-gray-600"
              }
            >
              {`└─────────────┘`}
            </div>
            <div className="text-gray-600">{`└─────────────┘`}</div>
            <div className="text-gray-600">{`└─────────────┘`}</div>
          </div>
        </div>

        <div className="text-cyber-cyan mt-4">
          {`
    ┌─────────────────────────────────────────────────────────────────────┐
    │  FEATURES:                                                          │
    │  • Direct BTC ↔ EVM swaps without wrapped tokens                   │
    │  • Lightning Network support for instant settlements                │
    │  • No intermediaries - pure cryptographic guarantees               │
    │  • MEV-resistant atomic swap protocol                               │
    └─────────────────────────────────────────────────────────────────────┘`}
        </div>
      </div>
    </div>
  );
};

export default AsciiNetworkDiagram;