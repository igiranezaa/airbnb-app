import type { ListingCategory } from '../types';

const BROKEN_IMAGE_PARTS = [
  'photo-1504551954841-6d1f5e8a31c1',
];

export const CATEGORY_PHOTOS: Record<ListingCategory, string[]> = {
  beach: [
    'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800&h=600&fit=crop',
  ],
  mountain: [
    'https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&h=600&fit=crop',
  ],
  city: [
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=600&fit=crop',
  ],
  countryside: [
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1510627489561-0ac447191028?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&h=600&fit=crop',
  ],
};

function isUsablePhoto(url: string | null | undefined): url is string {
  if (!url) return false;
  return !BROKEN_IMAGE_PARTS.some((part) => url.includes(part));
}

export function getFallbackPhoto(category: ListingCategory, index = 0): string {
  const photos = CATEGORY_PHOTOS[category] ?? CATEGORY_PHOTOS.city;
  return photos[index % photos.length] ?? 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop';
}

export function getListingPhotos(
  category: ListingCategory,
  photos: Array<string | null | undefined> | null | undefined,
  cover?: string | null
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const url of [cover, ...(photos ?? []), ...getCategoryPhotos(category)]) {
    if (!isUsablePhoto(url) || seen.has(url)) continue;
    seen.add(url);
    result.push(url);
    if (result.length === 5) break;
  }

  return result;
}

function getCategoryPhotos(category: ListingCategory): string[] {
  return CATEGORY_PHOTOS[category] ?? CATEGORY_PHOTOS.city;
}
