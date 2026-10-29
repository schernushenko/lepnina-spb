import { NextResponse } from 'next/server';

// Самый простой возможный API маршрут
export function GET() {
  return NextResponse.json({ ping: 'pong' });
}