import { NextRequest, NextResponse } from 'next/server';

// Данные работ в памяти
let worksData = Array.from({ length: 61 }).map((_, i) => ({
  id: i + 1,
  src: `/${i + 1}.jpg`,
  title: `Работа №${i + 1}`,
  active: true
}));

// Загружаем начальные данные из файла при запуске
async function loadInitialWorks() {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const WORKS_FILE_PATH = path.join(process.cwd(), 'app', 'data', 'works.json');
    
    if (fs.existsSync(WORKS_FILE_PATH)) {
      const data = fs.readFileSync(WORKS_FILE_PATH, 'utf-8');
      worksData = JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading works:', error);
  }
}

// Загружаем работы при импорте модуля
loadInitialWorks();

// Сохраняем работы в файл
async function saveWorks() {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const WORKS_FILE_PATH = path.join(process.cwd(), 'app', 'data', 'works.json');
    
    fs.writeFileSync(WORKS_FILE_PATH, JSON.stringify(worksData, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving works:', error);
  }
}

// Проверка авторизации
function checkAuth(request: NextRequest): boolean {
  return request.cookies.get('admin_auth')?.value === 'true';
}

export async function GET(request: NextRequest) {
  try {
    const isAuthenticated = checkAuth(request);
    
    // Для публичного доступа возвращаем только активные работы
    if (!isAuthenticated) {
      const activeWorks = worksData.filter(work => work.active);
      return NextResponse.json(activeWorks, { status: 200 });
    }

    // Для админа возвращаем все работы
    return NextResponse.json(worksData, { status: 200 });
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
    if (!checkAuth(request)) {
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
    await saveWorks();

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

export async function PUT(request: NextRequest) {
  try {
    if (!checkAuth(request)) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }

    const updatedWork = await request.json();
    
    if (!updatedWork.id) {
      return NextResponse.json(
        { error: 'ID работы обязателен' },
        { status: 400 }
      );
    }

    const index = worksData.findIndex(work => work.id === updatedWork.id);
    
    if (index === -1) {
      return NextResponse.json(
        { error: 'Работа не найдена' },
        { status: 404 }
      );
    }

    worksData[index] = { ...worksData[index], ...updatedWork };
    await saveWorks();

    return NextResponse.json(
      { success: true, work: worksData[index] },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update work error:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!checkAuth(request)) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID работы обязателен' },
        { status: 400 }
      );
    }

    const workId = parseInt(id);
    const index = worksData.findIndex(work => work.id === workId);
    
    if (index === -1) {
      return NextResponse.json(
        { error: 'Работа не найдена' },
        { status: 404 }
      );
    }

    // Вместо удаления помечаем как неактивную
    worksData[index].active = false;
    await saveWorks();

    return NextResponse.json(
      { success: true, message: 'Работа деактивирована' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete work error:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    );
  }
}