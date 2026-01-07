// Auth API client for Render backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://datapulse-fkcq.onrender.com';

export interface User {
  id: string;
  email: string;
  name?: string;
  has_store_credentials?: boolean;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export type StorePlatform = 'shopify' | 'lazada' | 'shopee';

export interface StoreCredentials {
  platform: StorePlatform;
  credentials: Record<string, string>;
}

const TOKEN_KEY = 'datapulse_token';
const USER_KEY = 'datapulse_user';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
}

export function storeAuth(token: string, user: User): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Invalid credentials');
  }

  const data = await response.json();
  storeAuth(data.access_token, data.user);
  return data;
}

export async function register(email: string, password: string, name: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Registration failed');
  }

  const data = await response.json();
  storeAuth(data.access_token, data.user);
  return data;
}

export async function getCurrentUser(): Promise<User | null> {
  const token = getStoredToken();
  if (!token) return null;

  const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) {
    clearAuth();
    return null;
  }

  return response.json();
}

export function logout(): void {
  clearAuth();
}

export async function requestPasswordReset(email: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to send reset email');
  }
}

export async function saveStoreCredentials(storeCredentials: StoreCredentials): Promise<void> {
  const token = getStoredToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/store/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(storeCredentials),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to save store credentials');
  }

  // Update stored user to reflect they have credentials
  const user = getStoredUser();
  if (user) {
    storeAuth(token, { ...user, has_store_credentials: true });
  }
}

export async function getStoreCredentials(): Promise<StoreCredentials | null> {
  const token = getStoredToken();
  if (!token) return null;

  const response = await fetch(`${API_BASE_URL}/api/v1/store/credentials`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error('Failed to fetch store credentials');
  }

  return response.json();
}
