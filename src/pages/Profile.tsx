import React, { useEffect, useState } from "react";
import {
  Building2, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight,
  CircleUserRound, Clock, FileText, Home, IndianRupee, Layers, LogOut, Mail,
  MapPin, Package, Palette, Percent, Phone, Plus, Ruler, Save, Search, ShieldCheck, Tag,
  Trash2, User, X,
} from "lucide-react";
import toast from "react-hot-toast";
import { database, onValue, push, ref, set } from "../config/firebase";
import { useAuth } from "../context/AuthContext";
import { User as UserType } from "../types";

const BRAND_LOGO_URL = "https://res.cloudinary.com/dmiwq3l2s/image/upload/v1764768203/vfw82jmca7zl5p86czhy.png";

type Tab = "home" | "pricelist" | "quotations" | "profile";
type ProfileSection = "list" | "personal" | "company";
type ProfileUser = UserType & { gst?: string };
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
  quoteNumber?: string;
  createdAt: number;
}

const ORDER_STATUS_META: Record<OrderRequestStatus, { label: string; className: string }> = {
  "not-reviewed": { label: "Not reviewed", className: "bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-neutral-300" },
  "viewed": { label: "Viewed", className: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" },
  "quote-prepared": { label: "Quote prepared", className: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300" },
  "prepared": { label: "Prepared", className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" },
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

const Profile: React.FC = () => {
  const { currentUser, updateProfile, logout } = useAuth();
  const user = currentUser as ProfileUser | null;
  const [tab, setTab] = useState<Tab>("home");
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [orderRequests, setOrderRequests] = useState<OrderRequest[]>([]);
  const [orderSheetOpen, setOrderSheetOpen] = useState(false);
  const [priceList, setPriceList] = useState<Record<string, Category>>({});
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [profileSection, setProfileSection] = useState<ProfileSection>("list");
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ displayName: "", phone: "", address: "", company: "", gst: "", bio: "" });

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

  if (!user) return <div className="flex min-h-screen items-center justify-center">Please log in to view your profile.</div>;
  

  const updateField = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await updateProfile(form.displayName, undefined, { phone: form.phone, address: form.address, company: form.company, gst: form.gst, bio: form.bio });
      setProfileSection("list");
      toast.success("Profile updated successfully");
    } catch {
      toast.error("Could not update your profile");
    } finally {
      setSaving(false);
    }
  };

  const openTab = (nextTab: Tab) => {
    setTab(nextTab);
    setSelectedCategory(null);
    setSearch("");
    setSearchOpen(false);
    setProfileSection("list");
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  };

 const submitOrderRequest = async (items: OrderRequestItem[]) => {
    const newRef = push(ref(database, "orderRequest"));
    await set(newRef, {
      items,
      customer: { name: user.displayName || "", email: user.email || "", phone: user.phone || "", address: user.address || "", company: user.company || "" },
      status: "not-reviewed",
      createdAt: Date.now(),
    });
  };

  const TAB_LABELS: Record<Tab, string> = { home: "Home", pricelist: "Pricelist", quotations: "Quotations", profile: "Profile" };
  const headerTitle = tab === "home" ? "Home" : TAB_LABELS[tab];
  const searchableTab = tab === "pricelist" || tab === "quotations";
  const searchPlaceholder = tab === "pricelist" ? "Search categories or products..." : "Search quotations...";

  return <div className="min-h-screen bg-[#f7f9fb] pb-24 text-[14px] text-slate-900 antialiased dark:bg-neutral-950 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui, -apple-system, sans-serif" }}>
    <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/96 px-4 py-3 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/96">
      <div className="mx-auto max-w-7xl">
        <div className="flex min-h-10 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <BrandLogo />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{headerTitle}</p>
              <p className="truncate text-[10px] text-slate-400">Decor Drapes Instyle</p>
            </div>
          </div>
          <div className="shrink-0">
            {tab === "profile" ? (
              <button type="button" onClick={logout} className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-red-600 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-red-400">
                <LogOut className="h-3.5 w-3.5" />Log out
              </button>
            ) : searchableTab ? (
              searchOpen ? (
                <div className="flex h-10 w-[min(62vw,360px)] items-center gap-2 rounded-full bg-slate-100 px-3.5 dark:bg-neutral-800">
                  <Search className="h-4 w-4 shrink-0 text-slate-400" />
                  <input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder={searchPlaceholder} className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400" />
                  <button type="button" onClick={() => { setSearch(""); setSearchOpen(false); }} aria-label="Close search" className="rounded-full p-1 text-slate-400 hover:bg-white hover:text-slate-700 dark:hover:bg-neutral-700">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => setSearchOpen(true)} aria-label="Search" className="rounded-full p-2.5 text-slate-500 transition hover:bg-slate-100 dark:text-neutral-300 dark:hover:bg-neutral-800">
                  <Search className="h-5 w-5" />
                </button>
              )
            ) : (
              <a href="https://www.decordrapesinstyle.com/" target="_blank" rel="noreferrer" className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-white dark:text-slate-900">Visit website</a>
            )}
          </div>
        </div>
      </div>
    </header>
    <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
      {tab === "home" && <HomeTab user={user} quotations={quotations} orderRequests={orderRequests} goTo={openTab} onNewOrder={() => setOrderSheetOpen(true)} />}
      {tab === "pricelist" && <PriceListTab priceList={priceList} selected={selectedCategory} setSelected={setSelectedCategory} search={search} />}
      {tab === "quotations" && <QuotationsTab quotations={quotations} search={search} />}
      {tab === "profile" && <ProfileTab user={user} section={profileSection} setSection={setProfileSection} form={form} saving={saving} updateField={updateField} save={save} logout={logout} />}
    </main>
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 px-2 pt-2 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/95"><div className="mx-auto grid max-w-lg grid-cols-4"><AppTab icon={Home} label="Home" active={tab === "home"} onClick={() => openTab("home")} /><AppTab icon={Tag} label="Pricelist" active={tab === "pricelist"} onClick={() => openTab("pricelist")} /><AppTab icon={FileText} label="Quotations" active={tab === "quotations"} onClick={() => openTab("quotations")} /><AppTab icon={CircleUserRound} label="Profile" active={tab === "profile"} onClick={() => openTab("profile")} /></div></nav>
    {orderSheetOpen && <OrderRequestSheet onClose={() => setOrderSheetOpen(false)} onSubmit={submitOrderRequest} />}
  </div>;
};

