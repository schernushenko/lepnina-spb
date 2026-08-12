// app/api/send-telegram/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { name, phone, comment, estimatedPrice } = await request.json();

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      return NextResponse.json({ error: 'Не настроены переменные окружения' }, { status: 500 });
    }

    const text = `🛠 НОВАЯ ЗАЯВКА\n\n👤 Имя: ${name}\n📞 Телефон: ${phone}\n💰 Примерная цена: ${estimatedPrice} руб.\n📝 Детали: ${comment || 'Не указаны'}`;

    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
      }),
    });

    if (!tgRes.ok) {
      const errorData = await tgRes.json().catch(() => ({ message: 'Не удалось получить тело ошибки' }));
      console.error('Telegram API error:', errorData);
      return NextResponse.json({ error: `Ошибка отправки в Telegram: ${errorData.description ?? errorData.message ?? JSON.stringify(errorData)}` }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}