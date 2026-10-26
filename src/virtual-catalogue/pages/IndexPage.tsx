import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Catalogue, Product } from '../types/catalogue';
import { updateOgMetadata } from '../utils/seo';
import { getOptimizedImageUrl } from '../utils/image';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Search, ArrowRight, ArrowLeft } from 'lucide-react';

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
  const { isDark, toggleDark } = useTheme();
  const query = searchQuery.trim().toLowerCase();
  const inputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    updateOgMetadata({
      title: `${brandName} | Product Catalogue`,
      description: 'Precision catalogue. Browse series and collections.',
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
      className={`min-h-screen flex flex-col bg-desk dark:bg-zinc-950 text-ink dark:text-zinc-100 transition-colors relative ${
        mounted ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ transition: 'opacity 0.4s ease' }}
    >
      {/* Top Left Return Link */}
      <div className="absolute top-4 sm:top-6 left-4 sm:left-6 z-10 flex items-center gap-3">
        <a
          href="/products"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur border border-line dark:border-zinc-800 text-xs font-semibold text-muted dark:text-zinc-400 hover:text-ink dark:hover:text-zinc-100 shadow-sm transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit to Products</span>
        </a>
      </div>

      {/* Top Controls */}
      <div className="absolute top-4 sm:top-6 right-4 sm:right-6 z-10 flex items-center gap-3">
        <button
          onClick={toggleDark}
          className="p-2 sm:p-2.5 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur border border-line dark:border-zinc-800 text-muted dark:text-zinc-400 hover:text-ink dark:hover:text-zinc-100 shadow-sm transition-all"
          title="Toggle Dark / Light Mode"
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* Hero / Logo Section */}
      <header className="pt-10 sm:pt-14 pb-5 sm:pb-8 px-4 text-center select-none flex flex-col items-center">
        {/* Brand Logo */}
        <div className="w-full max-w-xs sm:max-w-sm md:max-w-md flex justify-center mb-5 sm:mb-6">
          <img
            src="/logo.svg"
            alt={brandName}
            className="h-14 sm:h-20 md:h-24 w-auto max-w-full object-contain filter drop-shadow-sm"
          />
        </div>

        {/* Minimal Search Bar */}
        <div className="w-full max-w-md mx-auto">
          <div className="relative">
            <Search className="w-4 h-4 text-muted dark:text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by code, series, or name..."
              className="w-full bg-white dark:bg-zinc-900 text-ink dark:text-zinc-100 text-xs sm:text-sm rounded-full pl-10 sm:pl-11 pr-16 sm:pr-20 py-2.5 sm:py-3 border border-line dark:border-zinc-800 focus:border-ink dark:focus:border-zinc-500 focus:outline-none shadow-sm transition-all placeholder:text-muted dark:placeholder:text-zinc-600"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-[11px] sm:text-xs font-medium text-muted dark:text-zinc-400 hover:text-ink dark:hover:text-zinc-100 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-desk dark:bg-zinc-800 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {query && (
            <p className="mt-2.5 text-center text-[11px] sm:text-xs text-muted dark:text-zinc-500 font-mono">
              Found <span className="font-semibold text-ink dark:text-zinc-300">{totalMatchingItems}</span> matching item{totalMatchingItems === 1 ? '' : 's'} in{' '}
              <span className="font-semibold text-ink dark:text-zinc-300">{matchingCatalogues.length}</span> categor{matchingCatalogues.length === 1 ? 'y' : 'ies'}
            </p>
          )}
        </div>
      </header>

      {/* Main Content: Double Card Layout on Mobile & Desktop */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-2.5 sm:px-6 md:px-8 pb-12 sm:pb-20">
        {matchingCatalogues.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-zinc-900/60 rounded-2xl border border-line dark:border-zinc-800 p-6 sm:p-8 max-w-md mx-auto">
            <p className="text-sm sm:text-base font-semibold text-ink dark:text-zinc-200 mb-1">
              No matching products found
            </p>
            <p className="text-xs text-muted dark:text-zinc-500 mb-4">
              Try searching with another code, series name, or keyword.
            </p>
            <button
              onClick={() => onSearchChange('')}
              className="px-4 py-1.5 text-xs font-semibold rounded-full bg-ink text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition-opacity"
            >
              Reset Search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:gap-6">
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

/* ── Mobile-Friendly Category Card with Subcategory Avatars ── */
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
  // Extract subcategory / variant avatars belonging to this category
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
      className="group relative flex flex-col justify-between p-3 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl bg-white dark:bg-zinc-900/90 border border-line dark:border-zinc-800/80 hover:border-ink dark:hover:border-zinc-600 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer text-left active:scale-[0.99]"
      onClick={() => onSelectCatalogue(cat.slug)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelectCatalogue(cat.slug)}
      aria-label={`Open ${cat.title} catalogue`}
    >
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between gap-1 mb-2 sm:mb-3">
          <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-muted dark:text-zinc-500">
            <span className="font-bold text-ink dark:text-zinc-300">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="hidden sm:inline">/</span>
            <span className="truncate max-w-[80px] sm:max-w-[160px] hidden sm:inline">
              {cat.brand || 'Series'}
            </span>
          </span>

          <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[11px] font-mono font-medium bg-desk dark:bg-zinc-800 text-muted dark:text-zinc-400 border border-line dark:border-zinc-700/60 whitespace-nowrap">
            {totalCount}&thinsp;{totalCount === 1 ? 'item' : 'items'}
          </span>
        </div>

        {/* Title */}
        <h2 className="text-xs sm:text-base md:text-xl font-bold tracking-tight text-ink dark:text-zinc-100 group-hover:text-ink dark:group-hover:text-white transition-colors leading-snug line-clamp-2">
          {cat.title}
        </h2>

        {/* Subtitle (compact on larger screens, hidden on small mobile to maintain clean 2-col balance) */}
        <p className="hidden sm:block mt-1 sm:mt-2 text-xs sm:text-sm text-muted dark:text-zinc-400 leading-relaxed line-clamp-2">
          {cat.subtitle}
        </p>
      </div>

      {/* Bottom section: Avatars & Explore */}
      <div className="mt-3 sm:mt-5 pt-2.5 sm:pt-4 border-t border-line/60 dark:border-zinc-800/60">
        <div className="flex items-center justify-between gap-1 sm:gap-3">
          {/* Avatar Stack */}
          <div className="flex items-center gap-2 min-w-0">
            {previewAvatars.length > 0 && (
              <div className="flex -space-x-2 sm:-space-x-2.5 overflow-hidden py-0.5 flex-shrink-0">
                {previewAvatars.slice(0, 3).map((av, i) => (
                  <div
                    key={av.id || i}
                    title={`${av.name} (${av.code})`}
                    className="relative inline-block w-6 h-6 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full ring-2 ring-white dark:ring-zinc-900 bg-desk dark:bg-zinc-800 shadow-sm overflow-hidden flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
                    style={{ zIndex: 10 - i }}
                  >
                    <img
                      src={getOptimizedImageUrl(av.image, 'thumb')}
                      alt={av.name}
                      className="w-full h-full object-contain p-0.5 sm:p-1"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                ))}
                {previewAvatars.length > 3 && (
                  <div
                    className="relative inline-flex items-center justify-center w-6 h-6 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full ring-2 ring-white dark:ring-zinc-900 bg-desk dark:bg-zinc-800 text-[8px] sm:text-xs font-mono font-semibold text-muted dark:text-zinc-400 shadow-sm flex-shrink-0"
                    style={{ zIndex: 5 }}
                    title={`${previewAvatars.length - 3} more models`}
                  >
                    +{previewAvatars.length - 3}
                  </div>
                )}
              </div>
            )}

            <div className="hidden md:block text-left truncate">
              <span className="block text-[11px] font-medium text-ink dark:text-zinc-300 truncate">
                Subcategories
              </span>
              <span className="block text-[10px] text-muted dark:text-zinc-500 font-mono">
                {previewAvatars.length} preview{previewAvatars.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          {/* Action indicator */}
          <div className="flex items-center gap-1 text-[10px] sm:text-xs font-semibold text-ink dark:text-zinc-200 group-hover:text-ink dark:group-hover:text-white flex-shrink-0">
            <span className="hidden sm:inline tracking-wide">Explore</span>
            <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 inline-block transition-transform duration-200 group-hover:translate-x-1" />
          </div>
        </div>

        {/* Search match preview when query is active */}
        {query && matchingProducts.length > 0 && (
          <div
            className="mt-2.5 sm:mt-3 pt-2.5 sm:pt-3 border-t border-line dark:border-zinc-800/80 space-y-1"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[9px] sm:text-[10px] font-mono uppercase tracking-widest text-muted dark:text-zinc-500 mb-1">
              Matches ({matchingProducts.length})
            </p>
            <div className="space-y-1 max-h-36 overflow-y-auto pr-0.5">
              {matchingProducts.slice(0, 3).map((p) => (
                <div
                  key={p.id}
                  onClick={() => onOpenProduct(p.primaryCode)}
                  className="p-1.5 sm:p-2 rounded bg-desk/70 dark:bg-zinc-800/70 hover:bg-white dark:hover:bg-zinc-800 border border-line dark:border-zinc-700/60 flex items-center justify-between text-[10px] sm:text-xs cursor-pointer transition-colors"
                >
                  <div className="truncate mr-1">
                    <span className="font-semibold text-ink dark:text-zinc-100">{p.name}</span>
                  </div>
                  <span className="font-semibold text-ink dark:text-zinc-100 flex-shrink-0 font-mono text-[9px] sm:text-[11px]">
                    {p.currency || '₹'}{p.price.toFixed(0)}
                  </span>
                </div>
              ))}
              {matchingProducts.length > 3 && (
                <p className="text-[9px] text-muted dark:text-zinc-500 text-right pt-0.5 font-mono">
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
