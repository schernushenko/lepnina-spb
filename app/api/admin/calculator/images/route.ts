import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

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

export async function POST(request: NextRequest) {
  if (request.cookies.get('admin_auth')?.value !== 'true') {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  const savedPaths: string[] = [];
  try {
    const formData = await request.formData();
    const requestedKind = formData.get('kind');
    if (requestedKind !== null && requestedKind !== 'product' && requestedKind !== 'category') {
      return NextResponse.json({ error: 'Некорректный тип изображения' }, { status: 400 });
    }
    const kind = requestedKind === 'category' ? 'category' : 'product';
    const files = formData.getAll('images').filter((file): file is File => file instanceof File);
    if (!files.length || files.length > (kind === 'category' ? 1 : 10)) {
      return NextResponse.json(
        { error: kind === 'category' ? 'Выберите одно изображение категории' : 'Выберите от 1 до 10 изображений' },
        { status: 400 }
      );
    }

    const publicDirectory = path.resolve(process.cwd(), 'public');
    await mkdir(publicDirectory, { recursive: true });
    const images: string[] = [];
    for (const file of files) {
      if (file.size === 0 || file.size > maxImageSize) {
        throw new Error('Размер каждого изображения должен быть больше 0 и не превышать 20 МБ');
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const metadata = await sharp(buffer, { limitInputPixels: maxImagePixels }).metadata();
      if (!metadata.format || !metadata.width || !metadata.height || metadata.width * metadata.height > maxImagePixels) {
        throw new Error('Выбран некорректный файл изображения или слишком большое разрешение');
      }
      await sharp(buffer, { limitInputPixels: maxImagePixels }).stats();

      const extension = imageExtensions[metadata.format] ?? 'webp';
      const output = imageExtensions[metadata.format]
        ? buffer
        : await sharp(buffer, { limitInputPixels: maxImagePixels }).webp().toBuffer();
      const filename = `${kind}-${randomUUID()}.${extension}`;
      const destination = path.join(publicDirectory, filename);
      await writeFile(destination, output, { flag: 'wx' });
      savedPaths.push(destination);
      images.push(`/uploads/${filename}`);
    }

    return NextResponse.json({ images }, { status: 201 });
  } catch (error) {
    await Promise.all(savedPaths.map((filePath) => unlink(filePath).catch((cleanupError) => {
      console.error('Remove incomplete product image upload error:', cleanupError);
    })));
    console.error('Upload calculator product images error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Не удалось загрузить изображения' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (request.cookies.get('admin_auth')?.value !== 'true') {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  try {
    const { image } = await request.json() as { image?: unknown };
    if (typeof image !== 'string') return NextResponse.json({ error: 'Некорректное изображение' }, { status: 400 });
    const match = /^\/uploads\/((?:product|category)-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpg|png|webp|gif|avif))$/i.exec(image);
    if (!match) return NextResponse.json({ error: 'Можно удалить только загруженное изображение калькулятора' }, { status: 400 });

    const imagePath = path.resolve(process.cwd(), 'public', match[1]);
    if (path.dirname(imagePath) !== path.resolve(process.cwd(), 'public')) {
      return NextResponse.json({ error: 'Некорректный путь к изображению' }, { status: 400 });
    }
    await unlink(imagePath);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete calculator product image error:', error);
    return NextResponse.json({ error: 'Не удалось удалить изображение' }, { status: 500 });
  }
}
