import { NextResponse } from 'next/server';

// Простые тестовые данные
const worksData = Array.from({ length: 10 }).map((_, i) => ({
  id: i + 1,
  src: `/${i + 1}.jpg`,
  title: `Тестовая работа №${i + 1}`,
  active: true
}));

export async function GET() {
  return NextResponse.json(worksData);
}