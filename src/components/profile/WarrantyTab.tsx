import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  FormEvent,
} from "react";
import {
  ShieldCheck,
  ShieldAlert,
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
  ChevronRight,
  ChevronDown,
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

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const DAY = 24 * 60 * 60 * 1000;
const EXPIRING_SOON_DAYS = 90;
const TERMS_PREVIEW_COUNT = 3;

const norm = (value?: string) => (value || "").toLowerCase().trim();
const alnum = (value?: string) => norm(value).replace(/[^a-z0-9]/g, "");

const parseTime = (value?: string) => {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
};

function formatDate(dateStr?: string) {
  const time = parseTime(dateStr);
  if (time === null) return dateStr || "—";
  return new Date(time).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const inr = (value?: number | string) =>
  `₹${(Number(value) || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

function coverageLabel(w: WarrantyRecord) {
  const label = w.warranty?.warrantyPeriodLabel;
  if (label) return label;
  const months = Number(w.warranty?.durationMonths);
  if (!months) return "—";
  return months % 12 === 0 ? plural(months / 12, "year") : plural(months, "month");
}

const hasNoWarranty = (item: WarrantyProductItem) => {
  const period = norm(item.warrantyPeriod);
  return item.hasWarranty === false || period === "none" || period === "no warranty";
};

type Tone = "active" | "soon" | "expired";

interface WarrantyStatus {
  tone: Tone;
  label: string;
  timeText: string;
  /** share of the coverage period still left, 0–100 (null when dates are missing) */
  remainingPct: number | null;
}

const TONE: Record<Tone, { chip: string; bar: string }> = {
  active: {
    chip: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    bar: "bg-emerald-500",
  },
  soon: {
    chip: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    bar: "bg-amber-500",
  },
  expired: {
    chip: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
    bar: "bg-rose-500",
  },
};

function describeRemaining(remainingMs: number) {
  const days = Math.ceil(remainingMs / DAY);
  const months = Math.round(days / 30.4375);
  const years = Math.floor(months / 12);
  const extraMonths = months % 12;

  if (years > 0 && extraMonths > 0) return `${years} yr ${extraMonths} mo left`;
  if (years > 0) return `${plural(years, "year")} left`;
  if (months > 0) return `${plural(months, "month")} left`;
  return `${plural(days, "day")} left`;
}

function getStatus(status?: string, startDate?: string, endDate?: string): WarrantyStatus {
  const explicitlyExpired = norm(status) === "expired";
  const end = parseTime(endDate);

  if (end === null) {
    return explicitlyExpired
      ? { tone: "expired", label: "Expired", timeText: "Coverage ended", remainingPct: null }
      : { tone: "active", label: "Active", timeText: "Coverage active", remainingPct: null };
  }

  const remainingMs = end - Date.now();
  if (explicitlyExpired || remainingMs <= 0) {
    return { tone: "expired", label: "Expired", timeText: "", remainingPct: 0 };
  }

  const start = parseTime(startDate);
  const remainingPct =
    start !== null && end > start
      ? Math.min(100, Math.max(0, (remainingMs / (end - start)) * 100))
      : null;

  const soon = remainingMs <= EXPIRING_SOON_DAYS * DAY;
  return {
    tone: soon ? "soon" : "active",
    label: soon ? "Expiring soon" : "Active",
    timeText: describeRemaining(remainingMs),
    remainingPct,
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

const linkedStorageKey = (uid?: string) =>
  uid ? `portal_linked_warranties_${uid}` : "portal_linked_warranties_anon";

const warrantyKey = (w: WarrantyRecord) => w.id || w.warrantyNumber || w.orderNumber;

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

const Panel: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className = "",
  children,
}) => (
  <section
    className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 sm:p-6 print:mb-3 print:rounded-none print:border-0 print:border-b print:border-neutral-300 print:bg-transparent print:p-0 print:pb-3 print:shadow-none ${className}`}
  >
    {children}
  </section>
);

const PanelTitle: React.FC<{ children: React.ReactNode; aside?: React.ReactNode }> = ({
  children,
  aside,
}) => (
  <div className="mb-4 flex items-baseline justify-between gap-3">
    <h2 className="text-sm font-bold text-slate-900 dark:text-white print:text-[10pt]">{children}</h2>
    {aside && <span className="text-xs text-slate-500 dark:text-neutral-400">{aside}</span>}
  </div>
);

