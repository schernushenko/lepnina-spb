import { NextResponse } from 'next/server';
import { getCalculatorData } from '@/app/calculator/database';

export const runtime = 'nodejs';

export async function GET() {
  try {
    return NextResponse.json(getCalculatorData());
  } catch (error) {
    console.error('Load calculator data error:', error);
    return NextResponse.json({ error: 'Не удалось загрузить калькулятор' }, { status: 500 });
  }
}
