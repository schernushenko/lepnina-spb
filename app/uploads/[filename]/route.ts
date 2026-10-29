import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';

const imageContentTypes: Record<string, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif'
};

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  const match = /^(?:work|product)-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|gif|avif)$/i.exec(filename);

  if (!match) {
    return NextResponse.json({ error: 'Изображение не найдено' }, { status: 404 });
  }

  try {
    const image = await readFile(path.join(process.cwd(), 'public', filename));

    return new Response(new Uint8Array(image), {
      headers: {
        'Content-Type': imageContentTypes[match[1].toLowerCase()],
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return NextResponse.json({ error: 'Изображение не найдено' }, { status: 404 });
    }

    console.error('Read uploaded image error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
