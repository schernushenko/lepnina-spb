import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, isMeasurementUnit } from '@/app/calculator/database';
import type {
  CalculatorSettings,
  ProductVariant,
  ServicePriceType
} from '@/app/calculator/types';

export const runtime = 'nodejs';

type Resource = 'categories' | 'products' | 'services' | 'discounts' | 'settings';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requiredText(value: unknown, field: string, maximum = 120): string {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > maximum) {
    throw new Error(`${field}: обязательное поле, максимум ${maximum} символов`);
  }
  return value.trim();
}

function nonNegativeInteger(value: unknown, field: string): number {
  if (!Number.isSafeInteger(value) || Number(value) < 0) {
    throw new Error(`${field}: укажите неотрицательное целое значение`);
  }
  return Number(value);
}

function validateVariants(value: unknown): ProductVariant[] {
  if (!Array.isArray(value)) throw new Error('Варианты должны быть списком');
  return value.map((variant, index) => {
    if (!isRecord(variant)) throw new Error(`Вариант ${index + 1} имеет неверный формат`);
    const price = variant.priceMinor === null
      ? null
      : nonNegativeInteger(variant.priceMinor, `Цена варианта ${index + 1}`);
    return {
      id: typeof variant.id === 'string' && variant.id ? variant.id : randomUUID(),
      name: requiredText(variant.name, `Название варианта ${index + 1}`, 80),
      priceMinor: price,
      image: typeof variant.image === 'string' && variant.image ? variant.image : null
    };
  });
}

function validateImages(value: unknown): string[] {
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
    throw new Error('Изображения должны быть списком ссылок');
  }
  return value.slice(0, 10);
}

function normalizeResourceBody(resource: Resource, value: unknown): Record<string, unknown> {
  if (!isRecord(value)) throw new Error('Некорректные данные');

  if (resource === 'categories') {
    return {
      name: requiredText(value.name, 'Название'),
      slug: requiredText(value.slug, 'Slug', 120),
      sortOrder: nonNegativeInteger(value.sortOrder ?? 0, 'Порядок'),
      active: value.active === false ? 0 : 1
    };
  }

  if (resource === 'products') {
    const priceType = value.priceType;
    if (!['fixed', 'from', 'request'].includes(String(priceType))) throw new Error('Некорректный тип цены');
    if (!isMeasurementUnit(value.unit)) throw new Error('Некорректная единица измерения');
    if (value.categoryId !== null && typeof value.categoryId !== 'string') throw new Error('Некорректная категория');
    const priceMinor = priceType === 'request' ? null : nonNegativeInteger(value.priceMinor, 'Цена');
    if (priceMinor !== null && priceMinor > 1_000_000_000) throw new Error('Цена не может превышать 10 000 000 ₽');
    const minQuantityMilli = nonNegativeInteger(value.minQuantityMilli ?? 1000, 'Минимальное количество');
    const stepQuantityMilli = nonNegativeInteger(value.stepQuantityMilli ?? 1000, 'Шаг количества');
    if (minQuantityMilli < 1 || minQuantityMilli > 9_999_000 || stepQuantityMilli < 1 || stepQuantityMilli > 9_999_000) {
      throw new Error('Минимум и шаг должны быть от 0,001 до 9999');
    }
    return {
      name: requiredText(value.name, 'Название'),
      slug: requiredText(value.slug, 'Slug', 120),
      categoryId: value.categoryId,
      description: typeof value.description === 'string' ? value.description.trim().slice(0, 500) : '',
      unit: value.unit,
      priceMinor,
      priceType,
      minQuantityMilli,
      stepQuantityMilli,
      sortOrder: nonNegativeInteger(value.sortOrder ?? 0, 'Порядок'),
      active: value.active === false ? 0 : 1,
      images: validateImages(value.images ?? []),
      variants: validateVariants(value.variants ?? [])
    };
  }

  if (resource === 'services') {
    if (!['fixed', 'per_unit', 'percent'].includes(String(value.priceType))) throw new Error('Некорректный тип цены услуги');
    if (!isMeasurementUnit(value.unit)) throw new Error('Некорректная единица измерения');
    const percentBasisPoints = nonNegativeInteger(value.percentBasisPoints ?? 0, 'Процент');
    if (percentBasisPoints > 10_000) throw new Error('Процент не может быть больше 100%');
    const priceMinor = nonNegativeInteger(value.priceMinor ?? 0, 'Цена');
    if (priceMinor > 1_000_000_000) throw new Error('Цена не может превышать 10 000 000 ₽');
    return {
      name: requiredText(value.name, 'Название'),
      type: requiredText(value.type, 'Тип услуги', 60),
      priceType: value.priceType as ServicePriceType,
      unit: value.unit,
      priceMinor,
      percentBasisPoints,
      sortOrder: nonNegativeInteger(value.sortOrder ?? 0, 'Порядок'),
      active: value.active === false ? 0 : 1
    };
  }

  if (resource === 'discounts') {
    const percentBasisPoints = nonNegativeInteger(value.percentBasisPoints, 'Процент');
    if (percentBasisPoints > 10_000) throw new Error('Процент не может быть больше 100%');
    const minimumMinor = nonNegativeInteger(value.minimumMinor, 'Порог суммы');
    if (minimumMinor > 1_000_000_000_000) throw new Error('Порог суммы слишком велик');
    return {
      minimumMinor,
      percentBasisPoints,
      active: value.active === false ? 0 : 1
    };
  }

  const settings = value as unknown as CalculatorSettings;
  return {
    minimumOrderMinor: nonNegativeInteger(settings.minimumOrderMinor, 'Минимальная сумма'),
    phone: typeof settings.phone === 'string' ? settings.phone.trim().slice(0, 40) : '',
    email: typeof settings.email === 'string' ? settings.email.trim().slice(0, 120) : '',
    address: typeof settings.address === 'string' ? settings.address.trim().slice(0, 240) : '',
    title: requiredText(settings.title, 'Заголовок', 120),
    description: typeof settings.description === 'string' ? settings.description.trim().slice(0, 500) : ''
  };
}

