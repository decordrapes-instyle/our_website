import { Catalogue, Product } from '../types/catalogue';
import { INITIAL_CATALOGUES, INITIAL_PRODUCTS } from '../data/mockData';
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

const RTDB_URL = (
  getEnv('VITE_FIREBASE_DATABASE_URL') ||
  getEnv('VITE_CATALOGUE_RTDB_URL') ||
  'https://decor-drapes-default-rtdb.asia-southeast1.firebasedatabase.app'
).replace(/\/$/, '');

const STORAGE_KEY_CATALOGUES = 'v1_cat_catalogues_cache';
const STORAGE_KEY_PRODUCTS = 'v1_cat_products_cache';

// Unified collection root names supported in Firebase
const PRIMARY_PATH = 'legend-catalogue';
const SECONDARY_PATH = 'virtual-catalogue';

// Helper to check if live Firebase is active
export function isFirebaseConfigured(): boolean {
  return Boolean(database || RTDB_URL);
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

// Fetch all Catalogues from unified Firebase collections: legend-catalogue & virtual-catalogue
export async function getCatalogues(): Promise<Catalogue[]> {
  if (database) {
    try {
      // 1. Try primary collection 'legend-catalogue'
      let snapshot = await get(ref(database, `${PRIMARY_PATH}/catalogues`));
      if (!snapshot.exists() || !snapshot.val()) {
        // 2. Try secondary collection 'virtual-catalogue'
        snapshot = await get(ref(database, `${SECONDARY_PATH}/catalogues`));
      }

      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data) {
          const list: Catalogue[] = Object.values(data);
          localStorage.setItem(STORAGE_KEY_CATALOGUES, JSON.stringify(list));
          return list;
        }
      }
    } catch (e) {
      console.warn('Firebase RTDB SDK error, falling back to REST / local:', e);
    }
  }

  // Second attempt via REST fallback
  if (RTDB_URL) {
    try {
      let res = await fetch(`${RTDB_URL}/${PRIMARY_PATH}/catalogues.json`);
      if (!res.ok) {
        res = await fetch(`${RTDB_URL}/${SECONDARY_PATH}/catalogues.json`);
      }
      if (res.ok) {
        const data = await res.json();
        if (data && !data.error) {
          const list: Catalogue[] = Object.values(data);
          localStorage.setItem(STORAGE_KEY_CATALOGUES, JSON.stringify(list));
          return list;
        }
      }
    } catch (e) {
      console.warn('Firebase REST error, falling back to local cache:', e);
    }
  }

  return getLocalCatalogues();
}

// Fetch Products by Catalogue ID from unified Firebase collections
export async function getProducts(catalogueId: string): Promise<Product[]> {
  if (database) {
    try {
      // 1. Try primary collection 'legend-catalogue'
      let snapshot = await get(ref(database, `${PRIMARY_PATH}/products`));
      if (!snapshot.exists() || !snapshot.val()) {
        // 2. Try secondary collection 'virtual-catalogue'
        snapshot = await get(ref(database, `${SECONDARY_PATH}/products`));
      }

      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data) {
          const list: Product[] = Object.values(data);
          const filtered = list.filter((p) => p.catalogueId === catalogueId);
          return filtered.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        }
      }
    } catch (e) {
      console.warn('Firebase RTDB products error, falling back:', e);
    }
  }

  // Fallback to local cache
  const all = getLocalProducts();
  return all
    .filter((p) => p.catalogueId === catalogueId)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
}

// Save or Update a single Product under both unified collection roots
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
      await Promise.allSettled([
        set(ref(database, `${PRIMARY_PATH}/products/${product.id}`), product),
        set(ref(database, `${SECONDARY_PATH}/products/${product.id}`), product),
      ]);
      return;
    } catch (e) {
      console.error('Error saving product to Firebase:', e);
    }
  }
}

// Bulk Insert / Import Products under both unified collection roots
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
      await Promise.allSettled([
        update(ref(database, `${PRIMARY_PATH}/products`), payload),
        update(ref(database, `${SECONDARY_PATH}/products`), payload),
      ]);
      return;
    } catch (e) {
      console.error('Error bulk updating products in Firebase:', e);
    }
  }
}

// Delete Product from both unified collection roots
export async function deleteProduct(productId: string): Promise<void> {
  const all = getLocalProducts().filter((p) => p.id !== productId);
  localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(all));

  if (database) {
    try {
      await Promise.allSettled([
        remove(ref(database, `${PRIMARY_PATH}/products/${productId}`)),
        remove(ref(database, `${SECONDARY_PATH}/products/${productId}`)),
      ]);
      return;
    } catch (e) {
      console.error('Error deleting product from Firebase:', e);
    }
  }
}

// Save or Update a Catalogue Category under both unified collection roots
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
      await Promise.allSettled([
        set(ref(database, `${PRIMARY_PATH}/catalogues/${catalogue.id}`), catalogue),
        set(ref(database, `${SECONDARY_PATH}/catalogues/${catalogue.id}`), catalogue),
      ]);
      return;
    } catch (e) {
      console.error('Error saving catalogue category to Firebase:', e);
    }
  }
}

// Delete a Catalogue Category from both unified collection roots
export async function deleteCatalogue(catalogueId: string): Promise<void> {
  const all = getLocalCatalogues().filter((c) => c.id !== catalogueId);
  localStorage.setItem(STORAGE_KEY_CATALOGUES, JSON.stringify(all));

  if (database) {
    try {
      await Promise.allSettled([
        remove(ref(database, `${PRIMARY_PATH}/catalogues/${catalogueId}`)),
        remove(ref(database, `${SECONDARY_PATH}/catalogues/${catalogueId}`)),
      ]);
      return;
    } catch (e) {
      console.error('Error deleting catalogue category from Firebase:', e);
    }
  }
}

// Reset data to defaults
export function resetToDefaults(): void {
  localStorage.setItem(STORAGE_KEY_CATALOGUES, JSON.stringify(INITIAL_CATALOGUES));
  localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
}
