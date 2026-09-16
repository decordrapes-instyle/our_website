import { useEffect, useMemo, useRef, useState } from "react";
import {
  Building2,
  User,
  Package,
  CreditCard,
  FileSignature,
  Plus,
  Trash2,
  Upload,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  ImageOff,
} from "lucide-react";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * DEFAULTS — edit these to your real company details.
 * Any field the customer leaves blank in the builder falls back to these,
 * so an unbranded quotation still renders as "ours" by default.
 * ─────────────────────────────────────────────────────────────────────────
 */
const DEFAULT_COMPANY: CompanyInfo = {
  companyName: "Your Company Pvt. Ltd.",
  companyLogo: "", // full logo shown in the header, e.g. https://.../logo.png
  companyLogoSquare: "", // square mark used as the page watermark
  companyAddress: "",
  companyEmail: "",
  companyPhone: "",
  companyGSTIN: "",
  accountNumber: "",
  ifsc: "",
  bankName: "",
  bankLogo: "",
  upiId: "",
  termsAndConditions: [
    "Prices include installation unless specified otherwise.",
    "Delivery timeline will be shared post confirmation.",
    "Payment terms as mutually agreed.",
  ],
};

/**
 * Path to the two template files this builder injects data into.
 * Copy quotation.html and quotation.css, unchanged, into your public
 * folder at this path (e.g. public/quotation-template/quotation.html).
 */
const TEMPLATE_HTML_URL = "/quotation-template/quotation.html";
const TEMPLATE_CSS_URL = "/quotation-template/quotation.css";

// ── Types ───────────────────────────────────────────────────────────────

type Unit = "pcs" | "sqft" | "meter" | "foot" | "kgs" | "box" | "rft";

interface CompanyInfo {
  companyName: string;
  companyLogo: string;
  companyLogoSquare: string;
  companyAddress: string;
  companyEmail: string;
  companyPhone: string;
  companyGSTIN: string;
  accountNumber: string;
  ifsc: string;
  bankName: string;
  bankLogo: string;
  upiId: string;
  termsAndConditions: string[];
}

interface CustomerInfo {
  name: string;
  address: string;
  mobile: string;
  email: string;
  gstin: string;
  logo: string;
}

interface ItemRow {
  id: string;
  productName: string;
  productCategory: string;
  productCode: string;
  unit: Unit;
  gst: number;
  price: number;
  qty: number;
}

const UNIT_OPTIONS: { value: Unit; label: string }[] = [
  { value: "pcs", label: "Pieces" },
  { value: "sqft", label: "Sq. ft" },
  { value: "meter", label: "Meter" },
  { value: "foot", label: "Foot" },
  { value: "kgs", label: "Kg" },
  { value: "box", label: "Box" },
  { value: "rft", label: "Running ft" },
];

const GST_OPTIONS = [0, 5, 12, 18, 28];

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const emptyItem = (): ItemRow => ({
  id: newId(),
  productName: "",
  productCategory: "",
  productCode: "",
  unit: "pcs",
  gst: 18,
  price: 0,
  qty: 1,
});

const emptyCompany = (): CompanyInfo => ({
  companyName: "Decor Drapes Instyle",
  companyLogo: "",
  companyLogoSquare: "",
  companyAddress: "",
  companyEmail: "",
  companyPhone: "",
  companyGSTIN: "29BQCPR8997J1ZP",
  accountNumber: "125006314481",
  ifsc: "CNRB0001175",
  bankName: "",
  bankLogo: "",
  upiId: "323136682314481@cnrb",
  termsAndConditions: [],
});

const emptyCustomer = (): CustomerInfo => ({
  name: "",
  address: "",
  mobile: "",
  email: "",
  gstin: "",
  logo: "",
});

// Merge user input over the defaults: blank fields fall back to "ours".
function mergeCompany(input: CompanyInfo): CompanyInfo {
  const merged = { ...DEFAULT_COMPANY };
  (Object.keys(input) as (keyof CompanyInfo)[]).forEach((key) => {
    if (key === "termsAndConditions") return;
    const value = input[key];
    if (typeof value === "string" && value.trim().length > 0) {
      (merged as any)[key] = value.trim();
    }
  });
  merged.termsAndConditions =
    input.termsAndConditions.filter((t) => t.trim().length > 0).length > 0
      ? input.termsAndConditions.filter((t) => t.trim().length > 0)
      : DEFAULT_COMPANY.termsAndConditions;
  return merged;
}

