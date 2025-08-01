// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title EVMHtlcEscrow
 * @dev A unified EVM contract for handling HTLC-based cross-chain swaps supporting both Native Bitcoin and Lightning Network paths
 */
contract EVMHtlcEscrow {
    using SafeERC20 for IERC20;

    struct Swap {
        bytes32 htlcHash;
        address payable recipient;
        address token;
        uint256 amount;
        uint256 timeout;
    }

    mapping(bytes32 => Swap) public swaps;

    event SwapInitiated(
        bytes32 indexed htlcHash,
        address indexed sender,
        address indexed recipient,
        address token,
        uint256 amount,
        uint256 timeout
    );

    event SwapClaimed(
        bytes32 indexed htlcHash,
        bytes32 secret,
        address indexed claimant
    );

    event SwapRefunded(
        bytes32 indexed htlcHash,
        address indexed recipient
    );

    constructor() {
        // Empty constructor for now
    }
}