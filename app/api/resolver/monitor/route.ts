import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

// This would typically be an environment variable
const EVM_RPC_URL = process.env.EVM_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/your-api-key';
const CONTRACT_ADDRESS = process.env.HTLC_CONTRACT_ADDRESS || '';

// ABI for the SwapInitiated event
const CONTRACT_ABI = [
  "event SwapInitiated(bytes32 indexed htlcHash, address indexed sender, address indexed recipient, address token, uint256 amount, uint256 timeout)"
];

export async function GET(request: NextRequest) {
  try {
    // In a real implementation, this would be a WebSocket or Server-Sent Events endpoint
    // For now, we'll return the latest events
    
    if (!CONTRACT_ADDRESS) {
      return NextResponse.json(
        { success: false, error: 'Contract address not configured' },
        { status: 500 }
      );
    }
    
    const provider = new ethers.JsonRpcProvider(EVM_RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    
    // Get the latest block number
    const latestBlock = await provider.getBlockNumber();
    
    // Query for SwapInitiated events in the last 100 blocks
    const events = await contract.queryFilter(
      contract.filters.SwapInitiated(),
      latestBlock - 100,
      latestBlock
    );
    
    const formattedEvents = events.map(event => ({
      htlcHash: event.args?.htlcHash,
      sender: event.args?.sender,
      recipient: event.args?.recipient,
      token: event.args?.token,
      amount: event.args?.amount?.toString(),
      timeout: event.args?.timeout?.toString(),
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash
    }));
    
    return NextResponse.json({
      success: true,
      events: formattedEvents,
      latestBlock
    });
  } catch (error) {
    console.error('Error monitoring events:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to monitor events' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // This endpoint could be used to register webhooks or start monitoring specific addresses
    const body = await request.json();
    const { address, fromBlock } = body;
    
    // TODO: Implement webhook registration or persistent monitoring
    // For now, we'll just validate the inputs
    
    if (!address || !ethers.isAddress(address)) {
      return NextResponse.json(
        { success: false, error: 'Invalid address' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Monitoring request received',
      address,
      fromBlock: fromBlock || 'latest'
    });
  } catch (error) {
    console.error('Error starting monitor:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to start monitoring' },
      { status: 500 }
    );
  }
}