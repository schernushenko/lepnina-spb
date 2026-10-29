import { NextRequest, NextResponse } from 'next/server';

export default function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Защищаем админские маршруты (кроме страницы логина и публичных GET запросов)
  if (path.startsWith('/api/admin') && 
      !path.includes('/login') && 
      !path.includes('/logout') &&
      request.method !== 'GET') {
    
    const isAuthenticated = request.cookies.get('admin_auth')?.value === 'true';
    
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/admin/:path*'
  ]
};