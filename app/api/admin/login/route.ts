import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminCredentials } from '@/app/data/config';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Имя пользователя и пароль обязательны' },
        { status: 400 }
      );
    }

    const isValid = verifyAdminCredentials(username, password);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Неверные учетные данные' },
        { status: 401 }
      );
    }

    // Создаем простую сессию (в реальном проекте используйте JWT или сессии)
    const response = NextResponse.json(
      { success: true, message: 'Вход выполнен успешно' },
      { status: 200 }
    );

    // Устанавливаем куки для сессии (простая реализация)
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