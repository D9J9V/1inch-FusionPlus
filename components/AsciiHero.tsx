"use client";

import React, { useEffect, useState } from "react";

const AsciiHero = () => {
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
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║                         ${sparkles[sparkleFrame][1]}     ${sparkles[sparkleFrame][2]}     ${sparkles[sparkleFrame][3]}                               ║
║                                                                               ║
║   ██████╗   ██████╗  ██╗       █████╗  ██████╗  ██╗ ███████╗                ║
║   ██╔══██╗ ██╔═══██╗ ██║      ██╔══██╗ ██╔══██╗ ██║ ██╔════╝                ║
║   ██████╔╝ ██║   ██║ ██║      ███████║ ██████╔╝ ██║ ███████╗                ║
║   ██╔═══╝  ██║   ██║ ██║      ██╔══██║ ██╔══██╗ ██║ ╚════██║                ║
║   ██║      ╚██████╔╝ ███████╗ ██║  ██║ ██║  ██║ ██║ ███████║                ║
║   ╚═╝       ╚═════╝  ╚══════╝ ╚═╝  ╚═╝ ╚═╝  ╚═╝ ╚═╝ ╚══════╝                ║
║                                                                               ║
║   ─────────────────────────────────────────────────────────────────────      ║
║                                                                               ║
║                    Cross-Chain Bridge Protocol v2.0                           ║
║                                                                               ║
║   ┌─────────────────────────────────────────────────────────────────┐        ║
║   │                                                                 │        ║
║   │  • Trustless atomic swaps between chains                       │        ║
║   │  • Bitcoin & Lightning Network integration                     │        ║
║   │  • EVM chain compatibility                                     │        ║
║   │  • Powered by 1inch Fusion+ technology                         │        ║
║   │                                                                 │        ║
║   └─────────────────────────────────────────────────────────────────┘        ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
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

export default AsciiHero;