import { NextRequest, NextResponse } from 'next/server';

// Данные конфигурации для проверки учетных данных
let configData = {
  admin: {
    username: 'admin',
    password: 'admin123'
  }
};

// Загружаем конфигурацию при запуске
async function loadConfig() {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const CONFIG_PATH = path.join(process.cwd(), 'config.json');
    
    if (fs.existsSync(CONFIG_PATH)) {
      const data = fs.readFileSync(CONFIG_PATH, 'utf-8');
      const fullConfig = JSON.parse(data);
      configData.admin = fullConfig.admin;
    }
  } catch (error) {
    console.error('Error loading config:', error);
  }
}

loadConfig();

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Имя пользователя и пароль обязательны' },
        { status: 400 }
      );
    }

    const isValid = configData.admin.username === username && 
                    configData.admin.password === password;

    if (!isValid) {
      return NextResponse.json(
        { error: 'Неверные учетные данные' },
        { status: 401 }
      );
    }

    const response = NextResponse.json(
      { success: true, message: 'Вход выполнен успешно' },
      { status: 200 }
    );

    // Устанавливаем куки для сессии
    response.cookies.set('admin_auth', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 // 24 часа
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Метод не разрешен' },
    { status: 405 }
  );
}