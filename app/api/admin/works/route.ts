import { NextRequest, NextResponse } from 'next/server';

// Простые данные работ в памяти
let worksData = Array.from({ length: 61 }).map((_, i) => ({
  id: i + 1,
  src: `/${i + 1}.jpg`,
  title: `Работа №${i + 1}`,
  active: true
}));

export async function GET(request: NextRequest) {
  try {
    // Для публичного доступа возвращаем только активные работы
    const isAuthenticated = request.cookies.get('admin_auth')?.value === 'true';
    
    if (!isAuthenticated) {
      const activeWorks = worksData.filter(work => work.active);
      return NextResponse.json(activeWorks);
    }

    // Для админа возвращаем все работы
    return NextResponse.json(worksData);
  } catch (error) {
    console.error('Get works error:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAuthenticated = request.cookies.get('admin_auth')?.value === 'true';
    
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }

    const newWork = await request.json();
    
    if (!newWork.title || !newWork.src) {
      return NextResponse.json(
        { error: 'Название и путь к изображению обязательны' },
        { status: 400 }
      );
    }

    // Находим максимальный ID
    const maxId = worksData.reduce((max, work) => Math.max(max, work.id), 0);
    
    const workToAdd = {
      id: maxId + 1,
      title: newWork.title,
      src: newWork.src,
      active: true,
      createdAt: new Date().toISOString()
    };

    worksData.push(workToAdd);

    return NextResponse.json(
      { success: true, work: workToAdd },
      { status: 201 }
    );
  } catch (error) {
    console.error('Add work error:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    );
  }
}