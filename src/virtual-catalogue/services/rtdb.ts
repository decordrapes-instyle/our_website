import { Catalogue, Product } from '../types/catalogue';
import { INITIAL_CATALOGUES, INITIAL_PRODUCTS } from '../data/mockData';
import { getCurrentUser } from './auth';
import { database } from '../../config/firebase';
import { ref, get, set, remove, update } from 'firebase/database';

// Safe environment variable helper compatible with Vite, Next.js, CRA, and SSR
const getEnv = (key: string): string => {
  try {
    const meta = import.meta as unknown as { env?: Record<string, string> };
    if (meta?.env?.[key]) return meta.env[key];
  } catch { /* ignore */ }
  return '';
};

// Use the same Firebase Realtime Database as the main application
const DEFAULT_CATALOGUE_RTDB_URL =
  getEnv('VITE_FIREBASE_DATABASE_URL') ||
  getEnv('VITE_CATALOGUE_RTDB_URL') ||
  'https://decor-drapes-default-rtdb.asia-southeast1.firebasedatabase.app';

let dynamicRtdbUrl = '';
let dynamicAuthToken = '';

/**
 * Programmatic configuration for main app integration.
 * Allows the main app to specify a custom database URL or token at runtime.
 */
export function configureCatalogueDatabase(config: { rtdbUrl?: string; authToken?: string }): void {
  if (config.rtdbUrl) dynamicRtdbUrl = config.rtdbUrl.replace(/\/$/, '');
  if (config.authToken) dynamicAuthToken = config.authToken;
}

const RTDB_URL = (
  dynamicRtdbUrl ||
  getEnv('VITE_FIREBASE_DATABASE_URL') ||
  getEnv('VITE_CATALOGUE_RTDB_URL') ||
  DEFAULT_CATALOGUE_RTDB_URL
).replace(/\/$/, '');

const DB_SECRET =
  getEnv('VITE_CATALOGUE_DB_SECRET') ||
  getEnv('VITE_FIREBASE_DB_SECRET') ||
  '';

const STORAGE_KEY_CATALOGUES = 'v1_cat_catalogues_cache';
const STORAGE_KEY_PRODUCTS = 'v1_cat_products_cache';

// Helper to check if live Firebase is active
export function isFirebaseConfigured(): boolean {
  return Boolean(RTDB_URL || database);
}

function getAuthQueryParam(forWrite = false): string {
  if (dynamicAuthToken) {
    return `?auth=${encodeURIComponent(dynamicAuthToken)}`;
  }
  if (DB_SECRET) {
    return `?auth=${DB_SECRET}`;
  }
  const user = getCurrentUser();
  if (user?.idToken) {
    return `?auth=${encodeURIComponent(user.idToken)}`;
  }
  if (forWrite) {
    console.warn('Realtime Database write attempted without authentication credentials.');
  }
  return '';
}

// Local cache initializers
function getLocalCatalogues(): Catalogue[] {
  const cached = localStorage.getItem(STORAGE_KEY_CATALOGUES);
  if (cached) {
    try {
      const list: Catalogue[] = JSON.parse(cached);
      const existingSlugs = new Set(list.map((c) => c.slug));
      let updated = false;
      INITIAL_CATALOGUES.forEach((c) => {
        if (!existingSlugs.has(c.slug)) {
          list.push(c);
          updated = true;
        }
      });
      if (updated) {
        localStorage.setItem(STORAGE_KEY_CATALOGUES, JSON.stringify(list));
      }
      return list;
    } catch { /* ignore */ }
  }
  localStorage.setItem(STORAGE_KEY_CATALOGUES, JSON.stringify(INITIAL_CATALOGUES));
  return INITIAL_CATALOGUES;
}

function getLocalProducts(): Product[] {
  const cached = localStorage.getItem(STORAGE_KEY_PRODUCTS);
  if (cached) {
    try {
      const list: Product[] = JSON.parse(cached);
      const existingIds = new Set(list.map((p) => p.id));
      let updated = false;
      INITIAL_PRODUCTS.forEach((p) => {
        if (!existingIds.has(p.id)) {
          list.push(p);
          updated = true;
        }
      });
      if (updated) {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(list));
      }
      return list;
    } catch { /* ignore */ }
  }
  localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
  return INITIAL_PRODUCTS;
}

