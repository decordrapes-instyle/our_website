import { useState, useEffect, useMemo, FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  X,
  Printer,
  Copy,
  Check,
  MessageCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Tag,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ref, onValue, database } from '../config/firebase';
import { useSiteSettings } from '../hooks/useSiteSettings';
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
      "1. Warranty covers manufacturing defects, motor mechanism faults, and electronic drive failures. 2. Physical abuse or water damage is excluded. 3. Repairs must be handled only by authorized service technicians. 4. Original warranty document or digital record must be presented for claims.",
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

// Rate limiting helpers (10 searches/day, kept strictly in background without counter display)
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
    // Ignore storage issues
  }
  return { date: today, count: 0, history: [] };
}

function recordUsage(query: string): { allowed: boolean } {
  const usage = getDailyUsage();
  const cleanQ = query.trim().toLowerCase();

  // Re-searching same query doesn't consume quota
  if (usage.history.includes(cleanQ)) {
    return { allowed: true };
  }

  if (usage.count >= DAILY_SEARCH_LIMIT) {
    return { allowed: false };
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

  return { allowed: true };
}

/**
 * Color Theory for Remaining Warranty Time:
 * - Red (rose): Expired
 * - Vibrant Emerald Green: Just started / 2+ years remaining
 * - Lime Green: 1 to 2 years remaining
 * - Amber Yellow: 6 months to 1 year remaining
 * - Orange: Under 6 months remaining
 */
function getWarrantyStatusColor(status: string, startDate?: string, endDate?: string) {
  const isExplicitExpired = status?.toLowerCase() === 'expired';

  if (!endDate) {
    return {
      label: isExplicitExpired ? 'Expired' : 'Active',
      timeText: isExplicitExpired ? 'Coverage Expired' : 'Active Coverage',
      badgeClass: isExplicitExpired
        ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-900'
        : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
      dotClass: isExplicitExpired ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse',
    };
  }

  const now = Date.now();
  const end = new Date(endDate).getTime();
  const start = startDate ? new Date(startDate).getTime() : now;
  const remainingMs = end - now;

  if (isExplicitExpired || remainingMs <= 0) {
    return {
      label: 'Expired',
      timeText: 'Coverage Expired',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-900',
      dotClass: 'bg-rose-500',
    };
  }

  const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
  const remainingMonths = Math.max(0, Math.round(remainingDays / 30.4375));
  const remainingYears = Math.floor(remainingMonths / 12);
  const remainingExtraMonths = remainingMonths % 12;

  let timeText = '';
  if (remainingYears > 0 && remainingExtraMonths > 0) {
    timeText = `${remainingYears} Year${remainingYears > 1 ? 's' : ''} ${remainingExtraMonths} Mo${remainingExtraMonths > 1 ? 's' : ''} Left`;
  } else if (remainingYears > 0) {
    timeText = `${remainingYears} Year${remainingYears > 1 ? 's' : ''} Left`;
  } else if (remainingMonths > 0) {
    timeText = `${remainingMonths} Month${remainingMonths > 1 ? 's' : ''} Left`;
  } else {
    timeText = `${remainingDays} Day${remainingDays > 1 ? 's' : ''} Left`;
  }

  // Check if just started (within first 90 days of start date)
  const elapsedDays = Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
  const isJustStarted = elapsedDays <= 90;

  // Color shift for each reducing year
  if (remainingYears >= 2 || isJustStarted) {
    // 2+ years remaining / just started: Emerald Green
    return {
      label: isJustStarted ? 'Active (New)' : 'Active',
      timeText,
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
      dotClass: 'bg-emerald-500 animate-pulse',
    };
  }

  if (remainingYears >= 1) {
    // 1 to 2 years remaining: Lime Green
    return {
      label: 'Active',
      timeText,
      badgeClass: 'bg-lime-50 text-lime-800 border-lime-200 dark:bg-lime-950/60 dark:text-lime-300 dark:border-lime-800',
      dotClass: 'bg-lime-500',
    };
  }

  if (remainingMonths >= 6) {
    // 6 months to 1 year remaining: Warm Amber
    return {
      label: 'Active',
      timeText,
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
      dotClass: 'bg-amber-500',
    };
  }

  // Under 6 months remaining: Warning Orange
  return {
    label: 'Expiring Soon',
    timeText,
    badgeClass: 'bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800',
    dotClass: 'bg-orange-500 animate-ping',
  };
}

/**
 * Splits terms and conditions into clean individual items
 * Handles serial numbers like "1. ... 2. ...", newlines, and clauses
 */
function parseTermsAndConditions(rawText?: string): string[] {
  if (!rawText) return [];
  const text = rawText.trim();
  if (!text) return [];

  // If already contains newlines
  if (text.includes('\n')) {
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.replace(/^(\d+[\.\)]\s*|[-•*]\s*)/, '').trim());
  }

  // Look for serial number patterns: "1. ... 2. ..." or "1) ... 2) ..."
  const serialMatch = text.split(/(?=\b\d+[\.\)])/);
  if (serialMatch.length > 1) {
    return serialMatch
      .map((item) => item.trim().replace(/^\d+[\.\)]\s*/, '').trim())
      .filter(Boolean);
  }

  // Split by sentences if separated by period followed by capital letter
  const sentences = text
    .split(/(?<=\.)\s+(?=[A-Z0-9])/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length > 1) {
    return sentences;
  }

  return [text];
}

