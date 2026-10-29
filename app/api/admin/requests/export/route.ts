import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/app/calculator/database';

export const runtime = 'nodejs';

function csvCell(value: unknown): string {
  let text = String(value ?? '');
  if (/^[\t\r ]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest) {
  if (request.cookies.get('admin_auth')?.value !== 'true') {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  try {
    const rows = getDatabase().prepare(`
      SELECT created_at, name, phone, email, status, total_minor, payload_json, utm_json
      FROM calculator_requests ORDER BY created_at DESC
    `).all() as Array<Record<string, unknown>>;
    const header = ['Дата', 'Имя', 'Телефон', 'Email', 'Статус', 'Сумма, ₽', 'Состав', 'UTM'];
    const lines = rows.map((row) => {
      const payload = JSON.parse(String(row.payload_json)) as {
        calculation?: { lines?: Array<{ name: string; quantityMilli: number; unit: string }> };
      };
      const composition = payload.calculation?.lines
        ?.map((line) => `${line.name} ${line.quantityMilli / 1000} ${line.unit}`)
        .join('; ') ?? '';
      return [
        row.created_at,
        row.name,
        row.phone,
        row.email,
        row.status,
        Number(row.total_minor) / 100,
        composition,
        row.utm_json
      ].map(csvCell).join(',');
    });

    return new Response(`\uFEFF${[header.map(csvCell).join(','), ...lines].join('\r\n')}`, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="calculator-requests.csv"'
      }
    });
  } catch (error) {
    console.error('Export calculator requests error:', error);
    return NextResponse.json({ error: 'Не удалось экспортировать заявки' }, { status: 500 });
  }
}
