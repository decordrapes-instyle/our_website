import { useState } from "react";
import { FileText, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import QuotationBuilder from "./QuotationBuilder";

const quotaionImageUrl =
  "https://res.cloudinary.com/ds6um53cx/image/upload/v1767854182/utegoz4baqwjeyac10qd.jpg";

export default function Estimate() {
  const { currentUser, loading: authLoading } = useAuth();
  const [builderOpen, setBuilderOpen] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors duration-300">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-sky-400/5 blur-3xl" />
        <div className="absolute top-[35%] right-0 w-[300px] h-[300px] rounded-full bg-amber-400/5 blur-3xl" />
      </div>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative z-10 overflow-hidden border-b border-neutral-200/80 dark:border-neutral-800">
        {/* Faint ledger-paper dot grid instead of a generic gradient blob */}
        <div
          className="absolute inset-0 opacity-[0.55] dark:opacity-[0.12] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, #94a3b8 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-16 items-center">
            {/* Copy */}
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-[3.35rem] leading-[1.1] font-light tracking-tight text-neutral-950 dark:text-white mb-6 max-w-xl">
                Every quotation, exactly as it prints.
              </h1>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-md mb-9 leading-relaxed">
                Line items, GST, totals, and your branding - laid out the way
                your client will actually see it, before you ever hit send.
              </p>

              <div className="flex flex-wrap items-center gap-3 mb-8">
                <a
                  href="#preview"
                  className="px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-600 dark:bg-sky-500 dark:hover:bg-sky-400 text-white dark:text-neutral-950 font-medium shadow-sm shadow-sky-500/20 transition-all duration-200"
                >
                  See a sample
                </a>
                <a
                  href="#access"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-200 font-medium hover:bg-white dark:hover:bg-neutral-900 transition-all duration-200"
                >
                  Build your own <ArrowRight size={16} />
                </a>
              </div>

              <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-500">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                A4 standard, ready to print or email
              </div>
            </div>

            {/* A real miniature quotation, not a screenshot or icon grid */}
            <div className="relative mx-auto w-full max-w-xs lg:max-w-sm">
              <div
                className="absolute -top-5 -right-2 z-10 w-[72px] h-[72px] rounded-full border-2 border-dashed border-amber-500/70 dark:border-amber-400/60 text-amber-700 dark:text-amber-400 flex items-center justify-center text-center text-[9px] font-bold tracking-wide leading-tight -rotate-12 bg-white/90 dark:bg-neutral-950/90"
                aria-hidden
              >
                GST
                <br />
                AUTO
                <br />
                CALC
              </div>

              {/* Page peeking out behind */}
              <div className="absolute inset-0 -z-10 translate-x-3 translate-y-3 rotate-[2deg] rounded-3xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800" />

              <div className="rotate-[-2deg] rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="w-9 h-9 rounded-xl bg-sky-500 dark:bg-sky-400" aria-hidden />
                  <span className="text-xs font-mono text-neutral-400">#Q-2026-0417</span>
                </div>

                <div className="space-y-2.5 font-mono text-[13px] text-neutral-700 dark:text-neutral-300 mb-4">
                  <DotRow label="Curtain fabric, 12m" value="₹18,400" />
                  <DotRow label="Track & rings" value="₹4,200" />
                  <DotRow label="Installation" value="₹2,000" />
                </div>

                <div className="border-t border-dashed border-neutral-300 dark:border-neutral-700 pt-3 space-y-1.5 font-mono text-[13px]">
                  <DotRow label="Subtotal" value="₹24,600" muted />
                  <DotRow label="GST (18%)" value="₹4,428" muted />
                  <div className="flex justify-between items-baseline pt-1.5 text-neutral-900 dark:text-white font-semibold text-base">
                    <span>Total</span>
                    <span>₹29,028</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Contained sample preview (no more oversized raw screenshot) ─ */}
      <section id="preview" className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="rounded-3xl shadow-sm overflow-hidden border border-neutral-200/80 dark:border-neutral-800">
          <div className="bg-white dark:bg-neutral-900 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
              </div>
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
                sample_quotation.pdf
              </span>
            </div>
            <a
              href={quotaionImageUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-sky-600 dark:text-sky-400 hover:underline"
            >
              Open full size
            </a>
          </div>
          <div className="relative bg-neutral-100 dark:bg-neutral-950" style={{ height: 420 }}>
            <img
              src={quotaionImageUrl}
              alt="Sample quotation PDF preview"
              className="w-full h-full object-cover object-top"
            />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-neutral-100 dark:from-neutral-950 to-transparent" />
          </div>
        </div>
      </section>

      {/* ── How to read guide ────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-light tracking-tight text-neutral-950 dark:text-white mb-3">
            How to read your quotation
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
            Four things to check on every quotation, in the order they appear
            on the page.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <GuideCard
            step={1}
            color="blue"
            title="Header & contact info"
            body="Company details, quotation number, and dates for quick reference."
            preview={
              <MiniRow label="Company" value="YourCompany LLC" />
            }
          />
          <GuideCard
            step={2}
            color="emerald"
            title="Item breakdown"
            body="Each product or service listed with its quantity, rate, and amount."
            preview={<MiniRow label="Website Design" value="1 × ₹2,500" />}
          />
          <GuideCard
            step={3}
            color="purple"
            title="Totals"
            body="Subtotal, GST, and the final grand total — calculated automatically."
            preview={<MiniRow label="Grand Total" value="₹4,730" strong />}
          />
          <GuideCard
            step={4}
            color="orange"
            title="Payment details"
            body="Bank details and a scannable UPI QR code so clients can pay directly."
            preview={<MiniRow label="UPI" value="Scan to pay" />}
          />
        </div>
      </section>

      {/* ── Access / build your own ──────────────────────────────────── */}
      <section id="access" className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {authLoading ? (
          <div className="h-48 rounded-2xl bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
        ) : currentUser ? (
          <BuildOwnCard onOpen={() => setBuilderOpen(true)} />
        ) : (
          <SignInCard />
        )}
      </section>

      {builderOpen && <QuotationBuilder onClose={() => setBuilderOpen(false)} />}
    </div>
  );
}

