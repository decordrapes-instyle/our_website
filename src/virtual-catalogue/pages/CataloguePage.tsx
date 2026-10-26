import React, { useState, useEffect, useRef } from 'react';
import { Catalogue, Product } from '../types/catalogue';
import { A4Sheet } from '../components/catalogue/A4Sheet';
import { updateOgMetadata } from '../utils/seo';
import { useToast } from '../context/ToastContext';
import {
  ArrowLeft,
  ArrowUpDown,
  ArrowLeftRight,
  ZoomIn,
  ZoomOut,
  FileDown,
  Loader2,
} from 'lucide-react';

interface CataloguePageProps {
  catalogue: Catalogue;
  products: Product[];
  onOpenDetail: (code: string) => void;
  onGoHome: () => void;
}

export const CataloguePage: React.FC<CataloguePageProps> = ({
  catalogue,
  products,
  onOpenDetail,
  onGoHome,
}) => {
  const [fitMode, setFitMode] = useState<'' | 'width' | 'height'>('');
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [isSavingPdf, setIsSavingPdf] = useState<boolean>(false);
  const [pdfProgress, setPdfProgress] = useState<string>('');
  const catalogueRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  useEffect(() => {
    const firstImg = products[0]?.images[0] || catalogue.coverImage;
    updateOgMetadata({
      title: `${catalogue.title} | ${catalogue.brand}`,
      description: catalogue.subtitle,
      image: firstImg,
    });
  }, [catalogue, products]);

  // Clean up body[data-fit] on unmount
  useEffect(() => {
    return () => {
      document.body.removeAttribute('data-fit');
    };
  }, []);

  const toggleFit = (mode: 'width' | 'height') => {
    const next = fitMode === mode ? '' : mode;
    setFitMode(next);
    setZoomScale(1);
    if (next) {
      document.body.setAttribute('data-fit', next);
    } else {
      document.body.removeAttribute('data-fit');
    }
  };

  const handleZoomIn = () => {
    setZoomScale((prev) => Math.min(2.5, Math.round((prev + 0.15) * 100) / 100));
  };

  const handleZoomOut = () => {
    setZoomScale((prev) => Math.max(0.5, Math.round((prev - 0.15) * 100) / 100));
  };

  const handleResetZoom = () => {
    setZoomScale(1);
    setFitMode('');
    document.body.removeAttribute('data-fit');
  };

  // Zoom catalogue pages on Ctrl+wheel or pinch without zooming the webpage
  useEffect(() => {
    const el = catalogueRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = -e.deltaY * 0.003;
        setZoomScale((prev) => {
          const next = Math.min(2.5, Math.max(0.5, prev + delta));
          return Math.round(next * 100) / 100;
        });
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Save PDF logic with client-side compression
  const handleSavePdf = async () => {
    if (isSavingPdf) return;

    setIsSavingPdf(true);
    setPdfProgress('Preparing...');

    try {
      const { exportCatalogueToPdf } = await import('../utils/pdfExport');
      await exportCatalogueToPdf(
        catalogue.slug,
        catalogue.title,
        (progress) => setPdfProgress(progress)
      );
      toast.success('Catalogue PDF downloaded successfully!');
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setIsSavingPdf(false);
      setPdfProgress('');
    }
  };

  // Chunk products into groups of 2 per A4 sheet
  const sheets: Product[][] = [];
  for (let i = 0; i < products.length; i += 2) {
    sheets.push(products.slice(i, i + 2));
  }

  return (
    <>
      {/* Back button to return to Index */}
      <button
        type="button"
        className="back"
        onClick={onGoHome}
        data-tip="Back to index"
        aria-label="Back to index"
      >
        <ArrowLeft className="w-5 h-5 text-white" />
      </button>

      {/* Floating Action Bar */}
      <div className="fab" role="group" aria-label="Catalogue controls">
        {/* Fit to Height (Vertical Fit) */}
        <button
          type="button"
          data-tip="Vertical fit (Height)"
          aria-label="Vertical fit to height"
          aria-pressed={fitMode === 'height'}
          onClick={() => toggleFit('height')}
        >
          <ArrowUpDown className="w-4 h-4" />
        </button>

        {/* Fit to Width (Horizontal Fit) */}
        <button
          type="button"
          data-tip="Horizontal fit (Width)"
          aria-label="Horizontal fit to width"
          aria-pressed={fitMode === 'width'}
          onClick={() => toggleFit('width')}
        >
          <ArrowLeftRight className="w-4 h-4" />
        </button>

        <span className="fab-sep" aria-hidden="true" />

        {/* Zoom Out */}
        <button
          type="button"
          data-tip="Zoom out (-)"
          aria-label="Zoom out page"
          onClick={handleZoomOut}
          disabled={zoomScale <= 0.5}
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        {/* Zoom Reset Badge */}
        <button
          type="button"
          className="fab-zoom-badge"
          data-tip="Reset zoom (100%)"
          aria-label={`Reset zoom, currently ${Math.round(zoomScale * 100)}%`}
          onClick={handleResetZoom}
        >
          {Math.round(zoomScale * 100)}%
        </button>

        {/* Zoom In */}
        <button
          type="button"
          data-tip="Zoom in (+)"
          aria-label="Zoom in page"
          onClick={handleZoomIn}
          disabled={zoomScale >= 2.5}
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <span className="fab-sep" aria-hidden="true" />

        {/* Save PDF */}
        <button
          type="button"
          data-tip={isSavingPdf ? `Generating PDF (${pdfProgress})...` : 'Save compressed PDF'}
          aria-label="Save compressed PDF"
          onClick={handleSavePdf}
          disabled={isSavingPdf}
          style={{ opacity: isSavingPdf ? 1 : undefined }}
        >
          {isSavingPdf ? (
            <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
          ) : (
            <FileDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Catalogue Sheets Container */}
      <div
        id="catalogue"
        ref={catalogueRef}
        style={{ '--sheet-zoom': zoomScale } as React.CSSProperties}
      >
        {sheets.map((pageProducts, index) => (
          <A4Sheet
            key={index}
            pageNumber={index + 1}
            brandTitle={catalogue.brand}
            catalogueTitle={catalogue.title}
            products={pageProducts}
            currency={catalogue.currency || '₹'}
            onOpenDetail={onOpenDetail}
          />
        ))}
      </div>
    </>
  );
};
