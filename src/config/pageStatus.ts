/**
 * Central Page Status & Availability Configuration (Code-Only)
 * 
 * Set any page to `true` to display normally,
 * or `false` to display the "Under Construction / Maintenance" screen.
 * 
 * Major routes covered:
 * - products:    /products
 * - catalogue:   /catalogue
 * - ourWork:     /our-work
 * - about:       /about
 * - contact:     /contact
 * - estimate:    /estimate
 * - warranty:    /warranty
 * - home:        /
 */

export type PageKey =
  | 'home'
  | 'products'
  | 'catalogue'
  | 'ourWork'
  | 'about'
  | 'contact'
  | 'estimate'
  | 'warranty';

export const PAGE_STATUS: Record<PageKey, boolean> = {
  home: true,
  products: true,
  catalogue: false,
  ourWork: true,
  about: true,
  contact: true,
  estimate: true,
  warranty: true,
};

export function isPageActive(page: PageKey): boolean {
  return PAGE_STATUS[page] ?? true;
}
