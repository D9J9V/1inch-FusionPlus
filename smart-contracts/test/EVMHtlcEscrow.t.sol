// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console2} from "forge-std/Test.sol";
import {EVMHtlcEscrow} from "../bitcoin/EVMHtlcEscrow.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _mint(msg.sender, 1000000 * 10**18);
    }
}

contract EVMHtlcEscrowTest is Test {
    EVMHtlcEscrow public escrow;
    MockERC20 public token;
    
    address public user = address(0x1);
    address public resolver = address(0x2);
    address public treasury = address(0x3);
    
    bytes32 public secret = keccak256("test_secret");
    bytes32 public htlcHash;
    
    function setUp() public {
        escrow = new EVMHtlcEscrow(treasury);
        token = new MockERC20("Test Token", "TEST");
        
        // Calculate htlc hash from secret
        htlcHash = sha256(abi.encodePacked(secret));
        
        // Fund user with tokens
        token.transfer(user, 1000 * 10**18);
    }
    
    function testInitiateSwap() public {
        vm.startPrank(user);
        
        // Approve escrow to spend tokens
        token.approve(address(escrow), 100 * 10**18);
        
        // Initiate swap
        escrow.initiateSwap(htlcHash, address(token), 100 * 10**18, 3600);
        
        // Check swap was created
        (bytes32 storedHash, address recipient, address storedToken, uint256 amount, uint256 timeout) = escrow.swaps(htlcHash);
        
        assertEq(storedHash, htlcHash);
        assertEq(recipient, user);
        assertEq(storedToken, address(token));
        assertEq(amount, 100 * 10**18);
        assertGt(timeout, block.timestamp);
        
        // Check tokens were transferred
        assertEq(token.balanceOf(address(escrow)), 100 * 10**18);
        assertEq(token.balanceOf(user), 900 * 10**18);
        
        vm.stopPrank();
    }
    
    function testClaim() public {
        // First initiate a swap
        vm.startPrank(user);
        token.approve(address(escrow), 100 * 10**18);
        escrow.initiateSwap(htlcHash, address(token), 100 * 10**18, 3600);
        vm.stopPrank();
        
        // Resolver claims with secret
        vm.startPrank(resolver);
        uint256 balanceBefore = token.balanceOf(resolver);
        escrow.claim(secret);
        uint256 balanceAfter = token.balanceOf(resolver);
        
        // Check tokens were transferred to resolver (minus 0.3% fee)
        uint256 expectedAmount = 100 * 10**18;
        uint256 expectedFee = (expectedAmount * 30) / 10000; // 0.3%
        assertEq(balanceAfter - balanceBefore, expectedAmount - expectedFee);
        
        // Check treasury received the fee
        assertEq(token.balanceOf(treasury), expectedFee);
        
        // Check swap was deleted
        (,,,uint256 amount,) = escrow.swaps(htlcHash);
        assertEq(amount, 0);
        
        vm.stopPrank();
    }
    
    function testRefund() public {
        // First initiate a swap with short timeout
        vm.startPrank(user);
        token.approve(address(escrow), 100 * 10**18);
        escrow.initiateSwap(htlcHash, address(token), 100 * 10**18, 1);
        
        // Wait for timeout
        vm.warp(block.timestamp + 2);
        
        // Refund
        uint256 balanceBefore = token.balanceOf(user);
        escrow.refund(htlcHash);
        uint256 balanceAfter = token.balanceOf(user);
        
        // Check tokens were returned
        assertEq(balanceAfter - balanceBefore, 100 * 10**18);
        
        // Check swap was deleted
        (,,,uint256 amount,) = escrow.swaps(htlcHash);
        assertEq(amount, 0);
        
        vm.stopPrank();
    }
    
    function testCannotClaimAfterTimeout() public {
        // First initiate a swap with short timeout
        vm.startPrank(user);
        token.approve(address(escrow), 100 * 10**18);
        escrow.initiateSwap(htlcHash, address(token), 100 * 10**18, 1);
        vm.stopPrank();
        
        // Wait for timeout
        vm.warp(block.timestamp + 2);
        
        // Try to claim after timeout
        vm.startPrank(resolver);
        vm.expectRevert("Swap has timed out");
        escrow.claim(secret);
        vm.stopPrank();
    }
    
    function testCannotRefundBeforeTimeout() public {
        // First initiate a swap
        vm.startPrank(user);
        token.approve(address(escrow), 100 * 10**18);
        escrow.initiateSwap(htlcHash, address(token), 100 * 10**18, 3600);
        
        // Try to refund before timeout
        vm.expectRevert("Swap has not timed out yet");
        escrow.refund(htlcHash);
        
        vm.stopPrank();
    }
}