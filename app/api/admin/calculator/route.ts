import { NextRequest, NextResponse } from 'next/server';
import { getCalculatorData } from '@/app/calculator/database';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  if (request.cookies.get('admin_auth')?.value !== 'true') {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  try {
    return NextResponse.json(getCalculatorData(true));
  } catch (error) {
    console.error('Load admin calculator data error:', error);
    return NextResponse.json({ error: 'Не удалось загрузить данные калькулятора' }, { status: 500 });
  }
}