const BrandLogo = () => {
  const [broken, setBroken] = useState(false);
  if (broken) return <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-[11px] font-bold text-white">DD</span>;
  return <img src={BRAND_LOGO_URL} onError={() => setBroken(true)} alt="Decor Drapes Instyle" className="h-8 w-8 shrink-0 object-contain" />;
};

const HomeTab = ({ user, quotations, orderRequests, goTo, onNewOrder }: { user: ProfileUser; quotations: Quotation[]; orderRequests: OrderRequest[]; goTo: (tab: Tab) => void; onNewOrder: () => void }) => {

  const totalQuotations = quotations.length;
  const confirmedCount = quotations.filter((quotation) => quotation.status?.toLowerCase() === "confirmed").length;
  const totalValue = quotations.reduce((sum, quotation) => sum + Number(quotation.grandTotal || 0), 0);
  const latest = quotations[0];
  const latestOrder = orderRequests[0];
  const orderStatusMeta = latestOrder ? ORDER_STATUS_META[latestOrder.status] : null;

  return <div className="space-y-5">
    <section className="relative overflow-hidden rounded-[2rem] bg-slate-900 p-6 text-white shadow-sm dark:bg-neutral-900 sm:p-8">
      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-20 left-10 h-44 w-44 rounded-full bg-white/5 blur-3xl" />
      <div className="relative">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-white/50">Welcome back</p>
        <p className="text-3xl font-extrabold tracking-tight sm:text-4xl">Hi, {user.displayName || "there"}</p>
        <p className="mt-3 max-w-xl text-sm leading-6 text-white/65">
          Everything you need for your pricelist, quotations and order requests — all in one place.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <button onClick={() => goTo("pricelist")} className="rounded-full bg-white px-4 py-2.5 text-xs font-bold text-slate-900 transition hover:bg-slate-100">Browse pricelist</button>
          <button onClick={onNewOrder} className="rounded-full bg-white/10 px-4 py-2.5 text-xs font-bold text-white ring-1 ring-white/15 transition hover:bg-white/15">New order request</button>
        </div>
      </div>
    </section>

    <div className="grid grid-cols-3 gap-3">
      <StatTile label="Quotations" value={String(totalQuotations)} onClick={() => goTo("quotations")} />
      <StatTile label="Confirmed" value={String(confirmedCount)} onClick={() => goTo("quotations")} />
      <StatTile label="Total value" value={`₹${Math.round(totalValue).toLocaleString("en-IN")}`} onClick={() => goTo("quotations")} />
    </div>

    <section className="rounded-3xl bg-white p-4 shadow-sm dark:bg-neutral-900 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Recent order request</p>
          {latestOrder ? <>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${orderStatusMeta?.className}`}>
                {orderStatusMeta?.label}
              </span>
              {latestOrder.quoteNumber && <span className="text-xs font-semibold text-slate-500">Quote {latestOrder.quoteNumber}</span>}
            </div>
            <p className="mt-1 text-xs text-slate-500">Submitted {formatDate(latestOrder.createdAt)}</p>
          </> : <p className="mt-2 text-sm text-slate-500">No requests yet. Start your first order request.</p>}
        </div>
        <button onClick={onNewOrder} className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white dark:bg-white dark:text-slate-900">
          <Plus className="h-3.5 w-3.5" />New request
        </button>
      </div>

      {latestOrder && <OrderRequestTracker status={latestOrder.status} />}
    </section>

    {latest && <button onClick={() => goTo("quotations")} className="flex w-full items-center justify-between gap-3 rounded-2xl bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-neutral-900">
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Latest quotation</p>
        <p className="mt-0.5 truncate text-sm font-bold">{latest.quotationNumber}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-sm font-bold">₹{Math.round(Number(latest.grandTotal || 0)).toLocaleString("en-IN")}</span>
        <ChevronRight className="h-4 w-4 text-slate-400" />
      </div>
    </button>}
  </div>;
};

const OrderRequestTracker = ({ status }: { status: OrderRequestStatus }) => {
  const steps: { key: OrderRequestStatus; label: string; icon: React.ElementType }[] = [
    { key: "not-reviewed", label: "Received", icon: Clock },
    { key: "viewed", label: "Reviewed", icon: Search },
    { key: "quote-prepared", label: "Quote", icon: FileText },
    { key: "prepared", label: "Prepared", icon: CheckCircle2 },
  ];
  const activeIndex = Math.max(0, steps.findIndex((step) => step.key === status));

  return <div className="mt-5 rounded-2xl bg-slate-50 px-3 py-4 dark:bg-neutral-800/70">
    <div className="flex items-start">
      {steps.map((step, index) => {
        const complete = index <= activeIndex;
        const Icon = step.icon;
        return <React.Fragment key={step.key}>
          <div className="flex min-w-0 flex-1 flex-col items-center text-center">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${complete ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-slate-200 text-slate-400 dark:bg-neutral-700 dark:text-neutral-500"}`}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            <p className={`mt-2 text-[10px] font-semibold ${complete ? "text-slate-800 dark:text-white" : "text-slate-400"}`}>{step.label}</p>
          </div>
          {index < steps.length - 1 && <div className={`mt-4 h-px min-w-4 flex-1 ${index < activeIndex ? "bg-slate-900 dark:bg-white" : "bg-slate-200 dark:bg-neutral-700"}`} />}
        </React.Fragment>;
      })}
    </div>
  </div>;
};

