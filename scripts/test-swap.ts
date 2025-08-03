#!/usr/bin/env ts-node
const { ethers } = require("ethers");
const { exec } = require("child_process");
const { promisify } = require("util");
const dotenv = require("dotenv");
const path = require("path");

const execAsync = promisify(exec);

// Load env from parent directory
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

// Configuration from environment variables
const CONFIG = {
  rpcUrl: process.env.EVM_RPC_URL!,
  bitcoinResolverAddress: process.env.BITCOIN_RESOLVER_ADDRESS!,
  htlcEscrowAddress: process.env.HTLC_ESCROW_ADDRESS!,
  resolverPrivateKey: process.env.RESOLVER_PRIVATE_KEY!,
  testUserAddress: process.env.TEST_USER_ADDRESS!,
  testUserPrivateKey: process.env.TEST_USER_PRIVATE_KEY!,
  apiUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
};

// Contract ABIs (minimal)
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

const BITCOIN_RESOLVER_ABI = [
  "function initiateEvmSwap(address userAddress, bytes32 htlcHash, address token, uint256 amount, uint256 timeoutDuration)",
];

// Token addresses on Unichain Sepolia
const TOKENS = {
  USDC: "0x31d0220469e10c4E71834a79b1f276d740d3768F", // USDC on Unichain Sepolia
  WBTC: "0x0555e30da8f98308edb960aa94c0db47230d2b9c", // WBTC on Unichain
  ETH: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", // Native ETH
};

async function testSwap() {
  console.log("🚀 Starting test swap...\n");

  // Validate configuration
  for (const [key, value] of Object.entries(CONFIG)) {
    if (!value || value.includes("...")) {
      console.error(`❌ Missing configuration: ${key}`);
      console.log("\nPlease set up your .env file with:");
      console.log("- TEST_USER_ADDRESS: A wallet address with test tokens");
      console.log("- TEST_USER_PRIVATE_KEY: Private key for the test wallet");
      console.log("- RESOLVER_PRIVATE_KEY: Private key for the resolver");
      return;
    }
  }

  try {
    // Connect to provider
    const provider = new ethers.JsonRpcProvider(CONFIG.rpcUrl);
    console.log("✅ Connected to", CONFIG.rpcUrl);

    // Create signers
    const userSigner = new ethers.Wallet(CONFIG.testUserPrivateKey, provider);
    const resolverSigner = new ethers.Wallet(
      CONFIG.resolverPrivateKey,
      provider,
    );

    // Check balances
    const ethBalance = await provider.getBalance(CONFIG.testUserAddress);
    console.log(
      `\n💰 Test user ETH balance: ${ethers.formatEther(ethBalance)} ETH`,
    );

    // Test swap parameters
    // Let's test with USDC since the contract doesn't support native ETH
    const swapParams = {
      fromToken: TOKENS.USDC,
      toToken: "BTC", // This would be handled by the backend
      amount: ethers.parseUnits("3", 6), // 3 USDC (6 decimals)
      swapType: "lightning" as const,
    };

    console.log("\n📋 Swap Parameters:");
    console.log(`  From: 3 USDC`);
    console.log(`  To: BTC (Lightning Network)`);
    console.log(`  Type: ${swapParams.swapType}`);

    // Step 1: Handle approvals (skip for ETH)
    if (swapParams.fromToken !== TOKENS.ETH) {
      console.log("\n1️⃣ Approving Bitcoin Resolver...");
      const tokenContract = new ethers.Contract(
        swapParams.fromToken,
        ERC20_ABI,
        userSigner,
      );

      // Check token balance
      const tokenBalance = await tokenContract.balanceOf(CONFIG.testUserAddress);
      const decimals = await tokenContract.decimals();
      console.log(
        `   Token balance: ${ethers.formatUnits(tokenBalance, decimals)}`,
      );

      if (tokenBalance < swapParams.amount) {
        console.error("❌ Insufficient token balance!");
        return;
      }

      const approveTx = await tokenContract.approve(
        CONFIG.bitcoinResolverAddress,
        swapParams.amount,
      );
      console.log(`   Approval tx: ${approveTx.hash}`);
      await approveTx.wait();
      console.log("   ✅ Approval confirmed");
    } else {
      console.log("\n1️⃣ Using native ETH - no approval needed");
      if (ethBalance < swapParams.amount) {
        console.error("❌ Insufficient ETH balance!");
        return;
      }
    }

    // Step 2: Create swap via API
    console.log("\n2️⃣ Creating swap order...");
    const swapRequestBody = {
      from_token: swapParams.fromToken,
      to_token: swapParams.toToken,
      amount: swapParams.amount.toString(),
      user_address: CONFIG.testUserAddress,
      swap_type: swapParams.swapType,
      from_chain: "unichain",
      to_chain: "lightning",
    };
    
    console.log("   Request body:", JSON.stringify(swapRequestBody));
    
    let swapData;
    try {
      // Use curl to make the request
      const curlCommand = `curl -s -X POST "${CONFIG.apiUrl}/api/execute-swap" \
        -H "Content-Type: application/json" \
        -H "Accept: application/json" \
        -d '${JSON.stringify(swapRequestBody)}'`;
      
      const { stdout, stderr } = await execAsync(curlCommand);
      
      if (stderr) {
        console.error("❌ Curl Error:", stderr);
        return;
      }
      
      console.log("   Raw response:", stdout);
      
      swapData = JSON.parse(stdout);
      
      if (!swapData.success) {
        console.error("❌ API Error:", swapData.error || "Unknown error");
        return;
      }
    } catch (error) {
      console.error("❌ Error:", error.message);
      return;
    }
    console.log("   ✅ Swap created!");
    console.log(`   Swap ID: ${swapData.swap_id}`);
    console.log(`   HTLC Hash: ${swapData.htlc_hash}`);
    console.log(`   EVM TX: ${swapData.evm_tx_hash}`);
    console.log(`   Lightning Invoice: ${swapData.lightning_invoice || "Pending"}`);
    
    // For monitoring, use the swap_id or htlc_hash
    const swapIdentifier = swapData.swap_id || swapData.htlc_hash;

    // Step 3: Monitor swap status
    console.log("\n3️⃣ Monitoring swap status...");
    let status = "processing";
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes with 10s intervals

    while (
      status !== "completed" &&
      status !== "failed" &&
      attempts < maxAttempts
    ) {
      await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds

      try {
        const curlCommand = `curl -s "${CONFIG.apiUrl}/api/swap-status/${swapData.htlc_hash}"`;
        const { stdout } = await execAsync(curlCommand);
        const statusData = JSON.parse(stdout);

        if (statusData.state !== status) {
          status = statusData.state;
          console.log(`   Status update: ${status}`);
          if (statusData.lightning_invoice && !swapData.lightning_invoice) {
            console.log(`   Lightning Invoice: ${statusData.lightning_invoice}`);
            swapData.lightning_invoice = statusData.lightning_invoice;
          }
        }
      } catch (err) {
        console.log("   Error checking status:", err.message);
      }

      attempts++;
    }

    if (status === "completed") {
      console.log("\n🎉 Swap completed successfully!");
    } else if (status === "failed") {
      console.log("\n❌ Swap failed!");
    } else {
      console.log("\n⏱️ Swap timed out - still pending");
    }
  } catch (error) {
    console.error("\n❌ Error:", error);
  }
}

// Run the test
testSwap().catch(console.error);
