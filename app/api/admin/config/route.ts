import { NextRequest, NextResponse } from 'next/server';

// Данные конфигурации в памяти
const configData = {
  admin: {
    username: 'admin',
    password: 'admin123'
  },
  company: {
    name: 'Античная лепнина',
    phone: '+7 (999) 123-45-67',
    email: 'info@ellada-decor.ru',
    description: '15 лет опыта, индивидуальные проекты, выезд на замер.'
  }
};

export async function GET(request: NextRequest) {
  try {
    // Для публичного доступа возвращаем только данные компании
    const isAuthenticated = request.cookies.get('admin_auth')?.value === 'true';
    
    if (!isAuthenticated) {
      return NextResponse.json({ company: configData.company });
    }

    // Для админа возвращаем полную конфигурацию
    return NextResponse.json(configData);
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
      configData.company = { ...configData.company, ...updates.company };
    }

    return NextResponse.json(
      { success: true, message: 'Конфигурация обновлена', config: configData },
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