import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Monitor endpoint'
  });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Monitor endpoint'
  });
}