// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/**
 * @title PartialFillHTLC
 * @dev Extension of HTLC that supports partial fills using Merkle trees
 * @notice Allows cross-chain swaps to be filled in multiple parts with gas-efficient verification
 */
contract PartialFillHTLC is ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct PartialSwap {
        address token;
        uint256 totalAmount;
        uint256 remainingAmount;
        address recipient;
        address resolver;
        uint256 timeout;
        uint256 minFillAmount;
        bytes32 merkleRoot; // Root of the Merkle tree containing all valid secret hashes and amounts
        mapping(bytes32 => bool) usedSecrets;
    }
    
    mapping(bytes32 => PartialSwap) public swaps;
    
    event PartialSwapCreated(
        bytes32 indexed masterHash,
        address indexed token,
        uint256 totalAmount,
        uint256 minFillAmount,
        address recipient,
        address resolver,
        uint256 timeout,
        bytes32 merkleRoot
    );
    
    event PartialFill(
        bytes32 indexed masterHash,
        bytes32 indexed secretHash,
        uint256 amount,
        address indexed claimant
    );
    
    event SwapRefunded(bytes32 indexed masterHash, uint256 amount);
    
    /**
     * @dev Creates a new partial fill HTLC with Merkle tree verification
     * @param masterHash The master hash for the swap
     * @param token The token address
     * @param totalAmount Total amount to be swapped
     * @param minFillAmount Minimum amount per partial fill
     * @param recipient The recipient address
     * @param timeout The timeout timestamp
     * @param merkleRoot The root of the Merkle tree containing valid fills
     * 
     * The Merkle tree should be constructed with leaves of format:
     * keccak256(abi.encodePacked(secretHash, amount))
     */
    function createPartialSwap(
        bytes32 masterHash,
        address token,
        uint256 totalAmount,
        uint256 minFillAmount,
        address recipient,
        uint256 timeout,
        bytes32 merkleRoot
    ) external nonReentrant {
        require(swaps[masterHash].totalAmount == 0, "Swap already exists");
        require(minFillAmount > 0, "Min fill amount must be positive");
        require(timeout > block.timestamp, "Timeout must be in future");
        require(merkleRoot != bytes32(0), "Invalid merkle root");
        
        // Transfer tokens from sender
        IERC20(token).safeTransferFrom(msg.sender, address(this), totalAmount);
        
        // Create swap
        PartialSwap storage swap = swaps[masterHash];
        swap.token = token;
        swap.totalAmount = totalAmount;
        swap.remainingAmount = totalAmount;
        swap.recipient = recipient;
        swap.resolver = msg.sender;
        swap.timeout = timeout;
        swap.minFillAmount = minFillAmount;
        swap.merkleRoot = merkleRoot;
        
        emit PartialSwapCreated(
            masterHash,
            token,
            totalAmount,
            minFillAmount,
            recipient,
            msg.sender,
            timeout,
            merkleRoot
        );
    }
    
    /**
     * @dev Claims a partial fill with a secret and Merkle proof
     * @param masterHash The master hash for the swap
     * @param secret The secret that hashes to one of the registered secret hashes
     * @param amount The amount to claim for this secret
     * @param merkleProof The Merkle proof for this secret-amount pair
     */
    function claimPartialFill(
        bytes32 masterHash,
        bytes32 secret,
        uint256 amount,
        bytes32[] calldata merkleProof
    ) external nonReentrant {
        PartialSwap storage swap = swaps[masterHash];
        require(swap.totalAmount > 0, "Swap doesn't exist");
        require(swap.remainingAmount > 0, "Swap fully claimed");
        require(block.timestamp < swap.timeout, "Swap expired");
        require(amount >= swap.minFillAmount, "Amount below minimum");
        require(amount <= swap.remainingAmount, "Insufficient remaining amount");
        
        bytes32 secretHash = sha256(abi.encodePacked(secret));
        require(!swap.usedSecrets[secretHash], "Secret already used");
        
        // Verify Merkle proof
        bytes32 leaf = keccak256(abi.encodePacked(secretHash, amount));
        require(
            MerkleProof.verify(merkleProof, swap.merkleRoot, leaf),
            "Invalid merkle proof"
        );
        
        // Mark secret as used
        swap.usedSecrets[secretHash] = true;
        swap.remainingAmount -= amount;
        
        // Transfer tokens to recipient
        IERC20(swap.token).safeTransfer(swap.recipient, amount);
        
        emit PartialFill(masterHash, secretHash, amount, msg.sender);
    }
    
    /**
     * @dev Claims multiple partial fills in a single transaction
     * @param masterHash The master hash for the swap
     * @param claims Array of claim data (secrets, amounts, and proofs)
     */
    function claimMultiplePartialFills(
        bytes32 masterHash,
        bytes32[] calldata secrets,
        uint256[] calldata amounts,
        bytes32[][] calldata merkleProofs
    ) external nonReentrant {
        require(
            secrets.length == amounts.length && amounts.length == merkleProofs.length,
            "Array length mismatch"
        );
        
        PartialSwap storage swap = swaps[masterHash];
        require(swap.totalAmount > 0, "Swap doesn't exist");
        require(swap.remainingAmount > 0, "Swap fully claimed");
        require(block.timestamp < swap.timeout, "Swap expired");
        
        uint256 totalClaimAmount = 0;
        
        for (uint256 i = 0; i < secrets.length; i++) {
            bytes32 secretHash = sha256(abi.encodePacked(secrets[i]));
            
            // Skip if secret already used
            if (swap.usedSecrets[secretHash]) {
                continue;
            }
            
            // Verify amount meets minimum
            require(amounts[i] >= swap.minFillAmount, "Amount below minimum");
            
            // Verify Merkle proof
            bytes32 leaf = keccak256(abi.encodePacked(secretHash, amounts[i]));
            require(
                MerkleProof.verify(merkleProofs[i], swap.merkleRoot, leaf),
                "Invalid merkle proof"
            );
            
            // Mark secret as used
            swap.usedSecrets[secretHash] = true;
            totalClaimAmount += amounts[i];
            
            emit PartialFill(masterHash, secretHash, amounts[i], msg.sender);
        }
        
        require(totalClaimAmount > 0, "No valid claims");
        require(totalClaimAmount <= swap.remainingAmount, "Insufficient remaining amount");
        
        swap.remainingAmount -= totalClaimAmount;
        
        // Transfer tokens to recipient
        IERC20(swap.token).safeTransfer(swap.recipient, totalClaimAmount);
    }
    
    /**
     * @dev Refunds remaining tokens after timeout
     * @param masterHash The master hash for the swap
     */
    function refund(bytes32 masterHash) external nonReentrant {
        PartialSwap storage swap = swaps[masterHash];
        require(swap.totalAmount > 0, "Swap doesn't exist");
        require(swap.remainingAmount > 0, "Nothing to refund");
        require(block.timestamp >= swap.timeout, "Swap not expired");
        require(msg.sender == swap.resolver, "Only resolver can refund");
        
        uint256 refundAmount = swap.remainingAmount;
        swap.remainingAmount = 0;
        
        IERC20(swap.token).safeTransfer(swap.resolver, refundAmount);
        
        emit SwapRefunded(masterHash, refundAmount);
    }
    
    /**
     * @dev Gets swap details
     * @param masterHash The master hash for the swap
     */
    function getSwapDetails(bytes32 masterHash) external view returns (
        address token,
        uint256 totalAmount,
        uint256 remainingAmount,
        address recipient,
        address resolver,
        uint256 timeout,
        uint256 minFillAmount,
        bytes32 merkleRoot
    ) {
        PartialSwap storage swap = swaps[masterHash];
        return (
            swap.token,
            swap.totalAmount,
            swap.remainingAmount,
            swap.recipient,
            swap.resolver,
            swap.timeout,
            swap.minFillAmount,
            swap.merkleRoot
        );
    }
    
    /**
     * @dev Checks if a secret has been used
     * @param masterHash The master hash for the swap
     * @param secretHash The secret hash to check
     */
    function isSecretUsed(bytes32 masterHash, bytes32 secretHash) external view returns (bool) {
        return swaps[masterHash].usedSecrets[secretHash];
    }
    
    /**
     * @dev Verifies if a secret-amount pair is valid for a swap
     * @param masterHash The master hash for the swap
     * @param secretHash The secret hash
     * @param amount The amount to verify
     * @param merkleProof The merkle proof
     */
    function verifyPartialFill(
        bytes32 masterHash,
        bytes32 secretHash,
        uint256 amount,
        bytes32[] calldata merkleProof
    ) external view returns (bool) {
        PartialSwap storage swap = swaps[masterHash];
        if (swap.totalAmount == 0) return false;
        
        bytes32 leaf = keccak256(abi.encodePacked(secretHash, amount));
        return MerkleProof.verify(merkleProof, swap.merkleRoot, leaf);
    }
}