interface MatchResult {
  warranty: WarrantyRecord;
  specificProduct?: WarrantyProductItem;
  matchedBy: 'product_id' | 'product_code' | 'order' | 'warranty' | 'general';
}

/**
 * Product Showcase Item Card
 * Highlights Product Name, ID, Code, Group/Category, Specs, Guarantee, and Showcase Image
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

  // Product specific warranty color
  const productWarrantyColor = useMemo(() => {
    return getWarrantyStatusColor('active', item.startDate, item.endDate);
  }, [item.startDate, item.endDate]);

  return (
    <div className="p-5 sm:p-6 transition-colors hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30">
      <div className="flex flex-col md:flex-row gap-5 items-start">
        {/* Product Showcase Image: Auto-adjusts naturally to its exact aspect ratio (square or rectangle) without compromise */}
        {hasValidImage && (
          <div className="shrink-0 w-fit max-w-full sm:max-w-[260px] mx-auto sm:mx-0 rounded-2xl overflow-hidden bg-neutral-100/80 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 group relative shadow-xs flex items-center justify-center p-1.5">
            <img
              src={item.productImage}
              alt={item.productName}
              loading="lazy"
              onError={() => setImageError(true)}
              onClick={() => setShowLightbox(true)}
              className="w-auto h-auto max-h-56 sm:max-h-48 max-w-full rounded-xl cursor-pointer group-hover:scale-105 transition-transform duration-300 object-contain block"
            />
            <span className="absolute bottom-3 right-3 bg-neutral-900/80 text-white text-[9px] font-mono px-2 py-0.5 rounded-md backdrop-blur-xs select-none pointer-events-none">
              Preview
            </span>
          </div>
        )}

        {/* Product Information */}
        <div className="flex-1 min-w-0 w-full space-y-3">
          {/* Header & Price */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
            <div className="space-y-1">
              {/* Product Group Badge */}
              {item.productCategory && (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                  <Tag size={10} className="text-neutral-400" />
                  <span>Group: {item.productCategory}</span>
                </span>
              )}

              {/* Product Name */}
              <h3 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white font-display tracking-tight">
                {item.productName}
              </h3>
            </div>

            {/* Price (Strictly displayed ONLY if authenticated user is the matching customer) */}
            {isCustomerOwner && item.totalAmount ? (
              <div className="text-left sm:text-right font-mono text-xs shrink-0 pt-0.5">
                <span className="text-[10px] text-neutral-400 uppercase block font-sans font-medium">Commercial Value</span>
                <strong className="text-neutral-900 dark:text-white text-base">
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

          {/* All Identifiers Bar: Group, Code, ID */}
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            {item.productCode && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-800 font-mono text-xs">
                <span className="text-[10px] text-neutral-400 uppercase font-sans">Code</span>
                <strong className="font-semibold">{item.productCode}</strong>
              </span>
            )}

            {item.id && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-800 font-mono text-xs">
                <span className="text-[10px] text-neutral-400 uppercase font-sans">Item ID</span>
                <strong className="font-semibold">{item.id}</strong>
              </span>
            )}

            {item.warrantyPeriod && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-800 font-mono text-xs">
                <Clock size={11} className="text-neutral-400" />
                <span className="font-semibold">{item.warrantyPeriod} Term</span>
              </span>
            )}
          </div>

          {/* Product Specifications */}
          {item.productSpecification && (
            <p className="text-xs font-mono text-neutral-600 dark:text-neutral-400 leading-relaxed bg-neutral-50 dark:bg-neutral-900/60 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800/80">
              {item.productSpecification}
            </p>
          )}

          {/* Product Specific Guarantee with Color Theory */}
          {item.productSpecificWarranty && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${productWarrantyColor.badgeClass}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${productWarrantyColor.dotClass}`} />
                <span>Guarantee: {item.productSpecificWarranty}</span>
              </span>
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
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            className="relative max-w-2xl max-h-[85vh] bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden p-2 border border-neutral-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={item.productImage}
              alt={item.productName}
              className="w-auto h-auto max-w-full max-h-[78vh] object-contain block mx-auto rounded-xl"
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
  const [showAllProducts, setShowAllProducts] = useState(false);

  const { currentUser } = useAuth();
  const { get: getSetting } = useSiteSettings();
  const storeName = getSetting('store_name') || 'Decor Drapes Instyle';
  const supportPhone = getSetting('primary_phone') || '+91 98765 43210';

  // Initialize quota status silently
  useEffect(() => {
    const usage = getDailyUsage();
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
              setWarranties(list.length > 0 ? list : [SAMPLE_WARRANTY]);
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
      if (!check.allowed) {
        setLimitReached(true);
        toast.error(`Daily search quota reached.`);
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
    if (!check.allowed) {
      setLimitReached(true);
      toast.error(`Daily search quota reached.`);
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

  // Color theory status for overall warranty
  const overallWarrantyColor = useMemo(() => {
    if (!matchedWarranty) return null;
    return getWarrantyStatusColor(
      matchedWarranty.warranty.status,
      matchedWarranty.warranty.startDate,
      matchedWarranty.warranty.endDate
    );
  }, [matchedWarranty]);

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

  // Parse terms and conditions into separate serial-numbered items
  const termsList = useMemo(() => {
    if (!matchedWarranty?.warranty?.termsAndConditions) return [];
    return parseTermsAndConditions(matchedWarranty.warranty.termsAndConditions);
  }, [matchedWarranty]);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans antialiased selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-neutral-900 transition-colors">
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

      {/* ========================================================================= */}
      {/* 1. HOME STATE: "SEARCH AND NOTHING" - CLEAN MINIMAL UI                    */}
      {/* ========================================================================= */}
      {!submittedQuery && (
        <main className="min-h-screen flex flex-col items-center justify-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="w-full max-w-2xl mx-auto text-center space-y-8">
            {/* Minimal Brand Header & Subheader - No boxed card */}
            <div className="space-y-3">
              <span className="text-xs uppercase tracking-[0.25em] font-medium text-neutral-400 dark:text-neutral-500 block">
                {storeName}
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-neutral-900 dark:text-white font-display">
                Warranty Verification
              </h1>
              <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 max-w-md mx-auto leading-relaxed">
                Enter your Order Number, Warranty ID, or Product Code to verify authentic coverage records.
              </p>
            </div>

            {/* Seamless Search Bar with Button In Place */}
            <form onSubmit={handleSubmit} className="w-full">
              <div className="flex items-center w-full rounded-2xl sm:rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-1.5 sm:p-2 shadow-xs focus-within:border-neutral-900 dark:focus-within:border-neutral-100 focus-within:ring-2 focus-within:ring-neutral-900/10 dark:focus-within:ring-white/10 transition-all">
                <div className="pl-3 sm:pl-4 pr-1 text-neutral-400 dark:text-neutral-500 shrink-0 flex items-center">
                  <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>

                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  disabled={limitReached}
                  placeholder={limitReached ? "Daily quota reached" : "Order No, Warranty ID, or Product Code"}
                  className="flex-1 min-w-0 bg-transparent px-2.5 py-2 sm:py-2.5 text-sm sm:text-base font-mono text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none"
                  autoFocus
                />

                {inputVal && !limitReached && (
                  <button
                    type="button"
                    onClick={() => setInputVal('')}
                    className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors shrink-0 mr-1"
                    aria-label="Clear search input"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="submit"
                  disabled={limitReached || !inputVal.trim()}
                  className="shrink-0 px-5 sm:px-7 py-2.5 sm:py-3 rounded-xl sm:rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-medium text-xs sm:text-sm tracking-wide transition-all hover:bg-neutral-800 dark:hover:bg-neutral-100 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                >
                  Search
                </button>
              </div>
            </form>
          </div>
        </main>
      )}

      {/* ========================================================================= */}
      {/* 2. SEARCHED BUT NO MATCH FOUND                                            */}
      {/* ========================================================================= */}
      {submittedQuery && !matchResult && (
        <main className="min-h-screen flex flex-col items-center justify-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="w-full max-w-md mx-auto text-center space-y-6">
            <AlertCircle className="w-10 h-10 text-neutral-400 dark:text-neutral-500 mx-auto stroke-[1.5]" />

            <div className="space-y-1.5">
              <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white font-display">
                No Record Found
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 font-mono">
                "{submittedQuery}"
              </p>
            </div>

            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-sm mx-auto">
              No warranty record matches this query. Please check your order invoice or contact our support team.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={handleReset}
                className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                Try Another Search
              </button>
              <a
                href={`tel:${supportPhone}`}
                className="w-full sm:w-auto px-6 py-2.5 rounded-full border border-neutral-200 dark:border-neutral-800 text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
              >
                Call Support
              </a>
            </div>
          </div>
        </main>
      )}

      {/* ========================================================================= */}
      {/* 3. SEARCHED & MATCHED: SHOW RESULT (SAME WIDTH AS HOME IN PC)             */}
      {/* ========================================================================= */}
      {submittedQuery && matchedWarranty && (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
          {/* Top Actions: Print & Support (No "New Search", Exit, or Theme toggles) */}
          <div className="no-print flex items-center justify-end text-xs pb-3 border-b border-neutral-200 dark:border-neutral-850 gap-2.5">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors font-medium text-neutral-700 dark:text-neutral-300 shadow-2xs"
            >
              <Printer size={13} />
              <span>Print Certificate</span>
            </button>
            <a
              href={`https://wa.me/${supportPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                `Hello ${storeName}, I am inquiring about my warranty for Order ${matchedWarranty.orderNumber} (Warranty ID: ${matchedWarranty.warrantyNumber}).`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold hover:opacity-90 transition-opacity shadow-2xs"
            >
              <MessageCircle size={13} />
              <span>WhatsApp Support</span>
            </a>
          </div>

          {/* Clean, Non-A4, Fully Responsive Verification Document */}
          <article className="print-clean border border-neutral-200 dark:border-neutral-800 rounded-3xl bg-white dark:bg-neutral-900 p-6 sm:p-10 space-y-8 shadow-xs">
            {/* Header: Cleaned up without raw Firebase push keys */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-neutral-100 dark:border-neutral-800 pb-6">
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono tracking-widest text-neutral-400 dark:text-neutral-500 uppercase block">
                  {storeName}
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white font-display">
                  Warranty Certificate
                </h1>
                <p className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                  Order <strong className="text-neutral-900 dark:text-neutral-100 font-semibold">{matchedWarranty.orderNumber}</strong> • Warranty ID <strong className="text-neutral-900 dark:text-neutral-100 font-semibold">{matchedWarranty.warrantyNumber}</strong>
                </p>
              </div>

              {/* Status Badge with Color Theory for Time Remaining */}
              {overallWarrantyColor && (
                <div className="flex items-center shrink-0">
                  <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold uppercase tracking-wider border shadow-2xs ${overallWarrantyColor.badgeClass}`}>
                    <span className={`w-2 h-2 rounded-full ${overallWarrantyColor.dotClass}`} />
                    <span>{overallWarrantyColor.label} • {overallWarrantyColor.timeText}</span>
                  </span>
                </div>
              )}
            </div>

            {/* Key Information Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono border-b border-neutral-100 dark:border-neutral-800 pb-6">
              <div>
                <span className="text-[10px] text-neutral-400 uppercase block font-sans font-medium">Order Number</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <strong className="text-neutral-900 dark:text-white text-sm">{matchedWarranty.orderNumber}</strong>
                  <button
                    onClick={() => copyText(matchedWarranty.orderNumber, 'order', 'Order Number')}
                    className="no-print text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                    title="Copy"
                  >
                    {copiedKey === 'order' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-neutral-400 uppercase block font-sans font-medium">Warranty ID</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <strong className="text-neutral-900 dark:text-white text-sm">{matchedWarranty.warrantyNumber}</strong>
                  <button
                    onClick={() => copyText(matchedWarranty.warrantyNumber, 'warranty', 'Warranty ID')}
                    className="no-print text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                    title="Copy"
                  >
                    {copiedKey === 'warranty' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-neutral-400 uppercase block font-sans font-medium">Quotation Ref</span>
                <span className="text-neutral-800 dark:text-neutral-200 text-sm mt-1 block truncate">
                  {matchedWarranty.quotationId || '—'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-neutral-400 uppercase block font-sans font-medium">Coverage Period</span>
                <span className="text-neutral-800 dark:text-neutral-200 text-sm mt-1 block">
                  {matchedWarranty.warranty.warrantyPeriodLabel} ({matchedWarranty.warranty.durationMonths}m)
                </span>
              </div>
            </div>

            {/* Dates & Customer Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs border-b border-neutral-100 dark:border-neutral-800 pb-6">
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block font-sans font-medium">
                  Validity Period
                </span>
                <div className="flex items-baseline justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-800 font-mono">
                  <span className="text-neutral-500">Effective Date:</span>
                  <span className="font-semibold text-neutral-900 dark:text-white">{formatDate(matchedWarranty.warranty.startDate)}</span>
                </div>
                <div className="flex items-baseline justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-800 font-mono">
                  <span className="text-neutral-500">Expiration Date:</span>
                  <span className="font-semibold text-neutral-900 dark:text-white">{formatDate(matchedWarranty.warranty.endDate)}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block font-sans font-medium">
                  Registered Customer
                </span>
                <p className="font-semibold text-neutral-900 dark:text-white text-sm">
                  {matchedWarranty.customer.name}
                </p>
                <p className="text-neutral-500 font-mono text-xs">
                  {matchedWarranty.customer.mobile} • {matchedWarranty.customer.email}
                </p>
                <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed text-[11px]">
                  {matchedWarranty.customer.address}
                </p>
              </div>
            </div>

            {/* Covered Products Section with Showcase */}
            <div className="space-y-4">
              <div className="flex items-baseline justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-sans font-medium">
                  {isSpecificProductMatch && !showAllProducts
                    ? 'Queried Item'
                    : `Covered Products (${matchedWarranty.products.length})`}
                </span>

                {/* Subtitle / related items toggle if specific product query */}
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
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden bg-neutral-50/30 dark:bg-neutral-900/40">
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
              <div className="border-t border-neutral-100 dark:border-neutral-800 pt-5 flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono text-neutral-500 gap-3">
                <span>Total Items: {matchedWarranty.summary.totalProducts}</span>
                <div className="flex flex-wrap items-center gap-4">
                  <span>Subtotal: ₹{matchedWarranty.summary.subTotal.toLocaleString('en-IN')}</span>
                  <span>GST: ₹{matchedWarranty.summary.totalGst.toLocaleString('en-IN')}</span>
                  <strong className="text-neutral-900 dark:text-white text-base">
                    Grand Total: ₹{matchedWarranty.summary.grandTotal.toLocaleString('en-IN')}
                  </strong>
                </div>
              </div>
            )}

            {/* Terms and Conditions (Split into separate serial-numbered lines) */}
            <div className="border-t border-neutral-100 dark:border-neutral-800 pt-6 space-y-3">
              <span className="font-mono uppercase tracking-wider text-[10px] text-neutral-400 block font-sans font-medium">
                Terms & Conditions
              </span>
              <ol className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
                {termsList.map((term, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                    <span className="font-mono text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 shrink-0 mt-0.5">
                      {String(idx + 1).padStart(2, '0')}.
                    </span>
                    <span>{term}</span>
                  </li>
                ))}
              </ol>

              {matchedWarranty.metadata?.notes && (
                <div className="pt-2 text-[11px] font-mono text-neutral-400 dark:text-neutral-500 border-t border-neutral-100 dark:border-neutral-800/60">
                  Handover: <span className="font-sans text-neutral-600 dark:text-neutral-300">{matchedWarranty.metadata.notes}</span>
                </div>
              )}
            </div>
          </article>
        </div>
      )}
    </div>
  );
}
