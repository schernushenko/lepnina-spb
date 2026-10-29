// Самый простой API маршрут по документации Next.js
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Hello from Next.js API!' });
}