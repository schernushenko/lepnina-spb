import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const WORKS_FILE_PATH = path.join(process.cwd(), 'app', 'data', 'works.json');

// Загружаем работы из файла
function loadWorks() {
  try {
    if (fs.existsSync(WORKS_FILE_PATH)) {
      const data = fs.readFileSync(WORKS_FILE_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading works:', error);
  }
  
  // Если файла нет, создаем начальные данные
  const initialWorks = Array.from({ length: 61 }).map((_, i) => ({
    id: i + 1,
    src: `/${i + 1}.jpg`,
    title: `Работа №${i + 1}`,
    active: true
  }));
  
  saveWorks(initialWorks);
  return initialWorks;
}

// Сохраняем работы в файл
function saveWorks(works: any[]) {
  try {
    fs.writeFileSync(WORKS_FILE_PATH, JSON.stringify(works, null, 2), 'utf-8');
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
      const works = loadWorks();
      const activeWorks = works.filter((work: any) => work.active);
      return NextResponse.json(activeWorks, { status: 200 });
    }

    // Для админа возвращаем все работы
    const works = loadWorks();
    return NextResponse.json(works, { status: 200 });
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

    const works = loadWorks();
    
    // Находим максимальный ID
    const maxId = works.reduce((max: number, work: any) => Math.max(max, work.id), 0);
    
    const workToAdd = {
      id: maxId + 1,
      title: newWork.title,
      src: newWork.src,
      active: true,
      createdAt: new Date().toISOString()
    };

    works.push(workToAdd);
    saveWorks(works);

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

    const works = loadWorks();
    const index = works.findIndex((work: any) => work.id === updatedWork.id);
    
    if (index === -1) {
      return NextResponse.json(
        { error: 'Работа не найдена' },
        { status: 404 }
      );
    }

    works[index] = { ...works[index], ...updatedWork };
    saveWorks(works);

    return NextResponse.json(
      { success: true, work: works[index] },
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

    const works = loadWorks();
    const workId = parseInt(id);
    const index = works.findIndex((work: any) => work.id === workId);
    
    if (index === -1) {
      return NextResponse.json(
        { error: 'Работа не найдена' },
        { status: 404 }
      );
    }

    // Вместо удаления помечаем как неактивную
    works[index].active = false;
    saveWorks(works);

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