const StatTile = ({ label, value, onClick }: { label: string; value: string; onClick: () => void }) => <button onClick={onClick} className="flex flex-col items-start gap-1 rounded-2xl bg-white p-3.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-neutral-900">
  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</span>
  <span className="text-base font-bold leading-tight">{value}</span>
</button>;

const PriceListTab = ({ priceList, selected, setSelected, search }: { priceList: Record<string, Category>; selected: string | null; setSelected: (value: string | null) => void; search: string }) => {
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
    return <div className="space-y-5">
      <button onClick={() => setSelected(null)} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-neutral-300"><ChevronLeft className="h-4 w-4" />All categories</button>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Product category</p>
        <h2 className="mt-1 text-xl font-bold">{current.name}</h2>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
          <span>{current.products.length} products available</span>
          {lastUpdated && <span className="inline-flex items-center gap-1 text-xs text-slate-400"><Clock className="h-3.5 w-3.5" />Last updated {lastUpdated}</span>}
        </div>
      </div>
      {current.products.length ? <div className="space-y-3">{current.products.map((product, index) => <ProductCard key={index} product={product} />)}</div> : <EmptyState text="No products match your search." />}
    </div>;
  }

  return <div className="space-y-5">
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Decor Drapes Instyle</p>
      <h2 className="mt-1 text-xl font-bold">Product categories</h2>
      <p className="mt-1 text-sm text-slate-500">Choose a category to view its products and pricing.</p>
    </div>
    {categories.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{categories.map((item) => <CategoryCard key={item.name} name={item.name} category={item.category} productCount={item.products.length} onClick={() => setSelected(item.name)} />)}</div> : <EmptyState text="No categories found." />}
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

