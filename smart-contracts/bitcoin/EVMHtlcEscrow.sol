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
    
    // Fee configuration
    uint256 public constant FEE_BASIS_POINTS = 30; // 0.3% = 30 basis points
    address public immutable treasuryAddress;

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

    constructor(address _treasuryAddress) {
        require(_treasuryAddress != address(0), "Invalid treasury address");
        treasuryAddress = _treasuryAddress;
    }

    function initiateSwap(
        bytes32 htlcHash,
        address token,
        uint256 amount,
        uint256 timeoutDuration
    ) external {
        require(swaps[htlcHash].amount == 0, "Swap already exists");
        require(amount > 0, "Amount must be greater than 0");
        require(timeoutDuration > 0, "Timeout duration must be greater than 0");
        
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        
        swaps[htlcHash] = Swap({
            htlcHash: htlcHash,
            recipient: payable(msg.sender),
            token: token,
            amount: amount,
            timeout: block.timestamp + timeoutDuration
        });
        
        emit SwapInitiated(
            htlcHash,
            msg.sender,
            msg.sender,
            token,
            amount,
            block.timestamp + timeoutDuration
        );
    }

    function claim(bytes32 secret) external {
        bytes32 hash = sha256(abi.encodePacked(secret));
        Swap storage swap = swaps[hash];
        
        require(swap.amount > 0, "Swap does not exist");
        require(block.timestamp < swap.timeout, "Swap has timed out");
        
        uint256 amount = swap.amount;
        address token = swap.token;
        
        // Calculate fee (0.3% of the swap amount)
        uint256 fee = (amount * FEE_BASIS_POINTS) / 10000;
        uint256 amountAfterFee = amount - fee;
        
        delete swaps[hash];
        
        // Transfer amount minus fee to the claimer (resolver)
        IERC20(token).safeTransfer(msg.sender, amountAfterFee);
        
        // Transfer fee to treasury
        if (fee > 0) {
            IERC20(token).safeTransfer(treasuryAddress, fee);
        }
        
        emit SwapClaimed(hash, secret, msg.sender);
    }

    function calculateFee(uint256 amount) external pure returns (uint256) {
        return (amount * FEE_BASIS_POINTS) / 10000;
    }
    
    function refund(bytes32 htlcHash) external {
        Swap storage swap = swaps[htlcHash];
        
        require(swap.amount > 0, "Swap does not exist");
        require(block.timestamp >= swap.timeout, "Swap has not timed out yet");
        require(msg.sender == swap.recipient, "Only recipient can refund");
        
        uint256 amount = swap.amount;
        address token = swap.token;
        address recipient = swap.recipient;
        
        delete swaps[htlcHash];
        
        IERC20(token).safeTransfer(recipient, amount);
        
        emit SwapRefunded(htlcHash, recipient);
    }
}