function DotRow({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline gap-2 ${
        muted ? "text-neutral-500 dark:text-neutral-500" : ""
      }`}
    >
      <span className="whitespace-nowrap">{label}</span>
      <span className="flex-1 border-b border-dotted border-neutral-300 dark:border-neutral-700 translate-y-[-3px]" />
      <span className="whitespace-nowrap">{value}</span>
    </div>
  );
}

function GuideCard({
  step,
  color,
  title,
  body,
  preview,
}: {
  step: number;
  color: "blue" | "emerald" | "purple" | "orange";
  title: string;
  body: string;
  preview: React.ReactNode;
}) {
  const colorMap: Record<string, string> = {
    blue: "from-sky-500 to-sky-600",
    emerald: "from-amber-400 to-amber-500",
    purple: "from-sky-400 to-sky-500",
    orange: "from-amber-500 to-amber-600",
  };
  return (
    <div className="rounded-3xl p-6 sm:p-7 bg-white dark:bg-neutral-900/70 border border-neutral-200/80 dark:border-neutral-800 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`w-9 h-9 rounded-xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center text-white text-sm font-bold shrink-0`}
        >
          {step}
        </div>
        <h3 className="font-semibold text-neutral-900 dark:text-white">{title}</h3>
      </div>
      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">{body}</p>
      <div className="rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3">
        {preview}
      </div>
    </div>
  );
}

function MiniRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-neutral-500 dark:text-neutral-400">{label}</span>
      <span className={`text-neutral-900 dark:text-white ${strong ? "font-bold" : "font-medium"}`}>
        {value}
      </span>
    </div>
  );
}

function SignInCard() {
  return (
    <div className="relative overflow-hidden bg-sky-50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/50 rounded-3xl p-8 sm:p-10 text-center shadow-sm">
      <h2 className="text-2xl sm:text-3xl font-light text-neutral-950 dark:text-white mb-3">
        Sign in to access your quotations
      </h2>
      <p className="text-neutral-600 dark:text-neutral-400 mb-6 max-w-md mx-auto">
        View, download, and build your own quotations once you're signed in.
      </p>
      <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
        <a
          href="/login"
          className="inline-flex items-center justify-center px-6 py-3 bg-sky-500 text-white font-medium rounded-xl hover:bg-sky-600 transition-all duration-200"
        >
          Sign in
        </a>
        <a
          href="/login"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 font-medium rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all duration-200"
        >
          <img
            src="https://res.cloudinary.com/ds6um53cx/image/upload/v1767443974/kfz6yztoc4ovt40qehvj.svg"
            alt=""
            className="w-5 h-5"
          />
          Sign in with Google
        </a>
      </div>
    </div>
  );
}

function BuildOwnCard({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="rounded-3xl border border-neutral-200/80 dark:border-neutral-800 p-8 sm:p-10 text-center bg-white dark:bg-neutral-900/70 shadow-sm">
      <div className="inline-flex w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 items-center justify-center mb-4">
        <FileText size={22} />
      </div>
      <h2 className="text-2xl font-light text-neutral-950 dark:text-white mb-3">
        Build your own quotation
      </h2>
      <p className="text-neutral-600 dark:text-neutral-400 mb-6 max-w-md mx-auto">
        Enter your company details, logo, and UPI ID, add your line items, and
        download a print-ready PDF. Leave anything blank to use our default
        branding instead.
      </p>
      <button
        onClick={onOpen}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-600 dark:hover:bg-sky-400 text-white dark:text-neutral-950 font-medium shadow-sm shadow-sky-500/20 transition-all duration-200"
      >
        Start building <ArrowRight size={16} />
      </button>
    </div>
  );
}