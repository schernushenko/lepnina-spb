'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatRubles, parseRubles } from '@/app/calculator/calculate';
import AdminShell from '../AdminShell';
import type {
  CalculatorData,
  CalculatorSettings,
  Category,
  DiscountThreshold,
  MeasurementUnit,
  PriceType,
  Product,
  ProductVariant,
  ServicePriceType
} from '@/app/calculator/types';

type Section = 'categories' | 'products' | 'services' | 'discounts' | 'settings' | 'requests';
type VariantEditor = { id: string; name: string; price: string; image: string };
type ProductEditor = {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  description: string;
  unit: MeasurementUnit;
  price: string;
  priceType: PriceType;
  minimum: string;
  step: string;
  sortOrder: string;
  active: boolean;
  images: string[];
  variants: VariantEditor[];
};
type RequestRecord = {
  id: string;
  createdAt: string;
  name: string;
  phone: string;
  email: string;
  status: string;
  totalMinor: number;
  payload: {
    contact: { comment: string };
    calculation: {
      lines: Array<{ name: string; variantName: string | null; quantityMilli: number; unit: string; lineTotalMinor: number | null }>;
      services: Array<{ name: string; lineTotalMinor: number }>;
      discountMinor: number;
      discountName: string | null;
    };
  };
  utm: Record<string, string>;
};

const units: MeasurementUnit[] = ['шт', 'п.м.', 'м²', 'комплект'];
const sections: Array<{ id: Section; label: string }> = [
  { id: 'categories', label: 'Категории' },
  { id: 'products', label: 'Изделия' },
  { id: 'services', label: 'Услуги' },
  { id: 'discounts', label: 'Скидки' },
  { id: 'settings', label: 'Настройки' },
  { id: 'requests', label: 'Заявки' }
];
const initialProduct: ProductEditor = {
  id: '', name: '', slug: '', categoryId: '', description: '', unit: 'шт', price: '',
  priceType: 'fixed', minimum: '1', step: '1', sortOrder: '0', active: true, images: [], variants: []
};

