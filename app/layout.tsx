import "./globals.css";
import Navigation from "./components/ui/Navigation";
import { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Polaris - Cross-Chain Navigation System",
  description:
    "Navigate the blockchain universe with trustless atomic swaps between Bitcoin/Lightning and EVM chains",
  keywords: [
    "DeFi",
    "Cross-chain",
    "Atomic Swaps",
    "Bitcoin",
    "Lightning",
    "Ethereum",
  ],
  authors: [{ name: "Polaris Team" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#00D4FF",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen bg-cosmic-gradient text-white antialiased">
        {/* Background Effects */}
        <div className="fixed inset-0 pointer-events-none">
          {/* Star field background */}
          <div className="absolute inset-0 bg-star-field opacity-30" />

          {/* Animated particles */}
          <div
            className="absolute top-1/4 left-1/4 particle"
            style={{ animationDelay: "0s" }}
          />
          <div
            className="absolute top-1/3 right-1/4 particle"
            style={{ animationDelay: "1s" }}
          />
          <div
            className="absolute bottom-1/4 left-1/3 particle"
            style={{ animationDelay: "2s" }}
          />
          <div
            className="absolute bottom-1/3 right-1/3 particle"
            style={{ animationDelay: "3s" }}
          />

          {/* Scan lines overlay */}
          <div className="absolute inset-0 bg-scan-lines opacity-20" />
        </div>

        {/* Navigation */}
        <Navigation />

        {/* Main Content */}
        <main className="relative z-10">{children}</main>

        {/* Footer */}
        <footer className="relative z-10 border-t border-cyber-cyan/20 bg-space-black/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center space-x-2 mb-4 md:mb-0">
                <div className="w-2 h-2 bg-cyber-cyan rounded-full animate-pulse" />
                <span className="text-sm font-mono text-cyber-cyan">
                  POLARIS NAVIGATION SYSTEM v1.0
                </span>
              </div>
              <div className="text-sm text-white/60 font-mono">
                Guiding you through the blockchain universe
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
