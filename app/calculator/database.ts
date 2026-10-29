import 'server-only';

import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import type {
  CalculatorData,
  CalculatorService,
  CalculatorSettings,
  Category,
  DiscountThreshold,
  MeasurementUnit,
  PriceType,
  Product,
  ProductVariant,
  ServicePriceType
} from './types';

declare global {
  var calculatorDatabase: Database.Database | undefined;
}

const databasePath = path.join(process.cwd(), 'data', 'calculator.sqlite');
mkdirSync(path.dirname(databasePath), { recursive: true });

const database = globalThis.calculatorDatabase ?? new Database(databasePath);
if (process.env.NODE_ENV !== 'production') globalThis.calculatorDatabase = database;

database.pragma('journal_mode = WAL');
database.pragma('foreign_keys = ON');
database.exec(`
  CREATE TABLE IF NOT EXISTS calculator_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS calculator_products (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    category_id TEXT REFERENCES calculator_categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    unit TEXT NOT NULL,
    price_minor INTEGER,
    price_type TEXT NOT NULL,
    min_quantity_milli INTEGER NOT NULL DEFAULT 1000,
    step_quantity_milli INTEGER NOT NULL DEFAULT 1000,
    sort_order INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    images_json TEXT NOT NULL DEFAULT '[]',
    variants_json TEXT NOT NULL DEFAULT '[]'
  );
  CREATE TABLE IF NOT EXISTS calculator_services (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    price_type TEXT NOT NULL,
    unit TEXT NOT NULL,
    price_minor INTEGER NOT NULL DEFAULT 0,
    percent_basis_points INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS calculator_discounts (
    id TEXT PRIMARY KEY,
    minimum_minor INTEGER NOT NULL,
    percent_basis_points INTEGER NOT NULL,
    active INTEGER NOT NULL DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS calculator_settings (
    id INTEGER PRIMARY KEY CHECK(id = 1),
    payload_json TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS calculator_requests (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL DEFAULT '',
    comment TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'new',
    total_minor INTEGER NOT NULL,
    payload_json TEXT NOT NULL,
    utm_json TEXT NOT NULL DEFAULT '{}',
    telegram_sent INTEGER NOT NULL DEFAULT 0
  );
`);

const countCategories = database.prepare('SELECT COUNT(*) AS count FROM calculator_categories').get() as { count: number };
if (countCategories.count === 0) {
  const insertCategory = database.prepare(
    'INSERT INTO calculator_categories (id, name, slug, sort_order, active) VALUES (?, ?, ?, ?, 1)'
  );
  const categories = [
    ['cornices', 'Карнизы', 'karnizy'],
    ['moldings', 'Молдинги', 'moldingi'],
    ['rosettes', 'Розетки', 'rozetki'],
    ['baguettes', 'Багеты', 'bagety'],
    ['pilasters', 'Пилястры', 'pilyastry'],
    ['consoles', 'Консоли', 'konsoli'],
    ['ceiling', 'Потолочные элементы', 'potolochnye-elementy']
  ];
  categories.forEach((category, index) => insertCategory.run(...category.slice(0, 3), index));
}

const countProducts = database.prepare('SELECT COUNT(*) AS count FROM calculator_products').get() as { count: number };
if (countProducts.count === 0) {
  const insertProduct = database.prepare(`
    INSERT INTO calculator_products
      (id, slug, category_id, name, description, unit, price_minor, price_type, min_quantity_milli, step_quantity_milli, sort_order, active)
    VALUES (?, ?, ?, ?, '', ?, ?, 'fixed', 1000, 1000, ?, 1)
  `);
  const products = [
    ['column', 'pilasters', 'Ионическая колонна', 'шт', 850_000],
    ['rosette', 'rosettes', 'Потолочная розетка «Меандр»', 'шт', 420_000],
    ['cornice', 'cornices', 'Карниз «Греческий профиль»', 'п.м.', 180_000],
    ['bracket', 'consoles', 'Кронштейн с волютами', 'шт', 390_000]
  ];
  products.forEach((product, index) => insertProduct.run(product[0], product[0], ...product.slice(1), index));
}

