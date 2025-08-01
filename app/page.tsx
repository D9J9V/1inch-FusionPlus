import Link from 'next/link';

export default function Home() {
  return (
    <main>
      <h1>Polaris</h1>
      <p>Cross-chain atomic swaps between EVM chains and Bitcoin</p>
      
      <h2>Available Swap Routes</h2>
      <ul>
        <li>
          <Link href="/swap/ethereum/lightning">
            Ethereum → Bitcoin (Lightning Network)
          </Link>
        </li>
        <li>
          <Link href="/swap/base/lightning">
            Base → Bitcoin (Lightning Network)
          </Link>
        </li>
        <li>
          <Link href="/swap/lightning/ethereum">
            Bitcoin → Ethereum
          </Link>
        </li>
        <li>
          <Link href="/swap/lightning/base">
            Bitcoin → Base
          </Link>
        </li>
      </ul>
      
      <h2>Features</h2>
      <ul>
        <li>Trustless atomic swaps using HTLCs</li>
        <li>Support for both Native Bitcoin and Lightning Network</li>
        <li>No bridges required - direct cross-chain swaps</li>
        <li>MEV-protected transactions</li>
      </ul>
      
      <h2>How it Works</h2>
      <ol>
        <li>User locks tokens in an HTLC smart contract on the source chain</li>
        <li>Resolver creates a corresponding HTLC on the destination chain</li>
        <li>User reveals secret to claim funds on destination</li>
        <li>Resolver uses the revealed secret to claim funds on source</li>
      </ol>
      
      <h2>Smart Contract</h2>
      <p>EVMHtlcEscrow deployed at: {process.env.NEXT_PUBLIC_HTLC_CONTRACT_ADDRESS || 'Not deployed yet'}</p>
    </main>
  )
}