import { NextResponse } from 'next/server';

export default function proxy() {
  // Временно отключаем защиту для тестирования
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/admin/:path*'
  ]
};