const StatusChip: React.FC<{ status: WarrantyStatus; className?: string }> = ({
  status,
  className = "",
}) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${TONE[status.tone].chip} print:border print:border-neutral-400 print:bg-transparent print:text-neutral-900 ${className}`}
  >
    {status.label}
  </span>
);

const CopyButton: React.FC<{ copied: boolean; label: string; onClick: () => void }> = ({
  copied,
  label,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    title={label}
    className="no-print inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-neutral-800 dark:hover:text-white"
  >
    {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
  </button>
);

const Fact: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
    <dt className="text-sm text-slate-500 dark:text-neutral-400 print:text-[9pt]">{label}</dt>
    <dd className="flex min-w-0 items-center gap-0.5 text-right text-sm font-semibold text-slate-900 dark:text-white print:text-[9pt]">
      {children}
    </dd>
  </div>
);

const ListSkeleton = () => (
  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div className="space-y-3 p-4 pb-4">
          <div className="flex justify-between">
            <div className="skeleton h-6 w-20 rounded-full" />
            <div className="skeleton h-4 w-16 rounded" />
          </div>
          <div className="skeleton h-5 w-2/3 rounded" />
          <div className="skeleton h-3.5 w-1/2 rounded" />
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 dark:border-neutral-800">
          <div className="skeleton h-8 w-24 rounded" />
          <div className="skeleton h-8 w-8 rounded-full" />
        </div>
      </div>
    ))}
  </div>
);

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export const WarrantyTab: React.FC<WarrantyTabProps> = ({ user, onGoHome }) => {
  const [allWarranties, setAllWarranties] = useState<WarrantyRecord[]>([]);
  const [linkedKeys, setLinkedKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedWarrantyId, setSelectedWarrantyId] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [linkInput, setLinkInput] = useState<string>("");
  const [linkError, setLinkError] = useState<string>("");
  const [isLinking, setIsLinking] = useState<boolean>(false);
  const [showLinkForm, setShowLinkForm] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [unlinkTarget, setUnlinkTarget] = useState<WarrantyRecord | null>(null);
  const [termsOpen, setTermsOpen] = useState<boolean>(false);

  const linkInputRef = useRef<HTMLInputElement>(null);
  const isFirstRender = useRef(true);

  const { get: getSetting } = useSiteSettings();
  const storeName = getSetting("store_name") || "Decor Drapes Instyle";
  const supportPhone = getSetting("primary_phone") || "+91 98459 18992";
  const supportWhatsapp = getSetting("primary_whatsapp") || "919842918992";

  const userEmail = norm(user?.email);
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
        let userLinked: string[] = [];

        try {
          const rawLocal = localStorage.getItem(linkedStorageKey(userUid));
          if (rawLocal) userLinked = JSON.parse(rawLocal);
        } catch {
          // ignore local storage errors
        }

        if (userUid) {
          try {
            const linkedSnap = await get(ref(database, `users/${userUid}/linkedWarranties`));
            if (linkedSnap.exists()) {
              const data = linkedSnap.val();
              const dbKeys = Object.keys(data).map(
                (k) => data[k]?.warrantyNumber || data[k]?.orderNumber || k
              );
              userLinked = Array.from(new Set([...userLinked, ...dbKeys]));
            }
          } catch (dbErr) {
            console.warn("Could not read user linked warranties from Firebase:", dbErr);
          }
        }

        if (active) setLinkedKeys(userLinked);
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

  /* ---------- matching ---------- */

  // Registered directly to this account (email or phone)
  const isAutoMatch = useCallback(
    (w: WarrantyRecord) => {
      const custEmail = norm(w.customer?.email);
      if (userEmail && custEmail && userEmail === custEmail) return true;

      const custPhone = (w.customer?.mobile || "").replace(/\D/g, "");
      return (
        userPhone.length >= 10 &&
        custPhone.length >= 10 &&
        (userPhone.endsWith(custPhone.slice(-10)) || custPhone.endsWith(userPhone.slice(-10)))
      );
    },
    [userEmail, userPhone]
  );

  // Linked by the user with an order / warranty / item reference
  const linkedSet = useMemo(
    () => new Set(linkedKeys.map(norm).filter(Boolean)),
    [linkedKeys]
  );

  const isLinked = useCallback(
    (w: WarrantyRecord) => {
      const ids = [
        w.warrantyNumber,
        w.orderNumber,
        w.id,
        w.quotationId,
        ...(w.products || []).map((p) => p.id),
      ];
      return ids.some((id) => {
        const key = norm(id);
        return !!key && linkedSet.has(key);
      });
    },
    [linkedSet]
  );

  const matchedWarranties = useMemo(
    () => allWarranties.filter((w) => isAutoMatch(w) || isLinked(w)),
    [allWarranties, isAutoMatch, isLinked]
  );

  const filteredWarranties = useMemo(() => {
    const q = searchFilter.toLowerCase().trim();
    if (!q) return matchedWarranties;
    const qAlpha = q.replace(/[^a-z0-9]/g, "");

    const matches = (str?: string) => {
      if (!str) return false;
      const s = str.toLowerCase();
      if (s.includes(q)) return true;
      return !!qAlpha && s.replace(/[^a-z0-9]/g, "").includes(qAlpha);
    };

    return matchedWarranties.filter(
      (w) =>
        matches(w.warrantyNumber) ||
        matches(w.orderNumber) ||
        matches(w.quotationId) ||
        matches(w.customer?.name) ||
        matches(w.customer?.installationAddress) ||
        matches(w.customer?.address) ||
        (w.products || []).some(
          (p) => matches(p.id) || matches(p.productName) || matches(p.productCode)
        )
    );
  }, [matchedWarranties, searchFilter]);

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

  const activeStatus = activeWarranty
    ? getStatus(
        activeWarranty.warranty?.status,
        activeWarranty.warranty?.startDate,
        activeWarranty.warranty?.endDate
      )
    : null;

  const termsList = useMemo(
    () => parseTerms(activeWarranty?.warranty?.termsAndConditions),
    [activeWarranty]
  );

  /* ---------- view behaviour ---------- */

  // Start each view at the top
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTermsOpen(false);
  }, [selectedWarrantyId]);

  // Focus the field when the link form is opened
  useEffect(() => {
    if (!showLinkForm) return;
    const frame = window.requestAnimationFrame(() =>
      linkInputRef.current?.focus({ preventScroll: true })
    );
    return () => window.cancelAnimationFrame(frame);
  }, [showLinkForm]);

  // Escape closes dialogs
  useEffect(() => {
    if (!previewImage && !unlinkTarget) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPreviewImage(null);
        setUnlinkTarget(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewImage, unlinkTarget]);

  const openWarranty = (w: WarrantyRecord) => {
    setShowLinkForm(false);
    setSelectedWarrantyId(warrantyKey(w));
  };

  const copyToClipboard = async (text: string | undefined, key: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      toast.error("Couldn't copy. Please copy it manually.");
      return;
    }
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey((current) => (current === key ? null : current)), 1800);
  };

  /* ---------- link / unlink ---------- */

  const handleLinkCertificate = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    const query = linkInput.trim();
    if (!query) {
      setLinkError("Enter a Warranty ID, order number or item ID.");
      return;
    }

    setIsLinking(true);
    setLinkError("");

    try {
      const latestList = await fetchFreshWarranties();
      setAllWarranties(latestList);

      const qLower = query.toLowerCase();
      const qAlphaNum = qLower.replace(/[^a-z0-9]/g, "");

      const isExactMatch = (val?: string): boolean => {
        const trimmed = norm(val);
        if (!trimmed) return false;
        if (trimmed === qLower) return true;
        return !!qAlphaNum && trimmed.replace(/[^a-z0-9]/g, "") === qAlphaNum;
      };

      const found = latestList.find(
        (w) =>
          isExactMatch(w.warrantyNumber) ||
          isExactMatch(w.orderNumber) ||
          isExactMatch(w.id) ||
          isExactMatch(w.quotationId) ||
          (w.products || []).some((p) => isExactMatch(p.id))
      );

      if (!found) {
        setLinkError(`No certificate found for "${query}". Check the number or contact support.`);
        return;
      }

      const keyToSave = found.warrantyNumber || found.orderNumber || found.id;
      const updatedKeys = Array.from(new Set([...linkedKeys, keyToSave, query]));
      setLinkedKeys(updatedKeys);

      const userUid = user?.uid;
      try {
        localStorage.setItem(linkedStorageKey(userUid), JSON.stringify(updatedKeys));
      } catch {
        // ignore local storage errors
      }

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

      toast.success(`${found.warrantyNumber || found.orderNumber} linked to your account`);
      setLinkInput("");
      setShowLinkForm(false);
      setSelectedWarrantyId(warrantyKey(found));
    } catch (err) {
      console.error("Linking failed:", err);
      toast.error("Something went wrong while linking. Please try again.");
    } finally {
      setIsLinking(false);
    }
  };

  const confirmUnlink = async () => {
    const warranty = unlinkTarget;
    if (!warranty) return;
    setUnlinkTarget(null);

    // Drop every saved reference that points at this certificate
    const ids = new Set(
      [
        warranty.warrantyNumber,
        warranty.orderNumber,
        warranty.id,
        warranty.quotationId,
        ...(warranty.products || []).map((p) => p.id),
      ]
        .map(alnum)
        .filter(Boolean)
    );
    const updated = linkedKeys.filter((k) => !ids.has(alnum(k)));
    setLinkedKeys(updated);

    const userUid = user?.uid;
    try {
      localStorage.setItem(linkedStorageKey(userUid), JSON.stringify(updated));
    } catch {
      // ignore local storage errors
    }

    if (userUid) {
      try {
        const key = warranty.warrantyNumber || warranty.orderNumber || warranty.id;
        const safeKey = encodeURIComponent(key.replace(/[.#$[\]]/g, "_"));
        await set(ref(database, `users/${userUid}/linkedWarranties/${safeKey}`), null);
      } catch (err) {
        console.warn("Could not remove from Firebase:", err);
      }
    }

    toast.success("Certificate removed from your profile");
    setSelectedWarrantyId(null);
  };

  /* ---------- link form ---------- */

  const noCertificates = !loading && matchedWarranties.length === 0;
  const linkFormOpen = !activeWarranty && !loading && (showLinkForm || noCertificates);
  const whoLabel = user.email || user.displayName || "your account";

  const linkForm = (
    <div className="no-print">
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
          linkFormOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
        aria-hidden={!linkFormOpen}
      >
        <div className="-m-1 overflow-hidden p-1">
          <form
            onSubmit={handleLinkCertificate}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {noCertificates ? "Link your warranty certificate" : "Link another certificate"}
                </h2>
                <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-500 dark:text-neutral-400">
                  {noCertificates ? (
                    <>
                      We couldn&apos;t find a certificate registered to{" "} <span className="font-medium text-slate-700 dark:text-neutral-200">{whoLabel}</span>. If it was issued under a different email or phone, enter its Warranty ID, order number or item ID and we&apos;ll add it to your profile.
                    </>
                  ) : (
                    "Enter a Warranty ID, order number or item ID to add it to your profile."
                  )}
                </p>
              </div>
              {!noCertificates && (
                <button
                  type="button"
                  onClick={() => setShowLinkForm(false)}
                  aria-label="Close"
                  tabIndex={linkFormOpen ? 0 : -1}
                  className="-mr-1 -mt-1 shrink-0 cursor-pointer rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-neutral-800 dark:hover:text-white"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  ref={linkInputRef}
                  type="text"
                  value={linkInput}
                  tabIndex={linkFormOpen ? 0 : -1}
                  onChange={(e) => {
                    setLinkInput(e.target.value);
                    if (linkError) setLinkError("");
                  }}
                  placeholder="Warranty ID, order number or item ID"
                  aria-label="Warranty ID, order number or item ID"
                  aria-invalid={!!linkError}
                  className={`h-11 w-full rounded-xl border bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:bg-white dark:bg-neutral-800 dark:text-white dark:focus:bg-neutral-900 ${
                    linkError
                      ? "border-rose-300 focus:border-rose-400 dark:border-rose-900"
                      : "border-slate-200 focus:border-slate-400 dark:border-neutral-700 dark:focus:border-neutral-500"
                  }`}
                />
              </div>
              <button
                type="submit"
                disabled={isLinking || !linkInput.trim()}
                tabIndex={linkFormOpen ? 0 : -1}
                className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-slate-900"
              >
                {isLinking ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Checking…</span>
                  </>
                ) : (
                  <span>Link certificate</span>
                )}
              </button>
            </div>

            {linkError && (
              <p role="alert" className="mt-2.5 text-sm text-rose-600 dark:text-rose-400">
                {linkError}
              </p>
            )}

            <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-500 dark:text-neutral-400">
              <Phone size={13} className="shrink-0" />
              <span>
                Can&apos;t find it? Call{" "}
                <a
                  href={`tel:${supportPhone.replace(/[^\d+]/g, "")}`}
                  tabIndex={linkFormOpen ? 0 : -1}
                  className="font-semibold text-slate-700 underline-offset-2 hover:underline dark:text-neutral-200"
                >
                  {supportPhone}
                </a>{" "}
                and we&apos;ll link it for you.
              </span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );

  /* ---------- render ---------- */

  return (
    <div className="space-y-5">
      {/* Print stylesheet */}
      <style>{`
        @keyframes w-rise { from { opacity: 0; transform: translateY(8px); } }
        @keyframes w-fade { from { opacity: 0; } }
        .w-rise { animation: w-rise .3s cubic-bezier(.2,.8,.2,1) both; }
        .w-fade { animation: w-fade .18s ease-out both; }

        @page { size: A4 portrait; margin: 10mm 8mm; }

        @media print {
          *, *:before, *:after { box-shadow: none !important; text-shadow: none !important; animation: none !important; }
          html, body {
            background: #ffffff !important;
            color: #0f172a !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .app-main { margin: 0 !important; padding: 0 !important; max-width: 100% !important; }
          .app-main > * { max-width: 100% !important; }
          .app-status-scrim { display: none !important; }

          .no-print, header, footer, nav, button, form { display: none !important; }

          .print-clean { border: none !important; border-radius: 0 !important; padding: 0 !important; margin: 0 !important; max-width: 100% !important; width: 100% !important; background: #ffffff !important; }
          .print-avoid-break, .print-row, .print-table tr { page-break-inside: avoid !important; break-inside: avoid !important; }

          .print-table { width: 100% !important; border-collapse: collapse !important; margin-top: 6px !important; }
          .print-table thead { display: table-header-group !important; }
          .print-table thead th {
            background-color: #f1f5f9 !important;
            font-weight: 700 !important;
            font-size: 8pt !important;
            padding: 6px 8px !important;
            border: 1px solid #cbd5e1 !important;
            color: #0f172a !important;
          }
          .print-table tbody td {
            border: 1px solid #e2e8f0 !important;
            padding: 5px 8px !important;
            font-size: 8.5pt !important;
            color: #1e293b !important;
            vertical-align: top !important;
          }
        }
      `}</style>

      {/* Header */}
      {activeWarranty ? (
        <TabHeader
          eyebrow="Warranty"
          title={activeWarranty.warrantyNumber}
          deskEyebrow="Warranty certificate"
          deskTitle={activeWarranty.warrantyNumber}
          onBack={() => setSelectedWarrantyId(null)}
          extra={
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-slate-900 px-3.5 py-2 text-xs font-bold text-white transition hover:opacity-90 dark:bg-white dark:text-slate-900"
            >
              <Printer size={14} />
              <span>Print / PDF</span>
            </button>
          }
        />
      ) : (
        <TabHeader
          eyebrow=""
          title="Warranty"
          deskTitle="Warranty certificates"
          onBack={onGoHome}
          search={matchedWarranties.length > 2 ? searchFilter : undefined}
          setSearch={matchedWarranties.length > 2 ? setSearchFilter : undefined}
          placeholder="Search certificates..."
          extra={
            !loading && !noCertificates ? (
              <button
                type="button"
                onClick={() => setShowLinkForm((open) => !open)}
                aria-expanded={showLinkForm}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-slate-900 px-3.5 py-2 text-xs font-bold text-white transition hover:opacity-90 dark:bg-white dark:text-slate-900"
              >
                <Plus
                  size={14}
                  className={`transition-transform duration-300 ${showLinkForm ? "rotate-45" : ""}`}
                />
                <span>Link certificate</span>
              </button>
            ) : undefined
          }
        />
      )}

      {/* Loading */}
      {loading && <ListSkeleton />}

      {/* Link form (list view only) */}
      {!activeWarranty && !loading && linkForm}

      {/* List view */}
      {!loading && !activeWarranty && matchedWarranties.length > 0 && (
        <div className="space-y-4">
          <p className="px-1 text-sm text-slate-500 dark:text-neutral-400">
            {plural(matchedWarranties.length, "certificate")} on your account
          </p>

          {filteredWarranties.length > 0 ? (
            <div className="stagger grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filteredWarranties.map((w) => {
                const status = getStatus(
                  w.warranty?.status,
                  w.warranty?.startDate,
                  w.warranty?.endDate
                );
                const itemsCount = w.products?.length || 0;
                const hasEnd = !!parseTime(w.warranty?.endDate);

                return (
                  <button
                    key={w.id || w.warrantyNumber}
                    type="button"
                    onClick={() => openWarranty(w)}
                    className="relative flex w-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md active:scale-[.995] dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
                  >
                    <div className="p-4 pb-4">
                      <div className="flex items-center justify-between gap-2">
                        <StatusChip status={status} />
                        {status.timeText && (
                          <span className="text-xs text-slate-500 dark:text-neutral-400">
                            {status.timeText}
                          </span>
                        )}
                      </div>

                      <p className="mt-3 truncate text-base font-bold text-slate-900 dark:text-white">
                        {w.warrantyNumber || "—"}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-neutral-400">
                        {w.orderNumber || w.quotationId
                          ? `Order ${w.orderNumber || w.quotationId}`
                          : "No order reference"}
                      </p>

                      {w.customer?.installationAddress ? (
                        <p className="mt-2.5 flex items-start gap-1.5 text-xs text-slate-600 dark:text-neutral-400">
                          <MapPin size={13} className="mt-0.5 shrink-0 text-slate-400" />
                          <span className="line-clamp-1">{w.customer.installationAddress}</span>
                        </p>
                      ) : w.customer?.name ? (
                        <p className="mt-2.5 truncate text-xs text-slate-600 dark:text-neutral-400">
                          {w.customer.name}
                        </p>
                      ) : null}
                    </div>

                    <div className="mt-auto flex items-end justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-800/50">
                      <div className="min-w-0">
                        <p className="text-xs text-slate-500 dark:text-neutral-400">
                          {!hasEnd ? "Coverage" : status.tone === "expired" ? "Expired on" : "Valid until"}
                        </p>
                        <p className="mt-0.5 truncate text-sm font-semibold text-slate-900 dark:text-white">
                          {hasEnd ? formatDate(w.warranty?.endDate) : coverageLabel(w)}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-neutral-400">
                          <Package size={13} />
                          {plural(itemsCount, "item")}
                        </span>
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm dark:border dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                          <ChevronRight size={16} />
                        </span>
                      </div>
                    </div>

                    {status.remainingPct !== null && (
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-0 bottom-0 h-[3px] bg-slate-100 dark:bg-neutral-800"
                      >
                        <span
                          className={`block h-full rounded-r-full ${TONE[status.tone].bar}`}
                          style={{ width: `${status.remainingPct}%` }}
                        />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400">
              <p>No certificates match &ldquo;{searchFilter}&rdquo;.</p>
              <button
                type="button"
                onClick={() => setSearchFilter("")}
                className="mt-2 cursor-pointer text-sm font-semibold text-slate-900 underline underline-offset-2 dark:text-white"
              >
                Clear search
              </button>
            </div>
          )}
        </div>
      )}

      {/* Detail view */}
      {!loading && activeWarranty && activeStatus && (
        <div
          key={warrantyKey(activeWarranty)}
          className="w-rise print-clean grid gap-4 lg:grid-cols-3 lg:items-start print:block"
        >
          {/* Print-only heading */}
          <div className="print-avoid-break mb-3 hidden border-b border-neutral-300 pb-3 print:block lg:col-span-3">
            <p className="text-[9pt] font-semibold text-neutral-700">{storeName}</p>
            <h1 className="mt-0.5 text-xl font-bold text-neutral-950">Warranty Certificate</h1>
            <p className="mt-1 text-[9pt] text-neutral-700">
              Warranty ID <strong className="text-black">{activeWarranty.warrantyNumber}</strong>
              {activeWarranty.orderNumber && (
                <>
                  {"  "}Order <strong className="text-black">{activeWarranty.orderNumber}</strong>
                </>
              )}
            </p>
          </div>

          {/* Summary + customer */}
          <aside className="space-y-4 lg:sticky lg:top-28 lg:col-start-3 lg:row-start-1 print:static print:space-y-0">
            <Panel className="print-avoid-break">
              <div className="flex items-center justify-between gap-3">
                <StatusChip status={activeStatus} />
                {activeStatus.timeText && (
                  <span className="text-xs text-slate-500 dark:text-neutral-400 print:hidden">
                    {activeStatus.timeText}
                  </span>
                )}
              </div>

              {parseTime(activeWarranty.warranty?.endDate) !== null && (
                <div className="mt-5">
                  <p className="text-xs text-slate-500 dark:text-neutral-400">
                    {activeStatus.tone === "expired" ? "Expired on" : "Valid until"}
                  </p>
                  <p className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900 dark:text-white print:text-lg">
                    {formatDate(activeWarranty.warranty?.endDate)}
                  </p>
                  {activeStatus.remainingPct !== null && (
                    <div
                      aria-hidden="true"
                      className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-neutral-800 print:hidden"
                    >
                      <div
                        className={`h-full rounded-full transition-[width] duration-700 ease-out ${TONE[activeStatus.tone].bar}`}
                        style={{ width: `${activeStatus.remainingPct}%` }}
                      />
                    </div>
                  )}
                </div>
              )}

              <dl className="mt-5 divide-y divide-slate-100 border-t border-slate-100 pt-4 dark:divide-neutral-800 dark:border-neutral-800 print:divide-neutral-200 print:border-neutral-300">
                <Fact label="Warranty ID">
                  <span className="truncate">{activeWarranty.warrantyNumber}</span>
                  <CopyButton
                    copied={copiedKey === "warrantyNum"}
                    label="Copy Warranty ID"
                    onClick={() => copyToClipboard(activeWarranty.warrantyNumber, "warrantyNum")}
                  />
                </Fact>
                <Fact label="Order number">
                  <span className="truncate">{activeWarranty.orderNumber || "—"}</span>
                  {activeWarranty.orderNumber && (
                    <CopyButton
                      copied={copiedKey === "orderNum"}
                      label="Copy order number"
                      onClick={() => copyToClipboard(activeWarranty.orderNumber, "orderNum")}
                    />
                  )}
                </Fact>
                {activeWarranty.quotationId && (
                  <Fact label="Quotation">
                    <span className="truncate">{activeWarranty.quotationId}</span>
                  </Fact>
                )}
                <Fact label="Coverage">{coverageLabel(activeWarranty)}</Fact>
                <Fact label="Effective from">{formatDate(activeWarranty.warranty?.startDate)}</Fact>
              </dl>

              <a
                href={`https://wa.me/${supportWhatsapp}?text=${encodeURIComponent(
                  `Hello ${storeName}, I am contacting you regarding warranty claim for Warranty No: ${activeWarranty.warrantyNumber} (Order: ${activeWarranty.orderNumber}).`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="no-print mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                <MessageCircle size={16} />
                <span>Raise a claim on WhatsApp</span>
              </a>
            </Panel>

            <Panel className="print-avoid-break">
              <PanelTitle>Registered to</PanelTitle>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {activeWarranty.customer?.name || user.displayName || "Customer"}
                  </p>
                  <p className="mt-0.5 break-words text-sm text-slate-500 dark:text-neutral-400">
                    {activeWarranty.customer?.mobile || user.phone || "—"}
                  </p>
                  <p className="break-all text-sm text-slate-500 dark:text-neutral-400">
                    {activeWarranty.customer?.email || user.email || ""}
                  </p>
                </div>

                {activeWarranty.customer?.installationAddress && (
                  <div>
                    <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-neutral-400">
                      <MapPin size={13} /> Installation site
                    </p>
                    <p className="mt-0.5 text-sm leading-relaxed text-slate-700 dark:text-neutral-300">
                      {activeWarranty.customer.installationAddress}
                    </p>
                  </div>
                )}

                {activeWarranty.customer?.address && (
                  <div>
                    <p className="text-xs text-slate-500 dark:text-neutral-400">Billing address</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-slate-700 dark:text-neutral-300">
                      {activeWarranty.customer.address}
                    </p>
                  </div>
                )}

                {activeWarranty.customer?.gstin && (
                  <p className="text-xs text-slate-500 dark:text-neutral-400">
                    GSTIN {activeWarranty.customer.gstin}
                  </p>
                )}
              </div>
            </Panel>

            {isLinked(activeWarranty) && !isAutoMatch(activeWarranty) && (
              <button
                type="button"
                onClick={() => setUnlinkTarget(activeWarranty)}
                className="no-print inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-medium text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 dark:text-neutral-400 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
              >
                <Trash2 size={14} />
                <span>Remove from my profile</span>
              </button>
            )}
          </aside>

          {/* Products, totals, terms */}
          <div className="space-y-4 lg:col-span-2 lg:col-start-1 lg:row-start-1 print:space-y-0">
            <Panel>
              <PanelTitle aside={plural(activeWarranty.products?.length || 0, "item")}>
                Covered products
              </PanelTitle>

              {/* Screen list */}
              <ul className="no-print divide-y divide-slate-100 dark:divide-neutral-800">
                {activeWarranty.products?.map((item: WarrantyProductItem, idx: number) => {
                  const noWarranty = hasNoWarranty(item);
                  return (
                    <li key={item.id || idx} className="flex gap-3.5 py-4 first:pt-0 last:pb-0 sm:gap-4">
                      {item.productImage ? (
                        <button
                          type="button"
                          onClick={() => setPreviewImage(item.productImage || null)}
                          aria-label={`Enlarge image of ${item.productName}`}
                          className="h-16 w-16 shrink-0 cursor-zoom-in overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-1 transition hover:border-slate-300 dark:border-neutral-700 dark:bg-neutral-800 sm:h-20 sm:w-20"
                        >
                          <img
                            src={item.productImage}
                            alt=""
                            loading="lazy"
                            className="h-full w-full object-contain"
                          />
                        </button>
                      ) : (
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-300 dark:bg-neutral-800 dark:text-neutral-600 sm:h-20 sm:w-20">
                          <Package size={22} />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900 dark:text-white">
                              {item.productName}
                            </p>
                            {item.productCode && (
                              <p className="mt-0.5 text-xs text-slate-500 dark:text-neutral-400">
                                Code {item.productCode}
                              </p>
                            )}
                          </div>
                          {item.totalAmount ? (
                            <p className="shrink-0 text-sm font-semibold text-slate-900 dark:text-white">
                              {inr(item.totalAmount)}
                            </p>
                          ) : null}
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                          {noWarranty ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                              <ShieldAlert size={12} />
                              No warranty
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                              <ShieldCheck size={12} />
                              {item.warrantyPeriod || "Covered"}
                            </span>
                          )}

                          <span className="inline-flex items-center gap-0.5 text-xs text-slate-500 dark:text-neutral-400">
                            Item ID {item.id}
                            <CopyButton
                              copied={copiedKey === `item_${item.id}`}
                              label="Copy item ID"
                              onClick={() => copyToClipboard(item.id, `item_${item.id}`)}
                            />
                          </span>
                        </div>

                        {noWarranty && item.noWarrantyReason && (
                          <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-neutral-400">
                            {item.noWarrantyReason}
                          </p>
                        )}
                        {!noWarranty && item.productSpecificWarranty && (
                          <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-neutral-300">
                            {item.productSpecificWarranty}
                          </p>
                        )}
                        {item.productSpecification && (
                          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-neutral-400">
                            {item.productSpecification}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>

              {/* Print table */}
              <div className="hidden w-full print:block">
                <table className="print-table w-full border-collapse text-left">
                  <thead>
                    <tr>
                      <th className="w-8">#</th>
                      <th className="w-28">Item ID</th>
                      <th>Product &amp; specification</th>
                      <th className="w-28">Code</th>
                      <th className="w-32">Warranty</th>
                      <th className="w-24 text-right">Valid until</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeWarranty.products?.map((item: WarrantyProductItem, idx: number) => {
                      const noWarranty = hasNoWarranty(item);
                      return (
                        <tr key={item.id || idx} className="print-row">
                          <td>{idx + 1}</td>
                          <td className="font-semibold">{item.id}</td>
                          <td>
                            <span className="block font-semibold">{item.productName}</span>
                            {item.productSpecification && (
                              <span className="block leading-snug text-neutral-600">
                                {item.productSpecification}
                              </span>
                            )}
                          </td>
                          <td>
                            <span className="block">{item.productCode || "—"}</span>
                            {item.productCategory && (
                              <span className="block text-neutral-500">{item.productCategory}</span>
                            )}
                          </td>
                          <td>
                            {noWarranty ? (
                              <span className="font-bold text-rose-700">No warranty</span>
                            ) : (
                              <span className="font-semibold">
                                {item.warrantyPeriod || coverageLabel(activeWarranty)}
                              </span>
                            )}
                          </td>
                          <td className="text-right">
                            {noWarranty ? "—" : formatDate(activeWarranty.warranty?.endDate)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Panel>

            {activeWarranty.summary && (
              <Panel className="print-avoid-break">
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500 dark:text-neutral-400">Items</dt>
                    <dd className="font-semibold text-slate-900 dark:text-white">
                      {activeWarranty.summary.totalProducts}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500 dark:text-neutral-400">Subtotal</dt>
                    <dd className="font-semibold text-slate-900 dark:text-white">
                      {inr(activeWarranty.summary.subTotal)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500 dark:text-neutral-400">GST</dt>
                    <dd className="font-semibold text-slate-900 dark:text-white">
                      {inr(activeWarranty.summary.totalGst)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3 border-t border-slate-100 pt-3 text-base dark:border-neutral-800 print:border-neutral-300">
                    <dt className="font-bold text-slate-900 dark:text-white">Grand total</dt>
                    <dd className="font-bold text-slate-900 dark:text-white">
                      {inr(activeWarranty.summary.grandTotal)}
                    </dd>
                  </div>
                </dl>
              </Panel>
            )}

            {termsList.length > 0 && (
              <Panel className="print-avoid-break">
                <PanelTitle>Terms and conditions</PanelTitle>
                <ol className="space-y-2.5 text-sm leading-relaxed text-slate-600 dark:text-neutral-400 print:space-y-1.5 print:text-[8.5pt] print:text-neutral-800">
                  {termsList.map((term, idx) => (
                    <li
                      key={idx}
                      className={`gap-3 ${
                        idx >= TERMS_PREVIEW_COUNT && !termsOpen ? "hidden print:flex" : "flex"
                      }`}
                    >
                      <span className="w-5 shrink-0 text-slate-400 dark:text-neutral-500 print:text-neutral-600">
                        {idx + 1}.
                      </span>
                      <span>{term}</span>
                    </li>
                  ))}
                </ol>

                {termsList.length > TERMS_PREVIEW_COUNT && (
                  <button
                    type="button"
                    onClick={() => setTermsOpen((open) => !open)}
                    aria-expanded={termsOpen}
                    className="no-print mt-4 inline-flex cursor-pointer items-center gap-1 text-sm font-semibold text-slate-900 dark:text-white"
                  >
                    <span>
                      {termsOpen
                        ? "Show fewer"
                        : `Show all ${termsList.length} terms`}
                    </span>
                    <ChevronDown
                      size={15}
                      className={`transition-transform duration-300 ${termsOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                )}
              </Panel>
            )}

            {/* Print footer */}
            <div className="print-avoid-break hidden items-center justify-between border-t border-neutral-300 pt-3 text-[7.5pt] text-neutral-600 print:flex">
              <span>Verified certificate, digitally tracked</span>
              <span>Issued by {storeName}</span>
              <span>Valid across authorised service locations</span>
            </div>
          </div>
        </div>
      )}

      {/* Unlink confirmation */}
      {unlinkTarget && (
        <div
          className="no-print w-fade fixed !m-0 inset-0 z-50 flex items-end justify-center bg-slate-950/40 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setUnlinkTarget(null)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="unlink-title"
            onClick={(e) => e.stopPropagation()}
            className="app-sheet w-full max-w-sm overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl dark:bg-neutral-900 sm:rounded-3xl"
          >
            <h2 id="unlink-title" className="text-lg font-bold text-slate-900 dark:text-white">
              Remove this certificate?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-neutral-400">
              {unlinkTarget.warrantyNumber || unlinkTarget.orderNumber} will be removed from your
              profile. You can link it again any time with its Warranty ID.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setUnlinkTarget(null)}
                className="cursor-pointer rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                Keep it
              </button>
              <button
                type="button"
                onClick={confirmUnlink}
                className="cursor-pointer rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image preview */}
      {previewImage && (
        <div
          className="no-print w-fade fixed !m-0 inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <button
            type="button"
            onClick={() => setPreviewImage(null)}
            aria-label="Close preview"
            className="absolute right-4 top-4 cursor-pointer rounded-full bg-white/10 p-2.5 text-white transition hover:bg-white/20"
          >
            <X size={20} />
          </button>
          <img
            src={previewImage}
            alt="Enlarged product"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] max-w-full rounded-2xl bg-white object-contain p-3 shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};

export default WarrantyTab;