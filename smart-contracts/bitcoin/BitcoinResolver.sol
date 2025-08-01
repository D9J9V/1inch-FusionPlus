// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./EVMHtlcEscrow.sol";

/**
 * @title BitcoinResolver
 * @dev Ownable contract that acts as the trusted on-chain agent for the off-chain resolver service
 * Centralizes all interactions with the EVMHtlcEscrow contract
 */
contract BitcoinResolver is Ownable {
    using SafeERC20 for IERC20;

    EVMHtlcEscrow public immutable htlcEscrow;

    event SwapInitiated(
        bytes32 indexed htlcHash,
        address indexed user,
        address token,
        uint256 amount
    );

    event SwapClaimed(
        bytes32 indexed htlcHash,
        bytes32 secret
    );

    constructor(address htlcEscrowAddress, address initialOwner) Ownable(initialOwner) {
        require(htlcEscrowAddress != address(0), "Invalid escrow address");
        htlcEscrow = EVMHtlcEscrow(htlcEscrowAddress);
    }

    /**
     * @dev Initiates a new swap by pulling user funds and locking them in the escrow
     * @param userAddress The address of the user initiating the swap
     * @param htlcHash The hash of the secret
     * @param token The token address
     * @param amount The amount of tokens to swap
     * @param timeoutDuration The timeout duration in seconds
     */
    function initiateEvmSwap(
        address userAddress,
        bytes32 htlcHash,
        address token,
        uint256 amount,
        uint256 timeoutDuration
    ) external onlyOwner {
        require(userAddress != address(0), "Invalid user address");
        require(amount > 0, "Amount must be greater than 0");

        // Pull funds from user to this contract
        IERC20(token).safeTransferFrom(userAddress, address(this), amount);

        // Approve the escrow contract to spend the tokens
        IERC20(token).approve(address(htlcEscrow), amount);

        // Initiate the swap in the escrow contract
        htlcEscrow.initiateSwap(htlcHash, token, amount, timeoutDuration);

        emit SwapInitiated(htlcHash, userAddress, token, amount);
    }

    /**
     * @dev Claims a swap by revealing the secret
     * @param secret The secret that hashes to the htlcHash
     */
    function claimEvmSwap(bytes32 secret) external onlyOwner {
        htlcEscrow.claim(secret);
        emit SwapClaimed(sha256(abi.encodePacked(secret)), secret);
    }

    /**
     * @dev Allows the owner to withdraw any tokens sent to this contract by mistake
     * @param token The token address
     * @param to The recipient address
     * @param amount The amount to withdraw
     */
    function emergencyWithdraw(address token, address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid recipient");
        IERC20(token).safeTransfer(to, amount);
    }
}