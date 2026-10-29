'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { calculateQuote, formatRubles } from '@/app/calculator/calculate';
import type {
  CalculatorCart,
  CalculatorData,
  CartLine,
  CartService,
  Product
} from '@/app/calculator/types';

const storageKey = 'lepnina-calculator-cart-v1';
const emptyCart: CalculatorCart = { lines: [], services: [] };

function clampQuantity(value: number, minimum: number, step: number, maximum: number): number {
  const clamped = Math.max(minimum, Math.min(maximum, value));
  return minimum + Math.ceil((clamped - minimum) / step) * step;
}

function parseQuantity(value: string): number | null {
  if (!/^\d{1,7}([.,]\d{1,3})?$/.test(value)) return null;
  const [whole, fraction = ''] = value.replace(',', '.').split('.');
  return Number(whole) * 1_000 + Number(fraction.padEnd(3, '0'));
}

function formatPrice(priceMinor: number | null, priceType: Product['priceType']): string {
  if (priceType === 'request' || priceMinor === null) return 'Цена по запросу';
  return `${priceType === 'from' ? 'от ' : ''}${formatRubles(priceMinor)} ₽`;
}

function formatPhone(value: string): string {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('7') || digits.startsWith('8')) digits = digits.slice(1);
  digits = digits.slice(0, 10);
  let result = '+7';
  if (digits.length) result += ` (${digits.slice(0, 3)}`;
  if (digits.length >= 3) result += ')';
  if (digits.length > 3) result += ` ${digits.slice(3, 6)}`;
  if (digits.length > 6) result += `-${digits.slice(6, 8)}`;
  if (digits.length > 8) result += `-${digits.slice(8, 10)}`;
  return result;
}

function isCart(value: unknown): value is CalculatorCart {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<CalculatorCart>;
  return Array.isArray(candidate.lines) && Array.isArray(candidate.services);
}

function sanitizeCart(value: CalculatorCart, data: CalculatorData): CalculatorCart {
  const lines = value.lines.flatMap((line) => {
    if (
      !line ||
      typeof line.productId !== 'string' ||
      (line.variantId !== null && typeof line.variantId !== 'string') ||
      !Number.isSafeInteger(line.quantityMilli)
    ) return [];
    const product = data.products.find((item) => item.id === line.productId);
    if (!product || (line.variantId && !product.variants.some((variant) => variant.id === line.variantId))) return [];
    const max = product.minQuantityMilli +
      Math.floor((9_999_000 - product.minQuantityMilli) / product.stepQuantityMilli) * product.stepQuantityMilli;
    const clamped = Math.max(product.minQuantityMilli, Math.min(max, line.quantityMilli));
    const quantityMilli = product.minQuantityMilli +
      Math.ceil((clamped - product.minQuantityMilli) / product.stepQuantityMilli) * product.stepQuantityMilli;
    return [{ productId: line.productId, variantId: line.variantId, quantityMilli }];
  });
  const serviceIds = new Set<string>();
  const services = value.services.flatMap((selection) => {
    if (
      !selection ||
      typeof selection.serviceId !== 'string' ||
      typeof selection.enabled !== 'boolean' ||
      !Number.isSafeInteger(selection.quantityMilli) ||
      serviceIds.has(selection.serviceId) ||
      !data.services.some((service) => service.id === selection.serviceId)
    ) return [];
    serviceIds.add(selection.serviceId);
    return [{
      serviceId: selection.serviceId,
      enabled: selection.enabled,
      quantityMilli: Math.max(0, Math.min(9_999_000, selection.quantityMilli)),
      quantityManual: Boolean(selection.quantityManual)
    }];
  });
  return { lines, services };
}

function getDefaultServiceQuantity(unit: string, lines: CartLine[], products: Product[]): number {
  return lines.reduce((total, line) => {
    const product = products.find((item) => item.id === line.productId);
    return product?.unit === unit ? total + line.quantityMilli : total;
  }, 0);
}

