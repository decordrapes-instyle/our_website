/**
 * Firebase Authentication Service
 * Uses Firebase Email/Password REST API exclusively. No local bypass.
 */

export interface AuthUser {
  email: string;
  idToken: string;
  localId: string;
}

const STORAGE_KEY_AUTH = 'v1_cat_admin_auth';

// Safe environment variable helper compatible with Vite, Next.js, and SSR
const getEnv = (key: string): string => {
  try {
    const meta = import.meta as unknown as { env?: Record<string, string> };
    if (meta?.env?.[key]) return meta.env[key];
  } catch { /* ignore */ }
  return '';
};

// Isolated catalogue Firebase Auth key to prevent collision with main app's Firebase project
const DEFAULT_CATALOGUE_API_KEY = 'AIzaSyBlesMz7jiUxeDEPCuwuB4nvnzhN5qaOz8';

const FIREBASE_API_KEY =
  getEnv('VITE_CATALOGUE_FIREBASE_API_KEY') ||
  getEnv('NEXT_PUBLIC_CATALOGUE_FIREBASE_API_KEY') ||
  getEnv('VITE_FIREBASE_API_KEY') ||
  getEnv('NEXT_PUBLIC_FIREBASE_API_KEY') ||
  DEFAULT_CATALOGUE_API_KEY;

export function getCurrentUser(): AuthUser | null {
  const cached = localStorage.getItem(STORAGE_KEY_AUTH);
  if (!cached) return null;
  try {
    return JSON.parse(cached);
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

export function signOut(): void {
  localStorage.removeItem(STORAGE_KEY_AUTH);
}

/**
 * Signs in using Firebase Email & Password via the Firebase Auth REST API.
 * Requires VITE_FIREBASE_API_KEY to be set in your .env file.
 */
export async function signInWithEmailPassword(email: string, password: string): Promise<AuthUser> {
  if (!FIREBASE_API_KEY) {
    throw new Error('Firebase is not configured. Contact your administrator.');
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();

  try {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password: cleanPassword, returnSecureToken: true }),
    });

    const data = await res.json();

    if (res.ok && data.idToken) {
      const user: AuthUser = {
        email: data.email || cleanEmail,
        idToken: data.idToken,
        localId: data.localId || 'firebase_user',
      };
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(user));
      return user;
    }

    const errorMsg = data.error?.message || 'Authentication failed';
    if (
      errorMsg === 'EMAIL_NOT_FOUND' ||
      errorMsg === 'INVALID_PASSWORD' ||
      errorMsg === 'INVALID_LOGIN_CREDENTIALS' ||
      errorMsg === 'INVALID_EMAIL'
    ) {
      throw new Error('Invalid email or password.');
    }
    if (errorMsg === 'USER_DISABLED') {
      throw new Error('This account has been disabled. Contact your administrator.');
    }
    if (errorMsg === 'TOO_MANY_ATTEMPTS_TRY_LATER') {
      throw new Error('Too many failed attempts. Please try again later.');
    }
    throw new Error(errorMsg);
  } catch (netErr: any) {
    if (
      netErr.message?.includes('Failed to fetch') ||
      netErr.name === 'TypeError' ||
      netErr.message?.includes('network') ||
      netErr.message?.includes('ERR_INTERNET_DISCONNECTED')
    ) {
      throw new Error('Connection failed. Please check your internet connection.');
    }
    throw netErr;
  }
}