const resourceTables: Record<Exclude<Resource, 'settings'>, {
  table: string;
  columns: Record<string, string>;
}> = {
  categories: {
    table: 'calculator_categories',
    columns: { name: 'name', slug: 'slug', sortOrder: 'sort_order', active: 'active' }
  },
  products: {
    table: 'calculator_products',
    columns: {
      name: 'name', slug: 'slug', categoryId: 'category_id', description: 'description',
      unit: 'unit', priceMinor: 'price_minor', priceType: 'price_type',
      minQuantityMilli: 'min_quantity_milli', stepQuantityMilli: 'step_quantity_milli',
      sortOrder: 'sort_order', active: 'active', images: 'images_json', variants: 'variants_json'
    }
  },
  services: {
    table: 'calculator_services',
    columns: {
      name: 'name', type: 'type', priceType: 'price_type', unit: 'unit',
      priceMinor: 'price_minor', percentBasisPoints: 'percent_basis_points',
      sortOrder: 'sort_order', active: 'active'
    }
  },
  discounts: {
    table: 'calculator_discounts',
    columns: {
      minimumMinor: 'minimum_minor', percentBasisPoints: 'percent_basis_points', active: 'active'
    }
  }
};

function isResource(value: string): value is Resource {
  return ['categories', 'products', 'services', 'discounts', 'settings'].includes(value);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ resource: string }> }
) {
  return mutate(request, params, 'create');
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ resource: string }> }
) {
  return mutate(request, params, 'update');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ resource: string }> }
) {
  if (request.cookies.get('admin_auth')?.value !== 'true') {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }
  const { resource } = await params;
  if (!isResource(resource) || resource === 'settings') {
    return NextResponse.json({ error: 'Неизвестный раздел' }, { status: 404 });
  }

  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Не указан идентификатор' }, { status: 400 });
    const database = getDatabase();

    if (resource === 'categories') {
      const body = await request.json().catch(() => ({})) as { moveProductsToCategoryId?: unknown };
      const productsCount = database.prepare(
        'SELECT COUNT(*) AS count FROM calculator_products WHERE category_id = ?'
      ).get(id) as { count: number };
      if (productsCount.count > 0) {
        const targetId = body.moveProductsToCategoryId;
        if (targetId !== null && typeof targetId !== 'string') {
          return NextResponse.json({ error: 'Выберите категорию для переноса товаров или null' }, { status: 400 });
        }
        if (typeof targetId === 'string' && !database.prepare(
          'SELECT 1 FROM calculator_categories WHERE id = ?'
        ).get(targetId)) {
          return NextResponse.json({ error: 'Категория переноса не найдена' }, { status: 400 });
        }
        database.transaction(() => {
          database.prepare('UPDATE calculator_products SET category_id = ? WHERE category_id = ?').run(targetId, id);
          database.prepare('DELETE FROM calculator_categories WHERE id = ?').run(id);
        })();
      } else {
        database.prepare('DELETE FROM calculator_categories WHERE id = ?').run(id);
      }
    } else {
      database.prepare(`DELETE FROM ${resourceTables[resource].table} WHERE id = ?`).run(id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Delete ${resource} error:`, error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Не удалось удалить запись' }, { status: 500 });
  }
}

async function mutate(
  request: NextRequest,
  params: Promise<{ resource: string }>,
  operation: 'create' | 'update'
) {
  if (request.cookies.get('admin_auth')?.value !== 'true') {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  const { resource: resourceName } = await params;
  if (!isResource(resourceName)) return NextResponse.json({ error: 'Неизвестный раздел' }, { status: 404 });

  try {
    const body: unknown = await request.json();
    const normalized = normalizeResourceBody(resourceName, body);
    const database = getDatabase();

    if (resourceName === 'settings') {
      database.prepare('UPDATE calculator_settings SET payload_json = ? WHERE id = 1')
        .run(JSON.stringify(normalized));
      return NextResponse.json({ success: true });
    }

    const definition = resourceTables[resourceName];
    if (operation === 'create') {
      const id = randomUUID();
      const keys = Object.keys(normalized);
      const columns = keys.map((key) => definition.columns[key] ?? (key === 'images' ? 'images_json' : key === 'variants' ? 'variants_json' : key));
      const values = keys.map((key) => ['images', 'variants'].includes(key) ? JSON.stringify(normalized[key]) : normalized[key]);
      database.prepare(
        `INSERT INTO ${definition.table} (id, ${columns.join(', ')}) VALUES (?, ${keys.map(() => '?').join(', ')})`
      ).run(id, ...values);
      return NextResponse.json({ success: true, id }, { status: 201 });
    }

    if (!isRecord(body) || typeof body.id !== 'string') {
      return NextResponse.json({ error: 'Не указан идентификатор записи' }, { status: 400 });
    }
    const keys = Object.keys(normalized);
    const setClause = keys.map((key) => `${definition.columns[key]} = @${key}`).join(', ');
    const values = Object.fromEntries(keys.map((key) => [
      key,
      ['images', 'variants'].includes(key) ? JSON.stringify(normalized[key]) : normalized[key]
    ]));
    const result = database.prepare(
      `UPDATE ${definition.table} SET ${setClause} WHERE id = @id`
    ).run({ ...values, id: body.id });
    if (result.changes === 0) return NextResponse.json({ error: 'Запись не найдена' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`${operation} ${resourceName} error:`, error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Не удалось сохранить запись' }, { status: 400 });
  }
}
