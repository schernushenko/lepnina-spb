import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

// Простые данные работ в памяти
const worksData = Array.from({ length: 61 }).map((_, i) => ({
  id: i + 1,
  src: `/${i + 1}.jpg`,
  title: `Работа №${i + 1}`,
  active: true
}));

const maxImageSize = 20 * 1024 * 1024;
const maxImagePixels = 40_000_000;
const imageExtensions: Record<string, string> = {
  jpeg: 'jpg',
  png: 'png',
  webp: 'webp',
  gif: 'gif',
  avif: 'avif'
};

export const runtime = 'nodejs';

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

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (error) {
      console.error('Read work upload form error:', error);
      return NextResponse.json(
        { error: 'Не удалось прочитать загруженные данные' },
        { status: 400 }
      );
    }

    const title = formData.get('title');
    const image = formData.get('image');

    if (typeof title !== 'string' || !title.trim() || !(image instanceof File)) {
      return NextResponse.json(
        { error: 'Название работы и изображение обязательны' },
        { status: 400 }
      );
    }

    if (title.trim().length > 120) {
      return NextResponse.json(
        { error: 'Название работы не должно превышать 120 символов' },
        { status: 400 }
      );
    }

    if (image.size === 0 || image.size > maxImageSize) {
      return NextResponse.json(
        { error: 'Размер изображения должен быть больше 0 и не превышать 20 МБ' },
        { status: 400 }
      );
    }

    const imageBuffer = Buffer.from(await image.arrayBuffer());
    let metadata: sharp.Metadata;
    try {
      metadata = await sharp(imageBuffer, { limitInputPixels: maxImagePixels }).metadata();
      if (
        !metadata.format ||
        !imageExtensions[metadata.format] ||
        !metadata.width ||
        !metadata.height ||
        metadata.width * metadata.height > maxImagePixels
      ) {
        return NextResponse.json(
          { error: 'Формат или разрешение изображения не поддерживается' },
          { status: 400 }
        );
      }

      await sharp(imageBuffer, { limitInputPixels: maxImagePixels }).stats();
    } catch (error) {
      console.error('Validate uploaded work image error:', error);
      return NextResponse.json(
        { error: 'Выбранный файл не является корректным изображением' },
        { status: 400 }
      );
    }

    const filename = `work-${randomUUID()}.${imageExtensions[metadata.format]}`;
    const publicDirectory = path.resolve(process.cwd(), 'public');
    await mkdir(publicDirectory, { recursive: true });
    await writeFile(path.join(publicDirectory, filename), imageBuffer, { flag: 'wx' });

    // Находим максимальный ID
    const maxId = worksData.reduce((max, work) => Math.max(max, work.id), 0);
    
    const workToAdd = {
      id: maxId + 1,
      title: title.trim(),
      src: `/${filename}`,
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
    if (!Number.isInteger(updates.id)) {
      return NextResponse.json(
        { error: 'Некорректный идентификатор работы' },
        { status: 400 }
      );
    }

    const workIndex = worksData.findIndex((work) => work.id === updates.id);

    if (workIndex === -1) {
      return NextResponse.json(
        { error: 'Работа не найдена' },
        { status: 404 }
      );
    }

    if (
      (updates.title !== undefined && typeof updates.title !== 'string') ||
      (updates.src !== undefined && typeof updates.src !== 'string') ||
      (updates.active !== undefined && typeof updates.active !== 'boolean')
    ) {
      return NextResponse.json(
        { error: 'Некорректные данные работы' },
        { status: 400 }
      );
    }

    worksData[workIndex] = { ...worksData[workIndex], ...updates };

    return NextResponse.json({ success: true, work: worksData[workIndex] });
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
    const isAuthenticated = request.cookies.get('admin_auth')?.value === 'true';

    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }

    const idValue = request.nextUrl.searchParams.get('id');
    const id = idValue === null ? NaN : Number(idValue);

    if (!Number.isInteger(id)) {
      return NextResponse.json(
        { error: 'Некорректный идентификатор работы' },
        { status: 400 }
      );
    }

    const workIndex = worksData.findIndex((work) => work.id === id);

    if (workIndex === -1) {
      return NextResponse.json(
        { error: 'Работа не найдена' },
        { status: 404 }
      );
    }

    worksData.splice(workIndex, 1);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete work error:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    );
  }
}