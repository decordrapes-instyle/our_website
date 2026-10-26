import { useState, useEffect, useMemo, useContext, FormEvent } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  X,
  Printer,
  Copy,
  Check,
  ArrowLeft,
  Sun,
  Moon,
  MessageCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ref, onValue, database } from '../config/firebase';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { ThemeContext } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { WarrantyRecord, WarrantyProductItem } from '../types/warranty';

const DAILY_SEARCH_LIMIT = 10;

// Fallback reference data matching user JSON
const SAMPLE_WARRANTY: WarrantyRecord = {
  id: "-Oi87abC123def456",
  orderNumber: "DDI-2026-042",
  warrantyNumber: "87654B98",
  quotationId: "-Nxyz890abc123",

  customer: {
    name: "Rajesh Kumar",
    mobile: "+91 98765 43210",
    email: "rajesh.kumar@example.com",
    address: "Flat 402, Sunshine Heights, MG Road, Bengaluru, Karnataka - 560001",
    gstin: "29AAAAA0000A1Z5",
  },

  warranty: {
    startDate: "2026-10-26",
    endDate: "2029-10-25",
    durationMonths: 36,
    warrantyPeriodLabel: "3 Years",
    status: "active",
    termsAndConditions:
      "Warranty covers manufacturing defects, motor mechanism faults, and electronic drive failures. Physical abuse or water damage is excluded.",
  },

  products: [
    {
      id: "prod_1",
      productName: "Motorized Zebra Blind",
      productCode: "ZBR-MTR-004",
      productCategory: "Blinds",
      productSpecification:
        "Dimensions: 60\" W × 84\" H (sqft: 35) • Fabric: Charcoal Blackout • Motor: Somfy Altus 40 RTS",
      productImage:
        "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80",
      productSpecificWarranty: "5 Years on Somfy Motor, 3 Years on Fabric colorfastness",
      amount: 14500,
      gst: 18,
      gstAmount: 2610,
      totalAmount: 17110,
      startDate: "2026-10-26",
      endDate: "2031-10-25",
      warrantyPeriod: "5 Years",
    },
    {
      id: "prod_2",
      productName: "Heavy Duty Ripple Fold Curtain Track",
      productCode: "TRK-RPL-002",
      productCategory: "Tracks",
      productSpecification:
        "Length: 14 Running Feet • Color: Matte White • Runners: 60mm Spacing",
      productImage:
        "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=80",
      productSpecificWarranty: "3 Years on Track mechanism & smooth glide warranty",
      amount: 6300,
      gst: 18,
      gstAmount: 1134,
      totalAmount: 7434,
      startDate: "2026-10-26",
      endDate: "2029-10-25",
      warrantyPeriod: "3 Years",
    },
  ],

  summary: {
    totalProducts: 2,
    subTotal: 20800,
    totalGst: 3744,
    grandTotal: 24544,
  },

  metadata: {
    source: "quotation",
    createdAt: "2026-10-26T09:15:00.000Z",
    updatedAt: "2026-10-26T09:15:00.000Z",
    createdBy: "admin@decordrapes.com",
    notes: "Full home installation completed. Handover signoff received.",
  },
};

// Rate limiting helpers (10 searches per user per day via localStorage)
function getDailyUsage(): { date: string; count: number; history: string[] } {
  const today = new Date().toISOString().split('T')[0];
  try {
    const raw = localStorage.getItem('ddi_warranty_quota');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.date === today && typeof parsed.count === 'number') {
        return parsed;
      }
    }
  } catch {
    // Ignore storage errors
  }
  return { date: today, count: 0, history: [] };
}

