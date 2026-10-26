import React, { useState, useMemo } from 'react';
import { Product } from '../../types/catalogue';
import { getOptimizedImageUrl } from '../../utils/image';

interface ProductCardProps {
  product: Product;
  currency?: string;
  onOpenDetail: (code: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  currency = '₹',
  onOpenDetail,
}) => {
  // Aggregate all unique images: product.images + all variant images
  const allImages = useMemo(() => {
    const list: string[] = [];
    if (product.images && product.images.length > 0) {
      for (const img of product.images) {
        if (img && !list.includes(img)) list.push(img);
      }
    }
    if (product.variants && product.variants.length > 0) {
      for (const v of product.variants) {
        if (v.images) {
          for (const img of v.images) {
            if (img && !list.includes(img)) list.push(img);
          }
        }
      }
    }
    return list;
  }, [product]);

  const [activeImgIdx, setActiveImgIdx] = useState<number>(0);

  const currentCode = product.primaryCode;
  const currentPrice = product.price;

  const largeImg = allImages[activeImgIdx] || allImages[0] || '';

  // Other images (excluding the active preview image)
  const otherImages = useMemo(() => {
    return allImages.map((_, i) => i).filter((i) => i !== activeImgIdx);
  }, [allImages, activeImgIdx]);

  // Web view: show first 4 thumbnails + overflow count badge
  // PDF view: shows all thumbnails wrapped without count badge
  const MAX_VISIBLE_THUMBS = 4;
  const visibleThumbs = useMemo(() => otherImages.slice(0, MAX_VISIBLE_THUMBS), [otherImages]);
  const overflowThumbs = useMemo(() => otherImages.slice(MAX_VISIBLE_THUMBS), [otherImages]);
  const overflowCount = overflowThumbs.length;

  // Specifications
  const specsEntries = Object.entries(product.specs || {});
  const bore = product.dimensions?.d ? `${product.dimensions.d} mm` : specsEntries[0]?.[1] || '-';
  const od = product.dimensions?.D ? `${product.dimensions.D} mm` : specsEntries[1]?.[1] || '-';
  const width = product.dimensions?.B ? `${product.dimensions.B} mm` : specsEntries[2]?.[1] || '-';

  const boreLabel = product.dimensions?.d ? 'Bore' : (specsEntries[0]?.[0]?.slice(0, 10) || 'Spec 1');
  const odLabel = product.dimensions?.D ? 'OD' : (specsEntries[1]?.[0]?.slice(0, 10) || 'Spec 2');
  const widthLabel = product.dimensions?.B ? 'Width' : (specsEntries[2]?.[0]?.slice(0, 10) || 'Spec 3');

  return (
    <div
      className="card"
      onClick={() => onOpenDetail(currentCode)}
      data-go={currentCode}
    >
      {/* Media Column (inspire.html 1.15fr proportion) */}
      <div className="media">
        <div className="ph">
          <img
            className="m"
            src={getOptimizedImageUrl(largeImg, 'thumb')}
            alt={product.name}
            loading="eager"
            crossOrigin="anonymous"
          />
        </div>
        {allImages.length > 1 && (
          <div className="th">
            {/* Visible thumbnails in web */}
            {visibleThumbs.map((idx) => (
              <img
                key={idx}
                src={getOptimizedImageUrl(allImages[idx], 'thumb')}
                alt=""
                loading="eager"
                crossOrigin="anonymous"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImgIdx(idx);
                }}
                style={{ cursor: 'pointer' }}
                title="Click to preview in card"
              />
            ))}

            {/* Web overflow count div: hides extra cards behind count badge */}
            {overflowCount > 0 && (
              <div
                className="th-count-badge"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDetail(currentCode);
                }}
                title={`+${overflowCount} more views. Click to open detail.`}
              >
                +{overflowCount}
              </div>
            )}

            {/* Overflow thumbnails: hidden on web via .th-overflow-img, revealed in PDF as wrap cards */}
            {overflowThumbs.map((idx) => (
              <img
                key={idx}
                src={getOptimizedImageUrl(allImages[idx], 'thumb')}
                alt=""
                loading="eager"
                crossOrigin="anonymous"
                className="th-overflow-img"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImgIdx(idx);
                }}
                style={{ cursor: 'pointer' }}
                title="Click to preview in card"
              />
            ))}
          </div>
        )}
      </div>

      {/* Text / Information Column (inspire.html editorial scale) */}
      <div className="tx">
        <p className="k">{product.type}</p>
        <h3>{product.name}</h3>
        <p className="k">
          Code {currentCode}
          {product.seriesCodeRange && (
            <span style={{ marginLeft: '0.6em', opacity: 0.85 }}>
              ({product.seriesCodeRange})
            </span>
          )}
        </p>

        {product.summary && (
          <p className="tx-summary">{product.summary}</p>
        )}

        {product.features && product.features.length > 0 && (
          <ul>
            {product.features.slice(0, 3).map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        )}

        <div className="sp">
          <div>
            <span className="k">{boreLabel}</span>
            <b title={bore}>{bore}</b>
          </div>
          <div>
            <span className="k">{odLabel}</span>
            <b title={od}>{od}</b>
          </div>
          <div>
            <span className="k">{widthLabel}</span>
            <b title={width}>{width}</b>
          </div>
        </div>

        <div className="pr">
          <div>
            <span className="main-price">
              {currency}{currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="gst-note">
              + 18% GST (₹{(currentPrice * 1.18).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} incl.)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
