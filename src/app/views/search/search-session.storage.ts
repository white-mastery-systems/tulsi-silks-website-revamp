export const SEARCH_SESSION_STORAGE_KEY = 'ys_search_session_v1';

export interface SearchClassifyCache {
  imageFingerprint: string;
  classification: Record<string, unknown>;
  filters: Record<string, string>;
  previewDataUrl: string;
  imageDetected: boolean;
  cachedAt: number;
}

export interface SearchSessionCache {
  classify?: SearchClassifyCache;
  afterSearchEvent?: boolean;
  page?: number;
  fallbackUsed?: boolean;
  filters?: Record<string, string>;
}

export async function buildImageFingerprint(file: File): Promise<string> {
  const header = await file.slice(0, 64).arrayBuffer();
  const headerHex = Array.from(new Uint8Array(header))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
  return `${file.name}|${file.size}|${file.lastModified}|${headerHex}`;
}

export async function buildPreviewDataUrl(
  file: File,
  maxWidth = 360,
  quality = 0.72
): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, maxWidth / image.width);
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if(!context) {
        reject(new Error('Canvas unavailable'));
        return;
      }
      context.drawImage(image, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Preview load failed'));
    };
    image.src = objectUrl;
  });
}

export function readSearchSession(): SearchSessionCache | null {
  try {
    const raw = sessionStorage.getItem(SEARCH_SESSION_STORAGE_KEY);
    if(!raw) return null;
    return JSON.parse(raw) as SearchSessionCache;
  } catch {
    return null;
  }
}

export function writeSearchSession(cache: SearchSessionCache) {
  try {
    sessionStorage.setItem(SEARCH_SESSION_STORAGE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.log('search session persist failed', error);
  }
}

export function clearSearchSession() {
  try {
    sessionStorage.removeItem(SEARCH_SESSION_STORAGE_KEY);
  } catch {
    // ignore
  }
}
