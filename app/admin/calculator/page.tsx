function slugify(value: string): string {
  return value.toLocaleLowerCase('ru')
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function createUniqueProductSlug(value: string, excludeId: string | null, products: Product[] = []): string {
  const base = slugify(value || 'product');
  const used = new Set(
    products
      .filter((product) => product.id !== excludeId)
      .map((product) => product.slug)
  );

  let slug = base || 'product';
  let counter = 2;
  while (used.has(slug)) {
    slug = `${base}-${counter}`;
    counter += 1;
  }
  return slug;
}

function slugify(value: string): string {
  return value.toLocaleLowerCase('ru')
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function toMilli(value: string): number | null {
