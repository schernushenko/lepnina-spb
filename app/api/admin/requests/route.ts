import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/app/calculator/database';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  if (request.cookies.get('admin_auth')?.value !== 'true') {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  try {
    const status = request.nextUrl.searchParams.get('status');
    const from = request.nextUrl.searchParams.get('from');
    const to = request.nextUrl.searchParams.get('to');
    const clauses: string[] = [];
    const values: string[] = [];
    if (status && ['new', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      clauses.push('status = ?');
      values.push(status);
    }
    if (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) {
      clauses.push('created_at >= ?');
      values.push(`${from}T00:00:00.000Z`);
    }
    if (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) {
      clauses.push('created_at < ?');
      values.push(`${to}T23:59:59.999Z`);
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const rows = getDatabase().prepare(`
      SELECT id, created_at AS createdAt, name, phone, email, comment, status,
        total_minor AS totalMinor, payload_json AS payloadJson,
        utm_json AS utmJson, telegram_sent AS telegramSent
      FROM calculator_requests ${where} ORDER BY created_at DESC LIMIT 1000
    `).all(...values);

    return NextResponse.json(rows.map((row) => {
      const item = row as {
        payloadJson: string; utmJson: string; telegramSent: number;
      } & Record<string, unknown>;
      return {
        ...item,
        payload: JSON.parse(item.payloadJson),
        utm: JSON.parse(item.utmJson),
        telegramSent: Boolean(item.telegramSent)
      };
    }));
  } catch (error) {
    console.error('Load calculator requests error:', error);
    return NextResponse.json({ error: 'Не удалось загрузить заявки' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (request.cookies.get('admin_auth')?.value !== 'true') {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  try {
    const body: unknown = await request.json();
    if (
      typeof body !== 'object' || body === null ||
      !('id' in body) || typeof body.id !== 'string' ||
      !('status' in body) ||
      !['new', 'in_progress', 'completed', 'cancelled'].includes(String(body.status))
    ) {
      return NextResponse.json({ error: 'Некорректный статус заявки' }, { status: 400 });
    }
    const result = getDatabase().prepare('UPDATE calculator_requests SET status = ? WHERE id = ?')
      .run(body.status, body.id);
    if (!result.changes) return NextResponse.json({ error: 'Заявка не найдена' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update calculator request status error:', error);
    return NextResponse.json({ error: 'Не удалось изменить статус заявки' }, { status: 500 });
  }
}
