import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FileText, ArrowRight, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import QuotationBuilder from "./QuotationBuilder";

const quotaionImageUrl =
  "https://res.cloudinary.com/ds6um53cx/image/upload/v1767854182/utegoz4baqwjeyac10qd.jpg";

// Dark mode quotation image URL (defaults to quotaionImageUrl until updated)
const quotationImageUrlDark =
  "https://res.cloudinary.com/ds6um53cx/image/upload/v1767854182/utegoz4baqwjeyac10qd.jpg";

export default function Estimate() {
  const { currentUser, loading: authLoading } = useAuth();
  const [builderOpen, setBuilderOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const syncPreview = () => setPreviewOpen(window.location.hash === "#preview");
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPreviewOpen(false);
        if (window.location.hash === "#preview") {
          window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
        }
      }
    };

    syncPreview();
    window.addEventListener("hashchange", syncPreview);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("hashchange", syncPreview);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const closePreview = () => {
    setPreviewOpen(false);
    if (window.location.hash === "#preview") {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    }
  };

  const handleGetEstimate = () => {
    if (currentUser) {
      navigate("/profile");
    } else {
      const el = document.getElementById("access");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors duration-300">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-sky-400/5 dark:bg-sky-400/5 blur-3xl" />
        <div className="pointer-events-none absolute top-20 right-0 w-[300px] h-[300px] rounded-full bg-amber-400/5 dark:bg-amber-400/5 blur-3xl" />

        <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-24">
          {/* ── Hero (No card wrapping) ─────────────────────────────────── */}
          <section className="mb-20 sm:mb-24 lg:mb-28">
            <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-16 items-center">
              {/* Copy */}
              <div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight text-neutral-950 dark:text-white mb-6 max-w-xl">
                  Every quotation,{" "}
                  <span className="font-normal bg-gradient-to-r from-sky-500 to-sky-600 dark:from-sky-400 dark:to-sky-300 bg-clip-text text-transparent">
                    exactly as it prints.
                  </span>
                </h1>
                <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 max-w-lg mb-9 leading-relaxed">
                  Line items, GST, totals, and your branding — laid out the way
                  your client will actually see it, before you ever hit send.
                </p>

                <div className="flex flex-wrap items-center gap-3 mb-8">
                  <button
                    type="button"
                    onClick={handleGetEstimate}
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-sky-500 hover:bg-sky-600 dark:bg-sky-500 dark:hover:bg-sky-400 text-white font-medium shadow-sm shadow-sky-500/20 hover:shadow-md transition-all duration-200 cursor-pointer text-sm sm:text-base"
                  >
                    Get Estimate <ArrowRight size={16} />
                  </button>
                  <a
                    href="#access"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-200 font-medium hover:bg-white dark:hover:bg-neutral-900 transition-all duration-200 text-sm sm:text-base"
                  >
                    Build your own <ArrowRight size={16} />
                  </a>
                </div>

                <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  A4 standard, ready to print or email
                </div>
              </div>

              {/* Miniature quotation using the actual image */}
              <div className="relative mx-auto w-full max-w-sm lg:max-w-md">
                <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl sm:shadow-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 transition-all duration-300">
                  <div className="bg-neutral-100/90 dark:bg-neutral-800/90 px-4 py-2.5 border-b border-neutral-200 dark:border-neutral-700/60 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    </div>
                    <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
                      Quotation.pdf
                    </span>
                    <a
                      href={quotaionImageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-medium text-sky-600 dark:text-sky-400 hover:underline"
                    >
                      View full
                    </a>
                  </div>

                  <div className="relative aspect-[3/4]  overflow-hidden bg-neutral-100 dark:bg-neutral-950">
                    <img
                      src={quotaionImageUrl}
                      alt="Sample Quotation Miniature"
                      className="w-full h-full object-cover object-top dark:hidden transition-transform duration-500"
                    />
                    <img
                      src={quotationImageUrlDark || quotaionImageUrl}
                      alt="Sample Quotation Miniature (Dark Mode)"
                      className="w-full h-full object-cover object-top hidden dark:block transition-transform duration-500 hover:scale-[1.02]"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-neutral-100/80 dark:from-neutral-950/80 to-transparent pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── How to read guide ────────────────────────────────────────── */}
          <section className="mb-20 sm:mb-24 lg:mb-28">
            <div className=" mx-auto">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-light tracking-tight text-neutral-950 dark:text-white mb-3">
                  How to read your quotation
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                  Four things to check on every quotation, in the order they appear
                  on the page.
                </p>
              </div>

              <div className="grid sm:grid-cols-4 gap-5">
                <GuideCard
                  step={1}
                  color="blue"
                  title="Header & contact info"
                  body="Company details, quotation number, and dates for reference."
                  preview={
                    <MiniRow label="Company" value="Acme LLC" />
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
                  body="Subtotal, GST, and the final grand total - calculated automatically."
                  preview={<MiniRow label="Grand Total" value="₹4,730" strong />}
                />
                <GuideCard
                  step={4}
                  color="orange"
                  title="Payment details"
                  body="Bank details and a scannable UPI QR code so clients can pay."
                  preview={<MiniRow label="UPI" value="Scan to pay" />}
                />
              </div>
            </div>
          </section>

          {/* ── Access / build your own ──────────────────────────────────── */}
          <section id="access">
            <div className="max-w-2xl mx-auto">
              {authLoading ? (
                <div className="h-48 rounded-2xl bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
              ) : currentUser ? (
                <div className="space-y-6">
                  {/* Quick Action: Go to Portal & Get Estimate */}
                  <div className="rounded-3xl border border-sky-200 dark:border-sky-900/50 bg-sky-50/70 dark:bg-sky-950/20 p-8 sm:p-10 text-center shadow-xs">
                    <div className="inline-flex w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-300 items-center justify-center mb-3">
                      <CheckCircle2 size={24} />
                    </div>
                    <h2 className="text-2xl font-light text-neutral-950 dark:text-white mb-2">
                      Request an Official Estimate
                    </h2>
                    <p className="text-neutral-600 dark:text-neutral-400 text-sm max-w-md mx-auto mb-6 leading-relaxed">
                      Send your room measurements, browse materials, and receive a customized quotation in your customer portal.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate("/profile")}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 font-medium transition-all duration-200 shadow-sm cursor-pointer"
                    >
                      Go to Profile &amp; Get Estimate <ArrowRight size={16} />
                    </button>
                  </div>

                  {/* Custom Builder Option with auto-filled profile info */}
                  <BuildOwnCard user={currentUser} onOpen={() => setBuilderOpen(true)} />
                </div>
              ) : (
                <SignInCard />
              )}
            </div>
          </section>
        </main>
      </div>

      {previewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label="Sample quotation preview"
          onClick={closePreview}
        >
          <div className="relative max-h-full max-w-5xl" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              onClick={closePreview}
              aria-label="Close preview"
              className="absolute right-2 top-2 z-10 rounded-full bg-neutral-900/80 px-3 py-1.5 text-sm text-white hover:bg-neutral-900"
            >
              Close
            </button>
            <img
              src={quotationImageUrlDark || quotaionImageUrl}
              alt="Sample quotation"
              className="max-h-[90vh] max-w-full rounded-lg object-contain"
            />
          </div>
        </div>
      )}
      {builderOpen && <QuotationBuilder onClose={() => setBuilderOpen(false)} />}
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
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 text-xs font-semibold uppercase tracking-wider mb-4">
        Official Quotation
      </div>
      <h2 className="text-2xl sm:text-3xl font-light text-neutral-950 dark:text-white mb-3">
        Log in to request a quote
      </h2>
      <p className="text-neutral-600 dark:text-neutral-400 mb-6 max-w-md mx-auto leading-relaxed">
        Log in and request a quote for your custom curtains and automated motors. <strong className="text-neutral-900 dark:text-white font-medium">Your quote will look like the sample shown above!</strong>
      </p>
      <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mb-4">
        <Link
          to="/login?redirect=/profile"
          className="inline-flex items-center justify-center px-6 py-3 bg-sky-500 text-white font-medium rounded-xl hover:bg-sky-600 transition-all duration-200 shadow-sm shadow-sky-500/20"
        >
          Log in &amp; Request Quote
        </Link>
        <Link
          to="/login?redirect=/profile"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 font-medium rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all duration-200"
        >
          <img
            src="https://res.cloudinary.com/ds6um53cx/image/upload/v1767443974/kfz6yztoc4ovt40qehvj.svg"
            alt=""
            className="w-5 h-5"
          />
          Sign in with Google
        </Link>
      </div>
      <a
        href="#preview"
        className="inline-block text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline"
      >
        ↑ See sample quotation preview
      </a>
    </div>
  );
}

function BuildOwnCard({ onOpen, user }: { onOpen: () => void; user: any }) {
  return (
    <div className="rounded-3xl border border-neutral-200/80 dark:border-neutral-800 p-8 sm:p-10 text-center bg-white dark:bg-neutral-900/70 shadow-sm space-y-4">
      <div className="inline-flex w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 items-center justify-center">
        <FileText size={22} />
      </div>
      <div>
        <h2 className="text-2xl font-light text-neutral-950 dark:text-white mb-2">
          Build your own quotation
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 text-sm max-w-md mx-auto leading-relaxed">
          {user?.displayName || user?.email ? (
            <span>
              All your profile details (<strong className="text-neutral-900 dark:text-white">{user.displayName || user.email}</strong>) will be prefilled automatically into the builder.
            </span>
          ) : (
            "Enter line items, branding, and download a print-ready PDF."
          )}
        </p>
      </div>
      <div>
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-600 dark:hover:bg-sky-400 text-white font-medium shadow-sm shadow-sky-500/20 transition-all duration-200 cursor-pointer"
        >
          Start building <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
