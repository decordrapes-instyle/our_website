import React, { useMemo, useEffect } from 'react';
import { Product, Catalogue } from '../types/catalogue';
import { getOptimizedImageUrl } from '../utils/image';
import { updateOgMetadata } from '../utils/seo';

interface ProductDetailPageProps {
  product: Product;
  catalogue: Catalogue;
  onBack: () => void;
}

interface GalleryItem {
  code: string;
  name: string;
  image: string;
  price: number;
  specs: Record<string, string>;
  features: string[];
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  catalogue,
  onBack,
}) => {
  const currency = catalogue.currency || '₹';
  const currentPrice = product.price;

  // Aggregate all series / product images paired with their specific codes & metadata
  const galleryItems: GalleryItem[] = useMemo(() => {
    if (product.variants && product.variants.length > 0) {
      return product.variants.map((v, idx) => ({
        code: v.code,
        name: v.name || `${product.name} (${v.code})`,
        image: v.images?.[0] || product.images?.[idx] || '',
        price: v.price ?? product.price,
        specs: v.specs || product.specs || {},
        features: product.features || [],
      })).filter((item) => Boolean(item.image));
    }

    if (product.images && product.images.length > 0) {
      return product.images.map((img, idx) => ({
        code: idx === 0 ? product.primaryCode : `${product.primaryCode}-${idx + 1}`,
        name: idx === 0 ? product.name : `${product.name} (View ${idx + 1})`,
        image: img,
        price: product.price,
        specs: product.specs || {},
        features: product.features || [],
      }));
    }

    return [{
      code: product.primaryCode,
      name: product.name,
      image: '',
      price: product.price,
      specs: product.specs || {},
      features: product.features || [],
    }];
  }, [product]);

  const firstItem = galleryItems[0] || {
    code: product.primaryCode,
    name: product.name,
    image: '',
    price: product.price,
    specs: {},
    features: [],
  };
  const secondaryItems = galleryItems.slice(1);

  // Split secondary items into groups of 2 for subsequent A4 showcase sheets (Top & Bottom halves)
  const galleryGroups: GalleryItem[][] = useMemo(() => {
    const groups: GalleryItem[][] = [];
    for (let i = 0; i < secondaryItems.length; i += 2) {
      groups.push(secondaryItems.slice(i, i + 2));
    }
    return groups;
  }, [secondaryItems]);

  const totalSheets = 1 + galleryGroups.length;

  useEffect(() => {
    updateOgMetadata({
      title: `${product.name} (${product.primaryCode}) | ${catalogue.brand}`,
      description: `${product.summary} Available from ${currency}${currentPrice.toFixed(2)}.`,
      image: firstItem.image,
    });
  }, [product, currentPrice, firstItem.image, catalogue, currency]);

  // Clean specification rows for Sheet 1
  const rows: [string, string][] = [
    ['Base Price (Excl. GST)', `${currency}${currentPrice.toFixed(2)}`],
    ['Applicable GST (18%)', `${currency}${(currentPrice * 0.18).toFixed(2)}`],
    ['Total Price (Incl. GST)', `${currency}${(currentPrice * 1.18).toFixed(2)}`],
    ...Object.entries(product.specs || {}).filter(([k]) => {
      const lower = k.toLowerCase();
      if (lower.includes('series code') || lower.includes('variant') || lower.includes('serial slot')) {
        return false;
      }
      return true;
    }),
  ];

  return (
    <div id="detail">
      {/* Back button strictly from inspire.html */}
      <button
        type="button"
        className="back"
        onClick={onBack}
        data-tip="Back to catalogue"
        aria-label="Back to catalogue"
      >
        <svg className="i" viewBox="0 0 24 24">
          <path d="M19 12H5M11 6l-6 6 6 6" />
        </svg>
      </button>

      <main className="pages">
        {/* ===== SHEET 1: Overview, First Image & Specs ===== */}
        <section className="sheet dsheet">
          <div className="in">
            {/* Header */}
            <div className="hd">
              <span>{catalogue.brand}</span>
              <span>{catalogue.title}</span>
            </div>

            {/* Title, Category, Code, Price, and Action Button */}
            <div className="dh">
              <div>
                <p className="k">{product.type}</p>
                <h1>{product.name}</h1>
                <p className="k">
                  Code {product.primaryCode}
                  {product.seriesCodeRange && (
                    <span style={{ marginLeft: '0.6em', opacity: 0.85 }}>
                      (Series: {product.seriesCodeRange})
                    </span>
                  )}
                </p>
              </div>

              <div className="r">
                <div>
                  <p className="pr">
                    {currency}{currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="gst-line">
                    + 18% GST (Total: {currency}{(currentPrice * 1.18).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} incl.)
                  </p>
                </div>
              </div>
            </div>

            {/* First Image with Code Badge */}
            <div className="hero">
              {firstItem.code && (
                <div className="series-code-badge">
                  {firstItem.code}
                </div>
              )}
              <img
                src={getOptimizedImageUrl(firstItem.image, 'detail')}
                width="1600"
                height="1200"
                loading="eager"
                decoding="async"
                alt={`${product.name} - ${firstItem.code}`}
              />
            </div>

            {/* Summary, Chips & Specification List */}
            <div className="two">
              <div className="two-desc">
                <span className="overview-label">Product Overview</span>
                <p className="desc-body">{product.summary}</p>
                {product.features && product.features.length > 0 && (
                  <ul className="chips">
                    {product.features.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="two-specs">
                <span className="specs-label">Technical Specifications</span>
                <dl className="s">
                  {rows.slice(0, 10).map(([key, val], idx) => (
                    <div key={idx}>
                      <dt>{key}</dt>
                      <dd>{String(val)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            {/* Footer */}
            <div className="ft">
              <span>{product.primaryCode}{product.seriesCodeRange ? ` (${product.seriesCodeRange})` : ''}</span>
              <span>1 / {totalSheets}</span>
            </div>
          </div>
        </section>

        {/* ===== SHEET 2+: Stacked 2-Card Showcase (Top & Bottom Halves, Zero Wasted Space) ===== */}
        {galleryGroups.map((group, n) => (
          <section key={n} className="sheet dsheet">
            <div className="in">
              {/* Header */}
              <div className="hd">
                <span>{catalogue.brand}</span>
                <span>{catalogue.title}</span>
              </div>

              {/* Two Stacked Horizontal Cards filling the full A4 height */}
              <div className="gallery-spread">
                {group.map((item, cellIdx) => {
                  const itemPrice = item.price;
                  const displaySpecs = Object.entries(item.specs || {}).filter(([k]) => {
                    const lower = k.toLowerCase();
                    return !lower.includes('series code') && !lower.includes('serial slot');
                  });

                  return (
                    <div key={cellIdx} className="gallery-card">
                      {/* Full-width landscape image filling half A4 */}
                      <div className="gallery-card-media">
                        {item.code && (
                          <div className="series-code-badge">
                            {item.code}
                          </div>
                        )}
                        <img
                          src={getOptimizedImageUrl(item.image, 'detail')}
                          width="1600"
                          height="900"
                          loading="lazy"
                          decoding="async"
                          alt={`${item.name} - ${item.code}`}
                        />
                      </div>

                      {/* Compact info bar below image: name + specs + price */}
                      <div className="gallery-card-info">
                        <h2>{item.name}</h2>

                        {displaySpecs.length > 0 && (
                          <div className="gallery-card-specs">
                            {displaySpecs.slice(0, 3).map(([k, v]) => (
                              <div key={k} className="gallery-spec-row">
                                <span className="k">{k}</span>
                                <b>{v}</b>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="gallery-card-price">
                          <span className="main-pr">
                            {currency}{itemPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span className="sub-pr">
                            +18% GST
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="ft">
                <span>{product.primaryCode}{product.seriesCodeRange ? ` (${product.seriesCodeRange})` : ''}</span>
                <span>
                  {n + 2} / {totalSheets}
                </span>
              </div>
            </div>
          </section>
        ))}
      </main>
    </div>
  );
};
