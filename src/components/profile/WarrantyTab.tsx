import React, { useState, useEffect, useMemo, FormEvent } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Shield,
  Printer,
  Copy,
  Check,
  Plus,
  Search,
  Phone,
  MapPin,
  Trash2,
  MessageCircle,
  X,
  Loader2,
  ArrowLeft,
  ChevronRight,
  Package,
} from "lucide-react";
import toast from "react-hot-toast";
import { ref, get, set, database } from "../../config/firebase";
import { WarrantyRecord, WarrantyProductItem } from "../../types/warranty";
import { fetchFreshWarranties } from "../../pages/Warranty";
import { useSiteSettings } from "../../hooks/useSiteSettings";
import TabHeader from "./TabHeader";

interface WarrantyTabProps {
  user: {
    uid?: string;
    displayName?: string;
    email?: string;
    phone?: string;
    company?: string;
    address?: string;
  };
  onGoHome?: () => void;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function getStatusBadge(status?: string, _startDate?: string, endDate?: string) {
  const isExplicitExpired = status?.toLowerCase() === "expired";
  if (!endDate) {
    return {
      label: isExplicitExpired ? "Expired" : "Active",
      timeText: isExplicitExpired ? "Coverage Expired" : "Active Coverage",
      badgeClass: isExplicitExpired
        ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-900"
        : "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
      dotClass: isExplicitExpired ? "bg-rose-500" : "bg-emerald-500 animate-pulse",
    };
  }

  const now = Date.now();
  const end = new Date(endDate).getTime();
  const remainingMs = end - now;

  if (isExplicitExpired || remainingMs <= 0) {
    return {
      label: "Expired",
      timeText: "Coverage Expired",
      badgeClass:
        "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-900",
      dotClass: "bg-rose-500",
    };
  }

  const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
  const remainingMonths = Math.max(0, Math.round(remainingDays / 30.4375));
  const remainingYears = Math.floor(remainingMonths / 12);
  const remainingExtraMonths = remainingMonths % 12;

  let timeText = "";
  if (remainingYears > 0 && remainingExtraMonths > 0) {
    timeText = `${remainingYears}y ${remainingExtraMonths}m Left`;
  } else if (remainingYears > 0) {
    timeText = `${remainingYears} Year${remainingYears > 1 ? "s" : ""} Left`;
  } else if (remainingMonths > 0) {
    timeText = `${remainingMonths} Month${remainingMonths > 1 ? "s" : ""} Left`;
  } else {
    timeText = `${remainingDays} Day${remainingDays > 1 ? "s" : ""} Left`;
  }

  if (remainingYears >= 2) {
    return {
      label: "Active",
      timeText,
      badgeClass:
        "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
      dotClass: "bg-emerald-500 animate-pulse",
    };
  }

  if (remainingYears >= 1) {
    return {
      label: "Active",
      timeText,
      badgeClass:
        "bg-lime-50 text-lime-800 border-lime-200 dark:bg-lime-950/60 dark:text-lime-300 dark:border-lime-800",
      dotClass: "bg-lime-500",
    };
  }

  return {
    label: "Expiring Soon",
    timeText,
    badgeClass:
      "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
    dotClass: "bg-amber-500 animate-pulse",
  };
}

function parseTerms(rawText?: string): string[] {
  if (!rawText) return [];
  const text = rawText.trim();
  if (!text) return [];

  if (text.includes("\n")) {
    return text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => l.replace(/^(\d+[\.\)]\s*|[-•*]\s*)/, "").trim());
  }

  const serialMatch = text.split(/(?=\b\d+[\.\)])/);
  if (serialMatch.length > 1) {
    return serialMatch
      .map((item) => item.trim().replace(/^\d+[\.\)]\s*/, "").trim())
      .filter(Boolean);
  }

  return [text];
}

