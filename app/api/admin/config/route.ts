import { NextRequest, NextResponse } from 'next/server';

// Данные конфигурации в памяти (в реальном приложении нужно использовать базу данных)
let configData = {
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

// Загружаем начальные данные из файла при запуске
async function loadInitialConfig() {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const CONFIG_PATH = path.join(process.cwd(), 'config.json');
    
    if (fs.existsSync(CONFIG_PATH)) {
      const data = fs.readFileSync(CONFIG_PATH, 'utf-8');
      configData = JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading config:', error);
  }
}

// Загружаем конфигурацию при импорте модуля
loadInitialConfig();

// Сохраняем конфигурацию в файл
async function saveConfig() {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const CONFIG_PATH = path.join(process.cwd(), 'config.json');
    
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(configData, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving config:', error);
  }
}

// Проверка авторизации
function checkAuth(request: NextRequest): boolean {
  return request.cookies.get('admin_auth')?.value === 'true';
}

export async function GET(request: NextRequest) {
  try {
    // Для публичного доступа возвращаем только данные компании
    const isAuthenticated = checkAuth(request);
    
    if (!isAuthenticated) {
      return NextResponse.json(
        { company: configData.company },
        { status: 200 }
      );
    }

    // Для админа возвращаем полную конфигурацию
    return NextResponse.json(configData, { status: 200 });
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
    if (!checkAuth(request)) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }

    const updates = await request.json();
    
    // Обновляем только поля компании
    if (updates.company) {
      configData.company = { ...configData.company, ...updates.company };
      await saveConfig();
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