// Fetch all Catalogues wrapped under /virtual-catalogue/catalogues
export async function getCatalogues(): Promise<Catalogue[]> {
  // First attempt via Firebase Client SDK
  if (database) {
    try {
      const snapshot = await get(ref(database, 'virtual-catalogue/catalogues'));
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data) {
          const list: Catalogue[] = Object.values(data);
          localStorage.setItem(STORAGE_KEY_CATALOGUES, JSON.stringify(list));
          return list;
        }
      }
    } catch (e) {
      // SDK call failed or denied, continue to REST
    }
  }

  // Second attempt via REST
  if (isFirebaseConfigured()) {
    try {
      const res = await fetch(`${RTDB_URL}/virtual-catalogue/catalogues.json${getAuthQueryParam(false)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && !data.error) {
          const list: Catalogue[] = Object.values(data);
          localStorage.setItem(STORAGE_KEY_CATALOGUES, JSON.stringify(list));
          return list;
        }
      }
    } catch (e) {
      console.warn('Firebase RTDB error, falling back to local cache:', e);
    }
  }

  // Fallback to local cache & mock data
  return getLocalCatalogues();
}

// Fetch Products by Catalogue ID wrapped under /virtual-catalogue/products
export async function getProducts(catalogueId: string): Promise<Product[]> {
  // First attempt via Firebase Client SDK
  if (database) {
    try {
      const snapshot = await get(ref(database, 'virtual-catalogue/products'));
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data) {
          const list: Product[] = Object.values(data);
          const filtered = list.filter((p) => p.catalogueId === catalogueId);
          return filtered.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        }
      }
    } catch (e) {
      // Continue to REST
    }
  }

  // Second attempt via REST
  if (isFirebaseConfigured()) {
    try {
      const res = await fetch(`${RTDB_URL}/virtual-catalogue/products.json${getAuthQueryParam(false)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && !data.error) {
          const list: Product[] = Object.values(data);
          const filtered = list.filter((p) => p.catalogueId === catalogueId);
          return filtered.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        }
      }
    } catch (e) {
      console.warn('Firebase RTDB error, falling back to local cache:', e);
    }
  }

  // Fallback to local cache
  const all = getLocalProducts();
  return all
    .filter((p) => p.catalogueId === catalogueId)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
}

// Save or Update a single Product under /virtual-catalogue/products/:id
export async function saveProduct(product: Product): Promise<void> {
  const all = getLocalProducts();
  const index = all.findIndex((p) => p.id === product.id);
  if (index >= 0) {
    all[index] = product;
  } else {
    all.push(product);
  }
  localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(all));

  if (database) {
    try {
      await set(ref(database, `virtual-catalogue/products/${product.id}`), product);
      return;
    } catch (e) { /* fallback to REST */ }
  }

  if (isFirebaseConfigured()) {
    await fetch(`${RTDB_URL}/virtual-catalogue/products/${product.id}.json${getAuthQueryParam(true)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
  }
}

// Bulk Insert / Import Products under /virtual-catalogue/products
export async function bulkInsertProducts(products: Product[]): Promise<void> {
  const all = getLocalProducts();
  for (const prod of products) {
    const idx = all.findIndex((p) => p.id === prod.id);
    if (idx >= 0) all[idx] = prod;
    else all.push(prod);
  }
  localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(all));

  const payload: Record<string, Product> = {};
  for (const prod of products) {
    payload[prod.id] = prod;
  }

  if (database) {
    try {
      await update(ref(database, 'virtual-catalogue/products'), payload);
      return;
    } catch (e) { /* fallback to REST */ }
  }

  if (isFirebaseConfigured()) {
    await fetch(`${RTDB_URL}/virtual-catalogue/products.json${getAuthQueryParam(true)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }
}

// Delete Product from /virtual-catalogue/products/:id
export async function deleteProduct(productId: string): Promise<void> {
  const all = getLocalProducts().filter((p) => p.id !== productId);
  localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(all));

  if (database) {
    try {
      await remove(ref(database, `virtual-catalogue/products/${productId}`));
      return;
    } catch (e) { /* fallback to REST */ }
  }

  if (isFirebaseConfigured()) {
    await fetch(`${RTDB_URL}/virtual-catalogue/products/${productId}.json${getAuthQueryParam(true)}`, {
      method: 'DELETE',
    });
  }
}

// Save or Update a Catalogue Category under /virtual-catalogue/catalogues/:id
export async function saveCatalogue(catalogue: Catalogue): Promise<void> {
  const all = getLocalCatalogues();
  const index = all.findIndex((c) => c.id === catalogue.id);
  if (index >= 0) {
    all[index] = catalogue;
  } else {
    all.push(catalogue);
  }
  localStorage.setItem(STORAGE_KEY_CATALOGUES, JSON.stringify(all));

  if (database) {
    try {
      await set(ref(database, `virtual-catalogue/catalogues/${catalogue.id}`), catalogue);
      return;
    } catch (e) { /* fallback to REST */ }
  }

  if (isFirebaseConfigured()) {
    await fetch(`${RTDB_URL}/virtual-catalogue/catalogues/${catalogue.id}.json${getAuthQueryParam(true)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(catalogue),
    });
  }
}

// Delete a Catalogue Category from /virtual-catalogue/catalogues/:id
export async function deleteCatalogue(catalogueId: string): Promise<void> {
  const all = getLocalCatalogues().filter((c) => c.id !== catalogueId);
  localStorage.setItem(STORAGE_KEY_CATALOGUES, JSON.stringify(all));

  if (database) {
    try {
      await remove(ref(database, `virtual-catalogue/catalogues/${catalogueId}`));
      return;
    } catch (e) { /* fallback to REST */ }
  }

  if (isFirebaseConfigured()) {
    await fetch(`${RTDB_URL}/virtual-catalogue/catalogues/${catalogueId}.json${getAuthQueryParam(true)}`, {
      method: 'DELETE',
    });
  }
}

// Reset data to defaults
export function resetToDefaults(): void {
  localStorage.setItem(STORAGE_KEY_CATALOGUES, JSON.stringify(INITIAL_CATALOGUES));
  localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
}