// Escape a JSON string so it can sit safely inside the template's
// `` JSON.parse(`%%%DATA%%%`) `` literal.
function escapeForTemplateLiteral(raw: string) {
  return raw
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$\{/g, "\\${")
    .replace(/<\/script/gi, "<\\/script");
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

const formatINR = (n: number) =>
  Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// ── Small shared UI bits ───────────────────────────────────────────────

function Field({
  label,
  optional,
  children,
}: {
  label: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
        {label}
        {optional && (
          <span className="text-neutral-400 dark:text-neutral-500 font-normal">
            {" "}
            (optional — defaults to ours)
          </span>
        )}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const inputClasses =
  "w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

function TextInput(
  props: React.InputHTMLAttributes<HTMLInputElement>
) {
  return <input {...props} className={inputClasses + (props.className ? ` ${props.className}` : "")} />;
}

function LogoUpload({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (dataUrl: string) => void;
  label: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <Field label={label} optional>
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 flex items-center justify-center overflow-hidden bg-neutral-50 dark:bg-neutral-900 shrink-0">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="w-full h-full object-contain" />
          ) : (
            <ImageOff size={18} className="text-neutral-300 dark:text-neutral-600" />
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            onChange(await fileToDataUrl(file));
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition"
        >
          <Upload size={14} />
          {value ? "Replace" : "Upload"}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-sm text-neutral-400 hover:text-red-500 transition"
          >
            Remove
          </button>
        )}
      </div>
    </Field>
  );
}

// ── Steps ────────────────────────────────────────────────────────────────

const STEPS = ["Company", "Payment", "Customer", "Items", "Terms & Download"] as const;

export default function QuotationBuilder({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [company, setCompany] = useState<CompanyInfo>(emptyCompany());
  const [customer, setCustomer] = useState<CustomerInfo>(emptyCustomer());
  const [items, setItems] = useState<ItemRow[]>([emptyItem()]);
  const [quotationNumber, setQuotationNumber] = useState(
    `Q-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`
  );
  const [termsText, setTermsText] = useState("");

  const [templateHtml, setTemplateHtml] = useState<string | null>(null);
  const [templateCss, setTemplateCss] = useState<string | null>(null);
  const [templateError, setTemplateError] = useState(false);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const finalCompany = useMemo(
    () =>
      mergeCompany({
        ...company,
        termsAndConditions: termsText
          .split("\n")
          .map((t) => t.trim())
          .filter(Boolean),
      }),
    [company, termsText]
  );

  const subTotal = items.reduce((sum, it) => sum + it.price * it.qty, 0);
  const taxAmount = items.reduce(
    (sum, it) => sum + (it.price * it.qty * (it.gst || 0)) / 100,
    0
  );
  const grandTotal = subTotal + taxAmount;

  const quotationJSON = useMemo(
    () => ({
      quotationNumber: quotationNumber || "-",
      createdAt: new Date().toISOString(),
      status: "pending",
      company: finalCompany,
      customer,
      items: items
        .filter((it) => it.productName.trim().length > 0)
        .map((it) => ({
          product: {
            id: it.id,
            productCode: it.productCode,
            productName: it.productName,
            productCategory: it.productCategory,
            unit: it.unit,
            gst: it.gst,
          },
          price: it.price,
          qty: it.qty,
          amount: it.price * it.qty,
          [it.unit]: it.unit !== "pcs" ? it.qty : undefined,
        })),
      taxAmount,
      grandTotal,
    }),
    [quotationNumber, finalCompany, customer, items, taxAmount, grandTotal]
  );

  // Load the template once we reach the final step.
  useEffect(() => {
    if (step !== STEPS.length - 1 || templateHtml || loadingTemplate) return;
    setLoadingTemplate(true);
    setTemplateError(false);
    Promise.all([
      fetch(TEMPLATE_HTML_URL).then((r) => {
        if (!r.ok) throw new Error("html missing");
        return r.text();
      }),
      fetch(TEMPLATE_CSS_URL).then((r) => {
        if (!r.ok) throw new Error("css missing");
        return r.text();
      }),
    ])
      .then(([html, css]) => {
        setTemplateHtml(html);
        setTemplateCss(css);
      })
      .catch(() => setTemplateError(true))
      .finally(() => setLoadingTemplate(false));
  }, [step, templateHtml, loadingTemplate]);

  const renderedHtml = useMemo(() => {
    if (!templateHtml || !templateCss) return null;
    let html = templateHtml.replace("%%%CSS%%%", `<style>${templateCss}</style>`);
    const dataStr = escapeForTemplateLiteral(JSON.stringify(quotationJSON));
    html = html.replace("%%%DATA%%%", dataStr);
    return html;
  }, [templateHtml, templateCss, quotationJSON]);

  const handleDownload = () => {
    if (!renderedHtml) return;
    setIsPrinting(true);
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow pop-ups for this site to download the PDF.");
      setIsPrinting(false);
      return;
    }
    printWindow.document.open();
    printWindow.document.write(renderedHtml);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        setIsPrinting(false);
      }, 600);
    };
  };

  const updateItem = (id: string, patch: Partial<ItemRow>) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const canGoNext = () => {
    if (step === 2) return customer.name.trim().length > 0;
    if (step === 3) return items.some((it) => it.productName.trim().length > 0);
    return true;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-white dark:bg-neutral-950 shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
              Build your own quotation
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Step {step + 1} of {STEPS.length} · {STEPS[step]}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 text-2xl leading-none px-2"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex gap-1.5 px-6 pt-4 shrink-0">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-blue-600" : "bg-neutral-200 dark:bg-neutral-800"
              }`}
            />
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {step === 0 && (
            <div className="space-y-5">
              <SectionHeading icon={Building2} title="Your company" subtitle="Leave anything blank to use our default branding instead." />
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Company name" optional>
                  <TextInput
                    placeholder={DEFAULT_COMPANY.companyName}
                    value={company.companyName}
                    onChange={(e) => setCompany({ ...company, companyName: e.target.value })}
                  />
                </Field>
                <Field label="GSTIN" optional>
                  <TextInput
                    placeholder="22AAAAA0000A1Z5"
                    value={company.companyGSTIN}
                    onChange={(e) => setCompany({ ...company, companyGSTIN: e.target.value })}
                  />
                </Field>
                <Field label="Email" optional>
                  <TextInput
                    type="email"
                    placeholder="hello@yourcompany.com"
                    value={company.companyEmail}
                    onChange={(e) => setCompany({ ...company, companyEmail: e.target.value })}
                  />
                </Field>
                <Field label="Phone" optional>
                  <TextInput
                    placeholder="+91 90000 00000"
                    value={company.companyPhone}
                    onChange={(e) => setCompany({ ...company, companyPhone: e.target.value })}
                  />
                </Field>
              </div>
              <Field label="Address" optional>
                <TextInput
                  placeholder="Street, City, State, PIN"
                  value={company.companyAddress}
                  onChange={(e) => setCompany({ ...company, companyAddress: e.target.value })}
                />
              </Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <LogoUpload
                  label="Logo (header)"
                  value={company.companyLogo}
                  onChange={(v) => setCompany({ ...company, companyLogo: v })}
                />
                <LogoUpload
                  label="Square mark (watermark)"
                  value={company.companyLogoSquare}
                  onChange={(v) => setCompany({ ...company, companyLogoSquare: v })}
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <SectionHeading icon={CreditCard} title="Payment details" subtitle="Shown on the quotation footer. Skip anything you don't want to include." />
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Bank name" optional>
                  <TextInput
                    value={company.bankName}
                    onChange={(e) => setCompany({ ...company, bankName: e.target.value })}
                  />
                </Field>
                <Field label="Account number" optional>
                  <TextInput
                    value={company.accountNumber}
                    onChange={(e) => setCompany({ ...company, accountNumber: e.target.value })}
                  />
                </Field>
                <Field label="IFSC" optional>
                  <TextInput
                    value={company.ifsc}
                    onChange={(e) => setCompany({ ...company, ifsc: e.target.value })}
                  />
                </Field>
                <Field label="UPI ID" optional>
                  <TextInput
                    placeholder="yourname@upi"
                    value={company.upiId}
                    onChange={(e) => setCompany({ ...company, upiId: e.target.value })}
                  />
                </Field>
              </div>
              <p className="text-xs text-neutral-400 dark:text-neutral-500">
                A scannable UPI QR code is generated automatically on the PDF whenever a UPI ID
                and total amount are present.
              </p>
              <LogoUpload
                label="Bank logo"
                value={company.bankLogo}
                onChange={(v) => setCompany({ ...company, bankLogo: v })}
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <SectionHeading icon={User} title="Customer" subtitle="Who is this quotation for?" />
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Customer name">
                  <TextInput
                    required
                    value={customer.name}
                    onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  />
                </Field>
                <Field label="Mobile" optional>
                  <TextInput
                    value={customer.mobile}
                    onChange={(e) => setCustomer({ ...customer, mobile: e.target.value })}
                  />
                </Field>
                <Field label="Email" optional>
                  <TextInput
                    type="email"
                    value={customer.email}
                    onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                  />
                </Field>
                <Field label="GSTIN" optional>
                  <TextInput
                    value={customer.gstin}
                    onChange={(e) => setCustomer({ ...customer, gstin: e.target.value })}
                  />
                </Field>
              </div>
              <Field label="Address" optional>
                <TextInput
                  value={customer.address}
                  onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                />
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <SectionHeading icon={Package} title="Items" subtitle="Add each line item on the quotation." />
              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-neutral-400">Item {idx + 1}</span>
                      {items.length > 1 && (
                        <button
                          onClick={() => setItems((prev) => prev.filter((it) => it.id !== item.id))}
                          className="text-neutral-400 hover:text-red-500 transition"
                          aria-label="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <TextInput
                        placeholder="Product name"
                        value={item.productName}
                        onChange={(e) => updateItem(item.id, { productName: e.target.value })}
                      />
                      <TextInput
                        placeholder="Category (optional)"
                        value={item.productCategory}
                        onChange={(e) => updateItem(item.id, { productCategory: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <select
                        className={inputClasses}
                        value={item.unit}
                        onChange={(e) => updateItem(item.id, { unit: e.target.value as Unit })}
                      >
                        {UNIT_OPTIONS.map((u) => (
                          <option key={u.value} value={u.value}>
                            {u.label}
                          </option>
                        ))}
                      </select>
                      <select
                        className={inputClasses}
                        value={item.gst}
                        onChange={(e) => updateItem(item.id, { gst: Number(e.target.value) })}
                      >
                        {GST_OPTIONS.map((g) => (
                          <option key={g} value={g}>
                            GST {g}%
                          </option>
                        ))}
                      </select>
                      <TextInput
                        type="number"
                        min={0}
                        placeholder="Qty"
                        value={item.qty}
                        onChange={(e) => updateItem(item.id, { qty: Number(e.target.value) })}
                      />
                      <TextInput
                        type="number"
                        min={0}
                        placeholder="Rate (₹)"
                        value={item.price}
                        onChange={(e) => updateItem(item.id, { price: Number(e.target.value) })}
                      />
                    </div>
                    <div className="text-right text-sm text-neutral-500 dark:text-neutral-400">
                      Amount: <span className="font-medium text-neutral-800 dark:text-neutral-200">₹ {formatINR(item.price * item.qty)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setItems((prev) => [...prev, emptyItem()])}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                <Plus size={15} /> Add another item
              </button>

              <div className="rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 space-y-1.5 text-sm">
                <div className="flex justify-between text-neutral-500 dark:text-neutral-400">
                  <span>Subtotal</span>
                  <span>₹ {formatINR(subTotal)}</span>
                </div>
                <div className="flex justify-between text-neutral-500 dark:text-neutral-400">
                  <span>GST</span>
                  <span>₹ {formatINR(taxAmount)}</span>
                </div>
                <div className="flex justify-between font-semibold text-neutral-900 dark:text-white pt-1.5 border-t border-neutral-200 dark:border-neutral-800">
                  <span>Grand total</span>
                  <span>₹ {formatINR(grandTotal)}</span>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <SectionHeading icon={FileSignature} title="Terms & download" subtitle="One line per term. Leave blank to use our default terms." />
              <Field label="Quotation number">
                <TextInput
                  value={quotationNumber}
                  onChange={(e) => setQuotationNumber(e.target.value)}
                />
              </Field>
              <Field label="Terms & conditions" optional>
                <textarea
                  className={inputClasses}
                  rows={4}
                  placeholder={DEFAULT_COMPANY.termsAndConditions.join("\n")}
                  value={termsText}
                  onChange={(e) => setTermsText(e.target.value)}
                />
              </Field>

              <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                <div className="bg-neutral-50 dark:bg-neutral-900 px-4 py-2.5 text-sm font-medium text-neutral-600 dark:text-neutral-300 flex items-center justify-between">
                  <span>Live preview</span>
                  {loadingTemplate && (
                    <span className="inline-flex items-center gap-1.5 text-neutral-400 text-xs">
                      <Loader2 size={13} className="animate-spin" /> loading template…
                    </span>
                  )}
                </div>
                <div className="h-[420px] bg-neutral-100 dark:bg-neutral-950">
                  {templateError && (
                    <div className="h-full flex items-center justify-center text-sm text-red-500 px-6 text-center">
                      Couldn't load the quotation template from{" "}
                      <code className="mx-1">{TEMPLATE_HTML_URL}</code>. Make sure quotation.html
                      and quotation.css are in your public folder at that path.
                    </div>
                  )}
                  {!templateError && renderedHtml && (
                    <iframe
                      title="Quotation preview"
                      srcDoc={renderedHtml}
                      sandbox="allow-scripts"
                      className="w-full h-full border-0"
                    />
                  )}
                </div>
              </div>

              <button
                onClick={handleDownload}
                disabled={!renderedHtml || isPrinting}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isPrinting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Download size={16} />
                )}
                Open print dialog to save as PDF
              </button>
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 shrink-0">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft size={16} /> Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => canGoNext() && setStep((s) => Math.min(STEPS.length - 1, s + 1))}
              disabled={!canGoNext()}
              className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-lg text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionHeading({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
        <Icon size={18} />
      </div>
      <div>
        <h3 className="font-semibold text-neutral-900 dark:text-white">{title}</h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{subtitle}</p>
      </div>
    </div>
  );
}