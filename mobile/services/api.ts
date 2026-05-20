import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://pranesh.link';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
}

/**
 * Authenticated API client for mobile.
 *
 * @param path - API path (e.g. '/api/v1/finance/accounts').
 * @param options - Request options.
 * @returns Parsed JSON response.
 */
export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  const { method = 'GET', body, headers = {} } = options;

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `API error: ${response.status}`);
  }

  return response.json();
}
