import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json(
      { success: true, message: 'Выход выполнен успешно' },
      { status: 200 }
    );

    // Удаляем куки сессии
    response.cookies.delete('admin_auth');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
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