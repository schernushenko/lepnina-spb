import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'lepnina-site',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
}