const ProductCard = ({ product }: { product: Product }) => {
  const name = String(product["product name"] || product.media || "Product");
  const gst = formatGst(product.gst);
  const fields = Object.entries(product).filter(([key, value]) => !HIDDEN_FIELDS.includes(key) && value !== undefined);

  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
    <div className="mb-3 flex items-center justify-between gap-3 border-b border-slate-100 pb-2.5 dark:border-neutral-800">
      <p className="truncate text-sm font-bold text-slate-900">{name}</p>
      {gst && <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"><Percent className="mr-0.5 inline h-2.5 w-2.5" />GST {gst}</span>}
    </div>
    {fields.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {fields.map(([key, value]) => {
        const Icon = getFieldIcon(key);
        return <div key={key} className="flex flex-col items-center gap-1 rounded-xl bg-slate-50 px-2 py-2.5 text-center dark:bg-neutral-800">
          <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400"><Icon className="h-3 w-3" />{formatFieldName(key)}</span>
          <span className="text-sm font-semibold text-slate-800 dark:text-neutral-100">{formatFieldValue(key, value)}</span>
        </div>;
      })}
    </div> : <p className="text-sm text-slate-500">No further details available.</p>}
  </div>;
};

const QuotationsTab = ({ quotations, search }: { quotations: Quotation[]; search: string }) => {
  const [selected, setSelected] = useState<Quotation | null>(null);
  const query = search.trim().toLowerCase();
  const filtered = query
    ? quotations.filter((quotation) =>
        quotation.quotationNumber.toLowerCase().includes(query) ||
        quotation.customer?.name?.toLowerCase().includes(query) ||
        quotation.status.toLowerCase().includes(query))
    : quotations;

  return <div className="space-y-5">
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Your activity</p>
      <h2 className="mt-1 text-xl font-bold">Quotations</h2>
      <p className="mt-1 text-sm text-slate-500">Tap a quotation to see the full breakdown.</p>
    </div>
    {filtered.length ? <div className="space-y-3">{filtered.map((quotation) => <QuotationRow key={quotation.quotationNumber} quotation={quotation} onOpen={() => setSelected(quotation)} />)}</div> : <EmptyState text={query ? "No quotations match your search." : "Your quotations will appear here."} />}
    {selected && <QuotationSheet quotation={selected} onClose={() => setSelected(null)} />}
  </div>;
};

const QuotationRow = ({ quotation, onOpen }: { quotation: Quotation; onOpen: () => void }) => <button onClick={onOpen} className="flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
  <div className="min-w-0">
    <p className="truncate font-bold">{quotation.quotationNumber}</p>
    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><CalendarDays className="h-3.5 w-3.5" />{new Date(quotation.createdAt).toLocaleDateString()}</p>
  </div>
  <div className="flex items-center gap-3">
    <div className="text-right">
      <p className="font-bold">₹{Number(quotation.grandTotal || 0).toLocaleString("en-IN")}</p>
      <span className={`text-xs font-semibold ${quotation.status.toLowerCase() === "confirmed" ? "text-emerald-600" : "text-amber-600"}`}>{quotation.status}</span>
    </div>
    <ChevronRight className="h-4 w-4 text-slate-400" />
  </div>
</button>;

const QuotationSheet = ({ quotation, onClose }: { quotation: Quotation; onClose: () => void }) => {
  const subTotal = quotation.grandTotal - (quotation.taxAmount || 0);
  const taxRate = subTotal > 0 && quotation.taxAmount ? (quotation.taxAmount / subTotal) * 100 : 0;

  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
    <div onClick={(event) => event.stopPropagation()} className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl dark:bg-neutral-900 sm:rounded-3xl">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Quotation</p>
          <h2 className="mt-1 text-lg font-bold">{quotation.quotationNumber}</h2>
          <p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><CalendarDays className="h-3.5 w-3.5" />{new Date(quotation.createdAt).toLocaleDateString()}</p>
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
        </div>)}</div> : <p className="text-sm text-slate-500">No item details available for this quotation.</p>}
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

type OrderItemForm = { key: string; height: string; heightUnit: LengthUnit; width: string; widthUnit: LengthUnit; fabricCode: string };

const newOrderItem = (): OrderItemForm => ({ key: Math.random().toString(36).slice(2), height: "", heightUnit: "inch", width: "", widthUnit: "inch", fabricCode: "" });