const countServices = database.prepare('SELECT COUNT(*) AS count FROM calculator_services').get() as { count: number };
if (countServices.count === 0) {
  const insertService = database.prepare(`
    INSERT INTO calculator_services
      (id, name, type, price_type, unit, price_minor, percent_basis_points, sort_order, active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);
  insertService.run('installation', 'Монтаж', 'Монтаж', 'per_unit', 'п.м.', 50_000, 0, 0);
  insertService.run('painting', 'Покраска', 'Покраска', 'percent', 'шт', 0, 1_500, 1);
  insertService.run('delivery', 'Доставка', 'Доставка', 'fixed', 'комплект', 150_000, 0, 2);
}

database.prepare(`
  INSERT OR IGNORE INTO calculator_settings (id, payload_json)
  VALUES (1, ?)
`).run(JSON.stringify({
  minimumOrderMinor: 0,
  phone: '+7 (999) 123-45-67',
  email: 'info@ellada-decor.ru',
  address: '',
  title: 'Калькулятор лепнины',
  description: 'Выберите изделия, добавьте услуги и отправьте заявку.'
} satisfies CalculatorSettings));

function parseJson<T>(value: string): T {
  return JSON.parse(value) as T;
}

export function getCalculatorData(includeInactive = false): CalculatorData {
  const activeFilter = includeInactive ? '' : ' WHERE active = 1';
  const categories = database.prepare(
    `SELECT id, name, slug, sort_order AS sortOrder, active FROM calculator_categories${activeFilter} ORDER BY sort_order, name`
  ).all().map((row) => {
    const item = row as Omit<Category, 'active'> & { active: number };
    return { ...item, active: Boolean(item.active) };
  });

  const products = database.prepare(`
    SELECT id, slug, category_id AS categoryId, name, description, unit, price_minor AS priceMinor,
      price_type AS priceType, min_quantity_milli AS minQuantityMilli,
      step_quantity_milli AS stepQuantityMilli, sort_order AS sortOrder, active,
      images_json AS imagesJson, variants_json AS variantsJson
    FROM calculator_products${activeFilter}
    ORDER BY sort_order, name
  `).all().map((row) => {
    const item = row as Omit<Product, 'active' | 'images' | 'variants'> & {
      active: number; imagesJson: string; variantsJson: string;
    };
    return {
      id: item.id,
      slug: item.slug,
      categoryId: item.categoryId,
      name: item.name,
      description: item.description,
      unit: item.unit as MeasurementUnit,
      priceMinor: item.priceMinor,
      priceType: item.priceType as PriceType,
      minQuantityMilli: item.minQuantityMilli,
      stepQuantityMilli: item.stepQuantityMilli,
      sortOrder: item.sortOrder,
      active: Boolean(item.active),
      images: parseJson<string[]>(item.imagesJson),
      variants: parseJson<ProductVariant[]>(item.variantsJson)
    };
  });
  const visibleCategoryIds = new Set(categories.map((category) => category.id));
  const visibleProducts = includeInactive
    ? products
    : products.filter((product) => !product.categoryId || visibleCategoryIds.has(product.categoryId));

  const services = database.prepare(
    `SELECT id, name, type, price_type AS priceType, unit, price_minor AS priceMinor,
      percent_basis_points AS percentBasisPoints, sort_order AS sortOrder, active
     FROM calculator_services${activeFilter} ORDER BY sort_order, name`
  ).all().map((row) => {
    const item = row as Omit<CalculatorService, 'active' | 'unit' | 'priceType'> & {
      active: number; unit: string; priceType: string;
    };
    return { ...item, active: Boolean(item.active), unit: item.unit as MeasurementUnit, priceType: item.priceType as ServicePriceType };
  });

  const discounts = database.prepare(
    `SELECT id, minimum_minor AS minimumMinor, percent_basis_points AS percentBasisPoints, active
     FROM calculator_discounts${activeFilter} ORDER BY minimum_minor`
  ).all().map((row) => {
    const item = row as Omit<DiscountThreshold, 'active'> & { active: number };
    return { ...item, active: Boolean(item.active) };
  });

  const settingsRow = database.prepare(
    'SELECT payload_json AS payloadJson FROM calculator_settings WHERE id = 1'
  ).get() as { payloadJson: string };

  return {
    categories,
    products: visibleProducts,
    services,
    discounts,
    settings: parseJson<CalculatorSettings>(settingsRow.payloadJson)
  };
}

export function getDatabase(): Database.Database {
  return database;
}

export function isMeasurementUnit(value: unknown): value is MeasurementUnit {
  return value === 'шт' || value === 'п.м.' || value === 'м²' || value === 'комплект';
}
