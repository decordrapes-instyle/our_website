import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Catalogue, Product } from '../types/catalogue';
import { updateOgMetadata } from '../utils/seo';
import { getOptimizedImageUrl } from '../utils/image';
import { Search, ArrowRight } from 'lucide-react';

interface IndexPageProps {
  catalogues: Catalogue[];
  allProducts: Product[];
  onSelectCatalogue: (slug: string) => void;
  onOpenProduct: (code: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  brandName?: string;
}

export const IndexPage: React.FC<IndexPageProps> = ({
  catalogues,
  allProducts,
  onSelectCatalogue,
  onOpenProduct,
  searchQuery,
  onSearchChange,
  brandName = 'Decor Drapes Instyle',
}) => {
  const query = searchQuery.trim().toLowerCase();
  const inputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    updateOgMetadata({
      title: `${brandName} | Product Catalogue`,
      description: 'Precision architectural catalogue. Browse series and collections in printable A4 format.',
      image: catalogues[0]?.coverImage || '/logo.svg',
    });
  }, [brandName, catalogues]);

  const matchingCatalogues = useMemo(() => {
    return catalogues
      .map((cat) => {
        const prods = allProducts.filter((p) => p.catalogueId === cat.id);
        if (!query) {
          return { catalogue: cat, matchingProducts: prods, totalCount: prods.length };
        }
        const filtered = prods.filter((p) => {
          const matchName = p.name.toLowerCase().includes(query);
          const matchCode = p.primaryCode.toLowerCase().includes(query);
          const matchRange = p.seriesCodeRange?.toLowerCase().includes(query);
          const matchType = p.type?.toLowerCase().includes(query);
          const matchVariants = p.variants?.some((v) =>
            v.code.toLowerCase().includes(query) || (v.name && v.name.toLowerCase().includes(query))
          );
          const matchCat =
            cat.title.toLowerCase().includes(query) || cat.subtitle.toLowerCase().includes(query);
          return matchName || matchCode || matchRange || matchType || matchVariants || matchCat;
        });
        return { catalogue: cat, matchingProducts: filtered, totalCount: prods.length };
      })
      .filter((group) => !query || group.matchingProducts.length > 0);
  }, [catalogues, allProducts, query]);

  const totalMatchingItems = useMemo(() => {
    if (!query) return 0;
    return matchingCatalogues.reduce((sum, g) => sum + g.matchingProducts.length, 0);
  }, [matchingCatalogues, query]);

  return (
    <div
      className={`min-h-screen flex flex-col bg-gray-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors relative overflow-hidden ${
        mounted ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ transition: 'opacity 0.3s ease' }}
    >
      {/* Ambient background glows matching website Hero */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full bg-sky-400/5 dark:bg-sky-400/10 blur-3xl" />
      <div className="pointer-events-none absolute top-40 right-10 w-[350px] h-[350px] rounded-full bg-amber-400/5 dark:bg-amber-400/10 blur-3xl" />

      {/* Hero / Header Section matching website aesthetic */}
      <header className="pt-8 sm:pt-12 md:pt-14 pb-8 sm:pb-10 px-4 text-center select-none flex flex-col items-center relative z-10">
        {/* Kicker Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-neutral-200/90 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md shadow-xs mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-600 dark:text-neutral-400">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span>Virtual Catalogue · Architectural Collections</span>
        </div>

        {/* Heading with Playfair Display serif italic accent */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-light tracking-tight text-neutral-950 dark:text-white max-w-3xl leading-[1.15]">
          Explore Our <span className="font-serif italic font-normal text-amber-600 dark:text-amber-400">Architectural Series</span>
        </h1>

        {/* Subtitle */}
        <p className="mt-3 sm:mt-4 text-sm sm:text-base text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto leading-relaxed">
          Browse custom roller blinds, zebra shades, fabrics, and bearing assemblies formatted in printable A4 presentation sheets.
        </p>

        {/* Glassmorphism Search Bar */}
        <div className="w-full max-w-md mx-auto mt-6">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 dark:text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by series, code, or name..."
              className="w-full bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md text-neutral-900 dark:text-neutral-100 text-xs sm:text-sm rounded-full pl-11 pr-20 py-3 border border-neutral-200 dark:border-neutral-800 focus:border-amber-500 dark:focus:border-amber-400 focus:ring-4 focus:ring-amber-500/10 focus:outline-none shadow-xs hover:shadow-md transition-all placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {query && (
            <p className="mt-2.5 text-center text-xs text-neutral-500 dark:text-neutral-400 font-mono">
              Found <span className="font-semibold text-neutral-900 dark:text-neutral-200">{totalMatchingItems}</span> matching item{totalMatchingItems === 1 ? '' : 's'} in{' '}
              <span className="font-semibold text-neutral-900 dark:text-neutral-200">{matchingCatalogues.length}</span> categor{matchingCatalogues.length === 1 ? 'y' : 'ies'}
            </p>
          )}
        </div>
      </header>

      {/* Main Content: Luxury Category Cards */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pb-16 sm:pb-24 relative z-10">
        {matchingCatalogues.length === 0 ? (
          <div className="text-center py-16 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm rounded-3xl border border-neutral-200/80 dark:border-neutral-800 p-8 max-w-md mx-auto shadow-sm">
            <p className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
              No matching products found
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-5">
              Try searching with another code, series name, or keyword.
            </p>
            <button
              onClick={() => onSearchChange('')}
              className="px-5 py-2 text-xs font-semibold rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 shadow-sm transition-opacity"
            >
              Reset Search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {matchingCatalogues.map(({ catalogue: cat, matchingProducts, totalCount }, idx) => (
              <CatalogueCard
                key={cat.id}
                cat={cat}
                totalCount={totalCount}
                allCategoryProducts={allProducts.filter((p) => p.catalogueId === cat.id)}
                matchingProducts={matchingProducts}
                query={query}
                index={idx}
                onSelectCatalogue={onSelectCatalogue}
                onOpenProduct={onOpenProduct}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

/* ── Luxury Category Card with Subcategory Avatars ── */
interface CatalogueCardProps {
  cat: Catalogue;
  totalCount: number;
  allCategoryProducts: Product[];
  matchingProducts: Product[];
  query: string;
  index: number;
  onSelectCatalogue: (slug: string) => void;
  onOpenProduct: (code: string) => void;
}

interface SubcategoryAvatar {
  id: string;
  name: string;
  code: string;
  image: string;
}

const CatalogueCard: React.FC<CatalogueCardProps> = ({
  cat,
  totalCount,
  allCategoryProducts,
  matchingProducts,
  query,
  index,
  onSelectCatalogue,
  onOpenProduct,
}) => {
  const previewAvatars = useMemo<SubcategoryAvatar[]>(() => {
    const items: SubcategoryAvatar[] = [];
    const seenImages = new Set<string>();

    for (const p of allCategoryProducts) {
      if (p.isSeries && p.variants && p.variants.length > 0) {
        for (const v of p.variants) {
          const img = v.images?.[0] || p.images?.[0];
          if (img && !seenImages.has(img)) {
            seenImages.add(img);
            items.push({
              id: v.code || `${p.id}_${v.name}`,
              name: v.name || v.code,
              code: v.code,
              image: img,
            });
          }
        }
      } else {
        const img = p.images?.[0];
        if (img && !seenImages.has(img)) {
          seenImages.add(img);
          items.push({
            id: p.id,
            name: p.name,
            code: p.primaryCode,
            image: img,
          });
        }
      }
    }

    if (items.length === 0 && cat.coverImage) {
      items.push({
        id: cat.id,
        name: cat.title,
        code: cat.slug,
        image: cat.coverImage,
      });
    }

    return items;
  }, [allCategoryProducts, cat]);

  return (
    <div
      className="group relative flex flex-col justify-between p-5 sm:p-6 lg:p-6 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm border border-neutral-200/80 dark:border-neutral-800 hover:border-amber-500/50 dark:hover:border-amber-500/40 shadow-xs hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 cursor-pointer text-left"
      onClick={() => onSelectCatalogue(cat.slug)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelectCatalogue(cat.slug)}
      aria-label={`Open ${cat.title} catalogue`}
    >
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            <span className="font-bold text-neutral-800 dark:text-neutral-300">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span>/</span>
            <span className="truncate max-w-[110px] sm:max-w-[160px]">
              {cat.brand || 'Series'}
            </span>
          </span>

          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200/60 dark:border-neutral-700/60 whitespace-nowrap">
            {totalCount}&thinsp;{totalCount === 1 ? 'item' : 'items'}
          </span>
        </div>

        {/* Title */}
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors leading-snug line-clamp-2">
          {cat.title}
        </h2>

        {/* Subtitle */}
        <p className="mt-2 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed line-clamp-2">
          {cat.subtitle}
        </p>
      </div>

      {/* Bottom section: Avatars & Explore */}
      <div className="mt-5 pt-4 border-t border-neutral-100 dark:border-neutral-800/80">
        <div className="flex items-center justify-between gap-2.5">
          {/* Avatar Stack */}
          <div className="flex items-center gap-2 min-w-0">
            {previewAvatars.length > 0 && (
              <div className="flex -space-x-2 overflow-hidden py-0.5 flex-shrink-0">
                {previewAvatars.slice(0, 3).map((av, i) => (
                  <div
                    key={av.id || i}
                    title={`${av.name} (${av.code})`}
                    className="relative inline-block w-8 h-8 rounded-full ring-2 ring-white dark:ring-neutral-900 bg-neutral-100 dark:bg-neutral-800 shadow-xs overflow-hidden flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
                    style={{ zIndex: 10 - i }}
                  >
                    <img
                      src={getOptimizedImageUrl(av.image, 'thumb')}
                      alt={av.name}
                      className="w-full h-full object-contain p-1"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                ))}
                {previewAvatars.length > 3 && (
                  <div
                    className="relative inline-flex items-center justify-center w-8 h-8 rounded-full ring-2 ring-white dark:ring-neutral-900 bg-neutral-100 dark:bg-neutral-800 text-[10px] font-mono font-semibold text-neutral-600 dark:text-neutral-400 shadow-xs flex-shrink-0"
                    style={{ zIndex: 5 }}
                    title={`${previewAvatars.length - 3} more models`}
                  >
                    +{previewAvatars.length - 3}
                  </div>
                )}
              </div>
            )}

            <div className="hidden sm:block lg:hidden xl:block text-left truncate">
              <span className="block text-xs font-medium text-neutral-800 dark:text-neutral-200 truncate">
                Subcategories
              </span>
              <span className="block text-[11px] text-neutral-400 dark:text-neutral-500 font-mono">
                {previewAvatars.length} preview{previewAvatars.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          {/* Action indicator */}
          <div className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors flex-shrink-0">
            <span>Explore A4</span>
            <ArrowRight className="w-3.5 h-3.5 inline-block transition-transform duration-200 group-hover:translate-x-1" />
          </div>
        </div>

        {/* Search match preview when query is active */}
        {query && matchingProducts.length > 0 && (
          <div
            className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800/80 space-y-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-1">
              Matches ({matchingProducts.length})
            </p>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-0.5">
              {matchingProducts.slice(0, 3).map((p) => (
                <div
                  key={p.id}
                  onClick={() => onOpenProduct(p.primaryCode)}
                  className="p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 hover:bg-white dark:hover:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-700/60 flex items-center justify-between text-xs cursor-pointer transition-colors"
                >
                  <div className="truncate mr-2">
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">{p.name}</span>
                  </div>
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100 flex-shrink-0 font-mono text-xs">
                    {p.currency || '₹'}{p.price.toFixed(0)}
                  </span>
                </div>
              ))}
              {matchingProducts.length > 3 && (
                <p className="text-[10px] text-neutral-400 dark:text-neutral-500 text-right pt-0.5 font-mono">
                  +{matchingProducts.length - 3} more
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
