import { config } from '../config/env';

type RequestBody = BodyInit | Record<string, unknown> | unknown[] | null;

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: RequestBody;
}

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function buildUrl(path: string): string {
  const baseUrl = config.apiUrl ?? '';
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

function buildBody(body: RequestBody | undefined): BodyInit | undefined {
  if (body == null) return undefined;
  if (body instanceof FormData || body instanceof Blob || body instanceof URLSearchParams) {
    return body;
  }
  if (typeof body === 'string') return body;
  return JSON.stringify(body);
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers = new Headers(options.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const body = buildBody(options.body);
  if (body && !(body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(buildUrl(path), {
    ...options,
    headers,
    body,
  });

  if (response.status === 401) {
    localStorage.removeItem('token');
    window.location.assign('/login');
    throw new ApiError('Unauthorized', 401);
  }

  if (!response.ok) {
    const message = await response.text();
    throw new ApiError(message || response.statusText, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string): Promise<T> => request<T>(path),
  post: <T>(path: string, body?: RequestBody): Promise<T> =>
    request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body?: RequestBody): Promise<T> =>
    request<T>(path, { method: 'PUT', body }),
  delete: <T>(path: string): Promise<T> => request<T>(path, { method: 'DELETE' }),
};

export { ApiError };
