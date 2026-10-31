export type MeasurementUnit = 'шт' | 'п.м.' | 'м²' | 'комплект';
export type PriceType = 'fixed' | 'from' | 'request';
export type ServicePriceType = 'per_unit' | 'percent' | 'fixed';

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  sortOrder: number;
  active: boolean;
}

export interface ProductVariant {
  id: string;
  name: string;
  priceMinor: number | null;
  image: string | null;
}

export interface Product {
  id: string;
  slug: string;
  categoryId: string | null;
  name: string;
  description: string;
  unit: MeasurementUnit;
  priceMinor: number | null;
  priceType: PriceType;
  minQuantityMilli: number;
  stepQuantityMilli: number;
  sortOrder: number;
  active: boolean;
  images: string[];
  variants: ProductVariant[];
}

export interface CalculatorService {
  id: string;
  name: string;
  type: string;
  priceType: ServicePriceType;
  unit: MeasurementUnit;
  priceMinor: number;
  percentBasisPoints: number;
  sortOrder: number;
  active: boolean;
}

export interface DiscountThreshold {
  id: string;
  minimumMinor: number;
  percentBasisPoints: number;
  active: boolean;
}

export interface CalculatorSettings {
  minimumOrderMinor: number;
  phone: string;
  email: string;
  address: string;
  title: string;
  description: string;
}

export interface CartLine {
  productId: string;
  variantId: string | null;
  quantityMilli: number;
}

export interface CartService {
  serviceId: string;
  enabled: boolean;
  quantityMilli: number;
  quantityManual?: boolean;
}

export interface CalculatorCart {
  lines: CartLine[];
  services: CartService[];
}

export interface QuoteLine {
  productId: string;
  variantId: string | null;
  name: string;
  variantName: string | null;
  image: string | null;
  unit: MeasurementUnit;
  quantityMilli: number;
  unitPriceMinor: number | null;
  lineTotalMinor: number | null;
  priceType: PriceType;
}

export interface QuoteServiceLine {
  serviceId: string;
  name: string;
  unit: MeasurementUnit;
  quantityMilli: number;
  unitPriceMinor: number;
  lineTotalMinor: number;
  priceType: ServicePriceType;
  percentBasisPoints: number;
}

export interface QuoteCalculation {
  lines: QuoteLine[];
  services: QuoteServiceLine[];
  productsSubtotalMinor: number;
  servicesSubtotalMinor: number;
  subtotalMinor: number;
  discountName: string | null;
  discountBasisPoints: number;
  discountMinor: number;
  totalMinor: number;
  emptyCart: boolean;
  belowMinimum: boolean;
}

export interface CalculatorData {
  categories: Category[];
  products: Product[];
  services: CalculatorService[];
  discounts: DiscountThreshold[];
  settings: CalculatorSettings;
}
