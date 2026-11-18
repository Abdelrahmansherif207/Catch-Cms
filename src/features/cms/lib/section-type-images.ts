const SECTION_TYPE_IMAGE_FILES: Record<string, string> = {
  sliders: 'sliders.svg',
  promotions: 'promotions.svg',
  'flash-sales': 'flash-sales.svg',
  coupons: 'coupons.svg',
  brands: 'brands.svg',
  categories: 'categories.svg',
  products: 'products.svg',
  banners: 'banners.svg',
  tags: 'tags.svg',
  hero: 'hero.svg',
};

const SECTION_TYPES_BASE_URL = `${import.meta.env.BASE_URL}sectiontypes`;

interface SectionTypeImageOptions {
  shape?: string;
}

export function sectionTypeImage(
  type: string,
  { shape }: SectionTypeImageOptions = {}
): string | undefined {
  if (type === 'categories' && shape === 'circle') {
    return `${SECTION_TYPES_BASE_URL}/categories-circle.svg`;
  }

  const file = SECTION_TYPE_IMAGE_FILES[type];
  return file ? `${SECTION_TYPES_BASE_URL}/${file}` : undefined;
}
