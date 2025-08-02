import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

// In production, this would fetch from a secure database
// For demo purposes, we'll use environment variables and mock data

interface StoredSwap {
  htlcHash: string;
  secret: string;
  status: string;
  userAddress: string;
  claimable: boolean;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { htlcHash: string } }
) {
  try {
    const { htlcHash } = params;

    if (!htlcHash) {
      return NextResponse.json(
        { success: false, error: 'HTLC hash required' },
        { status: 400 }
      );
    }

    // Verify authorization - in production, check if the requester is authorized
    const authHeader = request.headers.get('authorization');
    const userAddress = request.headers.get('x-user-address');

    if (!authHeader || !userAddress) {
      return NextResponse.json(
        { success: false, error: 'Authorization required' },
        { status: 401 }
      );
    }

    // In production, fetch swap from database
    // const swap = await getSwapFromDatabase(htlcHash);
    
    // For demo, we'll return mock data
    // In reality, we would:
    // 1. Verify the user is the original swap initiator
    // 2. Check that Bitcoin/Lightning payment has been confirmed
    // 3. Only reveal the secret if all conditions are met

    // Mock verification that conditions are met
    const isClaimable = await verifyClaimConditions(htlcHash, userAddress);

    if (!isClaimable) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Swap not ready for claim. Bitcoin payment must be confirmed first.' 
        },
        { status: 403 }
      );
    }

    // In production, retrieve the actual secret from secure storage
    // For demo, generate a mock secret based on the htlcHash
    const mockSecret = `0x${ethers.hexlify(ethers.randomBytes(32)).slice(2)}`;

    // Log the secret reveal for audit purposes
    console.log(`Secret revealed for htlcHash: ${htlcHash} to user: ${userAddress}`);

    return NextResponse.json({
      success: true,
      htlcHash,
      secret: mockSecret,
      message: 'Use this secret to claim your funds on the Bitcoin network',
      instructions: {
        native: 'Use this secret as the preimage in your Bitcoin wallet to unlock the HTLC',
        lightning: 'This secret has been used to settle your Lightning invoice'
      }
    });

  } catch (error) {
    console.error('Error revealing secret:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reveal secret' },
      { status: 500 }
    );
  }
}

async function verifyClaimConditions(htlcHash: string, userAddress: string): Promise<boolean> {
  // In production, this would:
  // 1. Check database to verify user is the swap initiator
  // 2. Verify Bitcoin/Lightning payment has been confirmed
  // 3. Ensure swap hasn't already been claimed
  // 4. Check that swap hasn't expired

  try {
    // Check swap status
    const statusResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/swap-status/${htlcHash}`,
      {
        headers: {
          'x-internal-request': 'true'
        }
      }
    );

    if (!statusResponse.ok) {
      return false;
    }

    const statusData = await statusResponse.json();
    
    // Only reveal secret if swap is ready to claim
    return statusData.status === 'ready_to_claim';

  } catch (error) {
    console.error('Error verifying claim conditions:', error);
    return false;
  }
}