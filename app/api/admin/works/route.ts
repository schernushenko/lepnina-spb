import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import sharp, { type Metadata } from 'sharp';

interface Work {
  id: number;
  src: string;
  title: string;
  active: boolean;
  createdAt?: string;
}

const worksFilePath = path.join(process.cwd(), 'data', 'works.json');
const uploadsDirectory = path.resolve(process.cwd(), 'public', 'uploads');

function createDefaultWorks(): Work[] {
  return Array.from({ length: 61 }, (_, i) => ({
    id: i + 1,
    src: `/${i + 1}.jpg`,
    title: `Работа №${i + 1}`,
    active: true
  }));
}

function isWork(value: unknown): value is Work {
  if (!value || typeof value !== 'object') return false;
  const work = value as Record<string, unknown>;

  return (
    Number.isInteger(work.id) &&
    typeof work.src === 'string' &&
    typeof work.title === 'string' &&
    typeof work.active === 'boolean'
  );
}

async function getWorksData(): Promise<Work[]> {
  try {
    const fileContents = await readFile(worksFilePath, 'utf8');
    const data: unknown = JSON.parse(fileContents);

    if (!Array.isArray(data) || !data.every(isWork)) {
      throw new Error('Works data file has an invalid format');
    }

    return data;
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return createDefaultWorks();
    }

    throw error;
  }
}

async function saveWorksData(works: Work[]): Promise<void> {
  await mkdir(path.dirname(worksFilePath), { recursive: true });
  await writeFile(worksFilePath, JSON.stringify(works, null, 2), 'utf8');
}

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
    const worksData = await getWorksData();
    const isAuthenticated = request.cookies.get('admin_auth')?.value === 'true';

    if (!isAuthenticated) {
      const activeWorks = worksData.filter(work => work.active);
      return NextResponse.json(activeWorks);
    }

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
    let metadata: Metadata;
    let storedImageBuffer: Buffer;
    try {
      metadata = await sharp(imageBuffer, { limitInputPixels: maxImagePixels }).metadata();
      if (
        !metadata.format ||
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
      storedImageBuffer = imageExtensions[metadata.format]
        ? imageBuffer
        : await sharp(imageBuffer, { limitInputPixels: maxImagePixels }).webp().toBuffer();
    } catch (error) {
      console.error('Validate uploaded work image error:', error);
      return NextResponse.json(
        { error: 'Выбранный файл не является корректным изображением' },
        { status: 400 }
      );
    }

    const worksData = await getWorksData();
    const maxId = worksData.reduce((max, work) => Math.max(max, work.id), 0);
    const extension = imageExtensions[metadata.format] ?? 'webp';
    const filename = `work-${randomUUID()}.${extension}`;

    await mkdir(uploadsDirectory, { recursive: true });
    const imagePath = path.join(uploadsDirectory, filename);
    await writeFile(imagePath, storedImageBuffer, { flag: 'wx' });

    const workToAdd = {
      id: maxId + 1,
      title: title.trim(),
      src: `/uploads/${filename}`,
      active: true,
      createdAt: new Date().toISOString()
    };

    worksData.push(workToAdd);
    try {
      await saveWorksData(worksData);
    } catch (error) {
      try {
        await unlink(imagePath);
      } catch (cleanupError) {
        console.error('Remove orphaned work image error:', cleanupError);
      }
      throw error;
    }

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

    const worksData = await getWorksData();
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
    await saveWorksData(worksData);

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

    const worksData = await getWorksData();
    const workIndex = worksData.findIndex((work) => work.id === id);

    if (workIndex === -1) {
      return NextResponse.json(
        { error: 'Работа не найдена' },
        { status: 404 }
      );
    }

    const [removedWork] = worksData.splice(workIndex, 1);
    if (removedWork?.src.startsWith('/uploads/')) {
      const filename = removedWork.src.replace(/^\/uploads\//, '');
      const filePath = path.join(uploadsDirectory, filename);
      await unlink(filePath).catch(() => undefined);
    }

    await saveWorksData(worksData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete work error:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    );
  }
}