function slugify(value: string): string {
  return value.toLocaleLowerCase('ru')
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function toMilli(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (!/^\d+(\.\d{1,3})?$/.test(normalized)) return null;
  const [whole, fraction = ''] = normalized.split('.');
  return Number(whole) * 1000 + Number(fraction.padEnd(3, '0'));
}

function statusLabel(status: string): string {
  return ({ new: 'Новая', in_progress: 'В работе', completed: 'Выполнена', cancelled: 'Отменена' } as Record<string, string>)[status] ?? status;
}

export default function CalculatorAdminPage() {
  const router = useRouter();
  const [section, setSection] = useState<Section>('products');
  const [data, setData] = useState<CalculatorData | null>(null);
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ id: '', name: '', slug: '', sortOrder: '0', active: true });
  const [productForm, setProductForm] = useState<ProductEditor>(initialProduct);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [serviceForm, setServiceForm] = useState({
    id: '', name: '', type: 'Монтаж', priceType: 'per_unit' as ServicePriceType,
    unit: 'п.м.' as MeasurementUnit, price: '0', percent: '0', sortOrder: '0', active: true
  });
  const [discountForm, setDiscountForm] = useState({ id: '', minimum: '', percent: '', active: true });
  const [minimumOrderInput, setMinimumOrderInput] = useState('0');
  const [settingsForm, setSettingsForm] = useState<CalculatorSettings>({
    minimumOrderMinor: 0, phone: '', email: '', address: '', title: '', description: ''
  });
  const [requestStatus, setRequestStatus] = useState('all');
  const [requestFrom, setRequestFrom] = useState('');
  const [requestTo, setRequestTo] = useState('');
  const [draggedCategory, setDraggedCategory] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const response = await fetch('/api/admin/calculator', { cache: 'no-store' });
    if (response.status === 401) {
      router.replace('/admin/login');
      return;
    }
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Не удалось загрузить данные');
    const calculatorData = result as CalculatorData;
    setData(calculatorData);
    setSettingsForm(calculatorData.settings);
    setMinimumOrderInput((calculatorData.settings.minimumOrderMinor / 100).toFixed(2));
  }, [router]);

  const loadRequests = useCallback(async () => {
    const params = new URLSearchParams();
    if (requestStatus !== 'all') params.set('status', requestStatus);
    if (requestFrom) params.set('from', requestFrom);
    if (requestTo) params.set('to', requestTo);
    const response = await fetch(`/api/admin/requests?${params}`);
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Не удалось загрузить заявки');
    setRequests(result as RequestRecord[]);
  }, [requestFrom, requestStatus, requestTo]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadData().catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : String(loadError)));
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadData]);

  useEffect(() => {
    if (section !== 'requests') return;
    const timeoutId = window.setTimeout(() => {
      void loadRequests().catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : String(loadError)));
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadRequests, section]);

  const categoriesById = useMemo(
    () => new Map(data?.categories.map((category) => [category.id, category.name]) ?? []),
    [data]
  );

  const mutate = async (resource: string, method: 'POST' | 'PATCH' | 'DELETE', body?: unknown, id?: string) => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const suffix = id ? `?id=${encodeURIComponent(id)}` : '';
      const response = await fetch(`/api/admin/calculator/${resource}${suffix}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        ...(body === undefined ? {} : { body: JSON.stringify(body) })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Не удалось сохранить изменения');
      await loadData();
      setMessage('Изменения сохранены.');
      return result as { id?: string };
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : String(mutationError));
      return null;
    } finally {
      setBusy(false);
    }
  };

  const saveCategory = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = {
      name: categoryForm.name,
      slug: categoryForm.slug || slugify(categoryForm.name),
      sortOrder: Number(categoryForm.sortOrder),
      active: categoryForm.active
    };
    const result = await mutate('categories', categoryForm.id ? 'PATCH' : 'POST',
      categoryForm.id ? { ...payload, id: categoryForm.id } : payload);
    if (result) setCategoryForm({ id: '', name: '', slug: '', sortOrder: '0', active: true });
  };

  const deleteCategory = async (category: Category) => {
    if (!data) return;
    const hasProducts = data.products.some((product) => product.categoryId === category.id);
    let moveProductsToCategoryId: string | null = null;
    if (hasProducts) {
      const target = window.prompt(
        `В категории есть товары. Укажите slug категории для переноса или оставьте поле пустым, чтобы оставить товары без категории:\n${data.categories.filter((item) => item.id !== category.id).map((item) => item.slug).join(', ')}`,
        ''
      );
      if (target === null) return;
      moveProductsToCategoryId = target.trim()
        ? data.categories.find((item) => item.slug === target.trim() && item.id !== category.id)?.id ?? ''
        : null;
      if (moveProductsToCategoryId === '') {
        setError('Категория с таким slug не найдена.');
        return;
      }
    } else if (!window.confirm(`Удалить категорию «${category.name}»?`)) {
      return;
    }
    await mutate('categories', 'DELETE', { moveProductsToCategoryId }, category.id);
  };

  const reorderCategory = async (categoryId: string, targetId: string) => {
    if (!data || categoryId === targetId) return;
    const ordered = [...data.categories].sort((a, b) => a.sortOrder - b.sortOrder);
    const from = ordered.findIndex((item) => item.id === categoryId);
    const to = ordered.findIndex((item) => item.id === targetId);
    if (from < 0 || to < 0) return;
    const [moved] = ordered.splice(from, 1);
    ordered.splice(to, 0, moved);
    setBusy(true);
    try {
      for (let index = 0; index < ordered.length; index++) {
        const category = ordered[index];
        const response = await fetch('/api/admin/calculator/categories', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...category, sortOrder: index })
        });
        if (!response.ok) throw new Error((await response.json()).error || 'Не удалось изменить порядок');
      }
      await loadData();
      setMessage('Порядок категорий обновлён.');
    } catch (reorderError) {
      setError(reorderError instanceof Error ? reorderError.message : String(reorderError));
    } finally {
      setBusy(false);
      setDraggedCategory(null);
    }
  };

  const editProduct = (product: Product) => {
    setUploadedImages([]);
    setProductForm({
      id: product.id,
      name: product.name,
      slug: product.slug,
      categoryId: product.categoryId ?? '',
      description: product.description,
      unit: product.unit,
      price: product.priceMinor === null ? '' : (product.priceMinor / 100).toFixed(2),
      priceType: product.priceType,
      minimum: (product.minQuantityMilli / 1000).toString(),
      step: (product.stepQuantityMilli / 1000).toString(),
      sortOrder: String(product.sortOrder),
      active: product.active,
      images: product.images,
      variants: product.variants.map((variant) => ({
        id: variant.id,
        name: variant.name,
        price: variant.priceMinor === null ? '' : (variant.priceMinor / 100).toFixed(2),
        image: variant.image ?? ''
      }))
    });
  };

  const uploadProductImages = async (files: FileList | null) => {
    if (!files?.length) return;
    if (productForm.images.length + files.length > 10) {
      setError('Для одного изделия можно загрузить не более 10 изображений.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append('images', file));
      const response = await fetch('/api/admin/calculator/images', { method: 'POST', body: formData });
      const result = await response.json() as { images?: string[]; error?: string };
      if (!response.ok || !result.images) throw new Error(result.error || 'Не удалось загрузить изображения');
      setProductForm((current) => ({ ...current, images: [...current.images, ...result.images!] }));
      setUploadedImages((current) => [...current, ...result.images!]);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : String(uploadError));
    } finally {
      setBusy(false);
    }
  };

  const removeProductImage = async (image: string) => {
    if (uploadedImages.includes(image)) {
      try {
        const response = await fetch('/api/admin/calculator/images', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image })
        });
        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error || 'Не удалось удалить файл');
        }
      } catch (removeError) {
        setError(removeError instanceof Error ? removeError.message : String(removeError));
        return;
      }
      setUploadedImages((current) => current.filter((item) => item !== image));
    }
    setProductForm((current) => ({
      ...current,
      images: current.images.filter((item) => item !== image),
      variants: current.variants.map((variant) => variant.image === image ? { ...variant, image: '' } : variant)
    }));
  };

  const saveProduct = async (event: React.FormEvent) => {
    event.preventDefault();
    const priceMinor = productForm.priceType === 'request' ? null : parseRubles(productForm.price);
    const minimum = toMilli(productForm.minimum);
    const step = toMilli(productForm.step);
    const variants: ProductVariant[] = [];
    for (const variant of productForm.variants) {
      const variantPrice = variant.price ? parseRubles(variant.price) : null;
      if (variant.price && variantPrice === null) {
        setError(`Проверьте цену варианта «${variant.name}»`);
        return;
      }
      variants.push({ id: variant.id, name: variant.name, priceMinor: variantPrice, image: variant.image || null });
    }
    if (productForm.priceType !== 'request' && priceMinor === null) {
      setError('Введите цену в рублях, например 1250 или 1250,50.');
      return;
    }
    if (minimum === null || minimum < 1 || step === null || step < 1) {
      setError('Проверьте минимальное количество и шаг.');
      return;
    }
    const payload = {
      id: productForm.id,
      name: productForm.name,
      slug: productForm.slug || slugify(productForm.name),
      categoryId: productForm.categoryId || null,
      description: productForm.description,
      unit: productForm.unit,
      priceMinor,
      priceType: productForm.priceType,
      minQuantityMilli: minimum,
      stepQuantityMilli: step,
      sortOrder: Number(productForm.sortOrder),
      active: productForm.active,
      images: productForm.images,
      variants
    };
    const result = await mutate('products', productForm.id ? 'PATCH' : 'POST',
      productForm.id ? payload : { ...payload, id: undefined });
    if (result) {
      setProductForm(initialProduct);
      setUploadedImages([]);
    }
  };

  const discardProductEdit = async () => {
    try {
      await Promise.all(uploadedImages.map(async (image) => {
        const response = await fetch('/api/admin/calculator/images', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image })
        });
        if (!response.ok) throw new Error('Не удалось удалить несохранённое изображение');
      }));
      setUploadedImages([]);
      setProductForm(initialProduct);
    } catch (discardError) {
      setError(discardError instanceof Error ? discardError.message : String(discardError));
    }
  };

  const deleteProduct = async (product: Product) => {
    let existingRequests = requests;
    try {
      if (section !== 'requests') {
        const response = await fetch('/api/admin/requests');
        if (!response.ok) throw new Error('Не удалось проверить существующие заявки');
        existingRequests = await response.json() as RequestRecord[];
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : String(requestError));
      return;
    }
    const referenced = existingRequests.some((request) =>
      request.payload.calculation.lines.some((line) => line.name === product.name)
    );
    const warning = referenced
      ? 'Этот товар встречается в заявках. Старые заявки сохранят свой снимок состава. Удалить товар?'
      : `Удалить «${product.name}»?`;
    if (!window.confirm(warning)) return;
    await mutate('products', 'DELETE', undefined, product.id);
  };

  const reorderProduct = async (product: Product, direction: -1 | 1) => {
    if (!data) return;
    const group = [...data.products]
      .filter((item) => item.categoryId === product.categoryId)
      .sort((left, right) => left.sortOrder - right.sortOrder);
    const index = group.findIndex((item) => item.id === product.id);
    const target = index + direction;
    if (target < 0 || target >= group.length) return;
    [group[index], group[target]] = [group[target], group[index]];

    setBusy(true);
    try {
      for (let position = 0; position < group.length; position++) {
        const item = group[position];
        const response = await fetch('/api/admin/calculator/products', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...item, sortOrder: position })
        });
        if (!response.ok) throw new Error((await response.json()).error || 'Не удалось изменить порядок');
      }
      await loadData();
      setMessage('Порядок изделий в категории обновлён.');
    } catch (reorderError) {
      setError(reorderError instanceof Error ? reorderError.message : String(reorderError));
    } finally {
      setBusy(false);
    }
  };

  const saveService = async (event: React.FormEvent) => {
    event.preventDefault();
    const priceMinor = parseRubles(serviceForm.price);
    const percent = Math.round(Number(serviceForm.percent.replace(',', '.')) * 100);
    if (priceMinor === null || !Number.isFinite(percent) || percent < 0) {
      setError('Проверьте цену и процент услуги.');
      return;
    }
    const payload = {
      id: serviceForm.id,
      name: serviceForm.name,
      type: serviceForm.type,
      priceType: serviceForm.priceType,
      unit: serviceForm.unit,
      priceMinor,
      percentBasisPoints: percent,
      sortOrder: Number(serviceForm.sortOrder),
      active: serviceForm.active
    };
    const result = await mutate('services', serviceForm.id ? 'PATCH' : 'POST', payload);
    if (result) setServiceForm({
      id: '', name: '', type: 'Монтаж', priceType: 'per_unit', unit: 'п.м.',
      price: '0', percent: '0', sortOrder: '0', active: true
    });
  };

  const saveDiscount = async (event: React.FormEvent) => {
    event.preventDefault();
    const minimumMinor = parseRubles(discountForm.minimum);
    const percent = Math.round(Number(discountForm.percent.replace(',', '.')) * 100);
    if (minimumMinor === null || !Number.isFinite(percent) || percent < 0 || percent > 10_000) {
      setError('Введите корректную сумму и процент скидки от 0 до 100.');
      return;
    }
    const payload = {
      id: discountForm.id,
      minimumMinor,
      percentBasisPoints: percent,
      active: discountForm.active
    };
    const result = await mutate('discounts', discountForm.id ? 'PATCH' : 'POST', payload);
    if (result) setDiscountForm({ id: '', minimum: '', percent: '', active: true });
  };

  const saveSettings = async (event: React.FormEvent) => {
    event.preventDefault();
    const minimumOrderMinor = parseRubles(minimumOrderInput);
    if (minimumOrderMinor === null) {
      setError('Введите корректную минимальную сумму.');
      return;
    }
    await mutate('settings', 'PATCH', { ...settingsForm, minimumOrderMinor });
  };

  const changeRequestStatus = async (requestId: string, status: string) => {
    const response = await fetch('/api/admin/requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: requestId, status })
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.error || 'Не удалось изменить статус');
      return;
    }
    setMessage('Статус заявки обновлён.');
    await loadRequests();
  };

  const exportRequests = async () => {
    try {
      const response = await fetch('/api/admin/requests/export');
      if (!response.ok) throw new Error('Не удалось экспортировать заявки');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'calculator-requests.csv';
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : String(exportError));
    }
  };

  if (!data) {
    return (
      <AdminShell active="calculator" title="Калькулятор" description="Каталог изделий, услуги, цены и заявки клиентов.">
        <div className="rounded-2xl border border-[#e9e9e5] bg-white p-8 text-sm text-[#777971]">
          {error || 'Загружаем данные калькулятора…'}
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell active="calculator" title="Калькулятор" description="Управляйте каталогом изделий, услугами, скидками и заявками клиентов.">
      <main>
        <nav className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-[#e9e9e5] bg-white p-1.5 shadow-[0_2px_8px_rgba(27,30,22,0.025)]" aria-label="Разделы калькулятора">
          {sections.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => { setSection(item.id); setMessage(''); setError(''); }}
              aria-current={section === item.id ? 'page' : undefined}
              className={`shrink-0 rounded-lg px-3.5 py-2 text-xs font-medium transition-colors sm:px-4 ${
                section === item.id ? 'bg-[#292b25] text-white shadow-sm' : 'text-[#777971] hover:bg-[#f4f4f0] hover:text-[#292b25]'
              }`}
            >
              {item.label}{item.id === 'requests' ? ` (${requests.length})` : ''}
            </button>
          ))}
        </nav>
        {message && <p role="status" className="mb-4 rounded-xl border border-[#dce9dc] bg-[#f1f7f0] p-3.5 text-sm text-[#557958]">{message}</p>}
        {error && <p role="alert" className="mb-4 rounded-xl border border-[#f0dfda] bg-[#fcf3f0] p-3.5 text-sm text-[#9b5548]">{error}</p>}

        {section === 'categories' && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <section className="rounded bg-white p-5 shadow">
              <h2 className="mb-4 text-xl font-semibold">Категории (перетаскивайте для сортировки)</h2>
              <div className="space-y-2">
                {[...data.categories].sort((a, b) => a.sortOrder - b.sortOrder).map((category) => (
                  <div key={category.id} draggable onDragStart={() => setDraggedCategory(category.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => draggedCategory && void reorderCategory(draggedCategory, category.id)}
                    className="flex flex-wrap items-center justify-between gap-2 rounded border p-3">
                    <span className="cursor-grab">☰ {category.name} <small className="text-gray-500">/{category.slug} · {data.products.filter((item) => item.categoryId === category.id).length} изделий</small></span>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setCategoryForm({ id: category.id, name: category.name, slug: category.slug, sortOrder: String(category.sortOrder), active: category.active })} className="text-blue-700">Изменить</button>
                      <button type="button" onClick={() => void deleteCategory(category)} className="text-red-700">Удалить</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <form onSubmit={saveCategory} className="h-fit space-y-3 rounded bg-white p-5 shadow">
              <h2 className="text-xl font-semibold">{categoryForm.id ? 'Изменить категорию' : 'Новая категория'}</h2>
              <input required placeholder="Название" value={categoryForm.name} onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value, slug: categoryForm.slug || slugify(event.target.value) })} className="w-full rounded border p-2" />
              <input required placeholder="Slug" value={categoryForm.slug} onChange={(event) => setCategoryForm({ ...categoryForm, slug: event.target.value })} className="w-full rounded border p-2" />
              <label className="flex gap-2"><input type="checkbox" checked={categoryForm.active} onChange={(event) => setCategoryForm({ ...categoryForm, active: event.target.checked })} />Активна</label>
              <button disabled={busy} className="rounded bg-blue-700 px-4 py-2 text-white">Сохранить</button>
              {categoryForm.id && <button type="button" onClick={() => setCategoryForm({ id: '', name: '', slug: '', sortOrder: '0', active: true })} className="ml-2">Отмена</button>}
            </form>
          </div>
        )}

        {section === 'products' && (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]">
            <section className="rounded bg-white p-5 shadow">
              <h2 className="mb-4 text-xl font-semibold">Изделия ({data.products.length})</h2>
              <div className="space-y-3">
                {[...data.products].sort((a, b) => a.sortOrder - b.sortOrder).map((product, index, list) => (
                  <article key={product.id} className="flex flex-wrap items-center gap-3 rounded border p-3">
                    <div className="relative h-16 w-16 shrink-0 bg-gray-100">
                      {product.images[0] && <Image src={product.images[0]} alt="" fill sizes="64px" className="object-cover" />}
                    </div>
                    <div className="min-w-40 flex-1">
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-600">{categoriesById.get(product.categoryId ?? '') ?? 'Без категории'} · {product.unit} · {product.priceType === 'request' ? 'по запросу' : `${product.priceType === 'from' ? 'от ' : ''}${formatRubles(product.priceMinor ?? 0)} ₽`}</p>
                      <p className="text-xs text-gray-500">{product.active ? 'Активно' : 'Скрыто'} · {product.variants.length} вариантов · {product.images.length} фото</p>
                    </div>
                    <div className="flex gap-3">
                      <button type="button" disabled={!list.slice(0, index).some((item) => item.categoryId === product.categoryId) || busy} onClick={() => void reorderProduct(product, -1)} aria-label="Выше">↑</button>
                      <button type="button" disabled={!list.slice(index + 1).some((item) => item.categoryId === product.categoryId) || busy} onClick={() => void reorderProduct(product, 1)} aria-label="Ниже">↓</button>
                      <button type="button" onClick={() => editProduct(product)} className="text-blue-700">Изменить</button>
                      <button type="button" onClick={() => void deleteProduct(product)} className="text-red-700">Удалить</button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
            <form onSubmit={saveProduct} className="admin-product-form min-w-0 space-y-4 rounded bg-white p-5 shadow">
              <div>
                <h2 className="text-xl font-semibold">{productForm.id ? 'Редактировать изделие' : 'Новое изделие'}</h2>
                <p className="mt-1 text-xs text-gray-500">Добавьте основную информацию, цену и варианты изделия.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input required placeholder="Название" aria-label="Название изделия" value={productForm.name} onChange={(event) => setProductForm({ ...productForm, name: event.target.value, slug: productForm.slug || slugify(event.target.value) })} className="min-w-0 w-full rounded border p-2" />
                <input required placeholder="Slug" aria-label="Slug изделия" value={productForm.slug} onChange={(event) => setProductForm({ ...productForm, slug: event.target.value })} className="min-w-0 w-full rounded border p-2" />
              </div>
              <textarea placeholder="Краткое описание" aria-label="Краткое описание" value={productForm.description} onChange={(event) => setProductForm({ ...productForm, description: event.target.value })} className="min-w-0 w-full rounded border p-2" rows={2} />
              <div className="grid gap-3 sm:grid-cols-2">
                <select value={productForm.categoryId} onChange={(event) => setProductForm({ ...productForm, categoryId: event.target.value })} className="rounded border p-2">
                  <option value="">Без категории</option>{data.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
                <select value={productForm.unit} onChange={(event) => setProductForm({ ...productForm, unit: event.target.value as MeasurementUnit })} className="rounded border p-2">
                  {units.map((unit) => <option key={unit}>{unit}</option>)}
                </select>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <select value={productForm.priceType} onChange={(event) => setProductForm({ ...productForm, priceType: event.target.value as PriceType })} className="rounded border p-2">
                  <option value="fixed">Фиксированная</option><option value="from">Цена «от»</option><option value="request">По запросу</option>
                </select>
                <input type="number" min="0" step="0.01" disabled={productForm.priceType === 'request'} required={productForm.priceType !== 'request'} placeholder="Цена, ₽" value={productForm.price} onChange={(event) => setProductForm({ ...productForm, price: event.target.value })} className="rounded border p-2 disabled:bg-gray-100" />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="min-w-0 text-sm">Минимум<input required min="0.001" step="0.001" type="number" value={productForm.minimum} onChange={(event) => setProductForm({ ...productForm, minimum: event.target.value })} className="mt-1 w-full rounded border p-2" /></label>
                <label className="min-w-0 text-sm">Шаг<input required min="0.001" step="0.001" type="number" value={productForm.step} onChange={(event) => setProductForm({ ...productForm, step: event.target.value })} className="mt-1 w-full rounded border p-2" /></label>
                <label className="min-w-0 text-sm">Порядок<input min="0" type="number" value={productForm.sortOrder} onChange={(event) => setProductForm({ ...productForm, sortOrder: event.target.value })} className="mt-1 w-full rounded border p-2" /></label>
              </div>
              <label className="flex gap-2"><input type="checkbox" checked={productForm.active} onChange={(event) => setProductForm({ ...productForm, active: event.target.checked })} />Активно в публичном каталоге</label>
              <div>
                <label className="block text-sm font-medium">Изображения (до 10, первое — главное)</label>
                <input type="file" accept="image/*" multiple onChange={(event) => { void uploadProductImages(event.target.files); event.currentTarget.value = ''; }} className="admin-product-file mt-1 block w-full min-w-0 rounded border p-2" />
                <div className="mt-2 flex flex-wrap gap-2">
                  {productForm.images.map((image, index) => (
                    <div key={image} className="relative h-20 w-20 border">
                      <Image src={image} alt="" fill sizes="80px" className="object-cover" />
                      <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/70 text-xs text-white">
                        <button type="button" disabled={index === 0} onClick={() => setProductForm((current) => {
                          const images = [...current.images]; [images[index - 1], images[index]] = [images[index], images[index - 1]];
                          return { ...current, images };
                        })} aria-label="Переместить изображение выше">↑</button>
                        <button type="button" onClick={() => void removeProductImage(image)} aria-label="Удалить изображение">×</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="admin-product-variants border-t border-gray-200 pt-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-medium">Варианты изделия</h3>
                    <p className="mt-0.5 text-xs text-gray-500">Размеры и исполнения с отдельными ценами.</p>
                  </div>
                  <button type="button" onClick={() => setProductForm((current) => ({ ...current, variants: [...current.variants, { id: crypto.randomUUID(), name: '', price: '', image: '' }] }))} className="rounded-lg border border-[#e5e5df] px-3 py-2 text-xs font-medium text-[#806344] transition-colors hover:bg-[#f7f5f0]">+ Добавить вариант</button>
                </div>
                {productForm.variants.map((variant, index) => (
                  <div key={variant.id} className="admin-product-variant mb-2 rounded-xl border border-[#e9e9e5] bg-[#fafaf8] p-3">
                    <div className="admin-product-variant-fields">
                      <label className="min-w-0 text-xs font-medium text-[#55574f]">
                        Название варианта
                        <input required placeholder="Например, 50 см" aria-label={`Название варианта ${index + 1}`} value={variant.name} onChange={(event) => setProductForm((current) => ({ ...current, variants: current.variants.map((item, i) => i === index ? { ...item, name: event.target.value } : item) }))} className="mt-1.5 w-full min-w-0 rounded-lg border border-[#e5e5df] bg-white px-3 py-2.5 text-sm font-normal" />
                      </label>
                      <label className="min-w-0 text-xs font-medium text-[#55574f]">
                        Цена, ₽
                        <input type="number" min="0" step="0.01" placeholder="0" aria-label={`Цена варианта ${index + 1}`} value={variant.price} onChange={(event) => setProductForm((current) => ({ ...current, variants: current.variants.map((item, i) => i === index ? { ...item, price: event.target.value } : item) }))} className="mt-1.5 w-full min-w-0 rounded-lg border border-[#e5e5df] bg-white px-3 py-2.5 text-sm font-normal" />
                      </label>
                    </div>
                    <div className="admin-product-variant-footer mt-2">
                      <label className="min-w-0 text-xs font-medium text-[#55574f]">
                        Изображение
                        <select value={variant.image} aria-label={`Изображение варианта ${index + 1}`} onChange={(event) => setProductForm((current) => ({ ...current, variants: current.variants.map((item, i) => i === index ? { ...item, image: event.target.value } : item) }))} className="mt-1.5 w-full min-w-0 rounded-lg border border-[#e5e5df] bg-white px-3 py-2.5 text-sm font-normal">
                          <option value="">Основное фото</option>{productForm.images.map((image) => <option key={image} value={image}>{image.split('/').pop()}</option>)}
                        </select>
                      </label>
                      <button type="button" onClick={() => setProductForm((current) => ({ ...current, variants: current.variants.filter((_, i) => i !== index) }))} className="admin-product-variant-delete self-end rounded-lg px-3 py-2.5 text-xs font-medium text-[#a14d3c] transition-colors hover:bg-[#fbf2ef]">Удалить вариант</button>
                    </div>
                  </div>
                ))}
              </div>
              <button disabled={busy} className="rounded bg-blue-700 px-4 py-2 text-white">{busy ? 'Сохранение…' : 'Сохранить изделие'}</button>
              {productForm.id && <button type="button" onClick={() => void discardProductEdit()} className="ml-2">Отмена</button>}
            </form>
          </div>
        )}

        {section === 'services' && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <section className="rounded bg-white p-5 shadow"><h2 className="mb-4 text-xl font-semibold">Услуги</h2>
              <div className="space-y-2">{data.services.map((service) => (
                <div key={service.id} className="flex flex-wrap items-center justify-between gap-2 rounded border p-3">
                  <div><p className="font-medium">{service.name} <span className="text-sm text-gray-500">({service.type})</span></p><p className="text-sm text-gray-600">{service.priceType === 'percent' ? `${service.percentBasisPoints / 100}%` : `${formatRubles(service.priceMinor)} ₽${service.priceType === 'per_unit' ? ` / ${service.unit}` : ''}`} · {service.active ? 'Активна' : 'Скрыта'}</p></div>
                  <div className="flex gap-3"><button type="button" onClick={() => setServiceForm({ id: service.id, name: service.name, type: service.type, priceType: service.priceType, unit: service.unit, price: (service.priceMinor / 100).toFixed(2), percent: (service.percentBasisPoints / 100).toString(), sortOrder: String(service.sortOrder), active: service.active })} className="text-blue-700">Изменить</button><button type="button" onClick={() => void mutate('services', 'DELETE', undefined, service.id)} className="text-red-700">Удалить</button></div>
                </div>
              ))}</div>
            </section>
            <form onSubmit={saveService} className="h-fit space-y-3 rounded bg-white p-5 shadow">
              <h2 className="text-xl font-semibold">{serviceForm.id ? 'Изменить услугу' : 'Новая услуга'}</h2>
              <input required placeholder="Название" value={serviceForm.name} onChange={(event) => setServiceForm({ ...serviceForm, name: event.target.value })} className="w-full rounded border p-2" />
              <input required placeholder="Тип (монтаж, доставка…)" value={serviceForm.type} onChange={(event) => setServiceForm({ ...serviceForm, type: event.target.value })} className="w-full rounded border p-2" />
              <select value={serviceForm.priceType} onChange={(event) => setServiceForm({ ...serviceForm, priceType: event.target.value as ServicePriceType })} className="w-full rounded border p-2"><option value="per_unit">Цена за единицу</option><option value="percent">Процент от изделий</option><option value="fixed">Фиксированная цена</option></select>
              <select value={serviceForm.unit} onChange={(event) => setServiceForm({ ...serviceForm, unit: event.target.value as MeasurementUnit })} className="w-full rounded border p-2">{units.map((unit) => <option key={unit}>{unit}</option>)}</select>
              <input type="number" min="0" step="0.01" required placeholder="Цена, ₽" value={serviceForm.price} onChange={(event) => setServiceForm({ ...serviceForm, price: event.target.value })} className="w-full rounded border p-2" />
              {serviceForm.priceType === 'percent' && <input type="number" min="0" max="100" step="0.01" required placeholder="Процент" value={serviceForm.percent} onChange={(event) => setServiceForm({ ...serviceForm, percent: event.target.value })} className="w-full rounded border p-2" />}
              <label className="flex gap-2"><input type="checkbox" checked={serviceForm.active} onChange={(event) => setServiceForm({ ...serviceForm, active: event.target.checked })} />Активна</label>
              <label className="block text-sm">Порядок отображения<input type="number" min="0" value={serviceForm.sortOrder} onChange={(event) => setServiceForm({ ...serviceForm, sortOrder: event.target.value })} className="mt-1 w-full rounded border p-2" /></label>
              <button disabled={busy} className="rounded bg-blue-700 px-4 py-2 text-white">Сохранить</button>
              {serviceForm.id && <button type="button" onClick={() => setServiceForm({ id: '', name: '', type: 'Монтаж', priceType: 'per_unit', unit: 'п.м.', price: '0', percent: '0', sortOrder: '0', active: true })} className="ml-2">Отмена</button>}
            </form>
          </div>
        )}

        {section === 'discounts' && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <section className="rounded bg-white p-5 shadow"><h2 className="mb-4 text-xl font-semibold">Скидочные пороги</h2>
              <div className="space-y-2">{data.discounts.map((discount: DiscountThreshold) => (
                <div key={discount.id} className="flex items-center justify-between rounded border p-3">
                  <span>От {formatRubles(discount.minimumMinor)} ₽ — {discount.percentBasisPoints / 100}% {discount.active ? '' : '(выключен)'}</span>
                  <div className="flex gap-3"><button type="button" onClick={() => setDiscountForm({ id: discount.id, minimum: (discount.minimumMinor / 100).toFixed(2), percent: (discount.percentBasisPoints / 100).toString(), active: discount.active })} className="text-blue-700">Изменить</button><button type="button" onClick={() => void mutate('discounts', 'DELETE', undefined, discount.id)} className="text-red-700">Удалить</button></div>
                </div>
              ))}</div>
            </section>
            <form onSubmit={saveDiscount} className="h-fit space-y-3 rounded bg-white p-5 shadow">
              <h2 className="text-xl font-semibold">{discountForm.id ? 'Изменить порог' : 'Новый порог'}</h2>
              <input required type="number" min="0" step="0.01" placeholder="Минимальная сумма, ₽" value={discountForm.minimum} onChange={(event) => setDiscountForm({ ...discountForm, minimum: event.target.value })} className="w-full rounded border p-2" />
              <input required type="number" min="0" max="100" step="0.01" placeholder="Скидка, %" value={discountForm.percent} onChange={(event) => setDiscountForm({ ...discountForm, percent: event.target.value })} className="w-full rounded border p-2" />
              <label className="flex gap-2"><input type="checkbox" checked={discountForm.active} onChange={(event) => setDiscountForm({ ...discountForm, active: event.target.checked })} />Активен</label>
              <button disabled={busy} className="rounded bg-blue-700 px-4 py-2 text-white">Сохранить</button>
              {discountForm.id && <button type="button" onClick={() => setDiscountForm({ id: '', minimum: '', percent: '', active: true })} className="ml-2">Отмена</button>}
            </form>
          </div>
        )}

        {section === 'settings' && (
          <form onSubmit={saveSettings} className="max-w-3xl space-y-4 rounded bg-white p-6 shadow">
            <h2 className="text-xl font-semibold">Настройки калькулятора</h2>
            <label className="block">Минимальная сумма заказа, ₽<input required type="number" min="0" step="0.01" value={minimumOrderInput} onChange={(event) => setMinimumOrderInput(event.target.value)} className="mt-1 w-full rounded border p-2" /></label>
            <label className="block">Телефон<input value={settingsForm.phone} onChange={(event) => setSettingsForm({ ...settingsForm, phone: event.target.value })} className="mt-1 w-full rounded border p-2" /></label>
            <label className="block">Email<input type="email" value={settingsForm.email} onChange={(event) => setSettingsForm({ ...settingsForm, email: event.target.value })} className="mt-1 w-full rounded border p-2" /></label>
            <label className="block">Адрес<input value={settingsForm.address} onChange={(event) => setSettingsForm({ ...settingsForm, address: event.target.value })} className="mt-1 w-full rounded border p-2" /></label>
            <label className="block">Заголовок<input required value={settingsForm.title} onChange={(event) => setSettingsForm({ ...settingsForm, title: event.target.value })} className="mt-1 w-full rounded border p-2" /></label>
            <label className="block">Текст-подсказка<textarea rows={3} value={settingsForm.description} onChange={(event) => setSettingsForm({ ...settingsForm, description: event.target.value })} className="mt-1 w-full rounded border p-2" /></label>
            <button disabled={busy} className="rounded bg-blue-700 px-4 py-2 text-white">Сохранить настройки</button>
          </form>
        )}

        {section === 'requests' && (
          <section className="rounded bg-white p-5 shadow">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <h2 className="text-xl font-semibold">Заявки ({requests.length})</h2>
              <button type="button" onClick={() => void exportRequests()} className="rounded border px-3 py-2">Экспорт CSV</button>
            </div>
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              <label className="text-sm">Статус<select value={requestStatus} onChange={(event) => setRequestStatus(event.target.value)} className="mt-1 block w-full rounded border p-2"><option value="all">Все</option><option value="new">Новая</option><option value="in_progress">В работе</option><option value="completed">Выполнена</option><option value="cancelled">Отменена</option></select></label>
              <label className="text-sm">С даты<input type="date" value={requestFrom} onChange={(event) => setRequestFrom(event.target.value)} className="mt-1 block w-full rounded border p-2" /></label>
              <label className="text-sm">По дату<input type="date" value={requestTo} onChange={(event) => setRequestTo(event.target.value)} className="mt-1 block w-full rounded border p-2" /></label>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead><tr className="border-b"><th className="p-2">Дата</th><th className="p-2">Имя / телефон</th><th className="p-2">Сумма</th><th className="p-2">Статус</th><th className="p-2">Детали</th></tr></thead>
                <tbody>{requests.map((request) => (
                  <tr key={request.id} className="border-b align-top">
                    <td className="p-2">{new Date(request.createdAt).toLocaleString('ru-RU')}</td>
                    <td className="p-2">{request.name}<br /><a href={`tel:${request.phone}`} className="text-blue-700">{request.phone}</a>{request.email && <><br />{request.email}</>}</td>
                    <td className="p-2">{formatRubles(request.totalMinor)} ₽</td>
                    <td className="p-2"><select value={request.status} onChange={(event) => void changeRequestStatus(request.id, event.target.value)} className="rounded border p-1" aria-label={`Статус заявки ${request.id}`}>{['new', 'in_progress', 'completed', 'cancelled'].map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select></td>
                    <td className="p-2"><button type="button" onClick={() => setSelectedRequest(selectedRequest === request.id ? null : request.id)} className="text-blue-700">{selectedRequest === request.id ? 'Скрыть' : 'Просмотр'}</button>
                      {selectedRequest === request.id && <div className="mt-2 min-w-64 space-y-1">
                        {request.payload.calculation.lines.map((line, index) => <p key={`${line.name}-${index}`}>{line.name}{line.variantName ? ` (${line.variantName})` : ''} — {line.quantityMilli / 1000} {line.unit}: {line.lineTotalMinor === null ? 'по запросу' : `${formatRubles(line.lineTotalMinor)} ₽`}</p>)}
                        {request.payload.calculation.services.map((service, index) => <p key={`${service.name}-${index}`}>Услуга: {service.name} — {formatRubles(service.lineTotalMinor)} ₽</p>)}
                        <p>Скидка: {request.payload.calculation.discountName ?? 'нет'} — {formatRubles(request.payload.calculation.discountMinor)} ₽</p>
                        {request.payload.contact.comment && <p>Комментарий: {request.payload.contact.comment}</p>}
                        <p>UTM: {JSON.stringify(request.utm)}</p>
                      </div>}
                    </td>
                  </tr>
                ))}</tbody>
              </table>
              {!requests.length && <p className="py-6 text-center text-gray-500">Заявок пока нет.</p>}
            </div>
          </section>
        )}
      </main>
    </AdminShell>
  );
}
