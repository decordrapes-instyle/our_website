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
  ShieldOff,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ref, get, database } from '../config/firebase';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { useAuth } from '../context/AuthContext';
import { WarrantyRecord, WarrantyProductItem } from '../types/warranty';

const DAILY_SEARCH_LIMIT = 10;

// Reference data from actual customer installation order (sparse multi-item motors + accessories)
const SAMPLE_HAPPYMONK: WarrantyRecord = {
  id: "WAR-2026-Q-60747",
  orderNumber: "DDI-Q-60747",
  warrantyNumber: "WAR-2026-Q-60747",
  quotationId: "DDI-Q-60747",
  customer: {
    name: "Happymonk Technology Pvt Ltd",
    mobile: "+19 82961 33666",
    email: "accounts@happymonk.co.in",
    address: "J.P Nagar Bangalore Karnataka - 560029",
    installationAddress: "SPARSH Hospital, Hennur",
    gstin: "29AADCH6575K1ZZ",
  },
  metadata: {
    source: "quotation",
    updatedAt: "2026-10-26T12:19:50.973Z",
    notes: "Site installation at SPARSH Hospital completed.",
  },
  products: [
    {
      id: "202605140077",
      productName: "Tuya 3 Wire WiFi Motor",
      productCode: "WSCMXG-12-9W",
      productCategory: "Wistar",
      productSpecification: "50kg Load Capacity | 60RPM | IP40 | 18W",
      productImage: "https://res.cloudinary.com/ds6um53cx/image/upload/v1790763448/otqz6x6gcclhdj7s4yjp.png",
      productSpecificWarranty: "5 Years Manufacturer Replacement Guarantee",
      hasWarranty: true,
      noWarrantyReason: "",
      amount: 3800,
      gst: 18,
      gstAmount: 684,
      totalAmount: 4484,
      startDate: "2026-10-26",
      endDate: "2031-10-25",
      warrantyPeriod: "5 Years",
    },
    {
      id: "202605140112",
      productName: "Tuya 3 Wire WiFi Motor",
      productCode: "WSCMXG-12-9W",
      productCategory: "Wistar",
      productSpecification: "50kg Load Capacity | 60RPM | IP40 | 18W",
      productImage: "https://res.cloudinary.com/ds6um53cx/image/upload/v1790763448/otqz6x6gcclhdj7s4yjp.png",
      productSpecificWarranty: "",
      hasWarranty: false,
      noWarrantyReason: "Excluded from warranty coverage per terms of sale",
      amount: 0,
      gst: 18,
      gstAmount: 0,
      totalAmount: 0,
      startDate: "2026-10-26",
      endDate: "2028-10-25",
      warrantyPeriod: "None",
    },
    {
      id: "202605140076",
      productName: "Tuya 3 Wire WiFi Motor",
      productCode: "WSCMXG-12-9W",
      productCategory: "Wistar",
      productSpecification: "50kg Load Capacity | 60RPM | IP40 | 18W",
      productImage: "https://res.cloudinary.com/ds6um53cx/image/upload/v1790763448/otqz6x6gcclhdj7s4yjp.png",
      productSpecificWarranty: "",
      hasWarranty: true,
      amount: 0,
      gst: 18,
      gstAmount: 0,
      totalAmount: 0,
      startDate: "2026-10-26",
      endDate: "2031-10-25",
      warrantyPeriod: "5 Years",
    },
    {
      id: "202605140117",
      productName: "Tuya 3 Wire WiFi Motor",
      productCode: "WSCMXG-12-9W",
      productCategory: "Wistar",
      productSpecification: "50kg Load Capacity | 60RPM | IP40 | 18W",
      productImage: "https://res.cloudinary.com/ds6um53cx/image/upload/v1790763448/otqz6x6gcclhdj7s4yjp.png",
      productSpecificWarranty: "",
      hasWarranty: true,
      amount: 0,
      gst: 18,
      gstAmount: 0,
      totalAmount: 0,
      startDate: "2026-10-26",
      endDate: "2031-10-25",
      warrantyPeriod: "5 Years",
    },
    {
      id: "202605140087",
      productName: "Tuya 3 Wire WiFi Motor",
      productCode: "WSCMXG-12-9W",
      productCategory: "Wistar",
      productSpecification: "50kg Load Capacity | 60RPM | IP40 | 18W",
      productImage: "https://res.cloudinary.com/ds6um53cx/image/upload/v1790763448/otqz6x6gcclhdj7s4yjp.png",
      productSpecificWarranty: "",
      hasWarranty: true,
      amount: 0,
      gst: 18,
      gstAmount: 0,
      totalAmount: 0,
      startDate: "2026-10-26",
      endDate: "2031-10-25",
      warrantyPeriod: "5 Years",
    },
    {
      id: "202605140085",
      productName: "Tuya 3 Wire WiFi Motor",
      productCode: "WSCMXG-12-9W",
      productCategory: "Wistar",
      productSpecification: "50kg Load Capacity | 60RPM | IP40 | 18W",
      productImage: "https://res.cloudinary.com/ds6um53cx/image/upload/v1790763448/otqz6x6gcclhdj7s4yjp.png",
      productSpecificWarranty: "",
      hasWarranty: true,
      amount: 0,
      gst: 18,
      gstAmount: 0,
      totalAmount: 0,
      startDate: "2026-10-26",
      endDate: "2031-10-25",
      warrantyPeriod: "5 Years",
    },
    {
      id: "202605140074",
      productName: "Tuya 3 Wire WiFi Motor",
      productCode: "WSCMXG-12-9W",
      productCategory: "Wistar",
      productSpecification: "50kg Load Capacity | 60RPM | IP40 | 18W",
      productImage: "https://res.cloudinary.com/ds6um53cx/image/upload/v1790763448/otqz6x6gcclhdj7s4yjp.png",
      productSpecificWarranty: "",
      hasWarranty: true,
      amount: 0,
      gst: 18,
      gstAmount: 0,
      totalAmount: 0,
      startDate: "2026-10-26",
      endDate: "2031-10-25",
      warrantyPeriod: "5 Years",
    },
    {
      id: "202605140078",
      productName: "Tuya 3 Wire WiFi Motor",
      productCode: "WSCMXG-12-9W",
      productCategory: "Wistar",
      productSpecification: "50kg Load Capacity | 60RPM | IP40 | 18W",
      productImage: "https://res.cloudinary.com/ds6um53cx/image/upload/v1790763448/otqz6x6gcclhdj7s4yjp.png",
      productSpecificWarranty: "",
      hasWarranty: true,
      amount: 0,
      gst: 18,
      gstAmount: 0,
      totalAmount: 0,
      startDate: "2026-10-26",
      endDate: "2031-10-25",
      warrantyPeriod: "5 Years",
    },
    {
      id: "BC156724",
      productName: "Remote 4 Channel",
      productCode: "WSXE302",
      productCategory: "Motor & Accessories",
      productSpecification: "Four individual emitter channels to operate Tuya WSCMXG-12-9W motors",
      productImage: "https://res.cloudinary.com/dmiwq3l2s/image/upload/v1766227093/xixyu8gyx30wbhbauxi9.jpg",
      productSpecificWarranty: "",
      hasWarranty: false,
      noWarrantyReason: "Remote control and accessories are not covered under warranty",
      amount: 8400,
      gst: 18,
      gstAmount: 1512,
      totalAmount: 9912,
      startDate: "2026-10-26",
      endDate: "2031-10-25",
      warrantyPeriod: "None",
    },
  ],
  summary: {
    totalProducts: 9,
    subTotal: 12200,
    totalGst: 2196,
    grandTotal: 14396,
  },
  warranty: {
    startDate: "2026-10-26",
    endDate: "2031-10-25",
    durationMonths: 60,
    warrantyPeriodLabel: "5 Years",
    status: "active",
    termsAndConditions:
      "1. Motor warranty is valid for 5 years against manufacturing defects under normal use.\n2. Physical damage and short-circuit damage are not covered.\n3. Remote control and accessories are not covered under warranty.\n4. Warranty claims require this certificate or a valid Warranty Number.",
  },
};