export default function OrderForm() {
  const [data, setData] = useState<CalculatorData | null>(null);
  const [cart, setCart] = useState<CalculatorCart>(emptyCart);
  const [cartReady, setCartReady] = useState(false);
  const [categoryId, setCategoryId] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [comment, setComment] = useState('');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [shareMessage, setShareMessage] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/calculator', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Не удалось загрузить каталог калькулятора');
        return response.json() as Promise<CalculatorData>;
      })
      .then((catalog) => {
        if (active) setData(catalog);
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Ошибка загрузки каталога');
      });

    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!data || cartReady) return;
    let restored = emptyCart;
    try {
      const sharedCart = new URLSearchParams(window.location.search).get('quote');
      const storedCart = localStorage.getItem(storageKey);
      const encoded = sharedCart
        ? decodeURIComponent(escape(window.atob(sharedCart)))
        : storedCart;
      if (encoded) {
        const parsed: unknown = JSON.parse(encoded);
        if (isCart(parsed)) restored = sanitizeCart(parsed, data);
      }
    } catch (restoreError) {
      console.error('Restore calculator cart error:', restoreError);
    }

    if (!restored.services.length) {
      restored.services = data.services.map((service) => ({
        serviceId: service.id,
        enabled: false,
        quantityMilli: getDefaultServiceQuantity(service.unit, restored.lines, data.products)
      }));
    }
    const timeoutId = window.setTimeout(() => {
      setCart(restored);
      setCartReady(true);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [cartReady, data]);

  useEffect(() => {
    if (cartReady) localStorage.setItem(storageKey, JSON.stringify(cart));
  }, [cart, cartReady]);

  const activeProducts = useMemo(
    () => data?.products.filter((product) => product.active) ?? [],
    [data]
  );
  const visibleProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('ru');
    return activeProducts.filter((product) =>
      (categoryId === 'all' || product.categoryId === categoryId) &&
      (!normalizedSearch || `${product.name} ${product.description}`.toLocaleLowerCase('ru').includes(normalizedSearch))
    );
  }, [activeProducts, categoryId, search]);

  const calculation = useMemo(() => data
    ? calculateQuote(cart, data.products, data.services, data.discounts, data.settings.minimumOrderMinor)
    : null, [cart, data]);

  const syncServiceQuantities = useCallback((services: CartService[], lines: CartLine[]): CartService[] =>
    !data ? services : services.map((selection) => {
      const service = data.services.find((item) => item.id === selection.serviceId);
      if (!service || service.priceType !== 'per_unit' || selection.quantityManual) return selection;
      return {
        ...selection,
        quantityMilli: getDefaultServiceQuantity(service.unit, lines, data.products)
      };
    }), [data]);

  const setLineQuantity = useCallback((line: CartLine, enteredQuantity: number) => {
    if (!data) return;
    const product = data.products.find((item) => item.id === line.productId);
    if (!product) return;
    const maximum = product.minQuantityMilli +
      Math.floor((9_999_000 - product.minQuantityMilli) / product.stepQuantityMilli) * product.stepQuantityMilli;
    const quantityMilli = clampQuantity(
      enteredQuantity,
      product.minQuantityMilli,
      product.stepQuantityMilli,
      maximum
    );
    setCart((current) => {
      const lines = current.lines.map((item) =>
        item.productId === line.productId && item.variantId === line.variantId
          ? { ...item, quantityMilli }
          : item
      );
      return { ...current, lines, services: syncServiceQuantities(current.services, lines) };
    });
  }, [data, syncServiceQuantities]);

  const addProduct = (product: Product) => {
    const variantId = product.variants.length
      ? selectedVariants[product.id] ?? product.variants[0].id
      : null;
    setCart((current) => {
      const oldLine = current.lines.find((line) => line.productId === product.id && line.variantId === variantId);
      const maximum = product.minQuantityMilli +
        Math.floor((9_999_000 - product.minQuantityMilli) / product.stepQuantityMilli) *
        product.stepQuantityMilli;
      const quantityIncrement = oldLine ? product.stepQuantityMilli : product.minQuantityMilli;
      const quantityMilli = oldLine
        ? clampQuantity(oldLine.quantityMilli + product.stepQuantityMilli, product.minQuantityMilli, product.stepQuantityMilli, maximum)
        : product.minQuantityMilli;
      const updatedLine: CartLine = { productId: product.id, variantId, quantityMilli };
      const lines = oldLine
        ? current.lines.map((line) =>
            line.productId === product.id && line.variantId === variantId ? updatedLine : line
          )
        : [...current.lines, updatedLine];
      const services = current.services.map((selection) => {
        const service = data?.services.find((item) => item.id === selection.serviceId);
        if (
          !selection.enabled ||
          selection.quantityManual ||
          service?.priceType !== 'per_unit' ||
          service.unit !== product.unit
        ) return selection;
        return { ...selection, quantityMilli: selection.quantityMilli + quantityIncrement };
      });
      return {
        ...current,
        lines,
        services: syncServiceQuantities(services, lines)
      };
    });
  };

  const toggleService = (serviceId: string, enabled: boolean) => {
    if (!data) return;
    const service = data.services.find((item) => item.id === serviceId);
    if (!service) return;
    setCart((current) => {
      const existing = current.services.find((item) => item.serviceId === serviceId);
      const selection: CartService = {
        serviceId,
        enabled,
        quantityMilli: existing?.quantityMilli ??
          getDefaultServiceQuantity(service.unit, current.lines, data.products),
        quantityManual: existing?.quantityManual ?? false
      };
      return {
        ...current,
        services: existing
          ? current.services.map((item) => item.serviceId === serviceId ? selection : item)
          : [...current.services, selection]
      };
    });
  };

  const updateServiceQuantity = (serviceId: string, value: string) => {
    const parsed = parseQuantity(value);
    if (parsed === null) return;
    setCart((current) => ({
      ...current,
      services: current.services.map((item) =>
        item.serviceId === serviceId
          ? { ...item, quantityMilli: Math.min(9_999_000, parsed), quantityManual: true }
          : item
      )
    }));
  };

  const shareCart = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set('quote', window.btoa(encodeURIComponent(JSON.stringify(cart))));
    try {
      await navigator.clipboard.writeText(url.toString());
      setShareMessage('Ссылка на расчёт скопирована');
    } catch (clipboardError) {
      console.error('Copy calculator link error:', clipboardError);
      setShareMessage(url.toString());
    }
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!data || !calculation || calculation.emptyCart || calculation.belowMinimum) return;
    setLoading(true);
    setError('');
    setNotice('');
    try {
      const url = new URL(window.location.href);
      const utm = Object.fromEntries([...url.searchParams].filter(([key]) => /^utm_/i.test(key)));
      const response = await fetch(`/api/requests?${new URLSearchParams(utm).toString()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, comment, consent, cart })
      });
      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.error || 'Не удалось отправить заявку');
      if (!responseData.notificationSent) {
        setNotice('Заявка сохранена. Уведомление менеджеру не отправлено — с вами свяжутся по указанному телефону.');
      }
      setCart(emptyCart);
      setSuccess(true);
      setName('');
      setPhone('');
      setEmail('');
      setComment('');
      setConsent(false);
      localStorage.removeItem(storageKey);
      const cleanedUrl = new URL(window.location.href);
      cleanedUrl.searchParams.delete('quote');
      window.history.replaceState({}, '', cleanedUrl);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Ошибка отправки заявки');
    } finally {
      setLoading(false);
    }
  };

  if (!data) {
    return (
      <div className="w-full max-w-6xl mx-auto rounded-sm border border-[#b38b5d]/30 bg-[#fcfbf9] p-8 text-center">
        {error ? <p className="text-red-700">{error}</p> : <p>Загружаем каталог…</p>}
      </div>
    );
  }

  const renderProductCard = (product: Product) => {
    const selectedVariantId = selectedVariants[product.id] ?? product.variants[0]?.id ?? '';
    const variant = product.variants.find((item) => item.id === selectedVariantId);
    const image = variant?.image ?? product.images[0];
    const price = variant?.priceMinor ?? product.priceMinor;
    return (
      <article key={product.id} className="overflow-hidden rounded-sm border border-[#b38b5d]/25 bg-[#fcfbf9] shadow-sm">
        <div className="relative h-52 bg-[#eee9e1]">
          {image ? (
            <Image src={image} alt={product.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-[#756a5b]">Изображение не добавлено</div>
          )}
        </div>
        <div className="space-y-3 p-4">
          <h3 className="font-cinzel text-lg">{product.name}</h3>
          {product.description && <p className="text-sm text-[#5a5249]">{product.description}</p>}
          {product.variants.length > 0 && (
            <label className="block text-sm">
              Вариант
              <select
                value={selectedVariantId}
                onChange={(event) => setSelectedVariants((current) => ({ ...current, [product.id]: event.target.value }))}
                className="mt-1 w-full rounded border border-[#b38b5d]/40 bg-white px-3 py-2"
              >
                {product.variants.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
          )}
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold">{formatPrice(price, product.priceType)}<span className="font-normal"> / {product.unit}</span></span>
            <button type="button" onClick={() => addProduct(product)} className="rounded bg-[#b38b5d] px-4 py-2 text-white hover:bg-[#9e7b4f]">Добавить</button>
          </div>
        </div>
      </article>
    );
  };
  const productGroups = [
    ...data.categories.map((category) => ({
      id: category.id,
      name: category.name,
      products: visibleProducts.filter((product) => product.categoryId === category.id)
    })),
    {
      id: 'uncategorized',
      name: 'Без категории',
      products: visibleProducts.filter((product) => !product.categoryId)
    }
  ].filter((group) => group.products.length > 0);

  return (
    <div className="calculator w-full max-w-6xl mx-auto space-y-8">
      <section className="rounded-sm border border-[#b38b5d]/30 bg-[#fcfbf9] p-6 shadow-sm">
        <h2 className="font-cinzel text-3xl text-[#2c2a28]">{data.settings.title}</h2>
        <p className="mt-2 text-[#5a5249]">{data.settings.description}</p>
        <p className="mt-2 text-sm text-[#5a5249]">
          {data.settings.phone && <a className="mr-4 underline" href={`tel:${data.settings.phone}`}>{data.settings.phone}</a>}
          {data.settings.email && <a className="mr-4 underline" href={`mailto:${data.settings.email}`}>{data.settings.email}</a>}
          {data.settings.address}
        </p>
        <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Найти элемент…"
            aria-label="Поиск по каталогу"
            className="rounded border border-[#b38b5d]/40 bg-white px-3 py-2"
          />
          <select
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            aria-label="Фильтр по категории"
            className="rounded border border-[#b38b5d]/40 bg-white px-3 py-2"
          >
            <option value="all">Все категории</option>
            {data.categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>
      </section>

      <section aria-label="Каталог изделий">
        {visibleProducts.length === 0 ? (
          <p className="rounded bg-white p-6 text-center">По вашему запросу ничего не найдено.</p>
        ) : (
          <div className="space-y-8">
            {productGroups.map((group) => (
              <section key={group.id} aria-label={group.name}>
                <h3 className="mb-4 font-cinzel text-2xl text-[#2c2a28]">{group.name}</h3>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {group.products.map(renderProductCard)}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>

      <section id="quote" className="rounded-sm border border-[#b38b5d]/30 bg-[#fcfbf9] p-6 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-cinzel text-2xl">Корзина ({cart.lines.length})</h2>
          <div className="print-hide flex flex-wrap gap-2">
            <button type="button" onClick={() => void shareCart()} disabled={!cart.lines.length} className="rounded border border-[#b38b5d] px-3 py-2 text-sm disabled:opacity-50">Скопировать ссылку</button>
            <button type="button" onClick={() => window.print()} disabled={!cart.lines.length} className="rounded border border-[#b38b5d] px-3 py-2 text-sm disabled:opacity-50">Печать / PDF</button>
            <button type="button" onClick={() => setCart({ lines: [], services: cart.services.map((item) => ({ ...item, quantityMilli: 0, quantityManual: false })) })} disabled={!cart.lines.length} className="rounded border border-red-300 px-3 py-2 text-sm text-red-700 disabled:opacity-50">Очистить корзину</button>
          </div>
        </div>
        {shareMessage && <p className="mb-3 break-all text-sm text-green-700">{shareMessage}</p>}
        {!cart.lines.length ? <p className="text-[#5a5249]">Добавьте изделия из каталога.</p> : (
          <div className="space-y-3">
            {calculation?.lines.map((line) => {
              const product = data.products.find((item) => item.id === line.productId);
              if (!product) return null;
              return (
                <div key={`${line.productId}:${line.variantId ?? ''}`} className="grid gap-3 border-b border-[#b38b5d]/20 pb-3 md:grid-cols-[72px_1fr_auto] md:items-center">
                  <div className="relative h-[72px] w-[72px] bg-[#eee9e1]">
                    {line.image && <Image src={line.image} alt="" fill sizes="72px" className="object-cover" />}
                  </div>
                  <div>
                    <p className="font-medium">{line.name}{line.variantName ? ` — ${line.variantName}` : ''}</p>
                    <p className="text-sm text-[#5a5249]">
                      {line.priceType === 'request' || line.unitPriceMinor === null
                        ? 'Цена по запросу'
                        : `${line.priceType === 'from' ? 'от ' : ''}${formatRubles(line.unitPriceMinor)} ₽ / ${line.unit}`}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" aria-label="Уменьшить количество" onClick={() => setLineQuantity(line, line.quantityMilli - product.stepQuantityMilli)} className="h-9 w-9 rounded border">−</button>
                    <input
                      type="number"
                      min={product.minQuantityMilli / 1000}
                      max="9999"
                      step={product.stepQuantityMilli / 1000}
                      value={line.quantityMilli / 1000}
                      onChange={(event) => {
                        const parsed = parseQuantity(event.target.value);
                        if (parsed !== null) setLineQuantity(line, parsed);
                      }}
                      aria-label={`Количество: ${line.name}`}
                      className="w-24 rounded border px-2 py-2"
                    />
                    <button type="button" aria-label="Увеличить количество" onClick={() => setLineQuantity(line, line.quantityMilli + product.stepQuantityMilli)} className="h-9 w-9 rounded border">+</button>
                    <span className="min-w-24 text-right font-medium">{line.lineTotalMinor === null ? 'По запросу' : `${formatRubles(line.lineTotalMinor)} ₽`}</span>
                    <button type="button" onClick={() => setCart((current) => {
                      const lines = current.lines.filter((item) => item.productId !== line.productId || item.variantId !== line.variantId);
                      return { ...current, lines, services: syncServiceQuantities(current.services, lines) };
                    })} aria-label={`Удалить ${line.name}`} className="print-hide rounded px-2 py-1 text-red-700">Удалить</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-sm border border-[#b38b5d]/30 bg-[#fcfbf9] p-6 shadow-sm">
        <h2 className="mb-4 font-cinzel text-2xl">Дополнительные услуги</h2>
        {data.services.length === 0 ? <p className="text-[#5a5249]">Дополнительные услуги не заданы.</p> : (
          <div className="space-y-3">
            {data.services.map((service) => {
              const selection = cart.services.find((item) => item.serviceId === service.id);
              const enabled = selection?.enabled ?? false;
              return (
                <div key={service.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-[#b38b5d]/15 pb-3">
                  <label className="flex items-center gap-3">
                    <input type="checkbox" checked={enabled} onChange={(event) => toggleService(service.id, event.target.checked)} />
                    <span>{service.name}</span>
                  </label>
                  <div className="flex items-center gap-3">
                    {service.priceType === 'per_unit' && (
                      <input
                        type="number"
                        min="0"
                        max="9999"
                        step="0.1"
                        disabled={!enabled}
                        value={(selection?.quantityMilli ?? getDefaultServiceQuantity(service.unit, cart.lines, data.products)) / 1000}
                        onChange={(event) => updateServiceQuantity(service.id, event.target.value)}
                        aria-label={`Количество для услуги ${service.name}`}
                        className="w-24 rounded border px-2 py-1 disabled:opacity-50"
                      />
                    )}
                    <span className="text-sm">
                      {service.priceType === 'percent'
                        ? `${(service.percentBasisPoints / 100).toLocaleString('ru-RU')}% от суммы изделий`
                        : service.priceType === 'fixed'
                          ? `${formatRubles(service.priceMinor)} ₽`
                          : `${formatRubles(service.priceMinor)} ₽ / ${service.unit}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {calculation && (
        <section className="rounded-sm border border-[#b38b5d]/30 bg-[#fcfbf9] p-6 shadow-sm">
          <h2 className="mb-4 font-cinzel text-2xl">Итог расчёта</h2>
          <dl className="space-y-2">
            <div className="flex justify-between gap-4"><dt>Изделия</dt><dd>{formatRubles(calculation.productsSubtotalMinor)} ₽</dd></div>
            <div className="flex justify-between gap-4"><dt>Услуги</dt><dd>{formatRubles(calculation.servicesSubtotalMinor)} ₽</dd></div>
            {calculation.discountMinor > 0 && <div className="flex justify-between gap-4 text-green-700"><dt>Скидка {calculation.discountName} ({(calculation.discountBasisPoints / 100).toLocaleString('ru-RU')}%)</dt><dd>−{formatRubles(calculation.discountMinor)} ₽</dd></div>}
            <div className="flex justify-between gap-4 border-t border-[#b38b5d]/30 pt-3 text-xl font-bold"><dt>Итого</dt><dd>{formatRubles(calculation.totalMinor)} ₽</dd></div>
          </dl>
          {calculation.belowMinimum && !calculation.emptyCart && (
            <p className="mt-3 text-sm text-red-700">
              Минимальная сумма заказа — {formatRubles(data.settings.minimumOrderMinor)} ₽. Увеличьте состав заказа.
            </p>
          )}
          {calculation.lines.some((line) => line.lineTotalMinor === null) && (
            <p className="mt-3 text-sm text-[#5a5249]">Изделия с ценой по запросу будут включены в заявку; стоимость уточнит менеджер.</p>
          )}
        </section>
      )}

      {success ? (
        <section role="status" className="rounded-sm border border-green-300 bg-green-50 p-6 text-center">
          <h2 className="font-cinzel text-2xl text-green-900">Заявка принята</h2>
          <p className="mt-2 text-green-800">Мы свяжемся с вами по указанному телефону.</p>
          {notice && <p className="mt-2 text-sm text-amber-800">{notice}</p>}
          <button type="button" onClick={() => setSuccess(false)} className="print-hide mt-4 rounded bg-[#b38b5d] px-4 py-2 text-white">Вернуться к каталогу</button>
        </section>
      ) : (
        <form onSubmit={onSubmit} className="rounded-sm border border-[#b38b5d]/30 bg-[#fcfbf9] p-6 shadow-sm">
          <h2 className="mb-5 font-cinzel text-2xl">Оформить заявку</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm">Имя *
              <input required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded border px-3 py-2" />
            </label>
            <label className="space-y-1 text-sm">Телефон *
              <input required type="tel" inputMode="tel" placeholder="+7 (___) ___-__-__" value={phone} onChange={(event) => setPhone(formatPhone(event.target.value))} className="w-full rounded border px-3 py-2" />
            </label>
            <label className="space-y-1 text-sm md:col-span-2">Email (необязательно)
              <input type="email" maxLength={120} value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded border px-3 py-2" />
            </label>
            <label className="space-y-1 text-sm md:col-span-2">Комментарий
              <textarea rows={3} maxLength={2000} value={comment} onChange={(event) => setComment(event.target.value)} className="w-full rounded border px-3 py-2" />
            </label>
          </div>
          <label className="mt-4 flex items-start gap-2 text-sm">
            <input type="checkbox" required checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1" />
            <span>Согласен(на) на обработку персональных данных *</span>
          </label>
          {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={loading || !cart.lines.length || Boolean(calculation?.belowMinimum)}
            className="print-hide mt-5 w-full rounded bg-[#b38b5d] px-6 py-3 font-cinzel uppercase tracking-widest text-white transition hover:bg-[#9e7b4f] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Отправка…' : 'Отправить заявку'}
          </button>
        </form>
      )}
      <div className="hidden print:block pt-6 text-sm">
        {data.settings.phone} {data.settings.email} {data.settings.address}
      </div>
    </div>
  );
}
