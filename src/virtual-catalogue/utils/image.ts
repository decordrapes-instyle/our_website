export type ImageMode = 'thumb' | 'detail' | 'print' | 'raw';

/**
 * Returns optimized image URL according to requested tier:
 * - 'thumb':  w=420, q=auto:eco (~25-35 KB) - fast on 3G mobile
 * - 'detail': w=1400, q=auto:good (~150-200 KB) - high fidelity zoom
 * - 'print':  w=750, q=80 (~40 KB) - vector print engine guarantees < 1.5MB PDF
 */
export function getOptimizedImageUrl(
  imageSource: string | undefined,
  mode: ImageMode = 'thumb'
): string {
  if (!imageSource) {
    return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" fill="%23f0f0f0"><rect width="400" height="300"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23aaa" font-family="sans-serif" font-size="16">No Image</text></svg>';
  }

  // If already a local public asset (/uploads/...), data URI, or blob, return as-is
  if (imageSource.startsWith('/') || imageSource.startsWith('data:') || imageSource.startsWith('blob:')) {
    return imageSource;
  }

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

  // Cloudinary Public ID or URL handling (only if explicitly a cloudinary url)
  if (cloudName && imageSource.includes('cloudinary.com')) {
    const cleanPublicId = imageSource.replace(
      /^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/(v\d+\/)?/,
      ''
    );
    const baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload`;

    switch (mode) {
      case 'thumb':
        return `${baseUrl}/c_scale,w_420,q_auto:eco,f_auto/${cleanPublicId}`;
      case 'detail':
        return `${baseUrl}/c_scale,w_1400,q_auto:good,f_auto/${cleanPublicId}`;
      case 'print':
        return `${baseUrl}/c_scale,w_750,q_80,f_auto/${cleanPublicId}`;
      default:
        return `${baseUrl}/${cleanPublicId}`;
    }
  }

  return imageSource;
}