// Fallback reference data matching user JSON
const SAMPLE_RAJESH: WarrantyRecord = {
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
      hasWarranty: true,
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
      hasWarranty: true,
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

const DEFAULT_WARRANTIES: WarrantyRecord[] = [SAMPLE_HAPPYMONK, SAMPLE_RAJESH];

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
 * Product Showcase Item Card (Optimized for 2-column layout on mobile & desktop)
 * Highlights Item ID as primary distinction, Product Name, Code, Group/Category, Specs,
 * explicit "No Warranty" status with reason, or Active Warranty Guarantee.
 */
function ProductItemCard({
  item,
  isCustomerOwner,
  isHighlighted = false,
}: {
  item: WarrantyProductItem;
  isCustomerOwner: boolean;
  isHighlighted?: boolean;
}) {
  const [imageError, setImageError] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // If product has valid image and didn't fail, show it. Otherwise skip cleanly.
  const hasValidImage = Boolean(item.productImage && item.productImage.trim() && !imageError);

  // Check if item is explicitly excluded from warranty
  const isNoWarranty = Boolean(
    item.hasWarranty === false ||
    item.warrantyPeriod?.trim().toLowerCase() === 'none' ||
    item.warrantyPeriod?.trim().toLowerCase() === 'no warranty' ||
    (item.noWarrantyReason && item.noWarrantyReason.trim().length > 0 && item.warrantyPeriod?.trim().toLowerCase() === 'none')
  );

  // Product specific warranty color
  const productWarrantyColor = useMemo(() => {
    if (isNoWarranty) {
      return {
        label: 'No Warranty',
        timeText: 'Not Covered',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-900',
        dotClass: 'bg-rose-500',
      };
    }
    return getWarrantyStatusColor('active', item.startDate, item.endDate);
  }, [isNoWarranty, item.startDate, item.endDate]);

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.id);
    setCopiedId(true);
    toast.success(`Item ID ${item.id} copied`);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div
      className={`rounded-2xl border transition-all p-3.5 sm:p-5 bg-white dark:bg-neutral-900/90 shadow-2xs ${
        isHighlighted
          ? 'border-neutral-900 dark:border-white ring-2 ring-neutral-900/10 dark:ring-white/20'
          : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
      }`}
    >
      {/* Responsive layout: flex-col on mobile (for 2-column grid), flex-row on PC (for wide single-column) */}
      <div className="flex flex-col md:flex-row md:items-start gap-3 sm:gap-6 justify-between">
        {/* Product Image: 1:1 Square on both mobile and PC, never distorted */}
        {hasValidImage && (
          <div className="w-full aspect-square md:w-36 md:h-36 md:aspect-square shrink-0 flex items-center justify-center p-2 rounded-xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-100 dark:border-neutral-800/80 group relative overflow-hidden">
            <img
              src={item.productImage}
              alt={item.productName}
              loading="lazy"
              onError={() => setImageError(true)}
              onClick={() => setShowLightbox(true)}
              className="w-full h-full object-contain cursor-pointer group-hover:scale-105 transition-transform duration-300 block select-none"
            />
            <span className="absolute bottom-1.5 right-1.5 bg-neutral-900/75 text-white text-[8px] font-mono px-1.5 py-0.5 rounded backdrop-blur-xs select-none pointer-events-none">
              Zoom
            </span>
          </div>
        )}

        {/* Product Information */}
        <div className="flex-1 min-w-0 space-y-2 sm:space-y-3">
          {/* Item ID Header - Prominently highlighted as main distinction (no group name over Item ID) */}
          <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-neutral-100 dark:border-neutral-800/80">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[9px] uppercase font-sans tracking-wider text-neutral-400 font-semibold shrink-0">
                Item ID
              </span>
              <span className="font-mono text-xs font-bold text-neutral-900 dark:text-white truncate">
                {item.id}
              </span>
              <button
                type="button"
                onClick={handleCopyId}
                title="Copy Item ID"
                className="no-print p-0.5 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors shrink-0"
              >
                {copiedId ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
              </button>
            </div>
          </div>

          {/* Product Name & Commercial Value */}
          <div className="space-y-0.5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1">
              <h4 className="text-xs sm:text-base font-bold text-neutral-900 dark:text-white font-display tracking-tight leading-snug">
                {item.productName}
              </h4>

              {/* Price on PC (horizontal view) */}
              {isCustomerOwner && item.totalAmount ? (
                <div className="hidden md:block text-right font-mono text-xs shrink-0 pl-3">
                  <span className="text-neutral-400 text-[9px] uppercase block font-sans font-medium">Commercial Value</span>
                  <strong className="text-neutral-900 dark:text-white text-sm">
                    ₹{item.totalAmount.toLocaleString('en-IN')}
                  </strong>
                </div>
              ) : null}
            </div>

            {item.productCode && (
              <p className="text-[10px] sm:text-xs font-mono text-neutral-500 dark:text-neutral-400">
                Code: <span className="font-semibold">{item.productCode}</span>
                {item.productCategory && (
                  <span className="text-neutral-400 dark:text-neutral-500 font-normal ml-2">
                    • {item.productCategory}
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Warranty Status: Covered vs No Warranty */}
          {isNoWarranty ? (
            <div className="space-y-1 pt-0.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-900 font-mono text-[10px] sm:text-xs font-semibold">
                <ShieldOff size={11} className="shrink-0 text-rose-500" />
                <span>No Warranty</span>
              </span>
              {item.noWarrantyReason && (
                <p className="text-[10px] sm:text-xs text-neutral-600 dark:text-neutral-400 font-sans leading-tight">
                  {item.noWarrantyReason}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-1 pt-0.5">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-mono text-[10px] sm:text-xs font-semibold border ${productWarrantyColor.badgeClass}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${productWarrantyColor.dotClass}`} />
                <span>{item.warrantyPeriod || 'Active Coverage'}</span>
              </span>
              {item.productSpecificWarranty && (
                <p className="text-[10px] sm:text-xs text-neutral-600 dark:text-neutral-400 font-sans leading-tight">
                  {item.productSpecificWarranty}
                </p>
              )}
            </div>
          )}

          {/* Product Specification */}
          {item.productSpecification && (
            <p className="text-[10px] sm:text-xs font-mono text-neutral-500 dark:text-neutral-400 leading-relaxed bg-neutral-50 dark:bg-neutral-950/50 p-2 sm:p-2.5 rounded-lg border border-neutral-100 dark:border-neutral-800/60">
              {item.productSpecification}
            </p>
          )}

          {/* Price on Mobile (compact view) */}
          {isCustomerOwner && item.totalAmount ? (
            <div className="md:hidden pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-baseline justify-between text-[11px] font-mono">
              <span className="text-neutral-400 text-[9px] uppercase font-sans">Value</span>
              <strong className="text-neutral-900 dark:text-white">
                ₹{item.totalAmount.toLocaleString('en-IN')}
              </strong>
            </div>
          ) : null}
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
            className="relative max-w-xl max-h-[85vh] bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden p-3 border border-neutral-800 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={item.productImage}
              alt={item.productName}
              className="w-auto h-auto max-w-full max-h-[70vh] object-contain block mx-auto rounded-xl"
            />
            <div className="flex items-center justify-between text-xs font-mono text-neutral-400 pt-1 border-t border-neutral-100 dark:border-neutral-800">
              <div>
                <span className="text-neutral-900 dark:text-white font-semibold block">{item.productName}</span>
                <span className="text-[10px]">Item ID: {item.id}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowLightbox(false)}
                className="px-3 py-1 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-medium hover:opacity-80"
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

/**
 * Extract search query from ANY query parameter in the URL.
 * Supports ?q=..., ?search=..., ?id=..., ?itemId=..., ?orderNumber=..., ?warrantyNumber=..., etc.
 * Also handles bare keys such as /warranty?202605140078 or /warranty?DDI-Q-60747.
 */
function getSearchQueryFromParams(searchParams: URLSearchParams): string {
  const PRIORITY_KEYS = [
    'q',
    'search',
    'query',
    'id',
    'itemId',
    'item_id',
    'orderNumber',
    'order_number',
    'order',
    'orderNo',
    'order_no',
    'warrantyNumber',
    'warranty_number',
    'warranty',
    'warrantyId',
    'warranty_id',
    'quotationId',
    'quotation_id',
    'quotation',
    'productCode',
    'code',
    'name',
    'mobile',
    'phone',
    'email',
    'gstin',
  ];

  for (const k of PRIORITY_KEYS) {
    const val = searchParams.get(k);
    if (val && val.trim()) {
      try {
        return decodeURIComponent(val.trim());
      } catch {
        return val.trim();
      }
    }
  }

  // Fallback: check any parameter
  for (const [key, val] of searchParams.entries()) {
    if (val && val.trim()) {
      try {
        return decodeURIComponent(val.trim());
      } catch {
        return val.trim();
      }
    }
    if (key && key.trim() && !val) {
      try {
        return decodeURIComponent(key.trim());
      } catch {
        return key.trim();
      }
    }
  }

  return '';
}

/**
 * Clean search query if user pasted parameter prefixes like "id: ...", "orderNumber = ...", "?q=..."
 */
function cleanSearchQuery(raw: string): string {
  if (!raw) return '';
  let cleaned = raw.trim();

  // Strip leading URL tokens
  if (cleaned.startsWith('?') || cleaned.startsWith('&')) {
    cleaned = cleaned.replace(/^[?&]+/, '').trim();
  }

  // Handle prefix like "q=...", "id: ...", "orderNumber: ..."
  const paramPattern = /^(?:q|search|query|id|itemid|item_id|item\s+id|ordernumber|order_number|order\s+number|order|orderno|order_no|warrantynumber|warranty_number|warranty\s+number|warranty|warrantyid|warranty_id|warranty\s+id|quotationid|quotation_id|quotation\s+id|quotation|code|productcode|product_code|product\s+code|customer|mobile|phone|email|name|gstin)\s*[:=]\s*(.+)$/i;
  const match = cleaned.match(paramPattern);
  if (match && match[1]) {
    cleaned = match[1].trim();
  }

  cleaned = cleaned.replace(/^["']|["']$/g, '').trim();
  return cleaned;
}

/**
 * Safely parse raw Firebase data into WarrantyRecord[]
 * Handles single record objects at root, arrays, or object maps keyed by pushId.
 * Guarantees each record's `products` is always an array of WarrantyProductItem.
 */
function parseWarrantiesData(data: any): WarrantyRecord[] {
  if (!data) return [];

  const normalizeRec = (raw: any, fallbackId: string): WarrantyRecord => {
    let prods: WarrantyProductItem[] = [];
    if (Array.isArray(raw?.products)) {
      prods = raw.products.filter(Boolean);
    } else if (raw?.products && typeof raw.products === 'object') {
      prods = Object.entries(raw.products).map(([pk, pv]: [string, any]) => ({
        ...(typeof pv === 'object' && pv ? pv : {}),
        id: pv?.id || pk,
      }));
    }

    return {
      ...raw,
      id: raw.id || raw.warrantyNumber || raw.orderNumber || fallbackId,
      orderNumber: raw.orderNumber || raw.quotationId || '',
      warrantyNumber: raw.warrantyNumber || '',
      quotationId: raw.quotationId || raw.orderNumber || '',
      products: prods,
      customer: raw.customer || {},
      metadata: raw.metadata || {},
      warranty: raw.warranty || {
        startDate: raw.startDate || '',
        endDate: raw.endDate || '',
        durationMonths: raw.durationMonths || 12,
        warrantyPeriodLabel: raw.warrantyPeriodLabel || '1 Year',
        status: raw.status || 'active',
        termsAndConditions: raw.termsAndConditions || '',
      },
    };
  };

  // 1. Array of records
  if (Array.isArray(data)) {
    return data.filter(Boolean).map((d, i) => normalizeRec(d, `rec_${i}`));
  }

  // 2. Single root record
  if (
    typeof data === 'object' &&
    (data.orderNumber || data.warrantyNumber || data.quotationId || data.products || data.customer)
  ) {
    return [normalizeRec(data, data.warrantyNumber || data.orderNumber || 'root')];
  }

  // 3. Keyed map of records
  if (typeof data === 'object') {
    const list: WarrantyRecord[] = [];
    for (const [key, val] of Object.entries(data)) {
      if (val && typeof val === 'object') {
        list.push(normalizeRec(val, key));
      }
    }
    return list;
  }

  return [];
}

/**
 * Unified Seamless Search Bar Component
 */
function SearchBar({
  inputVal,
  setInputVal,
  onSubmit,
  onClear,
  limitReached,
  autoFocus = false,
  compact = false,
}: {
  inputVal: string;
  setInputVal: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
  onClear: () => void;
  limitReached: boolean;
  autoFocus?: boolean;
  compact?: boolean;
}) {
  return (
    <form onSubmit={onSubmit} className="w-full">
      <div
        className={`flex items-center w-full rounded-2xl sm:rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-xs focus-within:border-neutral-900 dark:focus-within:border-neutral-100 focus-within:ring-2 focus-within:ring-neutral-900/10 dark:focus-within:ring-white/10 transition-all ${
          compact ? 'p-1 sm:p-1.5' : 'p-1.5 sm:p-2'
        }`}
      >
        <div className="pl-3 sm:pl-4 pr-1 text-neutral-400 dark:text-neutral-500 shrink-0 flex items-center">
          <Search className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>

        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          disabled={limitReached}
          placeholder={limitReached ? 'Suspicious activity detected, try again later' : 'Enter Order No, Warranty ID, or Item ID'}
          className={`flex-1 min-w-0 bg-transparent px-2.5 font-mono text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none ${
            compact ? 'py-1.5 sm:py-2 text-xs sm:text-sm' : 'py-2 sm:py-2.5 text-sm sm:text-base'
          }`}
          autoFocus={autoFocus}
        />

        {inputVal && !limitReached && (
          <button
            type="button"
            onClick={onClear}
            className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors shrink-0 mr-1"
            aria-label="Clear search input"
            title="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <button
          type="submit"
          disabled={limitReached || !inputVal.trim()}
          className={`shrink-0 rounded-xl sm:rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-medium tracking-wide transition-all hover:bg-neutral-800 dark:hover:bg-neutral-100 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs ${
            compact ? 'px-4 sm:px-5 py-2 text-xs' : 'px-5 sm:px-7 py-2.5 sm:py-3 text-xs sm:text-sm'
          }`}
        >
          Search
        </button>
      </div>
    </form>
  );
}

export default function Warranty() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Extract initial query from URL search parameters if present
  const initialParam = getSearchQueryFromParams(searchParams);
  const [inputVal, setInputVal] = useState(initialParam);
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [warranties, setWarranties] = useState<WarrantyRecord[]>(DEFAULT_WARRANTIES);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

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

  // Fresh read directly from Firebase on each search - zero caching
  const fetchFreshWarranties = async (): Promise<WarrantyRecord[]> => {
    try {
      let snap = await get(ref(database, 'warrantymanagement'));
      if (!snap.exists()) {
        snap = await get(ref(database, 'warranties'));
        if (!snap.exists()) {
          snap = await get(ref(database, 'warranty'));
        }
      }

      if (snap.exists()) {
        const data = snap.val();
        const list = parseWarrantiesData(data);
        if (list.length > 0) {
          // Merge with sample defaults so demo records always stay available
          for (const def of DEFAULT_WARRANTIES) {
            if (!list.some((w) => w.orderNumber === def.orderNumber || w.warrantyNumber === def.warrantyNumber)) {
              list.push(def);
            }
          }
          return list;
        }
      }
    } catch (err) {
      console.error('Fresh fetch error:', err);
    }
    return DEFAULT_WARRANTIES;
  };

  // Sync whenever URL search parameters change (or on direct arrival with search params)
  useEffect(() => {
    const rawParam = getSearchQueryFromParams(searchParams);
    const cleaned = cleanSearchQuery(rawParam);

    if (!cleaned) {
      // No search parameter in URL
      setInputVal('');
      setSubmittedQuery('');
      setIsVerifying(false);
      return;
    }

    setInputVal(cleaned);
    setIsVerifying(true);

    const check = recordUsage(cleaned);
    if (!check.allowed) {
      setLimitReached(true);
      toast.error('Suspicious activity detected, try again later');
      setIsVerifying(false);
      return;
    }

    let isCurrent = true;
    (async () => {
      const freshList = await fetchFreshWarranties();
      if (!isCurrent) return;
      setWarranties(freshList);

      // Brief false buffering to give realistic verification feedback
      setTimeout(() => {
        if (!isCurrent) return;
        setSubmittedQuery(cleaned);
        setIsVerifying(false);
      }, 400);
    })();

    return () => {
      isCurrent = false;
    };
  }, [searchParams]);

  // Execute search & update URL: fetches fresh data directly from Firebase on every query
  const executeSearch = async (queryToRun: string) => {
    const cleaned = cleanSearchQuery(queryToRun);
    if (!cleaned) {
      handleReset();
      return;
    }

    const check = recordUsage(cleaned);
    if (!check.allowed) {
      setLimitReached(true);
      toast.error('Suspicious activity detected, try again later');
      return;
    }

    setShowAllProducts(false);

    // If URL already has this exact parameter, force re-fetch & buffering directly
    const currentParam = cleanSearchQuery(getSearchQueryFromParams(searchParams));
    if (currentParam.toLowerCase() === cleaned.toLowerCase()) {
      setIsVerifying(true);
      const freshList = await fetchFreshWarranties();
      setWarranties(freshList);
      setTimeout(() => {
        setSubmittedQuery(cleaned);
        setIsVerifying(false);
      }, 400);
      return;
    }

    // Update URL search parameter, which triggers the useEffect([searchParams])
    setSearchParams({ q: cleaned }, { replace: true });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    executeSearch(inputVal);
  };

  const handleReset = () => {
    setInputVal('');
    setSubmittedQuery('');
    setShowAllProducts(false);
    setIsVerifying(false);
    setSearchParams({}, { replace: true });
  };

  // Find match with specific Item ID discrimination and exhaustive parameter matching
  const matchResult: MatchResult | null = useMemo(() => {
    if (!submittedQuery) return null;
    const cleanQ = cleanSearchQuery(submittedQuery);
    const q = cleanQ.toLowerCase();
    const cleanAlphaNum = q.replace(/[^a-z0-9]/g, '');

    const check = (str?: string) => {
      if (!str) return false;
      const s = str.toLowerCase().trim();
      if (!s) return false;
      if (s === q || s.includes(q) || q.includes(s)) return true;
      if (cleanAlphaNum && cleanAlphaNum.length >= 2) {
        const sClean = s.replace(/[^a-z0-9]/g, '');
        if (sClean === cleanAlphaNum || sClean.includes(cleanAlphaNum) || cleanAlphaNum.includes(sClean)) {
          return true;
        }
      }
      return false;
    };

    for (const w of warranties) {
      const prods = Array.isArray(w.products) ? w.products : [];

      // 1. Check exact Item ID search first (primary unique distinction between repeating products)
      const prodById = prods.find(
        (p) =>
          p.id &&
          (p.id.toLowerCase().trim() === q ||
            (cleanAlphaNum && p.id.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanAlphaNum) ||
            (cleanAlphaNum.length >= 4 && p.id.toLowerCase().replace(/[^a-z0-9]/g, '').includes(cleanAlphaNum)))
      );
      if (prodById) {
        return { warranty: w, specificProduct: prodById, matchedBy: 'product_id' };
      }

      // 2. Check productCode search
      const prodByCode = prods.find((p) => p.productCode && check(p.productCode));
      if (prodByCode) {
        return { warranty: w, specificProduct: prodByCode, matchedBy: 'product_code' };
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

      // 6. Check Customer Phone / Email / Name / GSTIN / Addresses
      if (w.customer) {
        if (
          check(w.customer.name) ||
          check(w.customer.mobile) ||
          check(w.customer.email) ||
          check(w.customer.gstin) ||
          check(w.customer.address) ||
          check(w.customer.installationAddress)
        ) {
          return { warranty: w, matchedBy: 'general' };
        }
      }

      // 7. Check Product Name / Category / Specification
      const prodByNameOrSpec = prods.find(
        (p) => check(p.productName) || check(p.productCategory) || check(p.productSpecification)
      );
      if (prodByNameOrSpec) {
        return { warranty: w, specificProduct: prodByNameOrSpec, matchedBy: 'general' };
      }

      // 8. Check Metadata
      if (w.metadata && (check(w.metadata.notes) || check(w.metadata.source))) {
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
        @page {
          size: A4 portrait;
          margin-top: 10mm;
          margin-bottom: 10mm;
          margin-left: 8mm;
          margin-right: 8mm;
        }

        @media print {
          html, body {
            background: #ffffff !important;
            color: #111111 !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .no-print {
            display: none !important;
          }

          /* Outer certificate container in print: no outer border, no large padding or margins */
          .print-clean {
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            background: #ffffff !important;
            page-break-inside: auto;
          }

          /* Table for PDF: Clean, unboxed, minimal padding */
          .print-table {
            width: 100% !important;
            border-collapse: collapse !important;
            page-break-inside: auto;
            margin-top: 4px !important;
          }

          /* Table header repeats automatically on multi-page print */
          .print-table thead {
            display: table-header-group !important;
          }

          /* Minimal padding from top when header repeats on page break */
          .print-table thead th {
            background-color: #f3f3f3 !important;
            font-weight: 600 !important;
            text-transform: uppercase !important;
            font-size: 7.5pt !important;
            letter-spacing: 0.04em !important;
            padding: 6px 8px !important;
            border: 1px solid #d4d4d4 !important;
            border-top: 1px solid #999999 !important;
          }

          .print-table tbody td {
            border: 1px solid #e0e0e0 !important;
            padding: 5px 7px !important;
            font-size: 8pt !important;
            color: #111111 !important;
          }

          .print-table tr,
          .print-row {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .print-avoid-break,
          .print-header,
          .print-grid,
          .print-terms,
          .print-summary {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      {/* ========================================================================= */}
      {/* 0. FALSE BUFFERING / VERIFYING STATE                                      */}
      {/* ========================================================================= */}
      {isVerifying && (
        <main className="min-h-screen flex flex-col items-center justify-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="w-full max-w-sm mx-auto text-center space-y-4">
            <div className="w-8 h-8 mx-auto border-2 border-neutral-300 dark:border-neutral-700 border-t-neutral-900 dark:border-t-white rounded-full animate-spin" />
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-medium text-neutral-900 dark:text-white font-display">
                Verifying Warranty Certificate
              </h3>
              <p className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                Querying {storeName} warranty database...
              </p>
            </div>
          </div>
        </main>
      )}

      {/* ========================================================================= */}
      {/* 1. HOME STATE: "SEARCH AND NOTHING" - CLEAN MINIMAL UI                    */}
      {/* ========================================================================= */}
      {!isVerifying && !submittedQuery && (
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
                Enter your Order Number, Warranty ID, or Product Item ID to verify authentic coverage records.
              </p>
            </div>

            {/* Seamless Search Bar with Button In Place */}
            <SearchBar
              inputVal={inputVal}
              setInputVal={setInputVal}
              onSubmit={handleSubmit}
              onClear={handleReset}
              limitReached={limitReached}
              autoFocus
            />
          </div>
        </main>
      )}

      {/* ========================================================================= */}
      {/* 2. SEARCHED BUT NO MATCH FOUND                                            */}
      {/* ========================================================================= */}
      {!isVerifying && submittedQuery && !matchResult && (
        <main className="min-h-screen flex flex-col items-center justify-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="w-full max-w-xl mx-auto text-center space-y-6">
            <AlertCircle className="w-10 h-10 text-neutral-400 dark:text-neutral-500 mx-auto stroke-[1.5]" />

            <div className="space-y-1.5">
              <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white font-display">
                No Record Found
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 font-mono">
                "{submittedQuery}"
              </p>
            </div>

            {/* Accessible Search Bar right in No Record Found state */}
            <div className="w-full max-w-xl mx-auto pt-1">
              <SearchBar
                inputVal={inputVal}
                setInputVal={setInputVal}
                onSubmit={handleSubmit}
                onClear={handleReset}
                limitReached={limitReached}
                autoFocus
              />
            </div>

            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-sm mx-auto">
              No warranty record matches this query. Please verify the Item ID, order invoice, or contact our support team.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={handleReset}
                className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                Clear Search
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
      {!isVerifying && submittedQuery && matchedWarranty && (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6 print:p-0 print:m-0 print:max-w-full print:space-y-3">
          {/* Top Search Bar (no-print) so user can easily search another record or parameter */}
          <div className="no-print w-full max-w-2xl mx-auto">
            <SearchBar
              inputVal={inputVal}
              setInputVal={setInputVal}
              onSubmit={handleSubmit}
              onClear={handleReset}
              limitReached={limitReached}
              compact
            />
          </div>

          {/* Certificate Document */}
          <article className="print-clean border border-neutral-200 dark:border-neutral-800 rounded-3xl bg-white dark:bg-neutral-900 p-5 sm:p-10 space-y-8 print:p-0 print:border-none print:shadow-none print:rounded-none print:space-y-3 shadow-xs">
            {/* Header: Cleaned up without raw Firebase push keys */}
            <div className="print-avoid-break flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-neutral-100 dark:border-neutral-800 pb-6 print:pb-3 print:border-neutral-300">
              <div className="space-y-1.5 print:space-y-0.5">
                <span className="text-[10px] font-mono tracking-widest text-neutral-400 dark:text-neutral-500 uppercase block print:text-[8px]">
                  {storeName}
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white font-display print:text-xl">
                  Warranty Certificate
                </h1>
                <p className="text-xs font-mono text-neutral-500 dark:text-neutral-400 print:text-[10px]">
                  Order <strong className="text-neutral-900 dark:text-neutral-100 font-semibold">{matchedWarranty.orderNumber}</strong> • Warranty ID <strong className="text-neutral-900 dark:text-neutral-100 font-semibold">{matchedWarranty.warrantyNumber}</strong>
                </p>
              </div>

              {/* Status Badge with Color Theory for Time Remaining */}
              {overallWarrantyColor && (
                <div className="flex items-center shrink-0">
                  <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold uppercase tracking-wider border shadow-2xs print:px-2.5 print:py-0.5 print:text-[10px] ${overallWarrantyColor.badgeClass}`}>
                    <span className={`w-2 h-2 rounded-full ${overallWarrantyColor.dotClass}`} />
                    <span>{overallWarrantyColor.label} • {overallWarrantyColor.timeText}</span>
                  </span>
                </div>
              )}
            </div>

            {/* Key Information Grid */}
            <div className="print-avoid-break grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono border-b border-neutral-100 dark:border-neutral-800 pb-6 print:pb-3 print:gap-2 print:border-neutral-300">
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
            <div className="print-avoid-break grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs border-b border-neutral-100 dark:border-neutral-800 pb-6 print:pb-3 print:gap-3 print:border-neutral-300">
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
                {matchedWarranty.customer.address && (
                  <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed text-[11px]">
                    <span className="text-neutral-400 font-medium">Billing:</span> {matchedWarranty.customer.address}
                  </p>
                )}
                {matchedWarranty.customer.installationAddress && (
                  <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed text-[11px]">
                    <span className="text-neutral-400 font-medium">Site:</span> {matchedWarranty.customer.installationAddress}
                  </p>
                )}
                {matchedWarranty.customer.gstin && (
                  <p className="text-neutral-400 font-mono text-[10px]">
                    GSTIN: {matchedWarranty.customer.gstin}
                  </p>
                )}
              </div>
            </div>

            {/* Covered Products Section */}
            <div className="space-y-4 print:space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-sans font-medium">
                  {isSpecificProductMatch && !showAllProducts
                    ? `Queried Item (ID: ${matchResult?.specificProduct?.id})`
                    : `Covered Products (${matchedWarranty.products.length})`}
                </span>

                {/* Subtitle / related items toggle if specific item queried */}
                {isSpecificProductMatch && (
                  <button
                    type="button"
                    onClick={() => setShowAllProducts((prev) => !prev)}
                    className="no-print inline-flex items-center gap-1 text-[11px] font-mono text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
                  >
                    <span>
                      {showAllProducts
                        ? 'Show queried item only'
                        : `${otherProductsCount} other item${otherProductsCount > 1 ? 's' : ''} in this warranty`}
                    </span>
                    {showAllProducts ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                )}
              </div>

              {/* SCREEN VIEW: 2-Column on Mobile, 1-Column on PC */}
              <div
                className={`no-print ${
                  displayedProducts.length === 1
                    ? 'max-w-3xl mx-auto w-full'
                    : 'grid grid-cols-2 md:grid-cols-1 gap-2.5 sm:gap-4'
                }`}
              >
                {displayedProducts.map((item) => (
                  <ProductItemCard
                    key={item.id}
                    item={item}
                    isCustomerOwner={isCustomerOwner}
                    isHighlighted={isSpecificProductMatch && matchResult?.specificProduct?.id === item.id}
                  />
                ))}
              </div>

              {/* PDF / PRINT VIEW: Clean Professional Table (No Images, Exact Page Breaks) */}
              <div className="hidden print:block w-full overflow-hidden rounded-xl border border-neutral-300">
                <table className="w-full text-left border-collapse print-table">
                  <thead>
                    <tr className="bg-neutral-100 border-b border-neutral-300 font-mono text-[9px] uppercase tracking-wider text-neutral-700">
                      <th className="py-2 px-2.5 w-8">#</th>
                      <th className="py-2 px-2.5 w-28">Item ID</th>
                      <th className="py-2 px-2.5">Product & Specifications</th>
                      <th className="py-2 px-2.5 w-28">Code / Group</th>
                      <th className="py-2 px-2.5 w-40">Warranty Status</th>
                      {isCustomerOwner && (
                        <th className="py-2 px-2.5 text-right w-24">Amount</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 text-xs">
                    {displayedProducts.map((item, idx) => {
                      const isNoWarranty = Boolean(
                        item.hasWarranty === false ||
                        item.warrantyPeriod?.trim().toLowerCase() === 'none' ||
                        item.warrantyPeriod?.trim().toLowerCase() === 'no warranty' ||
                        (item.noWarrantyReason && item.noWarrantyReason.trim().length > 0 && item.warrantyPeriod?.trim().toLowerCase() === 'none')
                      );

                      return (
                        <tr key={item.id} className="print-row">
                          <td className="py-2 px-2.5 font-mono text-[10px] text-neutral-500 align-top">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-2.5 font-mono text-[11px] font-bold text-neutral-900 align-top">
                            {item.id}
                          </td>
                          <td className="py-2 px-2.5 align-top space-y-0.5">
                            <span className="font-semibold text-neutral-900 block font-sans text-xs">
                              {item.productName}
                            </span>
                            {item.productSpecification && (
                              <span className="text-[10px] text-neutral-600 font-mono block leading-snug">
                                {item.productSpecification}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-2.5 font-mono text-[10px] align-top">
                            <span className="font-semibold text-neutral-800 block">
                              {item.productCode || '—'}
                            </span>
                            {item.productCategory && (
                              <span className="text-neutral-500 block">
                                {item.productCategory}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-2.5 font-mono text-[10px] align-top">
                            {isNoWarranty ? (
                              <div className="space-y-0.5">
                                <span className="font-bold text-rose-700 block">
                                  No Warranty
                                </span>
                                {item.noWarrantyReason && (
                                  <span className="text-neutral-600 font-sans block leading-tight">
                                    {item.noWarrantyReason}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-0.5">
                                <span className="font-semibold text-emerald-800 block">
                                  {item.warrantyPeriod || 'Active Coverage'}
                                </span>
                                {item.productSpecificWarranty && (
                                  <span className="text-neutral-600 font-sans block leading-tight">
                                    {item.productSpecificWarranty}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          {isCustomerOwner && (
                            <td className="py-2 px-2.5 font-mono text-[11px] text-right font-medium text-neutral-900 align-top">
                              {item.totalAmount ? `₹${item.totalAmount.toLocaleString('en-IN')}` : '—'}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                  {isCustomerOwner && matchedWarranty.summary && (
                    <tfoot>
                      <tr className="border-t-2 border-neutral-300 font-mono text-xs font-semibold bg-neutral-50">
                        <td colSpan={4} className="py-2 px-2.5 text-right">
                          Total ({matchedWarranty.summary.totalProducts} items):
                        </td>
                        <td colSpan={2} className="py-2 px-2.5 text-right font-bold text-neutral-900">
                          ₹{matchedWarranty.summary.grandTotal.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* Related Items Notification below specific product */}
              {isSpecificProductMatch && !showAllProducts && otherProductsCount > 0 && (
                <div className="no-print text-[11px] font-mono text-neutral-400 dark:text-neutral-500 pt-1 flex items-center justify-between">
                  <span>
                    ℹ Item ID {matchResult?.specificProduct?.id} is 1 of {matchedWarranty.products.length} items linked to warranty order {matchedWarranty.orderNumber}.
                  </span>
                  <button
                    onClick={() => setShowAllProducts(true)}
                    className="underline hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors ml-2"
                  >
                    View all {matchedWarranty.products.length} items
                  </button>
                </div>
              )}
            </div>

            {/* Financial Summary - Strictly guarded for matching authenticated customer */}
            {isCustomerOwner && matchedWarranty.summary && (!isSpecificProductMatch || showAllProducts) && (
              <div className="print-avoid-break border-t border-neutral-100 dark:border-neutral-800 pt-5 flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono text-neutral-500 gap-3 print:pt-2 print:border-neutral-300">
                <span>Total Items: {matchedWarranty.summary.totalProducts}</span>
                <div className="flex flex-wrap items-center gap-4">
                  <span>Subtotal: ₹{matchedWarranty.summary.subTotal.toLocaleString('en-IN')}</span>
                  <span>GST: ₹{matchedWarranty.summary.totalGst.toLocaleString('en-IN')}</span>
                  <strong className="text-neutral-900 dark:text-white text-base print:text-sm">
                    Grand Total: ₹{matchedWarranty.summary.grandTotal.toLocaleString('en-IN')}
                  </strong>
                </div>
              </div>
            )}

            {/* Terms and Conditions (Split into separate serial-numbered lines) */}
            <div className="print-terms print-avoid-break border-t border-neutral-100 dark:border-neutral-800 pt-6 space-y-3 print:pt-2 print:space-y-1 print:border-neutral-300">
              <span className="font-mono uppercase tracking-wider text-[10px] text-neutral-400 block font-sans font-medium print:text-neutral-700 print:font-semibold">
                Terms & Conditions
              </span>
              <ol className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400 print:space-y-0.5 print:text-[8pt] print:text-neutral-800">
                {termsList.map((term, idx) => (
                  <li key={idx} className="print-avoid-break flex items-start gap-2.5 leading-relaxed print:leading-snug">
                    <span className="font-mono text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 shrink-0 mt-0.5 print:text-[8pt] print:text-neutral-600">
                      {String(idx + 1).padStart(2, '0')}.
                    </span>
                    <span>{term}</span>
                  </li>
                ))}
              </ol>

              {matchedWarranty.metadata?.notes && (
                <div className="pt-2 text-[11px] font-mono text-neutral-400 dark:text-neutral-500 border-t border-neutral-100 dark:border-neutral-800/60 print:pt-1 print:text-[8pt] print:border-neutral-200">
                  Handover: <span className="font-sans text-neutral-600 dark:text-neutral-300 print:text-neutral-800">{matchedWarranty.metadata.notes}</span>
                </div>
              )}
            </div>

            {/* ========================================================================= */}
            {/* BOTTOM ACTIONS: PDF & SUPPORT (MOVED FROM TOP TO BOTTOM AS REQUESTED)     */}
            {/* ========================================================================= */}
            <div className="no-print pt-6 border-t border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium text-xs transition-colors shadow-2xs w-full sm:w-auto"
                >
                  <Printer size={13} />
                  <span>Print Certificate / PDF</span>
                </button>

                <a
                  href={`tel:${supportPhone}`}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium text-xs transition-colors shadow-2xs w-full sm:w-auto"
                >
                  <span>Call Support</span>
                </a>
              </div>

              <a
                href={`https://wa.me/${supportPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                  `Hello ${storeName}, I am inquiring about my warranty for Order ${matchedWarranty.orderNumber} (Warranty ID: ${matchedWarranty.warrantyNumber}).`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold text-xs hover:opacity-90 transition-opacity shadow-xs w-full sm:w-auto"
              >
                <MessageCircle size={14} />
                <span>WhatsApp Support</span>
              </a>
            </div>
          </article>
        </div>
      )}
    </div>
  );
}
