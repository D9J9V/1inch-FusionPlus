# Polaris

Fusion+ opinionated implementation for Bitcoin (Lightning) and Polkadot (XCM).

[![ETHGlobal Unite](https://img.shields.io/badge/ETHGlobal-Unite%202024-purple)](https://ethglobal.com/events/unite)
[![1inch Fusion+](https://img.shields.io/badge/Powered%20by-1inch%20Fusion+-blue)](https://docs.1inch.io/docs/fusion-swap/introduction)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/D9J9V/1inch-FusionPlus)
[![Coverage](https://img.shields.io/badge/coverage-95%25-brightgreen)](https://github.com/D9J9V/1inch-FusionPlus)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636)](https://soliditylang.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Problem

1inch Fusion+ enables trustless cross-chain swaps between EVM chains and Solana (SVM) through HTLCs and intent-based architecture, but other major non-EVM ecosystems like Bitcoin and Polkadot remain isolated from this liquidity network, forcing users to rely on centralized bridges or forgo access to these blockchain ecosystems entirely.

## Solution

Polaris preserves the trustless, intent-based architecture while leveraging each ecosystem's strengths: Lightning invoices serve as HTLCs for instant Bitcoin swaps, and XCM via Moonbeam enables any Polkadot parachain to participate in cross-chain swaps.

## Key Features

- **Instant Bitcoin Swaps**: Sub-second settlements via Lightning Network instead of 60-minute confirmations
- **Trustless Atomic Swaps**: No bridges, no wrapped tokens - pure cryptographic guarantees
- **Universal Polkadot Access**: One Moonbeam deployment serves all parachains via XCM
- **Gasless Experience**: Users don't pay gas fees - resolvers handle execution costs