export default function AsciiNetworkDiagram() {
  const asciiArt = `
╔═════════════════════════════════════════════════════════════════════════════╗
║         ┌──────────────┐                       ┌──────────────┐             ║
║         │      █       │                       │       █╗     │             ║
║         │   ██████╗    │  BITCOIN              │     ██╔╝     │  LIGHTNING  ║
║         │   ██╔══██╗   │  NETWORK              │   ███╔╝      │  NETWORK    ║
║         │   ██████╔╝   │                       │  █████████╗  │             ║
║         │   ██╔══██╗   │                       │      ╚███    │             ║
║         │   ██████╔╝   │                       │    ╚██       │             ║
║         │      █       │                       │   ╚█         │             ║
║         └──────┬───────┘                       └──────┬───────┘             ║
║                │                                      │                     ║
║                └────────────────────┬─────────────────┘                     ║
║                                     │                                       ║
║                       ╔═════════════╧═════════════╗                         ║
║                       ║          POLARIS          ║                         ║
║                       ╚═════════════╤═════════════╝                         ║
║                                     │                                       ║
║                ┌────────────────────┴─────────────────┐                     ║
║                │                                      │                     ║
║         ┌──────┴───────┐                       ┌──────┴───────┐             ║
║         │              │  UNICHAIN             │              │  ETHEREUM   ║
║         │   ██   ██    │  NETWORK              │  █████████   │             ║
║         │   ██   ██    │                       │  ██          │  (AND MANY  ║
║         │   ██   ██    │                       │  ████████    │  OTHER EVM  ║
║         │    █████     │                       │  ██          │  COMPATIBLE ║
║         │              │                       │  █████████   │  NETWORKS)  ║
║         │   ┌──────┐   │                       │   ┌──────┐   │             ║
║         │   │ LIVE │   │                       │   │COMING│   │             ║
║         │   └──────┘   │                       │   └──────┘   │             ║
║         └──────────────┘                       └──────────────┘             ║
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
}
