import { NextRequest, NextResponse } from 'next/server';
import { readConfig, updateCompanyConfig } from '@/app/data/config';

export async function GET(request: NextRequest) {
  try {
    // Проверяем авторизацию через куки
    const isAuthenticated = request.cookies.get('admin_auth')?.value === 'true';
    
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }

    const config = readConfig();
    return NextResponse.json(config, { status: 200 });
  } catch (error) {
    console.error('Get config error:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Проверяем авторизацию через куки
    const isAuthenticated = request.cookies.get('admin_auth')?.value === 'true';
    
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }

    const updates = await request.json();
    
    // Обновляем только поля компании
    if (updates.company) {
      updateCompanyConfig(updates.company);
    }

    const config = readConfig();
    return NextResponse.json(
      { success: true, message: 'Конфигурация обновлена', config },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update config error:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    );
  }
}