const OrderRequestSheet = ({ onClose, onSubmit }: { onClose: () => void; onSubmit: (items: OrderRequestItem[]) => Promise<void> }) => {
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

  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
    <form onSubmit={handleSubmit} onClick={(event) => event.stopPropagation()} className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl dark:bg-neutral-900 sm:rounded-3xl">
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

const ProfileTab = ({ user, section, setSection, form, saving, updateField, save, logout }: { user: ProfileUser; section: ProfileSection; setSection: (value: ProfileSection) => void; form: Record<string, string>; saving: boolean; updateField: (field: keyof typeof form, value: string) => void; save: (event: React.FormEvent) => void; logout: () => void }) => {
  if (section === "list") return <div className="space-y-4">
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Account</p>
      <h2 className="mt-1 text-xl font-bold">Profile</h2>
    </div>
    <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-neutral-900">
      <div className="flex items-center gap-3.5">
        {user.profileImage ? <img src={user.profileImage} alt="Profile" className="h-12 w-12 rounded-xl object-cover" /> : <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-neutral-800"><User className="h-6 w-6 text-slate-600" /></div>}
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold">{user.displayName || "User"}</h3>
          <p className="truncate text-xs text-slate-500">{user.email}</p>
        </div>
      </div>
      <div className="mt-4 divide-y divide-slate-100 dark:divide-neutral-800">
        <button onClick={() => setSection("personal")} className="flex w-full items-center justify-between py-3 text-left">
          <span className="min-w-0"><span className="block text-sm font-semibold">Personal information</span><span className="mt-0.5 block truncate text-xs text-slate-400">{user.phone || "No phone"} · Personal details</span></span>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
        </button>
        <button onClick={() => setSection("company")} className="flex w-full items-center justify-between py-3 text-left">
          <span className="min-w-0"><span className="block text-sm font-semibold">Company information</span><span className="mt-0.5 block truncate text-xs text-slate-400">{user.company || "No company added"}{user.gst ? ` · GST ${user.gst}` : ""}{user.address ? ` · ${user.address}` : ""}</span></span>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
        </button>
      </div>
    </section>
    <div className="flex items-center justify-between px-1 pt-1">
      <button onClick={logout} className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-600"><LogOut className="h-3.5 w-3.5" />Log out</button>
      <span className="text-[10px] font-medium text-slate-400">Version 1.0.0</span>
    </div>
  </div>;

  const personal = section === "personal";
  return <form onSubmit={save} className="space-y-5">
    <button type="button" onClick={() => setSection("list")} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-neutral-300"><ChevronLeft className="h-4 w-4" />Profile settings</button>
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{personal ? "Personal information" : "Company information"}</p>
      <h2 className="mt-1 text-xl font-bold">{personal ? "About you" : "Your business"}</h2>
      <p className="mt-1 text-sm text-slate-500">Update your details below and save when you're done.</p>
    </div>
    <div className="space-y-4 rounded-3xl bg-white p-5 shadow-sm dark:bg-neutral-900">
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
        <button disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-slate-900"><Save className="h-4 w-4" />{saving ? "Saving..." : "Save changes"}</button>
        <button type="button" onClick={() => setSection("list")} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold dark:bg-neutral-800"><X className="h-4 w-4" />Cancel</button>
      </div>
    </div>
  </form>;
};

const MenuItem = ({ icon: Icon, title, description, onClick }: { icon: React.ElementType; title: string; description: string; onClick: () => void }) => <button onClick={onClick} className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-neutral-800"><Icon className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block font-bold">{title}</span><span className="mt-1 block text-sm text-slate-500">{description}</span></span><ChevronRight className="h-5 w-5 text-slate-400" /></button>;
const AppTab = ({ icon: Icon, label, active, onClick }: { icon: React.ElementType; label: string; active: boolean; onClick: () => void }) => <button onClick={onClick} className={`flex flex-col items-center gap-1 px-2 py-2 text-xs font-semibold ${active ? "text-slate-900 dark:text-white" : "text-slate-400"}`}><Icon className="h-5 w-5" />{label}{active && <span className="h-1 w-1 rounded-full bg-slate-900 dark:bg-white" />}</button>;
const Input = ({ icon: Icon, label, value, onChange }: { icon: React.ElementType; label: string; value: string; onChange: (value: string) => void }) => <label className="block text-sm font-medium"><span className="mb-1 flex items-center gap-1.5 text-slate-600 dark:text-neutral-300"><Icon className="h-3.5 w-3.5 text-slate-400" />{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-slate-400 dark:border-neutral-700" /></label>;
const EmptyState = ({ text }: { text: string }) => <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-neutral-700">{text}</div>;

export default Profile;