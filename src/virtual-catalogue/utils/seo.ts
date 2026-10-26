/**
 * Dynamic OpenGraph (OG) and Social Meta Tags Manager
 * Updates page title, OG image, description, and Twitter card on every page change.
 */

interface SeoMetadata {
  title: string;
  description?: string;
  image?: string;
  url?: string;
}

function setOrCreateMetaTag(property: string, content: string, isName = false) {
  const attr = isName ? 'name' : 'property';
  let el = document.querySelector(`meta[${attr}="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function updateOgMetadata({ title, description, image, url }: SeoMetadata): void {
  document.title = title;

  if (description) {
    setOrCreateMetaTag('description', description, true);
    setOrCreateMetaTag('og:description', description);
    setOrCreateMetaTag('twitter:description', description, true);
  }

  setOrCreateMetaTag('og:title', title);
  setOrCreateMetaTag('twitter:title', title, true);
  setOrCreateMetaTag('og:type', 'website');
  setOrCreateMetaTag('twitter:card', 'summary_large_image', true);

  if (image) {
    // If relative path, resolve to absolute URL for external social preview bots
    const absoluteImageUrl = image.startsWith('http') || image.startsWith('data:')
      ? image
      : `${window.location.origin}${image.startsWith('/') ? '' : '/'}${image}`;

    setOrCreateMetaTag('og:image', absoluteImageUrl);
    setOrCreateMetaTag('twitter:image', absoluteImageUrl, true);
  }

  const currentUrl = url || window.location.href;
  setOrCreateMetaTag('og:url', currentUrl);
}

