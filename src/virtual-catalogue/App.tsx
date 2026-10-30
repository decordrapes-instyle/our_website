import React, { useState, useEffect } from 'react';
import { Catalogue, Product } from './types/catalogue';
import { getCatalogues, getProducts } from './services/rtdb';
import { IndexPage } from './pages/IndexPage';
import { CataloguePage } from './pages/CataloguePage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { AdminPage } from './pages/admin/AdminPage';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import Spinner from '../components/common/Spinner';

export const App: React.FC = () => {
  const [catalogues, setCatalogues] = useState<Catalogue[]>([]);
  const [activeCatalogueSlug, setActiveCatalogueSlug] = useState<string>('home');
  const [activeProductCode, setActiveProductCode] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Load initial data
  const loadData = async () => {
    try {
      setLoading(true);
      const cats = await getCatalogues();
      setCatalogues(cats);

      // Collect all products for global index search
      const allProds: Product[] = [];
      for (const cat of cats) {
        const prods = await getProducts(cat.id);
        allProds.push(...prods);
      }
      setAllProducts(allProds);

      if (activeCatalogueSlug !== 'home' && activeCatalogueSlug !== 'admin') {
        const currentCat = cats.find((c) => c.slug === activeCatalogueSlug);
        if (currentCat) {
          const prods = await getProducts(currentCat.id);
          setProducts(prods);
        }
      }
    } catch (err) {
      console.error('Error loading catalogues:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.body.classList.add('catalogue-active');
    return () => {
      document.body.classList.remove('catalogue-active');
    };
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  // Update category products when category changes
  useEffect(() => {
    if (activeCatalogueSlug === 'home' || activeCatalogueSlug === 'admin') {
      setProducts([]);
      return;
    }
    const currentCat = catalogues.find((c) => c.slug === activeCatalogueSlug);
    if (currentCat) {
      getProducts(currentCat.id).then(setProducts);
    }
  }, [activeCatalogueSlug, catalogues]);

  // URL hash sync (#/ or #/admin or #/c/slug or #/c/slug/p/code)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;

      if (hash === '#/admin') {
        setActiveCatalogueSlug('admin');
        setActiveProductCode(null);
        return;
      }

      const detailMatch = hash.match(/^#\/c\/([^/]+)\/p\/(.+)$/);
      if (detailMatch) {
        setActiveCatalogueSlug(detailMatch[1]);
        setActiveProductCode(decodeURIComponent(detailMatch[2]));
        return;
      }

      const catMatch = hash.match(/^#\/c\/([^/]+)$/);
      if (catMatch) {
        setActiveCatalogueSlug(catMatch[1]);
        setActiveProductCode(null);
        return;
      }

      // Default to index
      setActiveCatalogueSlug('home');
      setActiveProductCode(null);
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);

    if (window.location.hash) {
      handleHashChange();
    }

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  // Navigate using View Transitions API
  const navigateTo = (slug: string, code?: string | null) => {
    const run = () => {
      setActiveCatalogueSlug(slug);
      setActiveProductCode(code || null);
      if (slug === 'admin') {
        window.location.hash = '#/admin';
      } else if (code) {
        window.location.hash = `#/c/${slug}/p/${encodeURIComponent(code)}`;
      } else if (slug !== 'home') {
        window.location.hash = `#/c/${slug}`;
      } else {
        window.location.hash = '#/';
      }
      window.scrollTo(0, 0);
    };

    const doc = document as unknown as { startViewTransition?: (cb: () => void) => void };
    if (doc.startViewTransition) {
      doc.startViewTransition(run);
    } else {
      run();
    }
  };

  // Keyboard navigation & Admin shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        navigateTo(activeCatalogueSlug === 'admin' ? 'home' : 'admin');
      } else if (e.key === 'Escape') {
        if (activeProductCode) navigateTo(activeCatalogueSlug, null);
        else if (activeCatalogueSlug !== 'home') navigateTo('home');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeProductCode, activeCatalogueSlug]);

  const currentCatalogue = catalogues.find((c) => c.slug === activeCatalogueSlug);
  const activeProduct = activeProductCode
    ? allProducts.find(
        (p) =>
          p.primaryCode === activeProductCode ||
          p.variants?.some((v) => v.code === activeProductCode)
      ) || products.find((p) => p.primaryCode === activeProductCode)
    : null;

  return (
    <div id="virtual-catalogue-root" className="min-h-screen">
      <ThemeProvider>
        <ToastProvider>
        {loading ? (
          <div className="min-h-screen flex items-center justify-center">
            <Spinner fullScreen={false} text="Loading catalogue..." size="lg" />
          </div>
        ) : activeCatalogueSlug === 'admin' ? (
          /* Standalone Non-Modal Admin Page */
          <AdminPage
            catalogues={catalogues}
            products={allProducts}
            onRefresh={loadData}
            onExit={() => navigateTo('home')}
          />
        ) : activeProductCode && activeProduct && currentCatalogue ? (
          /* Route 3: A4 Detail View strictly from inspire.html */
          <ProductDetailPage
            product={activeProduct}
            catalogue={currentCatalogue}
            onBack={() => navigateTo(activeCatalogueSlug, null)}
          />
        ) : activeCatalogueSlug !== 'home' && currentCatalogue ? (
          /* Route 2: Category A4 Virtual Sheets strictly from inspire.html */
          <CataloguePage
            catalogue={currentCatalogue}
            products={products}
            onOpenDetail={(code) => navigateTo(activeCatalogueSlug, code)}
            onGoHome={() => navigateTo('home')}
          />
        ) : (
          /* Route 1: Clean Minimal Index Page (Brand + Search + Category Cards) */
          <div className="flex flex-col min-h-screen justify-between bg-desk dark:bg-zinc-950 text-ink dark:text-zinc-100 transition-colors">
            <IndexPage
              catalogues={catalogues}
              allProducts={allProducts}
              onSelectCatalogue={(slug) => navigateTo(slug)}
              onOpenProduct={(code) => {
                const target = allProducts.find(
                  (p) => p.primaryCode === code || p.variants?.some((v) => v.code === code)
                );
                const parentCat = catalogues.find((c) => c.id === target?.catalogueId);
                navigateTo(parentCat?.slug || 'bearings', code);
              }}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              brandName="Decor Drapes Instyle"
            />
          </div>
        )}
      </ToastProvider>
    </ThemeProvider>
    </div>
  );
};

export default App;
