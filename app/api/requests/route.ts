import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { calculateQuote, formatQuantity, formatRubles } from '@/app/calculator/calculate';
import { getCalculatorData, getDatabase } from '@/app/calculator/database';
import type { CalculatorCart } from '@/app/calculator/types';

export const runtime = 'nodejs';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function escapeTelegramText(value: string): string {
  return value.replace(/[<>&]/g, '');
}

function validateCart(value: unknown): CalculatorCart {
  if (!isRecord(value) || !Array.isArray(value.lines) || !Array.isArray(value.services)) {
    throw new Error('Корзина заполнена некорректно');
  }
  if (value.lines.length > 100 || value.services.length > 50) throw new Error('Слишком много позиций');

  const lines = value.lines.map((line) => {
    if (!isRecord(line) || typeof line.productId !== 'string') throw new Error('Некорректная позиция корзины');
    if (line.variantId !== null && typeof line.variantId !== 'string') throw new Error('Некорректный вариант изделия');
    if (
      !Number.isSafeInteger(line.quantityMilli) ||
      Number(line.quantityMilli) < 1 ||
      Number(line.quantityMilli) > 9_999_000
    ) throw new Error('Некорректное количество');
    return {
      productId: line.productId,
      variantId: line.variantId,
      quantityMilli: Number(line.quantityMilli)
    };
  });
  if (new Set(lines.map((line) => `${line.productId}:${line.variantId ?? ''}`)).size !== lines.length) {
    throw new Error('Одинаковые варианты товара должны быть объединены');
  }
  const services = value.services.map((service) => {
    if (
      !isRecord(service) ||
      typeof service.serviceId !== 'string' ||
      typeof service.enabled !== 'boolean' ||
      !Number.isSafeInteger(service.quantityMilli) ||
      Number(service.quantityMilli) < 0 ||
      Number(service.quantityMilli) > 9_999_000
    ) {
      throw new Error('Некорректная услуга');
    }
    return {
      serviceId: service.serviceId,
      enabled: service.enabled,
      quantityMilli: Number(service.quantityMilli),
      quantityManual: service.quantityManual === true
    };
  });
  return { lines, services };
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) throw new Error('Некорректные данные заявки');
    if (typeof body.name !== 'string' || !body.name.trim() || body.name.trim().length > 120) {
      throw new Error('Укажите имя (до 120 символов)');
    }
    if (typeof body.phone !== 'string' || !/^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/.test(body.phone)) {
      throw new Error('Введите телефон в формате +7 (XXX) XXX-XX-XX');
    }
    if (body.email !== undefined && body.email !== '' && (
      typeof body.email !== 'string' || body.email.length > 120 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)
    )) {
      throw new Error('Проверьте адрес электронной почты');
    }
    if (typeof body.consent !== 'boolean' || !body.consent) throw new Error('Необходимо согласие на обработку персональных данных');
    const comment = typeof body.comment === 'string' ? body.comment.trim().slice(0, 2_000) : '';
    const cart = validateCart(body.cart);
    const data = getCalculatorData();
    const selectedServiceIds = new Set<string>();

    for (const line of cart.lines) {
      const product = data.products.find((item) => item.id === line.productId);
      if (!product || !product.active) throw new Error('Один из товаров больше недоступен. Обновите страницу.');
      if (line.variantId && !product.variants.some((variant) => variant.id === line.variantId)) {
        throw new Error(`Вариант товара «${product.name}» больше недоступен`);
      }
      if (
        line.quantityMilli < product.minQuantityMilli ||
        line.quantityMilli > 9_999_000 ||
        (line.quantityMilli - product.minQuantityMilli) % product.stepQuantityMilli !== 0
      ) {
        throw new Error(`Проверьте количество товара «${product.name}»`);
      }
    }
    for (const service of cart.services) {
      if (selectedServiceIds.has(service.serviceId)) throw new Error('Услуга указана несколько раз');
      selectedServiceIds.add(service.serviceId);
      if (!data.services.some((item) => item.id === service.serviceId)) {
        throw new Error('Одна из услуг больше недоступна. Обновите страницу.');
      }
    }
    if (!cart.lines.length) throw new Error('Добавьте товары в корзину');

    const calculation = calculateQuote(
      cart,
      data.products,
      data.services,
      data.discounts,
      data.settings.minimumOrderMinor
    );
    if (calculation.belowMinimum) throw new Error('Сумма заказа ниже минимальной');

    const utm: Record<string, string> = {};
    for (const [key, value] of request.nextUrl.searchParams) {
      if (/^utm_[a-z0-9_]{1,30}$/i.test(key)) utm[key] = value.slice(0, 200);
    }

    const details = {
      cart,
      calculation,
      consent: true,
      consentAt: new Date().toISOString(),
      contact: {
        name: body.name.trim(),
        phone: body.phone,
        email: typeof body.email === 'string' ? body.email.trim() : '',
        comment
      },
      utm
    };
    const requestId = randomUUID();
    const database = getDatabase();
    database.prepare(`
      INSERT INTO calculator_requests
        (id, created_at, name, phone, email, comment, status, total_minor, payload_json, utm_json, telegram_sent)
      VALUES (?, ?, ?, ?, ?, ?, 'new', ?, ?, ?, 0)
    `).run(
      requestId,
      new Date().toISOString(),
      details.contact.name,
      details.contact.phone,
      details.contact.email,
      details.contact.comment,
      calculation.totalMinor,
      JSON.stringify(details),
      JSON.stringify(utm)
    );

    let notificationSent = false;
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (token && chatId) {
      const productsText = calculation.lines.map((line) => {
        const price = line.lineTotalMinor === null
          ? 'цена по запросу'
          : `${formatRubles(line.lineTotalMinor)} ₽`;
        return `• ${escapeTelegramText(line.name)}${line.variantName ? ` (${escapeTelegramText(line.variantName)})` : ''} — ${formatQuantity(line.quantityMilli)} ${line.unit}; ${price}`;
      }).join('\n');
      const servicesText = calculation.services.map((service) =>
        `• ${escapeTelegramText(service.name)} — ${formatRubles(service.lineTotalMinor)} ₽`
      ).join('\n');
      const telegramText = [
        'НОВАЯ ЗАЯВКА',
        `Имя: ${escapeTelegramText(details.contact.name)}`,
        `Телефон: ${details.contact.phone}`,
        details.contact.email ? `Email: ${escapeTelegramText(details.contact.email)}` : '',
        '',
        'Изделия:',
        productsText,
        servicesText ? `\nУслуги:\n${servicesText}` : '',
        `\nИтого: ${formatRubles(calculation.totalMinor)} ₽`,
        details.contact.comment ? `Комментарий: ${escapeTelegramText(details.contact.comment)}` : '',
        Object.keys(utm).length ? `UTM: ${JSON.stringify(utm)}` : ''
      ].filter(Boolean).join('\n');

      try {
        const telegramResponse = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: telegramText }),
          signal: AbortSignal.timeout(10_000)
        });
        notificationSent = telegramResponse.ok;
        if (!telegramResponse.ok) {
          console.error('Telegram request notification failed:', await telegramResponse.text());
        }
      } catch (error) {
        console.error('Telegram request notification error:', error);
      }
    } else {
      console.error('Request saved but Telegram environment is not configured');
    }

    database.prepare('UPDATE calculator_requests SET telegram_sent = ? WHERE id = ?')
      .run(notificationSent ? 1 : 0, requestId);
    return NextResponse.json({ success: true, requestId, notificationSent }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Не удалось отправить заявку' },
      { status: 400 }
    );
  }
}
