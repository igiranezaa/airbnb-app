const BROKEN_IMAGE_PARTS = [
  'photo-1504551954841-6d1f5e8a31c1',
];

export const LISTING_PLACEHOLDER_IMAGE =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22800%22 height=%22600%22 viewBox=%220 0 800 600%22%3E%3Crect width=%22800%22 height=%22600%22 fill=%22%23f3f4f6%22/%3E%3Cpath d=%22M235 380l92-112 73 88 48-58 117 142H235z%22 fill=%22%23d7dce2%22/%3E%3Ccircle cx=%22543%22 cy=%22202%22 r=%2238%22 fill=%22%23d7dce2%22/%3E%3Ctext x=%22400%22 y=%22505%22 text-anchor=%22middle%22 font-family=%22Arial, sans-serif%22 font-size=%2232%22 font-weight=%22700%22 fill=%22%2399a1ad%22%3EPhoto unavailable%3C/text%3E%3C/svg%3E';

function isUsablePhoto(url: string | null | undefined): url is string {
  if (!url) return false;
  return !BROKEN_IMAGE_PARTS.some((part) => url.includes(part));
}

export function getFallbackPhoto(): string {
  return LISTING_PLACEHOLDER_IMAGE;
}

export function getListingPhotos(
  photos: Array<string | null | undefined> | null | undefined,
  cover?: string | null
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const url of [cover, ...(photos ?? [])]) {
    if (!isUsablePhoto(url) || seen.has(url)) continue;
    seen.add(url);
    result.push(url);
  }

  return result;
}
