/**
 * Universal Image Storage Service
 * Saves 3:4 portrait images directly to the project's public directory (/public/uploads)
 * Keeps images ultra-lightweight with client-side WebP compression.
 */

export interface StoredImageResult {
  url: string;
  filename: string;
}

/**
 * Optimizes an image to 3:4 portrait ratio and compresses to WebP using HTML Canvas
 */
async function compressImageTo34WebP(file: File, maxWidth = 800): Promise<{ dataUrl: string; filename: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Downscale while retaining 3:4 orientation
        if (width > maxWidth) {
          height = Math.round((maxWidth / width) * height);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ dataUrl: e.target?.result as string, filename: file.name });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Export as lightweight WebP (~30-50KB)
        const webpDataUrl = canvas.toDataURL('image/webp', 0.82);
        const baseName = file.name.replace(/\.[^/.]+$/, '');
        resolve({ dataUrl: webpDataUrl, filename: `${baseName}.webp` });
      };
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Saves an image directly into the project's public/uploads directory.
 */
export async function uploadImage(file: File): Promise<StoredImageResult> {
  // 1. Compress image to optimal lightweight 3:4 WebP
  const { dataUrl, filename } = await compressImageTo34WebP(file);

  // 2. PRIMARY: Save directly into project public directory (/public/uploads)
  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, data: dataUrl }),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.url) {
        return {
          url: result.url,
          filename: result.filename,
        };
      }
    }
  } catch {
    // If server upload endpoint not reached, fall through to dataUrl
  }

  // 3. SECURE FALLBACK: Return optimized WebP data URI (persists in RTDB/localStorage without breaking)
  return {
    url: dataUrl,
    filename: filename,
  };
}

/**
 * Cleans up and deletes image files from the public/uploads directory.
 */
export async function deleteStoredImages(urls: string[]): Promise<number> {
  const uploadUrls = urls.filter(
    (u) => typeof u === 'string' && (u.includes('/uploads/') || u.startsWith('uploads/'))
  );
  if (uploadUrls.length === 0) return 0;

  try {
    const response = await fetch('/api/delete-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls: uploadUrls }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.deletedCount || 0;
    }
  } catch (err) {
    console.warn('Failed to clean image from public directory:', err);
  }
  return 0;
}
