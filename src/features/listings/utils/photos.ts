const BROKEN_IMAGE_PARTS = [
  'photo-1504551954841-6d1f5e8a31c1',
];

export const MIN_LISTING_PHOTOS = 3;
export const MAX_LISTING_PHOTOS = 100;
export const LISTING_PHOTO_UPLOAD_BATCH_SIZE = 5;
const FALLBACK_PHOTO_MAX_DIMENSION = 1400;
const FALLBACK_PHOTO_QUALITY = 0.82;
type PhotoDataUrlOptions = {
  maxDimension?: number;
  quality?: number;
};

export const LISTING_PLACEHOLDER_IMAGE =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22800%22 height=%22600%22 viewBox=%220 0 800 600%22%3E%3Crect width=%22800%22 height=%22600%22 fill=%22%23f3f4f6%22/%3E%3Cpath d=%22M235 380l92-112 73 88 48-58 117 142H235z%22 fill=%22%23d7dce2%22/%3E%3Ccircle cx=%22543%22 cy=%22202%22 r=%2238%22 fill=%22%23d7dce2%22/%3E%3Ctext x=%22400%22 y=%22505%22 text-anchor=%22middle%22 font-family=%22Arial, sans-serif%22 font-size=%2232%22 font-weight=%22700%22 fill=%22%2399a1ad%22%3EPhoto unavailable%3C/text%3E%3C/svg%3E';

type UploadClient = {
  post: (url: string, body: FormData) => Promise<unknown>;
};

type AxiosLikeResponse = {
  data?: unknown;
};

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

function buildPhotoFormData(files: File[], fieldName: string, keepPhotos?: string[]): FormData {
  const form = new FormData();
  if (keepPhotos) form.append('keepPhotos', JSON.stringify(keepPhotos));
  files.forEach((file) => form.append(fieldName, file));
  return form;
}

function getErrorText(error: unknown): string {
  if (typeof error === 'object' && error != null && 'response' in error) {
    const response = (error as { response?: { data?: unknown } }).response;
    if (typeof response?.data === 'string') return response.data;
    if (typeof response?.data === 'object' && response.data != null) {
      return JSON.stringify(response.data);
    }
  }

  return error instanceof Error ? error.message : '';
}

function shouldRetryPhotoField(error: unknown): boolean {
  const text = getErrorText(error).toLowerCase();
  return (
    text.includes('unexpected field') ||
    text.includes('images') ||
    text.includes('image') ||
    text.includes('photos') ||
    text.includes('photo') ||
    text.includes('file') ||
    text.includes('files')
  );
}

async function uploadPhotoBatch(client: UploadClient, listingId: string, files: File[]) {
  const endpoint = `/listings/${listingId}/photos`;

  try {
    return await client.post(endpoint, buildPhotoFormData(files, 'images'));
  } catch (error) {
    if (!shouldRetryPhotoField(error)) throw error;
    return client.post(endpoint, buildPhotoFormData(files, 'photos'));
  }
}

async function uploadPhotoBatchWithKeep(client: UploadClient, listingId: string, files: File[], keepPhotos: string[]) {
  const endpoint = `/listings/${listingId}/photos`;

  try {
    return await client.post(endpoint, buildPhotoFormData(files, 'images', keepPhotos));
  } catch (error) {
    if (!shouldRetryPhotoField(error)) throw error;
    return client.post(endpoint, buildPhotoFormData(files, 'photos', keepPhotos));
  }
}

function unwrapResponseData(response: unknown): unknown {
  if (typeof response === 'object' && response != null && 'data' in response) {
    return (response as AxiosLikeResponse).data;
  }

  return response;
}

function collectPhotoUrls(value: unknown, urls: Set<string>) {
  if (typeof value === 'string') {
    if (/^(https?:|data:image\/|\/)/.test(value)) urls.add(value);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectPhotoUrls(item, urls));
    return;
  }

  if (typeof value !== 'object' || value == null) return;

  const record = value as Record<string, unknown>;
  for (const key of ['url', 'src', 'href', 'path', 'location', 'secure_url']) {
    collectPhotoUrls(record[key], urls);
  }
  for (const key of ['photos', 'photoUrls', 'images', 'imageUrls', 'files', 'urls', 'data']) {
    collectPhotoUrls(record[key], urls);
  }
}

export function getUploadedPhotoUrls(response: unknown): string[] {
  const urls = new Set<string>();
  collectPhotoUrls(unwrapResponseData(response), urls);
  return [...urls];
}

export async function uploadListingPhotos(
  client: UploadClient,
  listingId: string,
  files: File[],
  keepPhotos?: string[]
): Promise<string[]> {
  if (!files.length) return [];

  const uploadedUrls: string[] = [];
  const retainedPhotos = [...new Set(keepPhotos ?? [])];

  for (let i = 0; i < files.length; i += LISTING_PHOTO_UPLOAD_BATCH_SIZE) {
    const batch = files.slice(i, i + LISTING_PHOTO_UPLOAD_BATCH_SIZE);
    const response = keepPhotos
      ? await uploadPhotoBatchWithKeep(client, listingId, batch, [...retainedPhotos, ...uploadedUrls])
      : await uploadPhotoBatch(client, listingId, batch);
    uploadedUrls.push(...getUploadedPhotoUrls(response));
  }

  return [...new Set(uploadedUrls)];
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read photo.'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load photo.'));
    image.src = src;
  });
}

async function fileToCompressedDataUrl(file: File, options: PhotoDataUrlOptions = {}): Promise<string> {
  const originalDataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(originalDataUrl);
  const maxDimension = options.maxDimension ?? FALLBACK_PHOTO_MAX_DIMENSION;
  const quality = options.quality ?? FALLBACK_PHOTO_QUALITY;
  const scale = Math.min(
    1,
    maxDimension / Math.max(image.naturalWidth, image.naturalHeight)
  );
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) return originalDataUrl;

  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', quality);
}

export async function getPhotoDataUrls(files: File[], options?: PhotoDataUrlOptions): Promise<string[]> {
  return Promise.all(files.map((file) => fileToCompressedDataUrl(file, options)));
}