export const WarrantyTab: React.FC<WarrantyTabProps> = ({ user, onGoHome }) => {
  const [allWarranties, setAllWarranties] = useState<WarrantyRecord[]>([]);
  const [linkedKeys, setLinkedKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedWarrantyId, setSelectedWarrantyId] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [linkInput, setLinkInput] = useState<string>("");
  const [isLinking, setIsLinking] = useState<boolean>(false);
  const [showLinkForm, setShowLinkForm] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const { get: getSetting } = useSiteSettings();
  const storeName = getSetting("store_name") || "Decor Drapes Instyle";
  const supportPhone = getSetting("primary_phone") || "+91 98459 18992";
  const supportWhatsapp = getSetting("primary_whatsapp") || "919842918992";

  const userEmail = (user?.email || "").toLowerCase().trim();
  const userPhone = (user?.phone || "").replace(/\D/g, "");

  // Fetch all warranties & linked certificates for this user
  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      try {
        const freshList = await fetchFreshWarranties();
        if (!active) return;
        setAllWarranties(freshList);

        const userUid = user?.uid;
        const localSavedKey = userUid ? `portal_linked_warranties_${userUid}` : "portal_linked_warranties_anon";
        let userLinked: string[] = [];

        try {
          const rawLocal = localStorage.getItem(localSavedKey);
          if (rawLocal) {
            userLinked = JSON.parse(rawLocal);
          }
        } catch {
          // ignore local storage error
        }

        if (userUid) {
          try {
            const linkedSnap = await get(ref(database, `users/${userUid}/linkedWarranties`));
            if (linkedSnap.exists()) {
              const data = linkedSnap.val();
              const dbKeys = Object.keys(data).map((k) => data[k]?.warrantyNumber || data[k]?.orderNumber || k);
              userLinked = Array.from(new Set([...userLinked, ...dbKeys]));
            }
          } catch (dbErr) {
            console.warn("Could not read user linked warranties from Firebase:", dbErr);
          }
        }

        if (active) {
          setLinkedKeys(userLinked);
        }
      } catch (err) {
        console.error("Error loading warranties for profile:", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [user?.uid]);

  // Filter warranties matching this user
  const matchedWarranties = useMemo(() => {
    if (!allWarranties.length) return [];

    return allWarranties.filter((w) => {
      // 1. Match by email
      const custEmail = (w.customer?.email || "").toLowerCase().trim();
      if (userEmail && custEmail && userEmail === custEmail) return true;

      // 2. Match by phone
      const custPhone = (w.customer?.mobile || "").replace(/\D/g, "");
      if (
        userPhone.length >= 10 &&
        custPhone.length >= 10 &&
        (userPhone.endsWith(custPhone.slice(-10)) || custPhone.endsWith(userPhone.slice(-10)))
      ) {
        return true;
      }

      // 3. Match by manually linked keys
      const wNum = (w.warrantyNumber || "").toLowerCase().trim();
      const oNum = (w.orderNumber || "").toLowerCase().trim();
      const idNum = (w.id || "").toLowerCase().trim();
      const qNum = (w.quotationId || "").toLowerCase().trim();

      const normalizedLinked = linkedKeys.map((k) => k.toLowerCase().trim()).filter(Boolean);

      if (
        normalizedLinked.includes(wNum) ||
        normalizedLinked.includes(oNum) ||
        normalizedLinked.includes(idNum) ||
        normalizedLinked.includes(qNum)
      ) {
        return true;
      }

      // Check product items
      if (
        (w.products || []).some(
          (p) => p.id && normalizedLinked.includes(p.id.toLowerCase().trim())
        )
      ) {
        return true;
      }

      return false;
    });
  }, [allWarranties, userEmail, userPhone, linkedKeys]);

  // Filter matched warranties by search query on overview list
  const filteredWarranties = useMemo(() => {
    if (!searchFilter.trim()) return matchedWarranties;
    const q = searchFilter.toLowerCase().trim();
    const qAlpha = q.replace(/[^a-z0-9]/g, "");

    return matchedWarranties.filter((w) => {
      const matchString = (str?: string) => {
        if (!str) return false;
        const s = str.toLowerCase();
        if (s.includes(q)) return true;
        if (qAlpha && s.replace(/[^a-z0-9]/g, "").includes(qAlpha)) return true;
        return false;
      };

      if (matchString(w.warrantyNumber)) return true;
      if (matchString(w.orderNumber)) return true;
      if (matchString(w.quotationId)) return true;
      if (matchString(w.customer?.name)) return true;
      if (matchString(w.customer?.installationAddress)) return true;
      if (matchString(w.customer?.address)) return true;

      return (w.products || []).some(
        (p) => matchString(p.id) || matchString(p.productName) || matchString(p.productCode)
      );
    });
  }, [matchedWarranties, searchFilter]);

  // Active warranty selected for detail view (null by default)
  const activeWarranty = useMemo(() => {
    if (!selectedWarrantyId) return null;
    return (
      matchedWarranties.find(
        (w) =>
          w.id === selectedWarrantyId ||
          w.warrantyNumber === selectedWarrantyId ||
          w.orderNumber === selectedWarrantyId
      ) || null
    );
  }, [matchedWarranties, selectedWarrantyId]);

  // Copy helper
  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Manual linking handler
  const handleLinkCertificate = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    const query = linkInput.trim();
    if (!query) {
      toast.error("Please enter a Warranty Number, Order Number, or Item ID");
      return;
    }

    setIsLinking(true);

    try {
      const latestList = await fetchFreshWarranties();
      setAllWarranties(latestList);

      const qLower = query.toLowerCase().trim();
      const qAlphaNum = qLower.replace(/[^a-z0-9]/g, "");

      const isExactMatch = (val?: string): boolean => {
        if (!val) return false;
        const trimmedVal = val.trim().toLowerCase();
        if (!trimmedVal) return false;
        if (trimmedVal === qLower) return true;
        if (qAlphaNum) {
          const cleanVal = trimmedVal.replace(/[^a-z0-9]/g, "");
          if (cleanVal && cleanVal === qAlphaNum) return true;
        }
        return false;
      };

      const found = latestList.find((w) => {
        if (
          isExactMatch(w.warrantyNumber) ||
          isExactMatch(w.orderNumber) ||
          isExactMatch(w.id) ||
          isExactMatch(w.quotationId)
        ) {
          return true;
        }
        return (w.products || []).some((p) => isExactMatch(p.id));
      });

      if (!found) {
        toast.error(`No warranty certificate found matching "${query}". Please check the ID or contact support.`);
        setIsLinking(false);
        return;
      }

      const keyToSave = found.warrantyNumber || found.orderNumber || found.id;
      const updatedKeys = Array.from(new Set([...linkedKeys, keyToSave, query]));
      setLinkedKeys(updatedKeys);

      const userUid = user?.uid;
      const localSavedKey = userUid ? `portal_linked_warranties_${userUid}` : "portal_linked_warranties_anon";
      localStorage.setItem(localSavedKey, JSON.stringify(updatedKeys));

      if (userUid) {
        try {
          const safeKey = encodeURIComponent(keyToSave.replace(/[.#$[\]]/g, "_"));
          await set(ref(database, `users/${userUid}/linkedWarranties/${safeKey}`), {
            warrantyNumber: found.warrantyNumber,
            orderNumber: found.orderNumber,
            linkedAt: Date.now(),
            customerName: found.customer?.name || "",
          });
        } catch (dbErr) {
          console.warn("Could not save linked warranty to Firebase:", dbErr);
        }
      }

      toast.success(`Warranty certificate ${found.warrantyNumber || found.orderNumber} linked to your account!`);
      setLinkInput("");
      setShowLinkForm(false);
      // Open the newly linked certificate
      setSelectedWarrantyId(found.id || found.warrantyNumber || found.orderNumber);
    } catch (err) {
      console.error("Linking failed:", err);
      toast.error("An error occurred while linking certificate. Please try again.");
    } finally {
      setIsLinking(false);
    }
  };

  // Unlink manual certificate
  const handleUnlink = async (warranty: WarrantyRecord) => {
    const key = warranty.warrantyNumber || warranty.orderNumber || warranty.id;
    const confirmUnlink = window.confirm(
      `Are you sure you want to unlink certificate ${key} from your profile?`
    );
    if (!confirmUnlink) return;

    const updated = linkedKeys.filter(
      (k) =>
        k.toLowerCase() !== (warranty.warrantyNumber || "").toLowerCase() &&
        k.toLowerCase() !== (warranty.orderNumber || "").toLowerCase() &&
        k.toLowerCase() !== (warranty.id || "").toLowerCase()
    );
    setLinkedKeys(updated);

    const userUid = user?.uid;
    const localSavedKey = userUid ? `portal_linked_warranties_${userUid}` : "portal_linked_warranties_anon";
    localStorage.setItem(localSavedKey, JSON.stringify(updated));

    if (userUid) {
      try {
        const safeKey = encodeURIComponent(key.replace(/[.#$[\]]/g, "_"));
        await set(ref(database, `users/${userUid}/linkedWarranties/${safeKey}`), null);
      } catch (err) {
        console.warn("Could not remove from Firebase:", err);
      }
    }

    toast.success("Certificate unlinked from your profile.");
    if (selectedWarrantyId === key || selectedWarrantyId === warranty.id) {
      setSelectedWarrantyId(null);
    }
  };

  const termsList = useMemo(() => {
    if (!activeWarranty?.warranty?.termsAndConditions) return [];
    return parseTerms(activeWarranty.warranty.termsAndConditions);
  }, [activeWarranty]);

  const activeStatus = activeWarranty
    ? getStatusBadge(
        activeWarranty.warranty?.status,
        activeWarranty.warranty?.startDate,
        activeWarranty.warranty?.endDate
      )
    : null;

  return (
    <div className="space-y-6">
      {/* ── Print Stylesheet ────────────────────────────────────────── */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 10mm 8mm;
        }

        @media print {
          *, *:before, *:after {
            box-shadow: none !important;
            text-shadow: none !important;
          }
          html, body {
            background: #ffffff !important;
            color: #0f172a !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .no-print, header, footer, nav, button, form {
            display: none !important;
          }

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

          .print-table {
            width: 100% !important;
            border-collapse: collapse !important;
            page-break-inside: auto;
            margin-top: 6px !important;
          }

          .print-table thead {
            display: table-header-group !important;
          }

          .print-table thead th {
            background-color: #f1f5f9 !important;
            font-weight: 700 !important;
            text-transform: uppercase !important;
            font-size: 7.5pt !important;
            letter-spacing: 0.05em !important;
            padding: 6px 8px !important;
            border: 1px solid #cbd5e1 !important;
            color: #0f172a !important;
          }

          .print-table tbody td {
            border: 1px solid #e2e8f0 !important;
            padding: 5px 8px !important;
            font-size: 8pt !important;
            color: #1e293b !important;
            vertical-align: top !important;
          }

          .print-table tfoot td {
            border-top: 2px solid #94a3b8 !important;
            padding: 6px 8px !important;
            font-size: 8pt !important;
            background-color: #f8fafc !important;
          }

          .print-table tr,
          .print-row {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .print-avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      {/* ── Standard Profile Header (Matches all other tabs in Profile) */}
      {activeWarranty ? (
        <TabHeader
          eyebrow="Warranty"
          title={activeWarranty.warrantyNumber}
          deskEyebrow="Warranty Certificate"
          deskTitle={activeWarranty.warrantyNumber}
          onBack={() => setSelectedWarrantyId(null)}
          extra={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedWarrantyId(null)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-neutral-800 hover:bg-slate-50 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-300 transition-colors cursor-pointer"
              >
                <ArrowLeft size={13} />
                <span>All Certificates</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 transition-all cursor-pointer shadow-xs"
              >
                <Printer size={13} />
                <span>Print / PDF</span>
              </button>
            </div>
          }
        />
      ) : (
        <TabHeader
          eyebrow=""
          title="Warranty"
          deskTitle="Warranty Certificates"
          onBack={onGoHome}
          search={matchedWarranties.length > 2 ? searchFilter : undefined}
          setSearch={matchedWarranties.length > 2 ? setSearchFilter : undefined}
          placeholder="Search certificates..."
          extra={
            <button
              type="button"
              onClick={() => setShowLinkForm((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3.5 py-2 text-xs font-bold text-white dark:bg-white dark:text-slate-900 hover:opacity-90 transition cursor-pointer"
            >
              <Plus size={14} />
              <span>Link Certificate</span>
            </button>
          }
        />
      )}

      {/* ── Loading State ─────────────────────────────────────────────── */}
      {loading && (
        <div className="rounded-2xl border border-slate-200 dark:border-neutral-800 p-12 text-center bg-white dark:bg-neutral-900 animate-pulse space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-neutral-800 mx-auto" />
          <div className="h-4 bg-slate-200 dark:bg-neutral-800 rounded w-1/3 mx-auto" />
          <div className="h-3 bg-slate-100 dark:bg-neutral-800/60 rounded w-1/4 mx-auto" />
        </div>
      )}

      {/* ── Collapsible / Manual Link Form ───────────────────────────── */}
      {!loading && (showLinkForm || matchedWarranties.length === 0) && (
        <div className="no-print rounded-2xl border border-sky-200/90 dark:border-sky-900/40 bg-sky-50/60 dark:bg-sky-950/20 p-5 sm:p-7 space-y-4 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-300 flex items-center justify-center shrink-0">
              <Shield size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {matchedWarranties.length === 0
                    ? "No Warranty Certificate Automatically Found"
                    : "Link Additional Warranty Certificate"}
                </h3>
                {showLinkForm && matchedWarranties.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowLinkForm(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200 transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-neutral-400 mt-1 leading-relaxed">
                {matchedWarranties.length === 0 ? (
                  <>
                    We searched for certificates registered directly to{" "}
                    <strong className="text-slate-900 dark:text-white font-semibold">
                      {user.email || user.displayName}
                    </strong>
                    . If your warranty was registered under another order reference or phone, enter your
                    Warranty ID, Order Number, or Item ID below to link it permanently.
                  </>
                ) : (
                  "Enter any additional Order Number, Warranty ID, or Item ID to keep all your certificates organized under your profile."
                )}
              </p>
            </div>
          </div>

          <form onSubmit={handleLinkCertificate} className="pt-1">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  placeholder="Enter Warranty ID, Order Number, or Item ID"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={isLinking || !linkInput.trim()}
                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
              >
                {isLinking ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Plus size={15} />
                    <span>Link Certificate</span>
                  </>
                )}
              </button>
            </div>

            <div className="mt-3.5 pt-3 border-t border-sky-200/60 dark:border-sky-900/30 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-neutral-400">
              <span className="flex items-center gap-1.5">
                <Phone size={12} className="text-sky-600 dark:text-sky-400" />
                <span>Need assistance? Call {supportPhone}</span>
              </span>
              <span>Our team can also link your warranty directly.</span>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. OVERVIEW CARDS VIEW (DEFAULT - NOT OPENED BY DEFAULT)                   */}
      {/* ========================================================================= */}
      {!loading && !activeWarranty && (
        <div className="space-y-5">
          {/* Status bar */}
          {matchedWarranties.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Registered Certificates
                </h2>
                <p className="text-xs text-slate-500 dark:text-neutral-400">
                  {matchedWarranties.length} certificate{matchedWarranties.length > 1 ? "s" : ""} registered to your account. Select a card to view complete coverage details.
                </p>
              </div>

              {matchedWarranties.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowLinkForm((prev) => !prev)}
                  className="self-start sm:self-auto inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Link another certificate</span>
                </button>
              )}
            </div>
          )}

          {/* Cards Grid */}
          {filteredWarranties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredWarranties.map((w) => {
                const status = getStatusBadge(
                  w.warranty?.status,
                  w.warranty?.startDate,
                  w.warranty?.endDate
                );
                const itemsCount = w.products?.length || 0;
                const isManuallyLinked = linkedKeys.includes(w.warrantyNumber || "") || linkedKeys.includes(w.orderNumber || "");

                return (
                  <article
                    key={w.id || w.warrantyNumber}
                    onClick={() => setSelectedWarrantyId(w.id || w.warrantyNumber || w.orderNumber)}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md cursor-pointer dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
                  >
                    {/* Top Row: Status badge & Copy */}
                    <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-neutral-800">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider border ${status.badgeClass}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dotClass}`} />
                        <span>{status.label}</span>
                      </span>

                      <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                        <span>{status.timeText}</span>
                      </div>
                    </div>

                    {/* Certificate Identification */}
                    <div className="py-3.5 space-y-2">
                      <div>
                        <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block font-medium">
                          Warranty ID
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <h3 className="font-mono text-base font-bold text-slate-900 dark:text-white tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {w.warrantyNumber || "—"}
                          </h3>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(w.warrantyNumber, `card_${w.warrantyNumber}`);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                            title="Copy Warranty ID"
                          >
                            {copiedKey === `card_${w.warrantyNumber}` ? (
                              <Check size={12} className="text-emerald-500" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                        <div>
                          <span className="text-[9px] uppercase text-slate-400 block font-sans">Order Ref</span>
                          <span className="font-semibold text-slate-700 dark:text-neutral-300 truncate block">
                            {w.orderNumber || w.quotationId || "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase text-slate-400 block font-sans">Coverage</span>
                          <span className="font-semibold text-slate-700 dark:text-neutral-300 block">
                            {w.warranty?.warrantyPeriodLabel || `${w.warranty?.durationMonths || 12}m`}
                          </span>
                        </div>
                      </div>

                      {/* Site Address or Customer Preview */}
                      {w.customer?.installationAddress ? (
                        <div className="pt-1 flex items-start gap-1.5 text-[11px] text-slate-600 dark:text-neutral-400">
                          <MapPin size={12} className="text-amber-500 shrink-0 mt-0.5" />
                          <span className="truncate">{w.customer.installationAddress}</span>
                        </div>
                      ) : w.customer?.name ? (
                        <div className="pt-1 text-[11px] text-slate-500 dark:text-neutral-400 truncate">
                          Client: {w.customer.name}
                        </div>
                      ) : null}
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="pt-3 border-t border-slate-100 dark:border-neutral-800 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-slate-500 dark:text-neutral-400">
                        <Package size={12} />
                        <span>{itemsCount} Item{itemsCount === 1 ? "" : "s"}</span>
                      </span>

                      <div className="flex items-center gap-2">
                        {isManuallyLinked && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnlink(w);
                            }}
                            className="p-1 rounded text-red-500 hover:text-red-700 transition-colors"
                            title="Unlink from profile"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}

                        <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-900 dark:text-white group-hover:translate-x-0.5 transition-transform">
                          <span>View Certificate</span>
                          <ChevronRight size={14} className="text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white" />
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : matchedWarranties.length > 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-neutral-800 p-8 text-center text-xs text-slate-500 dark:text-neutral-400 space-y-2">
              <p>No certificates match your search query "{searchFilter}".</p>
              <button
                type="button"
                onClick={() => setSearchFilter("")}
                className="text-xs font-semibold text-slate-900 dark:text-white underline cursor-pointer"
              >
                Clear Search Filter
              </button>
            </div>
          ) : null}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. OPENED CERTIFICATE DETAILS VIEW (ONLY WHEN USER CLICKS A CARD)          */}
      {/* ========================================================================= */}
      {!loading && activeWarranty && (
        <div className="space-y-4">
          {/* Back button strip (no-print) */}
          <div className="no-print flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setSelectedWarrantyId(null)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-neutral-300 dark:hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back to all certificates ({matchedWarranties.length})</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors shadow-2xs"
            >
              <Printer size={13} />
              <span>Print A4 / PDF</span>
            </button>
          </div>

          {/* Certificate Document */}
          <article className="print-clean border border-slate-200 dark:border-neutral-800 rounded-2xl sm:rounded-3xl bg-white dark:bg-neutral-900 p-5 sm:p-9 space-y-7 shadow-sm print:p-0 print:border-none print:shadow-none print:rounded-none print:space-y-4">
            {/* Header */}
            <div className="print-avoid-break flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 dark:border-neutral-800 pb-5 print:pb-3 print:border-neutral-300">
              <div className="space-y-1">
                <span className="text-[10px] font-mono tracking-widest text-slate-400 dark:text-neutral-500 uppercase block print:text-[8pt] print:text-neutral-700 print:font-semibold">
                  {storeName}
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white print:text-xl print:text-neutral-950">
                  Warranty Certificate
                </h1>
                <p className="text-xs font-mono text-slate-500 dark:text-neutral-400 print:text-[9pt] print:text-neutral-700">
                  Order <strong className="text-slate-900 dark:text-neutral-100 font-semibold print:text-black">{activeWarranty.orderNumber}</strong> • Warranty ID <strong className="text-slate-900 dark:text-neutral-100 font-semibold print:text-black">{activeWarranty.warrantyNumber}</strong>
                </p>
              </div>

              {activeStatus && (
                <div className="flex items-center shrink-0">
                  <span
                    className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold uppercase tracking-wider border shadow-2xs print:px-2.5 print:py-0.5 print:text-[8pt] print:border-neutral-400 print:bg-neutral-100 print:text-neutral-900 ${activeStatus.badgeClass}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${activeStatus.dotClass} print:hidden`} />
                    <span>{activeStatus.label} • {activeStatus.timeText}</span>
                  </span>
                </div>
              )}
            </div>

            {/* Key Information 4-Grid */}
            <div className="print-avoid-break grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono border-b border-slate-100 dark:border-neutral-800 pb-5 print:pb-3 print:gap-2 print:border-neutral-300">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-sans font-medium">Order Number</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <strong className="text-slate-900 dark:text-white text-sm">{activeWarranty.orderNumber}</strong>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(activeWarranty.orderNumber, "orderNum")}
                    className="no-print text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200 transition-colors"
                    title="Copy Order Number"
                  >
                    {copiedKey === "orderNum" ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-sans font-medium">Warranty ID</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <strong className="text-slate-900 dark:text-white text-sm">{activeWarranty.warrantyNumber}</strong>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(activeWarranty.warrantyNumber, "warrantyNum")}
                    className="no-print text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200 transition-colors"
                    title="Copy Warranty ID"
                  >
                    {copiedKey === "warrantyNum" ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-sans font-medium">Quotation Ref</span>
                <span className="text-slate-800 dark:text-neutral-200 text-sm mt-1 block truncate">
                  {activeWarranty.quotationId || "—"}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-sans font-medium">Coverage Period</span>
                <span className="text-slate-800 dark:text-neutral-200 text-sm mt-1 block">
                  {activeWarranty.warranty?.warrantyPeriodLabel || `${activeWarranty.warranty?.durationMonths || 12}m`}
                </span>
              </div>
            </div>

            {/* Dates & Customer Details */}
            <div className="print-avoid-break grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs border-b border-slate-100 dark:border-neutral-800 pb-5 print:pb-3 print:gap-3 print:border-neutral-300">
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-sans font-medium">
                  Validity Period
                </span>
                <div className="flex items-baseline justify-between py-1.5 border-b border-slate-100 dark:border-neutral-800 font-mono">
                  <span className="text-slate-500 dark:text-neutral-400">Effective Date:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{formatDate(activeWarranty.warranty?.startDate)}</span>
                </div>
                <div className="flex items-baseline justify-between py-1.5 border-b border-slate-100 dark:border-neutral-800 font-mono">
                  <span className="text-slate-500 dark:text-neutral-400">Expiration Date:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{formatDate(activeWarranty.warranty?.endDate)}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-sans font-medium">
                  Registered Customer &amp; Site
                </span>
                <p className="font-semibold text-slate-900 dark:text-white text-sm">
                  {activeWarranty.customer?.name || user.displayName || "Customer"}
                </p>
                <p className="text-slate-500 dark:text-neutral-400 font-mono text-xs">
                  {activeWarranty.customer?.mobile || user.phone || "—"} • {activeWarranty.customer?.email || user.email}
                </p>
                {activeWarranty.customer?.installationAddress && (
                  <div className="mt-1 p-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 text-xs">
                    <span className="flex items-start gap-1.5">
                      <MapPin size={13} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <span><strong>Site:</strong> {activeWarranty.customer.installationAddress}</span>
                    </span>
                  </div>
                )}
                {activeWarranty.customer?.address && (
                  <p className="text-slate-500 dark:text-neutral-400 text-[11px] leading-relaxed pt-0.5">
                    <strong>Billing:</strong> {activeWarranty.customer.address}
                  </p>
                )}
                {activeWarranty.customer?.gstin && (
                  <p className="text-slate-400 font-mono text-[10px]">
                    GSTIN: {activeWarranty.customer.gstin}
                  </p>
                )}
              </div>
            </div>

            {/* Covered Products Section */}
            <div className="space-y-4 print:space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-sans font-medium">
                  Covered Products ({activeWarranty.products?.length || 0})
                </span>
              </div>

              {/* SCREEN VIEW: 2-Column on Mobile, 2 or 3 Columns on Desktop */}
              <div className="no-print grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {activeWarranty.products?.map((item: WarrantyProductItem, idx: number) => {
                  const isNoWarranty = Boolean(
                    item.hasWarranty === false ||
                    item.warrantyPeriod?.trim().toLowerCase() === "none" ||
                    item.warrantyPeriod?.trim().toLowerCase() === "no warranty" ||
                    (item.noWarrantyReason && item.noWarrantyReason.trim().length > 0 && item.warrantyPeriod?.trim().toLowerCase() === "none")
                  );

                  return (
                    <div
                      key={item.id || idx}
                      className="rounded-2xl border border-slate-200 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-800/40 p-3.5 space-y-2.5 transition-all hover:border-slate-300 dark:hover:border-neutral-700 flex flex-col justify-between"
                    >
                      <div className="space-y-2.5">
                        {/* 1:1 Square Image */}
                        {item.productImage && (
                          <div className="w-full aspect-square rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700/80 p-2 flex items-center justify-center overflow-hidden relative group">
                            <img
                              src={item.productImage}
                              alt={item.productName}
                              onClick={() => setPreviewImage(item.productImage || null)}
                              className="w-full h-full object-contain cursor-pointer group-hover:scale-105 transition-transform duration-200"
                            />
                            <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[8px] font-mono px-1 rounded pointer-events-none">
                              Zoom
                            </span>
                          </div>
                        )}

                        {/* Item ID Badge Prominent on Top */}
                        <div className="flex items-center justify-between gap-1.5 pb-1.5 border-b border-slate-200/80 dark:border-neutral-800">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-slate-900 text-white dark:bg-white dark:text-slate-900 shrink-0">
                            <span>ID:</span>
                            <span>{item.id}</span>
                          </span>

                          <button
                            type="button"
                            onClick={() => copyToClipboard(item.id, `item_${item.id}`)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                            title="Copy Item ID"
                          >
                            {copiedKey === `item_${item.id}` ? (
                              <Check size={11} className="text-emerald-500" />
                            ) : (
                              <Copy size={11} />
                            )}
                          </button>
                        </div>

                        {/* Product Info */}
                        <div className="space-y-0.5">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                            {item.productName}
                          </h4>
                          {item.productCode && (
                            <p className="text-[10px] sm:text-[11px] font-mono text-slate-500 dark:text-neutral-400">
                              Code: {item.productCode}
                            </p>
                          )}
                        </div>

                        {/* Warranty Status */}
                        {isNoWarranty ? (
                          <div className="space-y-1 pt-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-900">
                              <ShieldAlert size={11} className="shrink-0" />
                              <span>No Warranty</span>
                            </span>
                            {item.noWarrantyReason && (
                              <p className="text-[10px] text-rose-700/90 dark:text-rose-400/90 bg-rose-50/50 dark:bg-rose-950/30 p-1.5 rounded border border-rose-100 dark:border-rose-900/30 leading-tight">
                                {item.noWarrantyReason}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1 pt-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                              <ShieldCheck size={11} className="shrink-0 text-emerald-500" />
                              <span>{item.warrantyPeriod || "Active Coverage"}</span>
                            </span>
                            {item.productSpecificWarranty && (
                              <p className="text-[10px] text-slate-600 dark:text-neutral-400 leading-tight">
                                {item.productSpecificWarranty}
                              </p>
                            )}
                          </div>
                        )}

                        {item.productSpecification && (
                          <p className="text-[10px] text-slate-500 dark:text-neutral-400 font-mono bg-white dark:bg-neutral-900 p-2 rounded border border-slate-100 dark:border-neutral-800 line-clamp-3 leading-snug">
                            {item.productSpecification}
                          </p>
                        )}
                      </div>

                      {item.totalAmount ? (
                        <div className="pt-2 border-t border-slate-200/60 dark:border-neutral-800 flex items-baseline justify-between text-[11px] font-mono">
                          <span className="text-slate-400 text-[9px] uppercase font-sans">Value</span>
                          <strong className="text-slate-900 dark:text-white">
                            ₹{item.totalAmount.toLocaleString("en-IN")}
                          </strong>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              {/* PDF / PRINT VIEW: Clean Professional Table (No Images, Exact Page Breaks) */}
              <div className="hidden print:block w-full overflow-hidden rounded-xl border border-neutral-300">
                <table className="w-full text-left border-collapse print-table">
                  <thead>
                    <tr className="bg-neutral-100 border-b border-neutral-300 font-mono text-[9px] uppercase tracking-wider text-neutral-700">
                      <th className="py-2 px-2.5 w-8">#</th>
                      <th className="py-2 px-2.5 w-28">Item ID</th>
                      <th className="py-2 px-2.5">Product &amp; Specifications</th>
                      <th className="py-2 px-2.5 w-28">Code / Category</th>
                      <th className="py-2 px-2.5 w-36">Warranty Status</th>
                      <th className="py-2 px-2.5 text-right w-24">Validity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 text-xs">
                    {activeWarranty.products?.map((item: WarrantyProductItem, idx: number) => {
                      const isNoWarranty = Boolean(
                        item.hasWarranty === false ||
                        item.warrantyPeriod?.trim().toLowerCase() === "none" ||
                        item.warrantyPeriod?.trim().toLowerCase() === "no warranty"
                      );

                      return (
                        <tr key={item.id || idx} className="print-row">
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
                              {item.productCode || "—"}
                            </span>
                            {item.productCategory && (
                              <span className="text-neutral-500 block">
                                {item.productCategory}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-2.5 font-mono text-[10px] align-top">
                            {isNoWarranty ? (
                              <span className="font-bold text-rose-700 block">No Warranty</span>
                            ) : (
                              <span className="font-semibold text-emerald-800 block">
                                {item.warrantyPeriod || "Active"}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-2.5 font-mono text-[10px] text-right align-top">
                            {item.warrantyPeriod || activeWarranty.warranty?.warrantyPeriodLabel || "5 Years"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary (if available) */}
            {activeWarranty.summary && (
              <div className="print-avoid-break border-t border-slate-100 dark:border-neutral-800 pt-4 flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono text-slate-500 dark:text-neutral-400 gap-2 print:pt-2 print:border-neutral-300">
                <span>Total Items: {activeWarranty.summary.totalProducts}</span>
                <div className="flex flex-wrap items-center gap-4">
                  <span>Subtotal: ₹{activeWarranty.summary.subTotal.toLocaleString("en-IN")}</span>
                  <span>GST: ₹{activeWarranty.summary.totalGst.toLocaleString("en-IN")}</span>
                  <strong className="text-slate-900 dark:text-white text-sm print:text-sm">
                    Grand Total: ₹{activeWarranty.summary.grandTotal.toLocaleString("en-IN")}
                  </strong>
                </div>
              </div>
            )}

            {/* Terms and Conditions */}
            {termsList.length > 0 && (
              <div className="print-terms print-avoid-break border-t border-slate-100 dark:border-neutral-800 pt-5 space-y-2.5 print:pt-2 print:border-neutral-300">
                <span className="font-mono uppercase tracking-wider text-[10px] text-slate-400 block font-sans font-medium print:text-neutral-700 print:font-semibold">
                  Official Terms &amp; Conditions
                </span>
                <ol className="space-y-1.5 text-xs text-slate-600 dark:text-neutral-400 print:text-[8pt] print:text-neutral-800">
                  {termsList.map((term, idx) => (
                    <li key={idx} className="print-avoid-break flex items-start gap-2 leading-relaxed print:leading-snug">
                      <span className="font-mono text-[10px] font-semibold text-slate-400 dark:text-neutral-500 shrink-0 mt-0.5 print:text-[8pt] print:text-neutral-600">
                        {String(idx + 1).padStart(2, "0")}.
                      </span>
                      <span>{term}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Official Print Footer / Authentication Seal */}
            <div className="hidden print:flex items-center justify-between pt-3 border-t border-neutral-300 text-[7.5pt] font-mono text-neutral-600 print-avoid-break">
              <span>Verified Certificate • Digitally Tracked</span>
              <span>Issued by {storeName}</span>
              <span>Valid across authorized service locations</span>
            </div>

            {/* Bottom Actions Bar (no-print) */}
            <div className="no-print pt-5 border-t border-slate-100 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition-all cursor-pointer shadow-xs w-full sm:w-auto"
                >
                  <Printer size={13} />
                  <span>Print Certificate / PDF</span>
                </button>

                <a
                  href={`https://wa.me/${supportWhatsapp}?text=${encodeURIComponent(
                    `Hello ${storeName}, I am contacting you regarding warranty claim for Warranty No: ${activeWarranty.warrantyNumber} (Order: ${activeWarranty.orderNumber}).`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all cursor-pointer shadow-xs w-full sm:w-auto"
                >
                  <MessageCircle size={13} />
                  <span>WhatsApp Support</span>
                </a>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => copyToClipboard(activeWarranty.warrantyNumber, "bottomCopy")}
                  className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
                >
                  {copiedKey === "bottomCopy" ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  <span>Copy ID</span>
                </button>

                {linkedKeys.includes(activeWarranty.warrantyNumber || "") && (
                  <button
                    type="button"
                    onClick={() => handleUnlink(activeWarranty)}
                    className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors cursor-pointer ml-3"
                    title="Remove manual link from your profile"
                  >
                    <Trash2 size={12} />
                    <span>Unlink</span>
                  </button>
                )}
              </div>
            </div>
          </article>
        </div>
      )}

      {/* ── Image Lightbox Modal ─────────────────────────────────────── */}
      {previewImage && (
        <div
          className="no-print fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-xl max-h-[85vh] bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden p-3 border border-neutral-800 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-mono text-neutral-400">Product Image Preview</span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <img
              src={previewImage}
              alt="Enlarged view"
              className="w-auto h-auto max-w-full max-h-[70vh] object-contain block mx-auto rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default WarrantyTab;
