import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell, BellOff, Building2, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight,
  CircleUserRound, Clock, FileText, Home, IndianRupee, Layers, LogOut, Mail,
  MapPin, Package, Palette, Pencil, Percent, Phone, Plus, Ruler, Save, Search, ShieldCheck, Tag,
  Trash2, User, X,
  Moon,
  Sun,
  Camera,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { database, onValue, push, ref, set } from "../config/firebase";
import { useAuth } from "../context/AuthContext";
import { User as UserType } from "../types";
import type { ElementType } from "react";
import { uploadToCloudinary } from "../config/cloudinary";

type AppTabProps = {
  icon: ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
};

const AppTab = ({
  icon: Icon,
  label,
  active,
  onClick,
}: AppTabProps) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1 rounded-2xl px-2.5 py-2 text-[11px] font-semibold transition-all duration-200
      ${
        active
          ? "bg-slate-900 text-white shadow-sm dark:bg-white dark:text-neutral-900"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
      }
    `}
  >
    <Icon className="h-5 w-5" />
    <span>{label}</span>
  </button>
);

const BRAND_LOGO_URL = "https://res.cloudinary.com/dmiwq3l2s/image/upload/v1764768203/vfw82jmca7zl5p86czhy.png";
const READ_NOTIFICATIONS_KEY = "portal-read-notifications";

type Tab = "home" | "pricelist" | "quotations" | "profile";
type ProfileSection = "list" | "personal" | "company";
type ProfileUser = UserType & { gst?: string };
type ProfileForm = { displayName: string; phone: string; address: string; company: string; gst: string; bio: string };
type Product = Record<string, string | number | undefined>;
type Category = { products?: Record<string, Product>; imageUrl?: string; lastUpdated?: number };

interface QuotationItem {
  id?: string;
  product?: { productName?: string; productCategory?: string; unit?: string };
  qty?: number;
  width?: number;
  widthUnit?: string;
  height?: number;
  heightUnit?: string;
  sqft?: number;
  runningFeet?: number;
  amount?: number;
  price?: number;
}

interface Quotation {
  quotationNumber: string;
  customer?: { name?: string; email?: string; address?: string };
  company?: { companyName?: string; companyAddress?: string; companyEmail?: string; companyLogo?: string };
  grandTotal: number;
  taxAmount?: number;
  createdAt: number;
  status: string;
  items?: QuotationItem[];
}

const LENGTH_UNITS = ["inch", "cm", "feet", "meter"] as const;
type LengthUnit = (typeof LENGTH_UNITS)[number];

type OrderRequestStatus = "not-reviewed" | "viewed" | "quote-prepared" | "prepared";

interface OrderRequestItem {
  height?: number;
  heightUnit?: LengthUnit;
  width?: number;
  widthUnit?: LengthUnit;
  fabricCode?: string;
}

interface OrderRequest {
  id?: string;
  items: OrderRequestItem[];
  customer?: { name?: string; email?: string; phone?: string; address?: string; company?: string };
  status: OrderRequestStatus;
  /** set by admin once a quotation is generated — links the request to a quotation */
  quotationNumber?: string;
  /** legacy field name, kept for older records */
  quoteNumber?: string;
  createdAt: number;
}

type NotificationItem = {
  id: string;
  title: string;
  detail: string;
  time: number;
  tone: "order" | "quote";
  onClick: () => void;
};

const ORDER_STATUS_META: Record<OrderRequestStatus, { label: string; className: string; dot: string; note: string }> = {
  "not-reviewed": { label: "Not reviewed", className: "bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-neutral-300", dot: "bg-slate-400", note: "We have received your request." },
  "viewed": { label: "Viewed", className: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300", dot: "bg-amber-500", note: "Our team is checking your measurements." },
  "quote-prepared": { label: "Quote prepared", className: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300", dot: "bg-indigo-500", note: "Your quotation is ready to view." },
  "prepared": { label: "Prepared", className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300", dot: "bg-emerald-500", note: "Your order has been prepared." },
};

const HIDDEN_FIELDS = ["product name", "media", "serial", "gst", "id"];

const FIELD_ICONS: Record<string, React.ElementType> = {
  price: IndianRupee,
  rate: IndianRupee,
  "simple price": IndianRupee,
  cost: IndianRupee,
  width: Ruler,
  height: Ruler,
  size: Ruler,
  length: Ruler,
  color: Palette,
  colour: Palette,
  shade: Palette,
  material: Layers,
  fabric: Layers,
  finish: Layers,
};

const getFieldIcon = (key: string): React.ElementType => FIELD_ICONS[key.toLowerCase()] || Tag;

const formatFieldName = (key: string) => key.replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatFieldValue = (key: string, value: unknown) => {
  if (value === undefined || value === null || value === "") return "—";
  const lower = key.toLowerCase();
  if (typeof value === "number" && (lower.includes("price") || lower.includes("rate") || lower === "cost")) {
    return `₹${value.toLocaleString("en-IN")}`;
  }
  return String(value);
};

// GST in the data can show up as a fraction (0.18) or a whole number (18) —
// normalise both into a clean "18%" style label.
const formatGst = (value: unknown) => {
  if (value === undefined || value === null || value === "") return null;
  const num = typeof value === "number" ? value : parseFloat(String(value).replace("%", ""));
  if (Number.isNaN(num)) return String(value);
  const percent = num > 0 && num <= 1 ? num * 100 : num;
  const rounded = Math.round(percent * 100) / 100;
  return `${rounded}%`;
};

const formatDate = (value?: number) => value ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : null;

const formatShortDate = (value?: number) => value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" }) : "—";

const formatRelative = (value?: number) => {
  if (!value) return "";
  const diff = Date.now() - value;
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatShortDate(value);
};

const getQuotationNumber = (request: OrderRequest) => request.quotationNumber || request.quoteNumber || null;

const readStoredNotifications = (): string[] => {
  try {
    const raw = window.localStorage.getItem(READ_NOTIFICATIONS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
};

const Profile: React.FC = () => {
  const { currentUser, updateProfile, logout } = useAuth();
  const user = currentUser as ProfileUser | null;
  const [tab, setTab] = useState<Tab>("home");
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [readNotifications, setReadNotifications] = useState<string[]>(readStoredNotifications);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [selectedQuotationNumber, setSelectedQuotationNumber] = useState<string | null>(null);
  const [orderRequests, setOrderRequests] = useState<OrderRequest[]>([]);
  const [orderSheetOpen, setOrderSheetOpen] = useState(false);
  const [orderRequestsOpen, setOrderRequestsOpen] = useState(false);
  const [selectedOrderRequestId, setSelectedOrderRequestId] = useState<string | null>(null);
  // quick-view: opening a single order request from Home without navigating into the full list
  const [quickViewRequestId, setQuickViewRequestId] = useState<string | null>(null);
  const [priceList, setPriceList] = useState<Record<string, Category>>({});
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [profileSection, setProfileSection] = useState<ProfileSection>("list");
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [form, setForm] = useState<ProfileForm>({ displayName: "", phone: "", address: "", company: "", gst: "", bio: "" });

  useEffect(() => {
    if (!user) return;
    setForm({ displayName: user.displayName || "", phone: user.phone || "", address: user.address || "", company: user.company || "", gst: user.gst || "", bio: user.bio || "" });
  }, [user]);

  useEffect(() => {
    if (!user?.email) return;
    return onValue(ref(database, "quotations/quotationList"), (snapshot) => {
      const own = Object.values(snapshot.val() || {}).filter((item) => (item as Quotation).customer?.email === user.email) as Quotation[];
      setQuotations(own.sort((a, b) => b.createdAt - a.createdAt));
    });
  }, [user?.email]);

  useEffect(() => {
    if (!user?.email) return;
    return onValue(ref(database, "orderRequest"), (snapshot) => {
      const value = snapshot.val() || {};
      const own = Object.entries(value)
        .map(([id, entry]) => ({ id, ...(entry as OrderRequest) }))
        .filter((item) => item.customer?.email === user.email);
      setOrderRequests(own.sort((a, b) => b.createdAt - a.createdAt));
    });
  }, [user?.email]);

  useEffect(() => onValue(ref(database, "pricelist"), (snapshot) => setPriceList(snapshot.val() || {})), []);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("portal-theme");
    const nextTheme = savedTheme === "dark" ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem("portal-theme", theme);
  }, [theme]);

  // persist which notifications have already been read so they stay hidden
  useEffect(() => {
    try {
      window.localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(readNotifications.slice(-300)));
    } catch {
      /* storage unavailable — notifications simply reappear next launch */
    }
  }, [readNotifications]);

  const applyRoute = (nextTab: Tab, category: string | null = null, quotation: string | null = null, replace = false) => {
    setTab(nextTab);
    setSelectedCategory(category);
    setSelectedQuotationNumber(quotation);
    setSearch("");
    setSearchOpen(false);
    setProfileSection("list");
    setOrderRequestsOpen(false);
    setSelectedOrderRequestId(null);
    setQuickViewRequestId(null);
    setNotificationOpen(false);
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    const suffix = category ? `/category/${encodeURIComponent(category)}` : quotation ? `/${encodeURIComponent(quotation)}` : "";
    const url = `#${nextTab}${suffix}`;
    const state = { portal: true, tab: nextTab, category, quotation };
    if (replace) window.history.replaceState(state, "", url);
    else window.history.pushState(state, "", url);
  };

  const openTab = (nextTab: Tab) => applyRoute(nextTab);

  useEffect(() => {
    const route = () => {
      const hash = window.location.hash.replace(/^#/, "");
      const [rawTab, rawPart, ...rest] = hash.split("/");
      const known: Tab[] = ["home", "pricelist", "quotations", "profile"];
      const nextTab = known.includes(rawTab as Tab) ? rawTab as Tab : "home";
      const category = nextTab === "pricelist" && rawPart === "category" ? decodeURIComponent(rest.join("/")) : null;
      const quotation = nextTab === "quotations" && rawPart ? decodeURIComponent([rawPart, ...rest].join("/")) : null;
      // "requests" -> full order-requests list (optionally with one open); "request" -> quick view of a single request from Home
      const requestId = nextTab === "home" && rawPart === "requests" ? decodeURIComponent(rest.join("/")) || null : null;
      const quickRequestId = nextTab === "home" && rawPart === "request" ? decodeURIComponent(rest.join("/")) || null : null;
      setOrderSheetOpen(false);
      setOrderRequestsOpen(!!(nextTab === "home" && rawPart === "requests"));
      setSelectedOrderRequestId(requestId);
      setQuickViewRequestId(quickRequestId);
      setTab(nextTab);
      setSelectedCategory(category);
      setSelectedQuotationNumber(quotation);
      setSearch("");
      setSearchOpen(false);
      setProfileSection("list");
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    };
    if (!window.location.hash) applyRoute("home", null, null, true);
    else route();
    const onPopState = () => route();
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (orderSheetOpen) setOrderSheetOpen(false);
      else if (quickViewRequestId) window.history.back();
      else if (selectedOrderRequestId) setSelectedOrderRequestId(null);
      else if (orderRequestsOpen) setOrderRequestsOpen(false);
      else if (selectedQuotationNumber) setSelectedQuotationNumber(null);
      else if (selectedCategory) applyRoute("pricelist");
      else if (searchOpen) { setSearch(""); setSearchOpen(false); }
      else if (notificationOpen) setNotificationOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [orderSheetOpen, quickViewRequestId, selectedOrderRequestId, orderRequestsOpen, selectedQuotationNumber, selectedCategory, searchOpen, notificationOpen]);

  const openOrderRequestsPage = (requestId?: string) => {
    setOrderRequestsOpen(true);
    setSelectedOrderRequestId(requestId || null);
    setQuickViewRequestId(null);
    setNotificationOpen(false);
    setOrderSheetOpen(false);
    window.history.pushState({ portal: true, tab: "home", orderRequests: true, requestId: requestId || null }, "", requestId ? `#home/requests/${encodeURIComponent(requestId)}` : "#home/requests");
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  };

  // opens a single order request as a quick-view sheet over Home, without navigating into the full requests list
  const openOrderRequestQuickView = (requestId: string) => {
    setTab("home");
    setOrderRequestsOpen(false);
    setSelectedOrderRequestId(null);
    setQuickViewRequestId(requestId);
    setNotificationOpen(false);
    setOrderSheetOpen(false);
    window.history.pushState({ portal: true, tab: "home", quickRequest: requestId }, "", `#home/request/${encodeURIComponent(requestId)}`);
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  };

  // one place that opens a quotation, from anywhere in the app
  const openQuotation = (quotationNumber: string) => {
    const exists = quotations.some((quotation) => quotation.quotationNumber === quotationNumber);
    if (!exists) {
      toast("Quotation is not available yet.", { icon: "🧾" });
      return;
    }
    applyRoute("quotations", null, quotationNumber);
  };

  const allNotifications: NotificationItem[] = useMemo(() => [
    ...orderRequests.slice(0, 12).map((request) => {
      const meta = ORDER_STATUS_META[request.status];
      const quotationNumber = getQuotationNumber(request);
      return {
        // id includes the status, so a status change creates a fresh unread entry
        id: `order-${request.id}-${request.status}-${quotationNumber || "none"}`,
        title: `Order request · ${meta?.label || request.status}`,
        detail: quotationNumber ? `Quotation ${quotationNumber} is linked to this request` : meta?.note || "Your order request",
        time: request.createdAt,
        tone: "order" as const,
        onClick: () => (quotationNumber ? openQuotation(quotationNumber) : (request.id ? openOrderRequestQuickView(request.id) : openOrderRequestsPage())),
      };
    }),
    ...quotations.slice(0, 12).map((quotation) => ({
      id: `quote-${quotation.quotationNumber}-${quotation.status}`,
      title: `Quotation ${quotation.quotationNumber}`,
      detail: `${quotation.status || "Updated"} · ₹${Number(quotation.grandTotal || 0).toLocaleString("en-IN")}`,
      time: quotation.createdAt,
      tone: "quote" as const,
      onClick: () => openQuotation(quotation.quotationNumber),
    })),
  ].sort((a, b) => b.time - a.time), [orderRequests, quotations]);

  const unreadNotifications = useMemo(
    () => allNotifications.filter((item) => !readNotifications.includes(item.id)),
    [allNotifications, readNotifications],
  );
  const readNotificationItems = useMemo(
    () => allNotifications.filter((item) => readNotifications.includes(item.id)),
    [allNotifications, readNotifications],
  );

  const markNotificationRead = (id: string) =>
    setReadNotifications((current) => (current.includes(id) ? current : [...current, id]));
  const markAllNotificationsRead = () =>
    setReadNotifications((current) => Array.from(new Set([...current, ...allNotifications.map((item) => item.id)])));

  if (!user) return <div className="flex min-h-screen items-center justify-center">Please log in to view your profile.</div>;

  const quickViewRequest = quickViewRequestId ? orderRequests.find((request) => request.id === quickViewRequestId) || null : null;

  const updateField = (field: keyof ProfileForm, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const resetForm = () => setForm({ displayName: user.displayName || "", phone: user.phone || "", address: user.address || "", company: user.company || "", gst: user.gst || "", bio: user.bio || "" });

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await updateProfile(form.displayName, undefined, { phone: form.phone, address: form.address, company: form.company, gst: form.gst, bio: form.bio });
      toast.success("Profile updated successfully");
      return true;
    } catch {
      toast.error("Could not update your profile");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const submitOrderRequest = async (items: OrderRequestItem[]) => {
    const newRef = push(ref(database, "orderRequest"));
    await set(newRef, {
      items,
      customer: { name: user.displayName || "", email: user.email || "", phone: user.phone || "", address: user.address || "", company: user.company || "" },
      status: "not-reviewed",
      quotationNumber: "",
      createdAt: Date.now(),
    });
  };

  return <div className="portal-surface app-shell min-h-screen bg-[#f7f9fb] text-[14px] text-slate-900 antialiased dark:bg-neutral-950 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui, -apple-system, sans-serif" }}>
    <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

/* ---- native safe areas (status bar / notch / gesture bar) ---- */
:root {
  --safe-top: env(safe-area-inset-top, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
  --safe-left: env(safe-area-inset-left, 0px);
  --safe-right: env(safe-area-inset-right, 0px);
}
.app-shell { padding-left: var(--safe-left); padding-right: var(--safe-right); }
.app-status-scrim {
  position: fixed; top: 0; left: 0; right: 0; height: var(--safe-top);
  background: rgba(247,249,251,.92); backdrop-filter: blur(8px); z-index: 60; pointer-events: none;
}
html[data-theme="dark"] .app-status-scrim { background: rgba(10,10,10,.92); }
.app-main { padding-top: calc(var(--safe-top) + 14px); padding-bottom: calc(var(--safe-bottom) + 104px); }
@media (min-width: 768px) { .app-main { padding-bottom: 40px; } }
.app-nav { padding-bottom: calc(var(--safe-bottom) + 10px); }
@media (min-width: 768px) { .app-nav { padding-bottom: 16px; } }
.app-sheet { max-height: calc(100vh - var(--safe-top) - 24px); padding-bottom: calc(var(--safe-bottom) + 24px); }
.app-overlay-top { top: calc(var(--safe-top) + 12px); }
.app-bleed { margin-left: -1.25rem; margin-right: -1.25rem; padding-left: 1.25rem; padding-right: 1.25rem; }
@media (min-width: 640px) { .app-bleed { margin-left: -2rem; margin-right: -2rem; padding-left: 2rem; padding-right: 2rem; } }
.app-header-sticky { position: sticky; top: 0; z-index: 20; }
.no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
.no-scrollbar::-webkit-scrollbar { display: none; }

html[data-theme="dark"] body { background:#0a0a0a; }
html[data-theme="dark"] .portal-surface { background:#0a0a0a !important; color:#fff !important; }
html[data-theme="dark"] .portal-surface .bg-white { background:#171717 !important; }
html[data-theme="dark"] .portal-surface .bg-slate-50 { background:#1f1f1f !important; }
html[data-theme="dark"] .portal-surface .bg-slate-100 { background:#262626 !important; }
html[data-theme="dark"] .portal-surface .text-slate-900, html[data-theme="dark"] .portal-surface .text-slate-800 { color:#fff !important; }
html[data-theme="dark"] .portal-surface .text-slate-700, html[data-theme="dark"] .portal-surface .text-slate-600 { color:#d4d4d4 !important; }
html[data-theme="dark"] .portal-surface .text-slate-500, html[data-theme="dark"] .portal-surface .text-slate-400 { color:#a3a3a3 !important; }
html[data-theme="dark"] .portal-surface .border-slate-200, html[data-theme="dark"] .portal-surface .border-slate-300 { border-color:#404040 !important; }
html[data-theme="dark"] .portal-muted { color:#a3a3a3 !important; }`}</style>

    <div className="app-status-scrim" aria-hidden="true" />

    <main className="app-main mx-auto max-w-[1440px] px-5 sm:px-8 md:pl-32 md:pr-12 lg:pl-36 lg:pr-20 xl:pl-40">
      {orderRequestsOpen ? <OrderRequestsPage
        orderRequests={orderRequests}
        selectedRequestId={selectedOrderRequestId}
        onSelectRequest={setSelectedOrderRequestId}
        onBack={() => { if (window.history.length > 1) window.history.back(); else { setOrderRequestsOpen(false); setSelectedOrderRequestId(null); } }}
        onNewOrder={() => setOrderSheetOpen(true)}
        onOpenQuotation={openQuotation}
      /> : <>
        {tab === "home" && <HomeTab user={user} quotations={quotations} orderRequests={orderRequests} unreadCount={unreadNotifications.length} onNewOrder={() => setOrderSheetOpen(true)} onViewAllRequests={() => openOrderRequestsPage()} onOpenRequest={(id) => (id ? openOrderRequestQuickView(id) : openOrderRequestsPage())} onOpenQuotation={openQuotation} onOpenNotifications={() => setNotificationOpen(true)} />}
        {tab === "home" && quickViewRequest && <OrderRequestSheetDetail request={quickViewRequest} onClose={() => window.history.back()} onOpenQuotation={openQuotation} />}
        {tab === "pricelist" && <PriceListTab priceList={priceList} selected={selectedCategory} setSelected={setSelectedCategory} search={search} setSearch={setSearch} onGoHome={() => openTab("home")} />}
        {tab === "quotations" && <QuotationsTab quotations={quotations} search={search} setSearch={setSearch} selectedQuotationNumber={selectedQuotationNumber} onOpenQuotation={openQuotation} onGoHome={() => openTab("home")} />}
        {tab === "profile" && <ProfileTab user={user} section={profileSection} setSection={setProfileSection} form={form} saving={saving} updateField={updateField} resetForm={resetForm} save={save} logout={logout} theme={theme} setTheme={setTheme} onGoHome={() => openTab("home")} />}
      </>}
    </main>

    {notificationOpen && <NotificationPanel
      unread={unreadNotifications}
      read={readNotificationItems}
      onOpenItem={(item) => { markNotificationRead(item.id); setNotificationOpen(false); item.onClick(); }}
      onDismiss={markNotificationRead}
      onMarkAll={markAllNotificationsRead}
      onClose={() => setNotificationOpen(false)}
    />}

    <nav className="app-nav fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 px-2 pt-2 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/95 md:bottom-auto md:left-5 md:right-auto md:top-1/2 md:w-[96px] md:-translate-y-1/2 md:rounded-3xl md:border md:px-3 md:pt-4 md:shadow-xl">
      <div className="mx-auto grid max-w-lg grid-cols-4 gap-2 md:grid-cols-1 md:gap-3">
        <AppTab icon={Home} label="Home" active={tab === "home"} onClick={() => openTab("home")} />
        <AppTab icon={Tag} label="Pricelist" active={tab === "pricelist"} onClick={() => openTab("pricelist")} />
        <AppTab icon={FileText} label="Quotations" active={tab === "quotations"} onClick={() => openTab("quotations")} />
        <AppTab icon={CircleUserRound} label="Profile" active={tab === "profile"} onClick={() => openTab("profile")} />
      </div>
    </nav>

    {orderSheetOpen && <OrderRequestSheet onClose={() => setOrderSheetOpen(false)} onSubmit={submitOrderRequest} />}
  </div>;
};

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

const NotificationPanel = ({ unread, read, onOpenItem, onDismiss, onMarkAll, onClose }: {
  unread: NotificationItem[];
  read: NotificationItem[];
  onOpenItem: (item: NotificationItem) => void;
  onDismiss: (id: string) => void;
  onMarkAll: () => void;
  onClose: () => void;
}) => {
  const startY = React.useRef<number | null>(null);
  const [showRead, setShowRead] = useState(false);
  const items = showRead ? read : unread;

  return <div className="fixed inset-0 z-50 bg-slate-950/20 backdrop-blur-[1px]" onClick={onClose}>
    <div
      className="app-overlay-top absolute right-3 w-[min(94vw,390px)] touch-pan-y overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 md:right-24"
      onClick={(event) => event.stopPropagation()}
      onTouchStart={(event) => { startY.current = event.touches[0]?.clientY ?? null; }}
      onTouchEnd={(event) => { const endY = event.changedTouches[0]?.clientY; if (startY.current !== null && endY !== undefined && endY - startY.current > 80) onClose(); startY.current = null; }}
    >
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 dark:border-neutral-800">
        <div className="min-w-0">
          <p className="text-sm font-bold">Notifications</p>
          <p className="text-[10px] text-slate-400">{unread.length ? `${unread.length} unread update${unread.length === 1 ? "" : "s"}` : "You're all caught up"}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {!!unread.length && !showRead && <button type="button" onClick={onMarkAll} className="rounded-full px-2.5 py-1.5 text-[10px] font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-neutral-800">Mark all</button>}
          <button type="button" onClick={onClose} aria-label="Close notifications" className="flex h-9 w-9 touch-manipulation items-center justify-center rounded-full text-slate-400 active:scale-95 hover:bg-slate-100 dark:hover:bg-neutral-800"><X className="h-4 w-4" /></button>
        </div>
      </div>

      {items.length ? <div className="max-h-[58vh] overflow-y-auto">
        {items.map((item) => <div key={item.id} className="flex items-stretch border-b border-slate-100 last:border-0 dark:border-neutral-800">
          <button type="button" onClick={() => onOpenItem(item)} className="flex min-h-16 min-w-0 flex-1 touch-manipulation gap-3 px-4 py-3 text-left active:bg-slate-100 dark:active:bg-neutral-800">
            <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${item.tone === "quote" ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300" : "bg-slate-100 text-slate-500 dark:bg-neutral-800"}`}>
              {item.tone === "quote" ? <FileText className="h-4 w-4" /> : <Package className="h-4 w-4" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold">{item.title}</span>
              <span className="mt-0.5 block truncate text-[11px] text-slate-500">{item.detail}</span>
              <span className="mt-1 block text-[9px] text-slate-400">{formatRelative(item.time)}</span>
            </span>
          </button>
          {!showRead && <button type="button" onClick={() => onDismiss(item.id)} aria-label="Mark as read" className="flex w-11 shrink-0 items-center justify-center text-slate-300 hover:text-slate-600 dark:hover:text-neutral-200"><X className="h-4 w-4" /></button>}
        </div>)}
      </div> : <div className="flex flex-col items-center gap-2 p-8 text-center">
        <BellOff className="h-6 w-6 text-slate-300" />
        <p className="text-xs text-slate-500">{showRead ? "No read notifications." : "No new activity."}</p>
      </div>}

      {!!read.length && <button type="button" onClick={() => setShowRead((current) => !current)} className="w-full border-t border-slate-100 py-2.5 text-[11px] font-bold text-slate-500 hover:bg-slate-50 dark:border-neutral-800 dark:hover:bg-neutral-800">
        {showRead ? "Back to new" : `Show read (${read.length})`}
      </button>}
    </div>
  </div>;
};

const BrandLogo = () => {
  const [broken, setBroken] = useState(false);
  if (broken) return <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-[11px] font-bold text-white">DD</span>;
  return <img src={BRAND_LOGO_URL} onError={() => setBroken(true)} alt="Decor Drapes Instyle" className="h-8 w-8 shrink-0 object-contain" />;
};

/* ------------------------------------------------------------------ */
/* Shared tab header — bottom-rounded, edge-to-edge, expandable search */
/* ------------------------------------------------------------------ */

const TabHeader = ({ eyebrow, title, meta, search, setSearch, placeholder, extra, onBack }: {
  eyebrow: string;
  title: string;
  meta?: React.ReactNode;
  search?: string;
  setSearch?: (value: string) => void;
  placeholder?: string;
  extra?: React.ReactNode;
  onBack?: () => void;
}) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const hasSearch = typeof setSearch === "function";

  useEffect(() => { setSearchOpen(false); }, [title]);

  return (
    <div className="app-header-sticky app-bleed -mt-[calc(var(--safe-top)+14px)] rounded-b-[28px] bg-white px-5 pb-6 pt-[calc(var(--safe-top)+18px)] shadow-sm dark:bg-neutral-900 sm:mt-0 sm:rounded-3xl sm:px-7 sm:pt-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Go back"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-600 hover:text-slate-900 dark:text-neutral-300"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}

          <div className="flex h-11 min-w-0 flex-col justify-center">
            {!!eyebrow && (
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                {eyebrow}
              </p>
            )}
            <h1 className={`truncate text-xl font-bold tracking-tight text-slate-900 dark:text-white ${eyebrow ? "mt-0.5" : ""}`}>
              {title}
            </h1>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {extra}

          {hasSearch && (
            <button
              type="button"
              onClick={() => setSearchOpen((current) => !current)}
              aria-label={searchOpen ? "Close search" : "Search"}
              className={`flex h-10 w-10 touch-manipulation items-center justify-center rounded-full transition active:scale-95 ${
                searchOpen
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-neutral-300"
              }`}
            >
              {searchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>

      {meta}

      {hasSearch && searchOpen && (
        <div className="mt-3 flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 dark:border-neutral-800 dark:bg-neutral-800">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            autoFocus
            value={search}
            onChange={(event) => setSearch!(event.target.value)}
            placeholder={placeholder}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
          {!!search && (
            <button type="button" onClick={() => setSearch!("")} className="rounded-full p-1 text-slate-400">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Home                                                                */
/* ------------------------------------------------------------------ */

const HomeTab = ({ user, quotations, orderRequests, unreadCount, onNewOrder, onViewAllRequests, onOpenRequest, onOpenQuotation, onOpenNotifications }: {
  user: ProfileUser;
  quotations: Quotation[];
  orderRequests: OrderRequest[];
  unreadCount: number;
  onNewOrder: () => void;
  onViewAllRequests: () => void;
  onOpenRequest: (id?: string) => void;
  onOpenQuotation: (quotationNumber: string) => void;
  onOpenNotifications: () => void;
}) => {
  const activities = [
    ...orderRequests.slice(0, 6).map((request) => ({ id: `request-${request.id}`, type: "request" as const, time: request.createdAt, request })),
    ...quotations.slice(0, 6).map((quotation) => ({ id: `quotation-${quotation.quotationNumber}`, type: "quotation" as const, time: quotation.createdAt, quotation })),
  ].sort((a, b) => b.time - a.time).slice(0, 10);

  const pending = orderRequests.filter((request) => request.status !== "prepared").length;
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return <div className="space-y-8 sm:space-y-9">
    <div
      className={`app-header-sticky app-bleed -mt-[calc(var(--safe-top)+14px)] rounded-b-[28px] px-5 pb-6 pt-[calc(var(--safe-top)+18px)] transition-all duration-300 ease-out sm:mt-0 sm:rounded-3xl sm:px-7 sm:pt-6 ${
        isScrolled
          ? "border-b border-slate-200/70 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
          : "border-b border-transparent bg-transparent shadow-none"
      }`}
    >
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex min-w-0 items-center gap-3">
          {user.profileImage ? (
            <img src={user.profileImage} alt="Profile" className="h-11 w-11 rounded-full object-cover ring-1 ring-slate-200 dark:ring-neutral-700" />
          ) : (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-neutral-800">
              <User className="h-5 w-5 text-slate-500" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-slate-400">Hi,</p>
            <p className="truncate text-lg font-bold tracking-tight">{user.displayName || "there"}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenNotifications}
          aria-label="Notifications"
          className="relative flex h-12 w-12 touch-manipulation select-none items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition active:scale-95 hover:bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-neutral-900">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </div>
    </div>

    {/* hero — a color-block panel that stands apart from the body, not a floating card */}
    <section className="relative mt-4 overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 px-5 py-7 text-white shadow-[0_18px_40px_-18px_rgba(15,23,42,0.55)] sm:mt-6 sm:rounded-[32px] sm:px-8 sm:py-8">
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-52 w-52 rounded-full bg-indigo-500/20 blur-2xl" />
      <div className="pointer-events-none absolute inset-0 rounded-[28px] ring-1 ring-inset ring-white/10 sm:rounded-[32px]" />

      <div className="relative space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
            <BrandLogo />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">Decor Drapes Instyle</p>
            <h2 className="mt-1 text-xl font-bold leading-tight">Your fabric &amp; quotation partner</h2>
          </div>
        </div>

        <p className="max-w-md text-sm leading-6 text-white/70">Send your measurements and track every request in one place.</p>

        <div className="flex flex-wrap items-center gap-x-7 gap-y-3 rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-inset ring-white/10">
          <StatInline label="Requests" value={orderRequests.length} light />
          <StatInline label="In progress" value={pending} light />
          <StatInline label="Quotations" value={quotations.length} light />
        </div>

        <div className="flex flex-wrap gap-2.5 pt-1">
          <button
            type="button"
            onClick={onNewOrder}
            className="inline-flex min-h-12 items-center rounded-full bg-white px-5 text-xs font-bold text-slate-900 shadow-sm transition active:scale-[.98]"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Create request
          </button>
          <button
            type="button"
            onClick={onViewAllRequests}
            className="inline-flex min-h-12 items-center rounded-full bg-white/10 px-5 text-xs font-bold text-white ring-1 ring-inset ring-white/20 transition active:scale-[.98]"
          >
            View all requests
            <ChevronRight className="ml-1.5 h-4 w-4" />
          </button>
        </div>
      </div>
    </section>

    {/* recent activity — no surrounding card, app-style scroller */}
    <section className="mt-6 space-y-3 sm:mt-8">
      <div className="flex items-end justify-between gap-3 px-1">
        <div>
          <h2 className="text-base font-bold">Recent activity</h2>
          <p className="mt-0.5 text-xs text-slate-500">Tap a card to open its details.</p>
        </div>
        <button
          type="button"
          onClick={onViewAllRequests}
          className="shrink-0 text-[11px] font-bold text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white"
        >
          See all
          <ChevronRight className="inline h-3.5 w-3.5" />
        </button>
      </div>

      {activities.length ? (
        <div
          className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2"
          style={{ touchAction: "pan-x pan-y" }}
        >
          {activities.map((activity) =>
            activity.type === "request" ? (
              <OrderRequestCard key={activity.id} request={activity.request} variant="slide" onOpen={() => onOpenRequest(activity.request.id)} onOpenQuotation={onOpenQuotation} />
            ) : (
              <QuotationCard key={activity.id} quotation={activity.quotation} variant="slide" onOpen={() => onOpenQuotation(activity.quotation.quotationNumber)} />
            )
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500 dark:border-neutral-700">
          Your requests and quotations will appear here.
        </div>
      )}
    </section>
  </div>;
};

const StatInline = ({ label, value, light = false }: { label: string; value: number; light?: boolean }) => <div className="flex items-baseline gap-1.5">
  <span className={`text-xl font-extrabold leading-none tabular-nums ${light ? "text-white" : ""}`}>{value}</span>
  <span className={`text-[11px] font-semibold uppercase tracking-wide ${light ? "text-white/60" : "text-slate-400"}`}>{label}</span>
</div>;

/* ------------------------------------------------------------------ */
/* Order requests                                                      */
/* ------------------------------------------------------------------ */

const OrderRequestCard = ({ request, variant = "list", onOpen, onOpenQuotation }: {
  request: OrderRequest;
  variant?: "list" | "slide";
  onOpen: () => void;
  onOpenQuotation: (quotationNumber: string) => void;
}) => {
  const meta = ORDER_STATUS_META[request.status];
  const quotationNumber = getQuotationNumber(request);
  const items = request.items || [];
  const fabricCodes = Array.from(new Set(items.map((item) => item.fabricCode).filter(Boolean))) as string[];

  return <article className={`${variant === "slide" ? "w-[86vw] min-w-[270px] max-w-[330px] shrink-0 snap-start" : "w-full"} overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition dark:border-neutral-800 dark:bg-neutral-900`}>
    <button type="button" onClick={onOpen} className="w-full p-4 text-left transition active:scale-[.995]">
      <div className="flex items-center justify-between gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${meta?.className}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${meta?.dot}`} />{meta?.label || request.status}
        </span>
        <span className="shrink-0 text-[10px] font-medium text-slate-400">{formatShortDate(request.createdAt)}</span>
      </div>

      <p className="mt-3 text-sm font-bold">Order request</p>
      <p className="mt-0.5 text-[11px] text-slate-500">{meta?.note}</p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <Chip icon={Package} text={`${items.length} item${items.length === 1 ? "" : "s"}`} />
        {fabricCodes.slice(0, 2).map((code) => <Chip key={code} icon={Layers} text={code} />)}
        {fabricCodes.length > 2 && <Chip text={`+${fabricCodes.length - 2}`} />}
      </div>

      {!!items.length && <div className="mt-2 flex flex-wrap gap-1.5">
        {items.slice(0, variant === "slide" ? 2 : 4).map((item, index) => <span key={index} className="rounded-lg bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-500 dark:bg-neutral-800 dark:text-neutral-300">
          {item.width ?? "—"} {item.widthUnit} × {item.height ?? "—"} {item.heightUnit}
        </span>)}
        {items.length > (variant === "slide" ? 2 : 4) && <span className="self-center text-[10px] font-semibold text-slate-400">+{items.length - (variant === "slide" ? 2 : 4)} more</span>}
      </div>}

      <OrderRequestTracker status={request.status} compact={variant === "slide"} />
    </button>

    {quotationNumber ? <button type="button" onClick={() => onOpenQuotation(quotationNumber)} className="flex w-full items-center justify-between gap-2 border-t border-slate-100 bg-indigo-50/60 px-4 py-3 text-left transition active:bg-indigo-100 dark:border-neutral-800 dark:bg-indigo-950/30">
      <span className="flex min-w-0 items-center gap-2">
        <FileText className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-300" />
        <span className="min-w-0">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-indigo-400">Linked quotation</span>
          <span className="block truncate text-xs font-bold text-indigo-700 dark:text-indigo-300">{quotationNumber}</span>
        </span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-indigo-500" />
    </button> : <div className="border-t border-slate-100 px-4 py-2.5 text-[10px] font-medium text-slate-400 dark:border-neutral-800">Quotation not generated yet</div>}
  </article>;
};

const Chip = ({ icon: Icon, text }: { icon?: React.ElementType; text: string }) => <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600 dark:bg-neutral-800 dark:text-neutral-300">
  {Icon && <Icon className="h-3 w-3" />}{text}
</span>;

const OrderRequestsPage = ({ orderRequests, selectedRequestId, onSelectRequest, onBack, onNewOrder, onOpenQuotation }: {
  orderRequests: OrderRequest[];
  selectedRequestId: string | null;
  onSelectRequest: (id: string | null) => void;
  onBack: () => void;
  onNewOrder: () => void;
  onOpenQuotation: (quotationNumber: string) => void;
}) => {
  const [filter, setFilter] = useState<"all" | OrderRequestStatus>("all");
  const selected = selectedRequestId ? orderRequests.find((request) => request.id === selectedRequestId) || null : null;
  const visible = filter === "all" ? orderRequests : orderRequests.filter((request) => request.status === filter);

  return <div className="space-y-6">
    <TabHeader
      eyebrow=""
      title="Home"
      onBack={onBack}
      extra={<button type="button" onClick={onNewOrder} className="rounded-full bg-slate-900 px-3.5 py-2 text-xs font-bold text-white dark:bg-white dark:text-slate-900"><Plus className="mr-1 inline h-3.5 w-3.5" />New request</button>}
    />

    <div className="space-y-2.5 px-1">
      <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">All order requests</h2>
      <p className="text-sm text-slate-500 dark:text-neutral-400">Track every request and open its quotation directly.</p>
      <div className="flex flex-wrap items-center gap-2">
        <Chip icon={Package} text={`${orderRequests.length} request${orderRequests.length === 1 ? "" : "s"}`} />
      </div>
    </div>

    <div className="app-bleed no-scrollbar flex gap-2 overflow-x-auto pb-1">
      {([["all", "All"], ...Object.entries(ORDER_STATUS_META).map(([key, value]) => [key, value.label])] as [string, string][]).map(([key, label]) => <button
        key={key}
        type="button"
        onClick={() => setFilter(key as "all" | OrderRequestStatus)}
        className={`shrink-0 rounded-full px-3.5 py-2 text-[11px] font-bold transition ${filter === key ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "border border-slate-200 bg-white text-slate-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"}`}
      >{label}</button>)}
    </div>

    <div className="grid gap-3 lg:grid-cols-2">
      {visible.length ? visible.map((request) => <OrderRequestCard key={request.id} request={request} onOpen={() => onSelectRequest(request.id || null)} onOpenQuotation={onOpenQuotation} />) : <EmptyState text="No requests in this status." />}
    </div>

    {selected && <OrderRequestSheetDetail request={selected} onClose={() => onSelectRequest(null)} onOpenQuotation={onOpenQuotation} />}
  </div>;
};

const OrderRequestSheetDetail = ({ request, onClose, onOpenQuotation }: { request: OrderRequest; onClose: () => void; onOpenQuotation: (quotationNumber: string) => void }) => {
  const swipe = useSwipeToClose(onClose);
  const meta = ORDER_STATUS_META[request.status];
  const quotationNumber = getQuotationNumber(request);

  return <div {...swipe} className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
    <div onClick={(event) => event.stopPropagation()} className="app-sheet w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl dark:bg-neutral-900 sm:rounded-3xl sm:p-7">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Order request</p>
          <p className="mt-1 text-base font-bold">{formatDate(request.createdAt)}</p>
          <span className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${meta?.className}`}><span className={`h-1.5 w-1.5 rounded-full ${meta?.dot}`} />{meta?.label || request.status}</span>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="shrink-0 rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-neutral-800"><X className="h-5 w-5" /></button>
      </div>

      <OrderRequestTracker status={request.status} />

      <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-slate-400">Items ({request.items?.length || 0})</p>
      <div className="mt-2 space-y-2">
        {(request.items || []).map((item, index) => <div key={index} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2.5 dark:border-neutral-800">
          <div className="min-w-0">
            <p className="text-sm font-semibold">Item {index + 1}</p>
            {item.fabricCode && <p className="mt-0.5 truncate text-[11px] text-slate-500">Fabric {item.fabricCode}</p>}
          </div>
          <span className="shrink-0 rounded-lg bg-slate-50 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 dark:bg-neutral-800 dark:text-neutral-200">{item.width} {item.widthUnit} × {item.height} {item.heightUnit}</span>
        </div>)}
      </div>

      {quotationNumber ? <button type="button" onClick={() => onOpenQuotation(quotationNumber)} className="mt-5 flex w-full items-center justify-between gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-left text-white">
        <span className="min-w-0">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-indigo-200">Linked quotation</span>
          <span className="block truncate text-sm font-bold">{quotationNumber}</span>
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold"><FileText className="h-4 w-4" />Open</span>
      </button> : <p className="mt-5 rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-center text-xs text-slate-500 dark:border-neutral-700">A quotation will be linked here once it is prepared.</p>}
    </div>
  </div>;
};

const OrderRequestTracker = ({ status, compact = false }: { status: OrderRequestStatus; compact?: boolean }) => {
  const steps: { key: OrderRequestStatus; label: string; icon: React.ElementType }[] = [
    { key: "not-reviewed", label: "Received", icon: Clock },
    { key: "viewed", label: "Reviewed", icon: Search },
    { key: "quote-prepared", label: "Quote", icon: FileText },
    { key: "prepared", label: "Prepared", icon: CheckCircle2 },
  ];
  const activeIndex = Math.max(0, steps.findIndex((step) => step.key === status));

  return <div className={compact ? "mt-3 px-1 py-1" : "mt-4 rounded-2xl bg-slate-50 px-3 py-4 dark:bg-neutral-800/70"}>
    <div className="flex items-start">
      {steps.map((step, index) => {
        const complete = index <= activeIndex;
        const Icon = step.icon;
        return <React.Fragment key={step.key}>
          <div className="flex min-w-0 flex-1 flex-col items-center text-center">
            <div className={`flex ${compact ? "h-6 w-6" : "h-8 w-8"} items-center justify-center rounded-full ${complete ? (step.key === "prepared" ? "bg-emerald-500 text-white" : step.key === "quote-prepared" ? "bg-indigo-500 text-white" : step.key === "viewed" ? "bg-amber-500 text-white" : "bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-900") : "bg-slate-200 text-slate-400 dark:bg-neutral-700 dark:text-neutral-500"}`}>
              <Icon className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
            </div>
            <p className={`${compact ? "mt-1 text-[8px]" : "mt-2 text-[10px]"} font-semibold ${complete ? "text-slate-800 dark:text-white" : "text-slate-400"}`}>{step.label}</p>
          </div>
          {index < steps.length - 1 && <div className={`${compact ? "mt-3" : "mt-4"} h-px min-w-4 flex-1 ${index < activeIndex ? (activeIndex === 3 ? "bg-emerald-400" : activeIndex === 2 ? "bg-indigo-400" : activeIndex === 1 ? "bg-amber-400" : "bg-slate-400") : "bg-slate-200 dark:bg-neutral-700"}`} />}
        </React.Fragment>;
      })}
    </div>
  </div>;
};

/* ------------------------------------------------------------------ */
/* Pricelist                                                           */
/* ------------------------------------------------------------------ */

const PriceListTab = ({ priceList, selected, setSelected, search, setSearch, onGoHome }: { priceList: Record<string, Category>; selected: string | null; setSelected: (value: string | null) => void; search: string; setSearch: (value: string) => void; onGoHome?: () => void }) => {
  const query = search.trim().toLowerCase();

  const categories = Object.entries(priceList).map(([name, category]) => {
    const nameMatches = !!query && name.toLowerCase().includes(query);
    const allProducts = Object.values(category.products || {});
    const products = query && !nameMatches ? allProducts.filter((product) => JSON.stringify(product).toLowerCase().includes(query)) : allProducts;
    return { name, category, products };
  }).filter((item) => !query || item.name.toLowerCase().includes(query) || item.products.length > 0);

  const current = categories.find((item) => item.name === selected);

  if (current) {
    const lastUpdated = formatDate(current.category.lastUpdated);
    return <div className="space-y-6">
      <TabHeader
        eyebrow=""
        title="Price list"
        onBack={() => window.history.back()}
        search={search}
        setSearch={setSearch}
        placeholder="Search products..."
      />

      <div className="space-y-2.5 px-1">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{current.name}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Chip icon={Package} text={`${current.products.length} product${current.products.length === 1 ? "" : "s"}`} />
          {lastUpdated && <Chip icon={Clock} text={`Updated ${lastUpdated}`} />}
        </div>
      </div>

      {current.products.length ? <div className="space-y-2">{current.products.map((product, index) => <ProductCard key={index} product={product} />)}</div> : <EmptyState text="No products match your search." />}
    </div>;
  }

  return <div className="space-y-6">
    <TabHeader
      eyebrow=""
      title="Categories"
      onBack={onGoHome}
      search={search}
      setSearch={setSearch}
      placeholder="Search categories or products..."
      meta={""}
    />
    {categories.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">{categories.map((item) => <CategoryCard key={item.name} name={item.name} category={item.category} productCount={item.products.length} onClick={() => setSelected(item.name)} />)}</div> : <EmptyState text="No categories found." />}
  </div>;
};

const CategoryCard = ({ name, category, productCount, onClick }: { name: string; category: Category; productCount: number; onClick: () => void }) => <button onClick={onClick} className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
  <div className="relative aspect-square w-full overflow-hidden bg-slate-100 dark:bg-neutral-800">
    {category.imageUrl ? <img src={category.imageUrl} alt="" className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-105" /> : <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 text-3xl font-bold text-slate-300 dark:from-neutral-800 dark:to-neutral-900">{name.charAt(0).toUpperCase()}</div>}
  </div>
  <div className="flex min-h-[88px] flex-col p-3 sm:min-h-[100px] sm:p-4">
    <h3 className="line-clamp-2 min-h-[34px] break-words text-[12.5px] font-semibold leading-snug tracking-tight text-slate-900 sm:min-h-[38px] sm:text-sm dark:text-white">{name}</h3>
    <div className="mt-auto flex items-center justify-between gap-2 pt-2.5">
      <span className="inline-flex shrink-0 items-center rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600 dark:bg-neutral-800 dark:text-neutral-300">{productCount} {productCount === 1 ? "item" : "items"}</span>
      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition duration-200 group-hover:bg-slate-200 group-hover:text-slate-700 dark:bg-neutral-800"><ChevronRight className="h-3.5 w-3.5" /></span>
    </div>
  </div>
</button>;

const getVisibleProductFields = (product: Product) =>
  Object.entries(product).filter(([key, value]) => !HIDDEN_FIELDS.includes(key) && value !== undefined && value !== null && value !== "");

const getFieldGridClass = (count: number) => {
  if (count <= 1) return "grid-cols-1";
  if (count === 2) return "grid-cols-2";
  if (count === 3) return "grid-cols-3";
  if (count === 4) return "grid-cols-2 sm:grid-cols-4";
  if (count === 5) return "grid-cols-2 sm:grid-cols-5";
  return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6";
};

const ProductCard = ({ product }: { product: Product }) => {
  const name = String(product["product name"] || product.media || "Product");
  const gst = formatGst(product.gst);
  const fields = getVisibleProductFields(product);
  const onlyPrice = fields.length === 1 && /price|rate|cost/i.test(fields[0]?.[0] || "");

  return <article className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 md:flex md:items-center md:gap-5 md:rounded-lg md:px-4 md:py-3">
    <div className="mb-2.5 flex min-w-0 items-center justify-between gap-3 md:mb-0 md:w-[24%] md:shrink-0">
      <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{name}</p>
      {gst && <span className="shrink-0 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"><Percent className="mr-0.5 inline h-2.5 w-2.5" />GST {gst}</span>}
    </div>
    {onlyPrice ? <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-2.5 md:flex-1 md:border-0 md:pt-0">
      <span className="text-xs font-medium text-slate-400">{formatFieldName(fields[0][0])}</span>
      <span className="text-sm font-bold text-slate-900 dark:text-white">{formatFieldValue(fields[0][0], fields[0][1])}</span>
    </div> : fields.length ? <div className={`grid w-full ${getFieldGridClass(fields.length)} gap-2 md:flex-1`}>
      {fields.map(([key, value]) => {
        const Icon = getFieldIcon(key);
        return <div key={key} className="flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg bg-slate-50 px-2 py-2 text-center dark:bg-neutral-800 md:flex-row md:justify-between md:gap-2 md:rounded-md md:py-1.5 md:text-left">
          <span className="flex min-w-0 items-center gap-1 truncate text-[10px] font-medium text-slate-400"><Icon className="h-3 w-3 shrink-0" />{formatFieldName(key)}</span>
          <span className="truncate text-sm font-semibold text-slate-800 dark:text-neutral-100">{formatFieldValue(key, value)}</span>
        </div>;
      })}
    </div> : <p className="text-sm text-slate-500 dark:text-neutral-400">No further details available.</p>}
  </article>;
};

/* ------------------------------------------------------------------ */
/* Quotations                                                          */
/* ------------------------------------------------------------------ */

const QUOTATION_DATE_FILTERS: { key: string; label: string; days: number | null }[] = [
  { key: "all", label: "All time", days: null },
  { key: "7d", label: "7 days", days: 7 },
  { key: "30d", label: "30 days", days: 30 },
  { key: "90d", label: "3 months", days: 90 },
];

const getQuotationStatusGroup = (status: string): "paid" | "rejected" | "pending" => {
  const value = (status || "").toLowerCase();
  if (value.includes("confirm") || value.includes("approve") || value.includes("paid")) return "paid";
  if (value.includes("reject") || value.includes("cancel")) return "rejected";
  return "pending";
};

const QUOTATION_STATUS_FILTERS: { key: "all" | "pending" | "paid" | "rejected"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "paid", label: "Paid / confirmed" },
  { key: "rejected", label: "Rejected" },
];

const QuotationsTab = ({ quotations, search, setSearch, selectedQuotationNumber, onOpenQuotation, onGoHome }: {
  quotations: Quotation[];
  search: string;
  setSearch: (value: string) => void;
  selectedQuotationNumber: string | null;
  onOpenQuotation: (quotationNumber: string) => void;
  onGoHome?: () => void;
}) => {
  const selected = selectedQuotationNumber ? quotations.find((q) => q.quotationNumber === selectedQuotationNumber) || null : null;
  const [dateFilter, setDateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "paid" | "rejected">("all");
  const query = search.trim().toLowerCase();

  const filtered = useMemo(() => {
    const activeDate = QUOTATION_DATE_FILTERS.find((item) => item.key === dateFilter);
    const cutoff = activeDate?.days ? Date.now() - activeDate.days * 24 * 60 * 60 * 1000 : null;
    return quotations.filter((quotation) => {
      if (query && !(
        quotation.quotationNumber.toLowerCase().includes(query) ||
        quotation.customer?.name?.toLowerCase().includes(query) ||
        quotation.status.toLowerCase().includes(query)
      )) return false;
      if (cutoff && quotation.createdAt < cutoff) return false;
      if (statusFilter !== "all" && getQuotationStatusGroup(quotation.status) !== statusFilter) return false;
      return true;
    });
  }, [quotations, query, dateFilter, statusFilter]);

  const total = quotations.reduce((sum, quotation) => sum + Number(quotation.grandTotal || 0), 0);
  const pendingAmount = quotations
    .filter((quotation) => getQuotationStatusGroup(quotation.status) === "pending")
    .reduce((sum, quotation) => sum + Number(quotation.grandTotal || 0), 0);

  const filtersActive = !!query || dateFilter !== "all" || statusFilter !== "all";

  return <div className="space-y-6">
    <TabHeader
      eyebrow=""
      title="Quotations"
      onBack={onGoHome}
      search={search}
      setSearch={setSearch}
      placeholder="Search quotations..."
      meta={<></>}
    />

    <div className="space-y-2">
      {/* Date-filtered totals */} 
      {!!quotations.length && ( <div className="app-bleed mt-3"> <div className="flex flex-wrap gap-2"> <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600 dark:bg-neutral-800 dark:text-neutral-300"> Total ₹{Math.round(total).toLocaleString("en-IN")} </span> {pendingAmount > 0 && ( <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"> Pending ₹{Math.round(pendingAmount).toLocaleString("en-IN")} </span> )} </div> </div> )} {/* Date filters */} <div className="app-bleed mt-2 overflow-x-auto no-scrollbar"> <div className="flex w-max gap-2 pb-0.5"> {QUOTATION_DATE_FILTERS.map((item) => ( <button key={item.key} type="button" onClick={() => setDateFilter(item.key)} className={`shrink-0 rounded-full px-3.5 py-1.5 text-[11px] font-bold transition ${ dateFilter === item.key ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "border border-slate-200 bg-white text-slate-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300" }`} > {item.label} </button> ))} </div> </div>
      <div className="app-bleed no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {QUOTATION_STATUS_FILTERS.map((item) => <button
          key={item.key}
          type="button"
          onClick={() => setStatusFilter(item.key)}
          className={`shrink-0 rounded-full px-3.5 py-1.5 text-[11px] font-bold transition ${statusFilter === item.key ? "bg-indigo-600 text-white" : "border border-slate-200 bg-white text-slate-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"}`}
        >{item.label}</button>)}
      </div>
    </div>

    {filtered.length ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {filtered.map((quotation) => <QuotationCard key={quotation.quotationNumber} quotation={quotation} onOpen={() => onOpenQuotation(quotation.quotationNumber)} />)}
    </div> : <EmptyState text={filtersActive ? "No quotations match your filters." : "Your quotations will appear here."} />}

    {selected && <QuotationSheet quotation={selected} onClose={() => window.history.back()} />}
  </div>;
};

const getQuotationTone = (status: string) => {
  const value = (status || "").toLowerCase();
  if (value.includes("confirm") || value.includes("approve") || value.includes("paid")) return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
  if (value.includes("reject") || value.includes("cancel")) return "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300";
  return "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
};

const QuotationCard = ({ quotation, variant = "list", onOpen }: { quotation: Quotation; variant?: "list" | "slide"; onOpen: () => void }) => {
  const itemCount = quotation.items?.length || 0;
  return <button
    type="button"
    onClick={onOpen}
    className={`${variant === "slide" ? "w-[86vw] min-w-[270px] max-w-[330px] shrink-0 snap-start" : "w-full"} flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md active:scale-[.995] dark:border-neutral-800 dark:bg-neutral-900`}
  >
    <div className="flex items-start justify-between gap-2 p-4 pb-3">
      <div className="min-w-0">
        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"><FileText className="h-3 w-3" />Quotation</span>
        <p className="mt-2 truncate text-sm font-bold">{quotation.quotationNumber}</p>
        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500"><CalendarDays className="h-3.5 w-3.5" />{formatShortDate(quotation.createdAt)}</p>
      </div>
      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${getQuotationTone(quotation.status)}`}>{quotation.status || "Pending"}</span>
    </div>

    <div className="mt-auto flex items-end justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-800/50">
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Grand total</p>
        <p className="mt-0.5 truncate text-lg font-extrabold leading-tight">₹{Math.round(Number(quotation.grandTotal || 0)).toLocaleString("en-IN")}</p>
        {itemCount > 0 && <p className="mt-0.5 text-[10px] text-slate-400">{itemCount} item{itemCount === 1 ? "" : "s"}</p>}
      </div>
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm dark:bg-neutral-900"><ChevronRight className="h-4 w-4" /></span>
    </div>
  </button>;
};

const useSwipeToClose = (onClose: () => void) => {
  const startY = React.useRef<number | null>(null);
  return {
    onTouchStart: (event: React.TouchEvent) => { startY.current = event.touches[0]?.clientY ?? null; },
    onTouchEnd: (event: React.TouchEvent) => { const endY = event.changedTouches[0]?.clientY; if (startY.current !== null && endY !== undefined && endY - startY.current > 90) onClose(); startY.current = null; },
  };
};

const QuotationSheet = ({ quotation, onClose }: { quotation: Quotation; onClose: () => void }) => {
  const swipe = useSwipeToClose(onClose);
  const subTotal = quotation.grandTotal - (quotation.taxAmount || 0);
  const taxRate = subTotal > 0 && quotation.taxAmount ? (quotation.taxAmount / subTotal) * 100 : 0;

  return <div {...swipe} className="fixed !m-0 inset-0 z-50 flex items-end justify-center bg-slate-950/40 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
    <div onClick={(event) => event.stopPropagation()} className="app-sheet w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl dark:bg-neutral-900 sm:rounded-3xl sm:p-8">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Quotation</p>
          <h2 className="mt-1 text-lg font-bold">{quotation.quotationNumber}</h2>
          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500 dark:text-neutral-400"><CalendarDays className="h-3.5 w-3.5" />{formatDate(quotation.createdAt)}</p>
        </div>
        <button onClick={onClose} aria-label="Close" className="shrink-0 rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-neutral-800"><X className="h-5 w-5" /></button>
      </div>

      {(quotation.company || quotation.customer) && <div className="mb-5 grid gap-3 sm:grid-cols-2">
        {quotation.company && <div className="flex min-w-0 items-start gap-3 rounded-xl bg-slate-50 p-3 dark:bg-neutral-800">
          {quotation.company.companyLogo && <img src={quotation.company.companyLogo} alt={quotation.company.companyName} className="h-9 w-16 shrink-0 object-contain" />}
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{quotation.company.companyName}</p>
            {quotation.company.companyAddress && <p className="break-words text-xs text-slate-500">{quotation.company.companyAddress}</p>}
            {quotation.company.companyEmail && <p className="truncate text-xs text-slate-500">{quotation.company.companyEmail}</p>}
          </div>
        </div>}
        {quotation.customer && <div className="min-w-0 rounded-xl bg-slate-50 p-3 dark:bg-neutral-800">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Billed to</p>
          <p className="truncate text-sm font-bold">{quotation.customer.name}</p>
          {quotation.customer.email && <p className="truncate text-xs text-slate-500">{quotation.customer.email}</p>}
          {quotation.customer.address && <p className="break-words text-xs text-slate-500">{quotation.customer.address}</p>}
        </div>}
      </div>}

      <div className="mb-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Items</p>
        {quotation.items?.length ? <div className="space-y-2.5">{quotation.items.map((item, index) => <div key={item.id ?? index} className="rounded-xl border border-slate-200 p-3 dark:border-neutral-800">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{item.product?.productName || `Item ${index + 1}`}</p>
              {item.product?.productCategory && <p className="text-xs text-slate-500">{item.product.productCategory}</p>}
              <div className="mt-2 flex flex-wrap gap-1.5">
                <DetailBadge label="Qty" value={item.qty} unit="pcs" />
                <DetailBadge label="Width" value={item.width} unit={item.widthUnit} />
                <DetailBadge label="Height" value={item.height} unit={item.heightUnit} />
                <DetailBadge label="Sqft" value={item.sqft} />
                <DetailBadge label="Running Feet" value={item.runningFeet} />
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-bold">₹{Number(item.amount || 0).toLocaleString("en-IN")}</p>
              {item.price !== undefined && <p className="text-xs text-slate-500">@ ₹{Number(item.price).toLocaleString("en-IN")}{item.product?.unit ? ` / ${item.product.unit}` : ""}</p>}
            </div>
          </div>
        </div>)}</div> : <p className="text-sm text-slate-500 dark:text-neutral-400">No item details available for this quotation.</p>}
      </div>

      <div className="space-y-1.5 border-t border-dashed border-slate-200 pt-4 dark:border-neutral-800">
        <div className="flex justify-between text-sm"><span className="text-slate-500">Subtotal</span><span className="font-semibold">₹{subTotal.toLocaleString("en-IN")}</span></div>
        {quotation.taxAmount ? <div className="flex justify-between text-sm"><span className="text-slate-500">Tax ({Math.round(taxRate)}%)</span><span className="font-semibold">₹{quotation.taxAmount.toLocaleString("en-IN")}</span></div> : null}
        <div className="flex justify-between border-t border-slate-100 pt-1.5 text-base dark:border-neutral-800"><span className="font-bold">Grand total</span><span className="font-bold">₹{Number(quotation.grandTotal || 0).toLocaleString("en-IN")}</span></div>
      </div>
    </div>
  </div>;
};

const DetailBadge = ({ label, value, unit = "" }: { label: string; value?: string | number; unit?: string }) => {
  if (value === undefined || value === null || value === 0 || value === "") return null;
  const display = typeof value === "number" ? Math.ceil(value) : value;
  return <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:bg-neutral-700 dark:text-neutral-300">{label}: {display} {unit}</span>;
};

/* ------------------------------------------------------------------ */
/* New order request sheet                                             */
/* ------------------------------------------------------------------ */

type OrderItemForm = { key: string; height: string; heightUnit: LengthUnit; width: string; widthUnit: LengthUnit; fabricCode: string };

const newOrderItem = (): OrderItemForm => ({ key: Math.random().toString(36).slice(2), height: "", heightUnit: "inch", width: "", widthUnit: "inch", fabricCode: "" });

const OrderRequestSheet = ({ onClose, onSubmit }: { onClose: () => void; onSubmit: (items: OrderRequestItem[]) => Promise<void> }) => {
  const swipe = useSwipeToClose(onClose);
  const [items, setItems] = useState<OrderItemForm[]>([newOrderItem()]);
  const [sameFabricCode, setSameFabricCode] = useState(true);
  const [sharedFabricCode, setSharedFabricCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const updateItem = (key: string, field: keyof OrderItemForm, value: string) =>
    setItems((current) => current.map((item) => (item.key === key ? { ...item, [field]: value } : item)));

  const removeItem = (key: string) => setItems((current) => (current.length > 1 ? current.filter((item) => item.key !== key) : current));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const hasDimensions = items.every((item) => item.height && item.width);
    if (!hasDimensions) {
      toast.error("Enter height and width for every item");
      return;
    }
    if (sameFabricCode && !sharedFabricCode.trim()) {
      toast.error("Enter a fabric code");
      return;
    }
    setSubmitting(true);
    try {
      const payload: OrderRequestItem[] = items.map((item) => ({
        height: Number(item.height) || 0,
        heightUnit: item.heightUnit,
        width: Number(item.width) || 0,
        widthUnit: item.widthUnit,
        fabricCode: sameFabricCode ? sharedFabricCode.trim() : item.fabricCode.trim(),
      }));
      await onSubmit(payload);
      toast.success("Order request sent");
      onClose();
    } catch {
      toast.error("Could not send your request");
    } finally {
      setSubmitting(false);
    }
  };

  return <div {...swipe} className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
    <form onSubmit={handleSubmit} onClick={(event) => event.stopPropagation()} className="app-sheet w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl dark:bg-neutral-900 sm:rounded-3xl sm:p-8">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">New request</p>
          <h2 className="mt-1 text-lg font-bold">Order request</h2>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="shrink-0 rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-neutral-800"><X className="h-5 w-5" /></button>
      </div>

      <label className="mb-4 flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-sm font-medium dark:bg-neutral-800">
        <input type="checkbox" checked={sameFabricCode} onChange={(event) => setSameFabricCode(event.target.checked)} className="h-4 w-4 rounded border-slate-300" />
        Use the same fabric code for all items
      </label>
      {sameFabricCode && <div className="mb-4">
        <Input icon={Layers} label="Fabric code" value={sharedFabricCode} onChange={setSharedFabricCode} />
      </div>}

      <div className="space-y-3">
        {items.map((item, index) => <div key={item.key} className="rounded-2xl border border-slate-200 p-3.5 dark:border-neutral-800">
          <div className="mb-2.5 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Item {index + 1}</p>
            {items.length > 1 && <button type="button" onClick={() => removeItem(item.key)} aria-label="Remove item" className="rounded-full p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"><Trash2 className="h-4 w-4" /></button>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <DimensionInput label="Height" value={item.height} unit={item.heightUnit} onValueChange={(value) => updateItem(item.key, "height", value)} onUnitChange={(unit) => updateItem(item.key, "heightUnit", unit)} />
            <DimensionInput label="Width" value={item.width} unit={item.widthUnit} onValueChange={(value) => updateItem(item.key, "width", value)} onUnitChange={(unit) => updateItem(item.key, "widthUnit", unit)} />
          </div>
          {!sameFabricCode && <div className="mt-3">
            <Input icon={Layers} label="Fabric code" value={item.fabricCode} onChange={(value) => updateItem(item.key, "fabricCode", value)} />
          </div>}
        </div>)}
      </div>

      <button type="button" onClick={() => setItems((current) => [...current, newOrderItem()])} className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-dashed border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:border-slate-400 dark:border-neutral-700 dark:text-neutral-300">
        <Plus className="h-3.5 w-3.5" />Add another item
      </button>

      <div className="mt-6 flex gap-2">
        <button disabled={submitting} className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-slate-900"><Package className="h-4 w-4" />{submitting ? "Sending..." : "Send request"}</button>
        <button type="button" onClick={onClose} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold dark:bg-neutral-800"><X className="h-4 w-4" />Cancel</button>
      </div>
    </form>
  </div>;
};

const DimensionInput = ({ label, value, unit, onValueChange, onUnitChange }: { label: string; value: string; unit: LengthUnit; onValueChange: (value: string) => void; onUnitChange: (unit: LengthUnit) => void }) => <label className="block text-sm font-medium">
  <span className="mb-1 flex items-center gap-1.5 text-slate-600 dark:text-neutral-300"><Ruler className="h-3.5 w-3.5 text-slate-400" />{label}</span>
  <div className="flex overflow-hidden rounded-xl border border-slate-200 dark:border-neutral-700">
    <input type="number" min="0" step="any" value={value} onChange={(event) => onValueChange(event.target.value)} className="w-full min-w-0 bg-transparent px-3 py-2.5 text-sm outline-none" />
    <select value={unit} onChange={(event) => onUnitChange(event.target.value as LengthUnit)} className="shrink-0 border-l border-slate-200 bg-slate-50 px-2 text-xs font-semibold outline-none dark:border-neutral-700 dark:bg-neutral-800">
      {LENGTH_UNITS.map((option) => <option key={option} value={option}>{option}</option>)}
    </select>
  </div>
</label>;

/* ------------------------------------------------------------------ */
/* Profile                                                             */
/* ------------------------------------------------------------------ */

const MenuItem = ({ icon: Icon, title, description, onClick }: {
  icon: React.ElementType;
  title: string;
  description: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="group flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
  >
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-neutral-300">
      <Icon className="h-5 w-5" />
    </span>
    <span className="min-w-0 flex-1">
      <span className="block text-sm font-semibold text-slate-900 dark:text-white">{title}</span>
      <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-neutral-400">{description}</span>
    </span>
    <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 dark:text-neutral-500" />
  </button>
);

const DetailRow = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string }) => <div className="flex items-start gap-3 border-b border-slate-100 px-4 py-3.5 last:border-0 dark:border-neutral-800">
  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-neutral-800 dark:text-neutral-400"><Icon className="h-4 w-4" /></span>
  <div className="min-w-0 flex-1">
    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
    <p className={`mt-0.5 break-words text-sm ${value ? "font-semibold text-slate-900 dark:text-white" : "text-slate-400"}`}>{value || "Not added yet"}</p>
  </div>
</div>;

const ProfileTab = ({ user, section, setSection, form, saving, updateField, resetForm, save, logout, theme, setTheme, onGoHome, onUpdateProfileImage }: {
  user: ProfileUser;
  section: ProfileSection;
  setSection: (value: ProfileSection) => void;
  form: ProfileForm;
  saving: boolean;
  updateField: (field: keyof ProfileForm, value: string) => void;
  resetForm: () => void;
  save: (event: React.FormEvent) => Promise<boolean>;
  logout: () => void;
  theme: "light" | "dark";
  setTheme: (value: "light" | "dark") => void;
  onGoHome?: () => void;
  onUpdateProfileImage: (url: string) => Promise<void>; // persists the Cloudinary URL to your DB
}) => {
  const [editing, setEditing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setEditing(false); }, [section]);

  const goBack = () => { resetForm(); setEditing(false); setSection("list"); };

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image must be under 5MB.");
      return;
    }

    setUploadError(null);
    setUploadingImage(true);
    try {
      const url = await uploadToCloudinary(file);
      await onUpdateProfileImage(url); // your API call saves `url` against the user record
    } catch {
      setUploadError("Couldn't upload image. Try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  const themeToggle = (
    <button
      type="button"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Switch theme"
      className="flex h-10 w-10 touch-manipulation items-center justify-center rounded-full bg-slate-100 text-slate-600 transition active:scale-95 dark:bg-neutral-800 dark:text-neutral-300"
    >
      {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  );

  if (section === "list") {
    const menuItems = [
      { key: "personal", icon: User, title: "Personal information", description: user.phone ? user.phone : "Name, phone and bio", onClick: () => setSection("personal") },
      { key: "company", icon: Building2, title: "Company information", description: user.company || "Company, GST and address", onClick: () => setSection("company") },
    ];

    return <div className="space-y-6">
      <TabHeader eyebrow="" title="Profile" onBack={onGoHome} extra={themeToggle} />

      {/* centered avatar card */}
      <section className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white px-5 py-8 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="relative">
          {user.profileImage ? (
            <img src={user.profileImage} alt="Profile" className="h-24 w-24 rounded-full object-cover ring-2 ring-slate-100 dark:ring-neutral-800" />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-100 dark:bg-neutral-800">
              <User className="h-10 w-10 text-slate-400 dark:text-neutral-500" />
            </div>
          )}

          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage}
            aria-label="Change profile photo"
            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white shadow-sm ring-2 ring-white transition active:scale-95 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:ring-neutral-900"
          >
            {uploadingImage ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
          </button>
        </div>

        {uploadError && <p className="mt-2 text-xs font-medium text-red-500">{uploadError}</p>}

        <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">{user.displayName || "User"}</h3>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-neutral-400">{user.email}</p>
        {user.company && <p className="mt-1 text-xs font-medium text-slate-400 dark:text-neutral-500">{user.company}</p>}
      </section>

      <section className="space-y-3">
        <div className="px-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-neutral-500">Details</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">View your personal and business information.</p>
        </div>
        {menuItems.map((item) => <MenuItem key={item.key} icon={item.icon} title={item.title} description={item.description} onClick={item.onClick} />)}
      </section>

      <section className="mt-2 rounded-2xl border border-red-200/70 bg-red-50/70 p-4 dark:border-red-900/60 dark:bg-red-950/20">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-white">Sign out</p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-neutral-400">End your current customer portal session.</p>
          </div>
          <button onClick={logout} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-red-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"><LogOut className="h-3.5 w-3.5" />Log out</button>
        </div>
      </section>
    </div>;
  }

  const personal = section === "personal";

  const headerExtra = !editing ? (
    <button type="button" onClick={() => setEditing(true)} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition active:scale-95 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"><Pencil className="h-3.5 w-3.5" />Edit</button>
  ) : undefined;

  const header = (
    <TabHeader
      eyebrow={personal ? "Personal information" : "Company information"}
      title={personal ? "About you" : "Your business"}
      onBack={goBack}
      extra={headerExtra}
    />
  );

  if (!editing) return <div className="space-y-6">
    {header}
    <div className="px-1">
      <p className="text-sm text-slate-500 dark:text-neutral-400">Tap edit to change these details.</p>
    </div>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      {personal ? <>
        <DetailRow icon={User} label="Full name" value={user.displayName} />
        <DetailRow icon={Mail} label="Email" value={user.email} />
        <DetailRow icon={Phone} label="Phone" value={user.phone} />
        <DetailRow icon={FileText} label="Bio" value={user.bio} />
      </> : <>
        <DetailRow icon={Building2} label="Company name" value={user.company} />
        <DetailRow icon={MapPin} label="Company address" value={user.address} />
        <DetailRow icon={ShieldCheck} label="GST number" value={user.gst} />
      </>}
    </section>
  </div>;

  return <form className="space-y-6" onSubmit={async (event) => { const ok = await save(event); if (ok) setEditing(false); }}>
    {header}
    <div className="px-1">
      <p className="text-sm text-slate-500 dark:text-neutral-400">Update your details below and save when you're done.</p>
    </div>
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="grid gap-4 sm:grid-cols-2">
        {personal ? <>
          <Input icon={User} label="Full name" value={form.displayName} onChange={(value) => updateField("displayName", value)} />
          <Input icon={Phone} label="Phone" value={form.phone} onChange={(value) => updateField("phone", value)} />
          <Input icon={Mail} label="Bio" value={form.bio} onChange={(value) => updateField("bio", value)} />
        </> : <>
          <Input icon={Building2} label="Company name" value={form.company} onChange={(value) => updateField("company", value)} />
          <Input icon={MapPin} label="Company address" value={form.address} onChange={(value) => updateField("address", value)} />
          <Input icon={ShieldCheck} label="GST number" value={form.gst} onChange={(value) => updateField("gst", value)} />
        </>}
      </div>
      <div className="flex gap-2 pt-1">
        <button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-slate-900"><Save className="h-4 w-4" />{saving ? "Saving..." : "Save changes"}</button>
        <button type="button" onClick={() => { resetForm(); setEditing(false); }} className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:bg-neutral-800 dark:text-neutral-200"><X className="h-4 w-4" />Cancel</button>
      </div>
    </div>
  </form>;
};

const Input = ({ icon: Icon, label, value, onChange }: {
  icon: React.ElementType;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) => (
  <label className="block text-sm font-medium text-slate-700 dark:text-neutral-200">
    <span className="mb-1 flex items-center gap-1.5 text-slate-600 dark:text-neutral-300">
      <Icon className="h-3.5 w-3.5 text-slate-400 dark:text-neutral-500" />{label}
    </span>
    <input
      value={value}
      onChange={(event: React.ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white dark:placeholder:text-neutral-600 dark:focus:border-neutral-500 dark:focus:ring-neutral-800"
    />
  </label>
);

const EmptyState = ({ text }: { text: string }) => (
  <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400">
    {text}
  </div>
);

export default Profile;