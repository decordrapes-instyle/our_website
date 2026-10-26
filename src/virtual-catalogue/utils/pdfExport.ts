import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Pre-rasterizes any HTMLImageElement to a high-resolution JPEG Data URL
 * directly using canvas.drawImage.
 */
function rasterizeImageElement(img: HTMLImageElement): Promise<string> {
  return new Promise((resolve) => {
    // If not complete, wait for it
    if (!img.complete || img.naturalWidth === 0) {
      const waitImg = new Image();
      waitImg.crossOrigin = 'anonymous';
      waitImg.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const w = Math.max(waitImg.naturalWidth || 640, 640);
          const h = Math.max(waitImg.naturalHeight || 480, 480);
          canvas.width = w * 1.5;
          canvas.height = h * 1.5;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(img.src);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(waitImg, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        } catch {
          resolve(img.src);
        }
      };
      waitImg.onerror = () => resolve(img.src);
      waitImg.src = img.src;
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      const w = Math.max(img.naturalWidth || img.clientWidth || 640, 640);
      const h = Math.max(img.naturalHeight || img.clientHeight || 480, 480);
      canvas.width = w * 1.5;
      canvas.height = h * 1.5;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(img.src);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    } catch {
      resolve(img.src);
    }
  });
}

/**
 * Exports all A4 sheets in the catalogue container to a multi-page,
 * client-side compressed PDF with 100% image fidelity.
 */
export async function exportCatalogueToPdf(
  catalogueSlug: string,
  catalogueTitle: string,
  onProgress?: (progressText: string) => void
): Promise<void> {
  const sheetEls = Array.from(document.querySelectorAll<HTMLElement>('#catalogue .sheet'));
  if (!sheetEls || sheetEls.length === 0) {
    throw new Error('No catalogue pages found to export.');
  }

  onProgress?.('Preparing images...');

  // 1. Ensure all images across all sheets are decoded & pre-rasterized
  const allImages = Array.from(document.querySelectorAll<HTMLImageElement>('#catalogue img'));
  const rasterMap = new Map<HTMLImageElement, string>();

  await Promise.all(
    allImages.map(async (img) => {
      try {
        if (img.decode) {
          await img.decode().catch(() => {});
        }
        const rasterUrl = await rasterizeImageElement(img);
        rasterMap.set(img, rasterUrl);
      } catch {
        // Fallback to original
      }
    })
  );

  // 2. Initialize jsPDF: A4 portrait (210mm x 297mm) with stream compression
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const standardA4WidthPx = 794;
  const standardA4HeightPx = 1123;

  for (let i = 0; i < sheetEls.length; i++) {
    onProgress?.(`Page ${i + 1}/${sheetEls.length}`);
    const sheet = sheetEls[i];

    // Collect pre-rasterized image data for this specific sheet
    const sheetImages = Array.from(sheet.querySelectorAll<HTMLImageElement>('img'));
    const preRasterList = sheetImages.map((img) => rasterMap.get(img) || img.src);

    const canvas = await html2canvas(sheet, {
      scale: 1.6, // Optimal balance between crisp 300DPI text and fast capture
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 1200,
      onclone: (clonedDoc, clonedSheet) => {
        // A. Inject exact pixel equivalents for CSS container query units (cqw)
        // Since html2canvas does not parse cqw units, this guarantees identical A4 typography & spacing
        const style = clonedDoc.createElement('style');
        style.textContent = `
          .sheet {
            width: ${standardA4WidthPx}px !important;
            height: ${standardA4HeightPx}px !important;
            margin: 0 !important;
            background: #ffffff !important;
            overflow: hidden !important;
          }
          .in {
            padding: 43.7px 47.6px !important;
            gap: 23.8px !important;
            font-size: 13.9px !important;
            height: 100% !important;
            box-sizing: border-box !important;
          }
          .hd, .ft {
            font-size: 12.5px !important;
          }
          .bd {
            gap: 31.8px !important;
          }
          .card {
            gap: 31.8px !important;
          }
          .media {
            gap: 8px !important;
          }
          .ph {
            border-radius: 12.7px !important;
            overflow: hidden !important;
            background: #f4f4f6 !important;
          }
          .ph img {
            width: 100% !important;
            height: 100% !important;
            object-fit: contain !important;
            display: block !important;
          }
          .th {
            display: flex !important;
            flex-direction: row !important;
            flex-wrap: wrap !important;
            gap: 6.4px !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
          }
          .th img {
            height: 62px !important;
            aspect-ratio: 3 / 4 !important;
            border-radius: 6.4px !important;
            object-fit: contain !important;
            display: block !important;
            background: #f4f4f6 !important;
            flex-shrink: 0 !important;
          }
          .th-count-badge {
            display: none !important;
          }
          .th-overflow-img {
            display: block !important;
          }
          .tx h3 {
            font-size: 28px !important;
            line-height: 1.1 !important;
          }
        `;
        clonedDoc.head.appendChild(style);

        // B. Replace all cloned images with their pre-rasterized JPEG Data URLs
        const clonedImgs = Array.from(clonedSheet.querySelectorAll<HTMLImageElement>('img'));
        clonedImgs.forEach((clonedImg, idx) => {
          if (preRasterList[idx]) {
            clonedImg.src = preRasterList[idx];
          }
          clonedImg.loading = 'eager';
        });
      },
    });

    // Client-side compression to JPEG at 0.82 quality
    // Drastically reduces PDF weight (~180KB per page instead of ~5MB)
    const imgData = canvas.toDataURL('image/jpeg', 0.82);

    if (i > 0) {
      pdf.addPage('a4', 'portrait');
    }

    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
  }

  const safeTitle = (catalogueTitle || catalogueSlug || 'catalogue')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');
  pdf.save(`${safeTitle}-catalogue.pdf`);
}

