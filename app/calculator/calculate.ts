import type {
  CalculatorCart,
  CalculatorService,
  DiscountThreshold,
  Product,
  QuoteCalculation,
  QuoteLine,
  QuoteServiceLine
} from './types';

function roundProductRatio(value: number, multiplier: number, denominator: number): number {
  const whole = Math.floor(value / denominator);
  const remainder = value % denominator;
  return whole * multiplier +
    Math.floor((remainder * multiplier + denominator / 2) / denominator);
}

function roundToRubles(amountMinor: number): number {
  return roundProductRatio(amountMinor, 1, 100) * 100;
}

function calculateService(
  selection: CalculatorCart['services'][number],
  service: CalculatorService,
  lines: QuoteLine[],
  productsSubtotalMinor: number
): QuoteServiceLine {
  const quantityMilli = Math.max(0, Math.trunc(selection.quantityMilli));

  let lineTotalMinor = 0;
  if (service.priceType === 'fixed') {
    lineTotalMinor = service.priceMinor;
  } else if (service.priceType === 'percent') {
    lineTotalMinor = roundProductRatio(productsSubtotalMinor, service.percentBasisPoints, 10_000);
  } else {
    lineTotalMinor = roundProductRatio(service.priceMinor, quantityMilli, 1_000);
  }

  return {
    serviceId: service.id,
    name: service.name,
    unit: service.unit,
    quantityMilli,
    unitPriceMinor: service.priceMinor,
    lineTotalMinor,
    priceType: service.priceType,
    percentBasisPoints: service.percentBasisPoints
  };
}

export function calculateQuote(
  cart: CalculatorCart,
  products: Product[],
  availableServices: CalculatorService[],
  discounts: DiscountThreshold[],
  minimumOrderMinor: number
): QuoteCalculation {
  const productById = new Map(products.map((product) => [product.id, product]));
  const lines: QuoteLine[] = [];

  for (const cartLine of cart.lines) {
    const product = productById.get(cartLine.productId);
    if (!product) continue;

    const variant = cartLine.variantId
      ? product.variants.find((item) => item.id === cartLine.variantId)
      : undefined;
    if (cartLine.variantId && !variant) continue;

    const maximumQuantity = product.minQuantityMilli +
      Math.floor((9_999_000 - product.minQuantityMilli) / product.stepQuantityMilli) *
      product.stepQuantityMilli;
    const boundedQuantity = Math.max(
      product.minQuantityMilli,
      Math.min(maximumQuantity, Math.trunc(cartLine.quantityMilli))
    );
    const quantityMilli = product.minQuantityMilli +
      Math.ceil((boundedQuantity - product.minQuantityMilli) / product.stepQuantityMilli) *
      product.stepQuantityMilli;
    const unitPriceMinor = variant?.priceMinor ?? product.priceMinor;
    const priceType = product.priceType;
    const lineTotalMinor = priceType === 'request' || unitPriceMinor === null
      ? null
      : roundProductRatio(unitPriceMinor, quantityMilli, 1_000);

    lines.push({
      productId: product.id,
      variantId: variant?.id ?? null,
      name: product.name,
      variantName: variant?.name ?? null,
      image: variant?.image ?? product.images[0] ?? null,
      unit: product.unit,
      quantityMilli,
      unitPriceMinor,
      lineTotalMinor,
      priceType
    });
  }

  const productsSubtotalMinor = lines.reduce(
    (sum, line) => sum + (line.lineTotalMinor ?? 0),
    0
  );
  const services = cart.services
    .filter((selection) => selection.enabled)
    .flatMap((selection) => {
      const service = availableServices.find((item) => item.id === selection.serviceId);
      return service ? [calculateService(selection, service, lines, productsSubtotalMinor)] : [];
    });
  const servicesSubtotalMinor = services.reduce(
    (sum, service) => sum + service.lineTotalMinor,
    0
  );
  const subtotalMinor = productsSubtotalMinor + servicesSubtotalMinor;
  const discount = [...discounts]
    .filter((item) => item.active && item.minimumMinor <= subtotalMinor)
    .sort((left, right) => right.minimumMinor - left.minimumMinor)[0];
  const discountMinor = discount
    ? roundProductRatio(subtotalMinor, discount.percentBasisPoints, 10_000)
    : 0;
  const totalMinor = roundToRubles(Math.max(0, subtotalMinor - discountMinor));

  return {
    lines,
    services,
    productsSubtotalMinor,
    servicesSubtotalMinor,
    subtotalMinor,
    discountName: discount
      ? `От ${formatRubles(discount.minimumMinor)} ₽`
      : null,
    discountBasisPoints: discount?.percentBasisPoints ?? 0,
    discountMinor,
    totalMinor,
    emptyCart: lines.length === 0,
    belowMinimum: !lines.length || totalMinor < minimumOrderMinor
  };
}

export function formatRubles(amountMinor: number): string {
  return (amountMinor / 100).toLocaleString('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

export function formatQuantity(quantityMilli: number): string {
  return (quantityMilli / 1_000).toLocaleString('ru-RU', {
    maximumFractionDigits: 3
  });
}

export function parseRubles(value: string): number | null {
  const normalized = value.trim().replace(/\s/g, '').replace(',', '.');
  if (!normalized || !/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const [whole, fraction = ''] = normalized.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}