function recordUsage(query: string): { allowed: boolean; remaining: number } {
  const usage = getDailyUsage();
  const cleanQ = query.trim().toLowerCase();

  // Re-searching identical query does not consume extra quota
  if (usage.history.includes(cleanQ)) {
    return { allowed: true, remaining: Math.max(0, DAILY_SEARCH_LIMIT - usage.count) };
  }

  if (usage.count >= DAILY_SEARCH_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  const newCount = usage.count + 1;
  const newHistory = [...usage.history, cleanQ];
  try {
    localStorage.setItem(
      'ddi_warranty_quota',
      JSON.stringify({ date: usage.date, count: newCount, history: newHistory })
    );
  } catch {
    // Ignore storage quota errors
  }

  return { allowed: true, remaining: Math.max(0, DAILY_SEARCH_LIMIT - newCount) };
}

interface MatchResult {
  warranty: WarrantyRecord;
  specificProduct?: WarrantyProductItem;
  matchedBy: 'product_id' | 'product_code' | 'order' | 'warranty' | 'general';
}

/**
 * Product Item Card with clean showcase image handling & price privacy
 */
function ProductItemCard({
  item,
  isCustomerOwner,
}: {
  item: WarrantyProductItem;
  isCustomerOwner: boolean;
}) {
  const [imageError, setImageError] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);

  // If product has valid image and didn't fail, show it. Otherwise skip cleanly.
  const hasValidImage = Boolean(item.productImage && item.productImage.trim() && !imageError);

  return (
    <div className="p-4 sm:p-5 transition-colors">
      <div className="flex flex-col md:flex-row gap-4 items-start">
        {/* Product Showcase Image: Only displayed when image exists; otherwise omitted */}
        {hasValidImage && (
          <div className="w-full sm:w-36 h-40 sm:h-36 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shrink-0 group relative">
            <img
              src={item.productImage}
              alt={item.productName}
              loading="lazy"
              onError={() => setImageError(true)}
              onClick={() => setShowLightbox(true)}
              className="w-full h-full object-cover object-center cursor-pointer group-hover:scale-105 transition-transform duration-300"
            />
            <span className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-mono backdrop-blur-xs select-none pointer-events-none">
              View
            </span>
          </div>
        )}

        {/* Product Information */}
        <div className="flex-1 min-w-0 w-full space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1.5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-neutral-900 dark:text-white text-base font-display">
                  {item.productName}
                </h3>
                {item.productCategory && (
                  <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 px-2 py-0.5 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
                    {item.productCategory}
                  </span>
                )}
              </div>
              <span className="text-xs font-mono text-neutral-400 block mt-1">
                Code: <strong className="text-neutral-700 dark:text-neutral-300 font-semibold">{item.productCode}</strong>
                {item.id && <span> • ID: {item.id}</span>}
              </span>
            </div>

            {/* Price: Strictly displayed ONLY if user is logged in with matching customer email */}
            {isCustomerOwner && item.totalAmount ? (
              <div className="text-left sm:text-right font-mono text-xs shrink-0">
                <span className="text-[10px] text-neutral-400 uppercase block font-sans">Price</span>
                <strong className="text-neutral-900 dark:text-white text-sm">
                  ₹{item.totalAmount.toLocaleString('en-IN')}
                </strong>
                {item.gst && (
                  <span className="text-neutral-400 block text-[10px]">
                    (₹{item.amount?.toLocaleString('en-IN')} + {item.gst}% GST)
                  </span>
                )}
              </div>
            ) : null}
          </div>

          {/* Product Specifications */}
          {item.productSpecification && (
            <p className="text-xs font-mono text-neutral-600 dark:text-neutral-400 leading-relaxed bg-neutral-50 dark:bg-neutral-900/60 p-3 rounded-lg border border-neutral-100 dark:border-neutral-800/60">
              {item.productSpecification}
            </p>
          )}

          {/* Product Specific Guarantee */}
          {item.productSpecificWarranty && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300 pt-0.5">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 font-medium text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Guarantee: {item.productSpecificWarranty}</span>
              </span>
              {item.warrantyPeriod && (
                <span className="font-mono text-neutral-400 text-[11px]">
                  ({item.warrantyPeriod})
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      {showLightbox && hasValidImage && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setShowLightbox(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            className="relative max-w-2xl max-h-[85vh] bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden p-2 border border-neutral-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={item.productImage}
              alt={item.productName}
              className="w-full h-auto max-h-[75vh] object-contain rounded-xl"
            />
            <div className="p-3 flex items-center justify-between text-xs font-mono text-neutral-400">
              <span className="text-neutral-800 dark:text-neutral-200 font-semibold">{item.productName}</span>
              <button
                type="button"
                onClick={() => setShowLightbox(false)}
                className="px-3 py-1 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:opacity-80"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Warranty() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = (searchParams.get('q') || searchParams.get('search') || '').trim();

  const [inputVal, setInputVal] = useState(urlQuery);
  const [submittedQuery, setSubmittedQuery] = useState(urlQuery);
  const [warranties, setWarranties] = useState<WarrantyRecord[]>([SAMPLE_WARRANTY]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [searchesLeft, setSearchesLeft] = useState<number>(DAILY_SEARCH_LIMIT);
  const [showAllProducts, setShowAllProducts] = useState(false);

  const { currentUser } = useAuth();
  const { resolvedTheme, setTheme } = useContext(ThemeContext);
  const isDark = resolvedTheme === 'dark';
  const toggleDark = () => setTheme(isDark ? 'light' : 'dark');

  const { get: getSetting } = useSiteSettings();
  const storeName = getSetting('store_name') || 'Decor Drapes Instyle';
  const supportPhone = getSetting('primary_phone') || '+91 98765 43210';

  // Initialize usage
  useEffect(() => {
    const usage = getDailyUsage();
    setSearchesLeft(Math.max(0, DAILY_SEARCH_LIMIT - usage.count));
    if (usage.count >= DAILY_SEARCH_LIMIT) {
      setLimitReached(true);
    }
  }, []);

  // Fetch real-time data from Firebase `warrantymanagement`
  useEffect(() => {
    try {
      const warrantyRef = ref(database, 'warrantymanagement');
      const unsub = onValue(
        warrantyRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.val();
            if (data && typeof data === 'object') {
              const list: WarrantyRecord[] = Object.entries(data).map(([key, val]: [string, any]) => ({
                ...val,
                id: val.id || key,
              }));
              const hasSample = list.some(
                (w) => w.orderNumber === SAMPLE_WARRANTY.orderNumber || w.warrantyNumber === SAMPLE_WARRANTY.warrantyNumber
              );
              setWarranties(hasSample ? list : [SAMPLE_WARRANTY, ...list]);
              return;
            }
          }
          setWarranties([SAMPLE_WARRANTY]);
        },
        () => {
          setWarranties([SAMPLE_WARRANTY]);
        }
      );
      return () => unsub();
    } catch {
      setWarranties([SAMPLE_WARRANTY]);
    }
  }, []);

  // Sync if URL query exists on direct arrival
  useEffect(() => {
    if (urlQuery && urlQuery !== submittedQuery) {
      const check = recordUsage(urlQuery);
      setSearchesLeft(check.remaining);
      if (!check.allowed) {
        setLimitReached(true);
        toast.error(`Daily limit reached (${DAILY_SEARCH_LIMIT} searches/day).`);
      } else {
        setSubmittedQuery(urlQuery);
        setInputVal(urlQuery);
      }
    }
  }, [urlQuery]);

  // Execute search & update URL
  const executeSearch = (queryToRun: string) => {
    const trimmed = queryToRun.trim();
    if (!trimmed) {
      setSubmittedQuery('');
      setShowAllProducts(false);
      setSearchParams({}, { replace: true });
      return;
    }

    const check = recordUsage(trimmed);
    setSearchesLeft(check.remaining);

    if (!check.allowed) {
      setLimitReached(true);
      toast.error(`Daily limit reached (${DAILY_SEARCH_LIMIT} searches/day).`);
      return;
    }

    setShowAllProducts(false);
    setSubmittedQuery(trimmed);
    setSearchParams({ q: trimmed }, { replace: true });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    executeSearch(inputVal);
  };

  const handleReset = () => {
    setInputVal('');
    setSubmittedQuery('');
    setShowAllProducts(false);
    setSearchParams({}, { replace: true });
  };

  // Find match with specific product discrimination
  const matchResult: MatchResult | null = useMemo(() => {
    if (!submittedQuery) return null;
    const q = submittedQuery.toLowerCase();
    const cleanAlphaNum = q.replace(/[^a-z0-9]/g, '');

    const check = (str?: string) => {
      if (!str) return false;
      const s = str.toLowerCase();
      if (s === q || s.includes(q)) return true;
      if (cleanAlphaNum && s.replace(/[^a-z0-9]/g, '').includes(cleanAlphaNum)) return true;
      return false;
    };

    for (const w of warranties) {
      // 1. Check exact product.id search first
      if (w.products && Array.isArray(w.products)) {
        const prodById = w.products.find(
          (p) => p.id && (p.id.toLowerCase() === q || p.id.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanAlphaNum)
        );
        if (prodById) {
          return { warranty: w, specificProduct: prodById, matchedBy: 'product_id' };
        }

        // 2. Check productCode search
        const prodByCode = w.products.find((p) => p.productCode && check(p.productCode));
        if (prodByCode) {
          return { warranty: w, specificProduct: prodByCode, matchedBy: 'product_code' };
        }
      }

      // 3. Check Order Number
      if (check(w.orderNumber)) {
        return { warranty: w, matchedBy: 'order' };
      }

      // 4. Check Warranty Number
      if (check(w.warrantyNumber)) {
        return { warranty: w, matchedBy: 'warranty' };
      }

      // 5. Check Quotation ID / Doc ID
      if (check(w.quotationId) || check(w.id)) {
        return { warranty: w, matchedBy: 'general' };
      }

      // 6. Check Customer Phone / Email / Name
      if (w.customer && (check(w.customer.name) || check(w.customer.mobile) || check(w.customer.email))) {
        return { warranty: w, matchedBy: 'general' };
      }
    }

    return null;
  }, [submittedQuery, warranties]);

  const copyText = (text: string, key: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(`${label} copied`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const matchedWarranty = matchResult?.warranty;

  // Determine whether current authenticated user owns this warranty record
  const isCustomerOwner = useMemo(() => {
    if (!currentUser?.email || !matchedWarranty?.customer?.email) return false;
    return currentUser.email.trim().toLowerCase() === matchedWarranty.customer.email.trim().toLowerCase();
  }, [currentUser, matchedWarranty]);

  const isSpecificProductMatch = Boolean(
    (matchResult?.matchedBy === 'product_id' || matchResult?.matchedBy === 'product_code') &&
    matchResult?.specificProduct
  );

  const displayedProducts = useMemo(() => {
    if (!matchedWarranty) return [];
    if (isSpecificProductMatch && !showAllProducts && matchResult?.specificProduct) {
      return [matchResult.specificProduct];
    }
    return matchedWarranty.products || [];
  }, [matchedWarranty, isSpecificProductMatch, showAllProducts, matchResult]);

  const otherProductsCount = useMemo(() => {
    if (!matchedWarranty || !isSpecificProductMatch) return 0;
    return Math.max(0, (matchedWarranty.products?.length || 0) - 1);
  }, [matchedWarranty, isSpecificProductMatch]);

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans antialiased selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-neutral-900 transition-colors">
      <style>{`
        @media print {
          body {
            background: #fff !important;
            color: #000 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-clean {
            border: 1px solid #111 !important;
            box-shadow: none !important;
            padding: 16px !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
        }
      `}</style>

      {/* Subtle Utility Bar (Exit / Theme) */}
      <header className="no-print absolute top-4 sm:top-6 right-4 sm:right-6 z-20 flex items-center gap-3">
        <Link
          to="/"
          className="text-xs text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          Exit
        </Link>
        <button
          onClick={toggleDark}
          aria-label="Toggle theme"
          className="p-1.5 sm:p-2 rounded-full border border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
        >
          {isDark ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </header>

      {/* ========================================================================= */}
      {/* 1. HOME STATE: "SEARCH AND NOTHING"                                       */}
      {/* ========================================================================= */}
      {!submittedQuery && (
        <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
          <div className="w-full max-w-md mx-auto text-center space-y-6">
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono tracking-widest text-neutral-400 dark:text-neutral-500 uppercase">
                {storeName}
              </span>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white font-display">
                Warranty Verification
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative flex items-center">
                <Search className="absolute left-4 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  disabled={limitReached}
                  placeholder={limitReached ? "Daily search limit reached" : "Order No, Warranty ID, or Product Code"}
                  className="w-full pl-11 pr-10 py-3.5 rounded-full border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 text-sm font-mono focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-100 focus:bg-white dark:focus:bg-neutral-900 transition-colors disabled:opacity-50"
                  autoFocus
                />
                {inputVal && !limitReached && (
                  <button
                    type="button"
                    onClick={() => setInputVal('')}
                    className="absolute right-3.5 p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={limitReached || !inputVal.trim()}
                className="w-full py-3 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-medium text-sm hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                Search Record
              </button>
            </form>

            <div className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500">
              {limitReached ? (
                <span className="text-rose-600 dark:text-rose-400 font-semibold">
                  Daily limit of {DAILY_SEARCH_LIMIT} searches reached for today.
                </span>
              ) : (
                <span>Daily searches remaining: {searchesLeft} / {DAILY_SEARCH_LIMIT}</span>
              )}
            </div>
          </div>
        </main>
      )}

      {/* ========================================================================= */}
      {/* 2. SEARCHED BUT NO MATCH FOUND                                            */}
      {/* ========================================================================= */}
      {submittedQuery && !matchResult && (
        <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
          <div className="w-full max-w-sm mx-auto text-center space-y-5">
            <div className="w-10 h-10 rounded-full border border-neutral-200 dark:border-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
              <AlertCircle size={18} />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white font-display">
                No Record Found
              </h2>
              <p className="text-xs text-neutral-500 font-mono">
                "{submittedQuery}"
              </p>
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              No warranty matches this code. Please verify the code or contact support.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <button
                onClick={handleReset}
                className="w-full sm:w-auto px-5 py-2 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                Search Again
              </button>
              <a
                href={`tel:${supportPhone}`}
                className="w-full sm:w-auto px-5 py-2 rounded-full border border-neutral-200 dark:border-neutral-800 text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
              >
                Call Support
              </a>
            </div>
          </div>
        </main>
      )}

      {/* ========================================================================= */}
      {/* 3. SEARCHED & MATCHED: SHOW RESULT AND NOTHING ELSE (NO SEARCH BAR)       */}
      {/* ========================================================================= */}
      {submittedQuery && matchedWarranty && (
        <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-14 space-y-6">
          {/* Subtle Back & Actions Bar */}
          <div className="no-print flex items-center justify-between text-xs pb-3 border-b border-neutral-100 dark:border-neutral-850">
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors font-medium"
            >
              <ArrowLeft size={14} />
              <span>New Search</span>
            </button>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors font-medium text-neutral-700 dark:text-neutral-300"
              >
                <Printer size={13} />
                <span>Print</span>
              </button>
              <a
                href={`https://wa.me/${supportPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                  `Hello ${storeName}, I am inquiring about my warranty for Order ${matchedWarranty.orderNumber} (Warranty ID: ${matchedWarranty.warrantyNumber}).`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold hover:opacity-90 transition-opacity"
              >
                <MessageCircle size={13} />
                <span>Support</span>
              </a>
            </div>
          </div>

          {/* Clean, Non-A4, Fully Responsive Verification Document */}
          <article className="print-clean border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-950 p-5 sm:p-8 space-y-6 shadow-sm">
            {/* Header: Cleaned up without raw Firebase push keys */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-neutral-100 dark:border-neutral-850 pb-5">
              <div className="space-y-1">
                <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase">
                  {storeName}
                </span>
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white font-display">
                  Warranty Certificate
                </h1>
                <p className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                  Order <strong className="text-neutral-800 dark:text-neutral-200 font-semibold">{matchedWarranty.orderNumber}</strong> • Warranty <strong className="text-neutral-800 dark:text-neutral-200 font-semibold">{matchedWarranty.warrantyNumber}</strong>
                </p>
              </div>

              <div className="flex items-center">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {matchedWarranty.warranty.status}
                </span>
              </div>
            </div>

            {/* Key Information Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono border-b border-neutral-100 dark:border-neutral-850 pb-5">
              <div>
                <span className="text-[10px] text-neutral-400 uppercase block font-sans">Order No</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <strong className="text-neutral-900 dark:text-white text-sm">{matchedWarranty.orderNumber}</strong>
                  <button
                    onClick={() => copyText(matchedWarranty.orderNumber, 'order', 'Order Number')}
                    className="no-print text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                    title="Copy"
                  >
                    {copiedKey === 'order' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-neutral-400 uppercase block font-sans">Warranty ID</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <strong className="text-neutral-900 dark:text-white text-sm">{matchedWarranty.warrantyNumber}</strong>
                  <button
                    onClick={() => copyText(matchedWarranty.warrantyNumber, 'warranty', 'Warranty ID')}
                    className="no-print text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                    title="Copy"
                  >
                    {copiedKey === 'warranty' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-neutral-400 uppercase block font-sans">Quotation Ref</span>
                <span className="text-neutral-800 dark:text-neutral-200 text-sm mt-0.5 block truncate">
                  {matchedWarranty.quotationId || '—'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-neutral-400 uppercase block font-sans">Coverage Term</span>
                <span className="text-neutral-800 dark:text-neutral-200 text-sm mt-0.5 block">
                  {matchedWarranty.warranty.warrantyPeriodLabel} ({matchedWarranty.warranty.durationMonths}m)
                </span>
              </div>
            </div>

            {/* Dates & Customer Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs border-b border-neutral-100 dark:border-neutral-850 pb-5">
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block font-sans">
                  Validity Period
                </span>
                <div className="flex items-baseline justify-between py-1 border-b border-neutral-100 dark:border-neutral-800 font-mono">
                  <span className="text-neutral-500">Start Date:</span>
                  <span className="font-semibold text-neutral-900 dark:text-white">{formatDate(matchedWarranty.warranty.startDate)}</span>
                </div>
                <div className="flex items-baseline justify-between py-1 border-b border-neutral-100 dark:border-neutral-800 font-mono">
                  <span className="text-neutral-500">End Date:</span>
                  <span className="font-semibold text-neutral-900 dark:text-white">{formatDate(matchedWarranty.warranty.endDate)}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block font-sans">
                  Customer
                </span>
                <p className="font-semibold text-neutral-900 dark:text-white text-sm">
                  {matchedWarranty.customer.name}
                </p>
                <p className="text-neutral-500 font-mono">
                  {matchedWarranty.customer.mobile} • {matchedWarranty.customer.email}
                </p>
                <p className="text-neutral-500 leading-relaxed text-[11px]">
                  {matchedWarranty.customer.address}
                </p>
              </div>
            </div>

            {/* Covered Products Section */}
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-sans">
                  {isSpecificProductMatch && !showAllProducts
                    ? 'Queried Item'
                    : `Covered Products (${matchedWarranty.products.length})`}
                </span>

                {/* Subtitle / related items note toggle if specific product search */}
                {isSpecificProductMatch && (
                  <button
                    type="button"
                    onClick={() => setShowAllProducts((prev) => !prev)}
                    className="no-print inline-flex items-center gap-1 text-[11px] font-mono text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
                  >
                    <span>
                      {showAllProducts
                        ? 'Show queried item only'
                        : `${otherProductsCount} other item${otherProductsCount > 1 ? 's' : ''} linked to this warranty`}
                    </span>
                    {showAllProducts ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                )}
              </div>

              {/* Product Showcase Cards */}
              <div className="divide-y divide-neutral-100 dark:divide-neutral-850 border border-neutral-100 dark:border-neutral-850 rounded-xl overflow-hidden">
                {displayedProducts.map((item) => (
                  <ProductItemCard
                    key={item.id}
                    item={item}
                    isCustomerOwner={isCustomerOwner}
                  />
                ))}
              </div>

              {/* Related Items Small Notification in small type below specific product */}
              {isSpecificProductMatch && !showAllProducts && otherProductsCount > 0 && (
                <div className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500 pt-1 flex items-center justify-between">
                  <span>
                    ℹ {otherProductsCount} other item{otherProductsCount > 1 ? 's are' : ' is'} linked to warranty order {matchedWarranty.orderNumber}.
                  </span>
                  <button
                    onClick={() => setShowAllProducts(true)}
                    className="no-print underline hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors ml-2"
                  >
                    View all {matchedWarranty.products.length} items
                  </button>
                </div>
              )}
            </div>

            {/* Financial Summary - Strictly guarded for matching authenticated customer */}
            {isCustomerOwner && matchedWarranty.summary && (!isSpecificProductMatch || showAllProducts) && (
              <div className="border-t border-neutral-100 dark:border-neutral-850 pt-4 flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono text-neutral-500 gap-2">
                <span>Total Items: {matchedWarranty.summary.totalProducts}</span>
                <div className="flex flex-wrap items-center gap-4">
                  <span>Subtotal: ₹{matchedWarranty.summary.subTotal.toLocaleString('en-IN')}</span>
                  <span>GST: ₹{matchedWarranty.summary.totalGst.toLocaleString('en-IN')}</span>
                  <strong className="text-neutral-900 dark:text-white text-sm">
                    Grand Total: ₹{matchedWarranty.summary.grandTotal.toLocaleString('en-IN')}
                  </strong>
                </div>
              </div>
            )}

            {/* Terms and Signoff */}
            <div className="border-t border-neutral-100 dark:border-neutral-850 pt-5 space-y-1.5 text-[11px] text-neutral-400 leading-relaxed">
              <span className="font-mono uppercase tracking-wider block font-sans">
                Terms & Conditions
              </span>
              <p>{matchedWarranty.warranty.termsAndConditions}</p>
              {matchedWarranty.metadata?.notes && (
                <p className="text-neutral-500 dark:text-neutral-400 pt-0.5">
                  Handover: {matchedWarranty.metadata.notes}
                </p>
              )}
            </div>
          </article>
        </div>
      )}
    </div>
  );
}
