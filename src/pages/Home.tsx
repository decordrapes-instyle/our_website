import React, { useEffect, useRef, useState } from "react";
import { ref, onValue, database } from "../config/firebase";
import { Testimonial, Product } from "../types";
import Hero from "../components/Hero";
import Spinner from "../components/common/Spinner";
import ProductCard from "../components/product/ProductCard";
import ProductModal from "../components/product/ProductModal";
import OurWorkPublic from "./OurWork";
import Reviews from "../components/Reviews";
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle,
  Clock,
  EyeOff,
  Ruler,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*  Brand                                                                      */
/*  amber  #f59e0b  → actions + highlights (always with dark ink text on it)   */
/*  blue   #058dd0  → structure, icons, links                                  */
/*  ink    #062a3d  → deep blue used for the one dark moment (CTA)             */
/*  #0373ab / #4db8ee are darker / lighter blues for small TEXT, because the   */
/*  brand blue alone is only ~3.7:1 on white.                                  */
/* -------------------------------------------------------------------------- */

// Swap these for your own photos (put them in /public) when you can —
// hot-linked stock/Google thumbnails are the weakest part of this page.
const CATEGORY_IMAGES = {
  sheer:
    "https://media.istockphoto.com/id/1442115350/photo/modern-design-of-gray-fabric-sofa-with-cushion-and-round-black-coffee-table-in-luxury-white.jpg?s=612x612&w=0&k=20&c=zlTdhIZWcT-yjRSbQU2ZP5H40n76o47TcMRUsEYFc_s=",
  blinds:
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT4vYrHlcgnWE_dTb1ugv9CyaWoDTtAzJnPxA&s",
  mosquito:
    "https://media.istockphoto.com/id/1492463709/photo/hand-hold-pleated-mosquito-net-wire-screen-handle-on-house-window.jpg?s=612x612&w=0&k=20&c=RitElFFOlM8T7mLdViTCT-H0Z2Y7B71tbGLkZDYy8jY=",
  motorized:
    "https://media.istockphoto.com/id/1438964450/photo/roller-blinds-on-the-windows-in-the-interior.jpg?s=612x612&w=0&k=20&c=Gs9RNXBV1Svrem8VEgoOtw2ZZQUj0eo1kjC5otE3wY8=",
};

/* -------------------------------------------------------------------------- */
/*  Static content                                                             */
/* -------------------------------------------------------------------------- */

interface Category {
  title: string;
  description: string;
  icon: React.ReactNode;
  image: string;
  features: string[];
}

const PRODUCT_CATEGORIES: Category[] = [
  {
    title: "Curtain sheer fabrics",
    description:
      "Light, airy fabric that softens daylight and keeps the room private.",
    icon: <EyeOff className="h-6 w-6" />,
    image: CATEGORY_IMAGES.sheer,
    features: ["Light filtering", "Elegant draping", "Many colours"],
  },
  {
    title: "Ready-made blinds",
    description:
      "Precision-cut in standard sizes, ready for quick installation.",
    icon: <Ruler className="h-6 w-6" />,
    image: CATEGORY_IMAGES.blinds,
    features: ["Perfect fit", "Quick installation", "Multiple sizes"],
  },
  {
    title: "Pleated mosquito mesh",
    description:
      "Keeps insects out and the breeze in, then folds away when you don’t need it.",
    icon: <Shield className="h-6 w-6" />,
    image: CATEGORY_IMAGES.mosquito,
    features: ["Insect protection", "Full ventilation", "Discreet design"],
  },
  {
    title: "Motorised solutions",
    description:
      "Automated curtains and blinds that move at the touch of a button.",
    icon: <Zap className="h-6 w-6" />,
    image: CATEGORY_IMAGES.motorized,
    features: ["Smart control", "Energy efficient", "Quiet operation"],
  },
];

// Column spans give the grid a 7/5 – 5/7 rhythm instead of four equal boxes.
const CATEGORY_SPANS = [
  "md:col-span-7",
  "md:col-span-5",
  "md:col-span-5",
  "md:col-span-7",
];

const BENEFITS = [
  {
    title: "Custom sizing",
    description: "Cut to the exact dimensions of your windows.",
    icon: <Ruler className="h-5 w-5" />,
  },
  {
    title: "Quick installation",
    description: "Professional fitting, done in less time.",
    icon: <Clock className="h-5 w-5" />,
  },
  {
    title: "Premium materials",
    description: "Quality fabrics built to last.",
    icon: <Sparkles className="h-5 w-5" />,
  },
  {
    title: "5-year warranty",
    description: "Comprehensive warranty coverage.",
    icon: <CheckCircle className="h-5 w-5" />,
  },
];

const VISIT_STEPS = [
  { title: "Book a free visit", text: "Pick a time that suits you." },
  { title: "We come to you", text: "A window decor specialist visits your home." },
  { title: "Get your quote", text: "A detailed quote for your windows." },
];

const SECTION = "py-16 md:py-24";
const CONTAINER = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";

/* -------------------------------------------------------------------------- */
/*  Styles (scoped with the hm- prefix so nothing leaks into the rest of site) */
/* -------------------------------------------------------------------------- */

const HOME_STYLES = `
@import url("https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700&display=swap");

.hm-root {
  --hm-amber: #f59e0b;
  --hm-blue: #058dd0;
  --hm-ink: #062a3d;
  /* Falls back to your existing display font if Google Fonts is blocked. */
  --hm-display: "Bricolage Grotesque", var(--font-display, ui-sans-serif), ui-sans-serif, system-ui, sans-serif;
}

.hm-display {
  font-family: var(--hm-display);
  font-optical-sizing: auto;
  letter-spacing: -0.025em;
  text-wrap: balance;
}

.hm-focus:focus-visible {
  outline: 2px solid var(--hm-blue);
  outline-offset: 4px;
  border-radius: 0.5rem;
}

/* ---- The one signature moment: category photos open like curtains -------- */
.hm-reveal {
  position: relative;
  overflow: hidden;
  isolation: isolate;
}
.hm-reveal::before,
.hm-reveal::after {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  width: 50.5%;
  z-index: 2;
  background:
    repeating-linear-gradient(90deg,
      rgb(0 0 0 / .14) 0 3px,
      rgb(255 255 255 / .07) 3px 11px,
      transparent 11px 26px),
    linear-gradient(180deg, #058dd0, #04689a);
  transition: transform 1.15s cubic-bezier(.7, 0, .2, 1) var(--hm-delay, 0ms);
}
.hm-reveal::before { left: 0; }
.hm-reveal::after { right: 0; }
.hm-reveal[data-in="true"]::before { transform: translateX(-101%); }
.hm-reveal[data-in="true"]::after { transform: translateX(101%); }

.hm-reveal img {
  transform: scale(1.1);
  transition: transform 1.8s cubic-bezier(.2, .7, .2, 1) var(--hm-delay, 0ms);
}
.hm-reveal[data-in="true"] img { transform: scale(1); }
.hm-reveal[data-in="true"]:hover img {
  transform: scale(1.045);
  transition-duration: 1s;
  transition-delay: 0ms;
}
.hm-fallback {
  background: linear-gradient(135deg, rgb(5 141 208 / .2), rgb(245 158 11 / .2));
}

/* ---- Product grid entrance (fires when data lands) --------------------- */
@keyframes hm-pop {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: none; }
}
.hm-pop { animation: hm-pop .6s cubic-bezier(.2, .7, .2, 1) both; }

/* ---- Loading skeleton -------------------------------------------------- */
.hm-shimmer { position: relative; overflow: hidden; }
.hm-shimmer::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgb(148 163 184 / .25), transparent);
  animation: hm-shimmer 1.6s ease-in-out infinite;
}
@keyframes hm-shimmer { to { transform: translateX(100%); } }

/* ---- CTA: morning light moving across pleated fabric ------------------- */
.hm-pleats {
  background: repeating-linear-gradient(90deg,
    rgb(255 255 255 / .055) 0px,
    transparent 18px,
    rgb(0 0 0 / .2) 36px,
    transparent 54px,
    rgb(255 255 255 / .055) 72px);
  -webkit-mask-image: linear-gradient(180deg, #000 0%, #000 50%, transparent 100%);
          mask-image: linear-gradient(180deg, #000 0%, #000 50%, transparent 100%);
}
.hm-sun {
  background: linear-gradient(100deg,
    transparent 0%,
    rgb(245 158 11 / .26) 45%,
    rgb(245 158 11 / .07) 62%,
    transparent 100%);
  filter: blur(22px);
  transform: translateX(-10%) skewX(-12deg);
  animation: hm-sun 18s ease-in-out infinite alternate;
}
@keyframes hm-sun {
  from { transform: translateX(-10%) skewX(-12deg); }
  to   { transform: translateX(150%) skewX(-12deg); }
}

@media (prefers-reduced-motion: reduce) {
  .hm-reveal::before,
  .hm-reveal::after { display: none; }
  .hm-reveal img,
  .hm-reveal[data-in="true"]:hover img { transform: none; transition: none; }
  .hm-pop,
  .hm-sun,
  .hm-shimmer::after { animation: none; }
}
`;

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

// Fires once, the first time the element scrolls into view.
function useInView<T extends Element>(threshold = 0.25) {
  const elRef = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return [elRef, inView] as const;
}

// Fisher–Yates. The old `.sort(() => Math.random() - 0.5)` is biased.
const shuffle = <T,>(items: T[]): T[] => {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/* -------------------------------------------------------------------------- */
/*  Small components                                                           */
/* -------------------------------------------------------------------------- */

const SectionHeading: React.FC<{
  title: string;
  aside?: React.ReactNode;
  children?: React.ReactNode;
}> = ({ title, aside, children }) => (
  <div className="mb-12 flex flex-col gap-6 md:mb-16 lg:flex-row lg:items-end lg:justify-between">
    <div className="max-w-2xl">
      <h2 className="hm-display text-4xl font-semibold leading-[1.04] text-neutral-900 dark:text-white sm:text-5xl">
        {title}
      </h2>
      {children && (
        <p className="mt-4 max-w-xl text-base leading-relaxed text-neutral-600 dark:text-neutral-400 sm:text-lg">
          {children}
        </p>
      )}
    </div>
    {aside}
  </div>
);

const CategoryCard: React.FC<{
  category: Category;
  index: number;
  className?: string;
}> = ({ category, index, className = "" }) => {
  const [mediaRef, inView] = useInView<HTMLDivElement>(0.25);
  const [broken, setBroken] = useState(false);

  return (
    <article className={className}>
      <div className="relative">
        <div
          ref={mediaRef}
          data-in={inView ? "true" : "false"}
          style={{ "--hm-delay": `${(index % 2) * 140}ms` } as React.CSSProperties}
          className="hm-reveal h-64 rounded-[1.75rem] bg-neutral-200 dark:bg-neutral-800 sm:h-72 lg:h-80"
        >
          {broken ? (
            <div className="hm-fallback flex h-full w-full items-center justify-center text-[#058dd0]">
              <span className="scale-[2.5] opacity-60">{category.icon}</span>
            </div>
          ) : (
            <img
              src={category.image}
              alt={category.title}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={() => setBroken(true)}
              className="h-full w-full object-cover"
            />
          )}
        </div>

        {/* Icon badge sits half on the photo; the ring matches the page bg */}
        <span className="absolute -bottom-6 left-6 z-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f59e0b] text-[#062a3d] ring-4 ring-neutral-50 dark:ring-neutral-950">
          {category.icon}
        </span>
      </div>

      <div className="pt-10">
        <h3 className="hm-display text-2xl font-semibold leading-tight text-neutral-900 dark:text-white sm:text-[1.7rem]">
          {category.title}
        </h3>
        <p className="mt-2 max-w-md leading-relaxed text-neutral-600 dark:text-neutral-400">
          {category.description}
        </p>
        <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-neutral-800 dark:text-neutral-200">
          {category.features.map((feature) => (
            <li key={feature} className="inline-flex items-center gap-1.5">
              <Check className="h-4 w-4 text-[#058dd0]" aria-hidden />
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
};

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

const Home: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingWork, setLoadingWork] = useState(true);

  useEffect(() => {
    // Testimonials — three random approved ones
    const unsubTestimonials = onValue(ref(database, "testimonials"), (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const approved = Object.keys(data)
          .map((k) => ({ id: k, ...data[k] }))
          .filter((t) => t.isApproved);
        setTestimonials(shuffle(approved).slice(0, 3));
      } else {
        setTestimonials([]);
      }
    });

    // Products
    const unsubProducts = onValue(
      ref(database, "products"),
      (snap) => {
        if (snap.exists()) {
          const data = snap.val();
          const list: Product[] = Object.keys(data).map((k) => ({
            id: k,
            ...data[k],
          }));
          setProducts(list);
        } else {
          setProducts([]);
        }
        setLoadingProducts(false);
      },
      // Don't leave the skeleton spinning forever if the read is denied
      () => setLoadingProducts(false)
    );

    // Our work — OurWorkPublic fetches its own items; this only drives the skeleton
    const unsubWork = onValue(
      ref(database, "ourWork"),
      () => setLoadingWork(false),
      () => setLoadingWork(false)
    );

    return () => {
      unsubTestimonials();
      unsubProducts();
      unsubWork();
    };
  }, []);

  const previewProducts = products.slice(0, 4);

  return (
    <div className="hm-root overflow-x-clip bg-neutral-50 text-neutral-900 transition-colors duration-300 dark:bg-neutral-950 dark:text-neutral-100">
      <style>{HOME_STYLES}</style>

      {/* HERO */}
      <Hero />

      {/* RANGE */}
      <section className={SECTION}>
        <div className={CONTAINER}>
          <SectionHeading
            title="Everything for your windows"
            aside={
              <a
                href="/products"
                className="hm-focus group inline-flex items-center gap-2 font-medium text-[#0373ab] hover:text-[#058dd0] dark:text-[#4db8ee] dark:hover:text-white"
              >
                See all products
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </a>
            }
          >
            Sheers that soften the light, blinds that fit first time, mesh that
            keeps insects out, and motors that do the pulling for you.
          </SectionHeading>

          <div className="grid grid-cols-1 gap-x-8 gap-y-16 md:grid-cols-12">
            {PRODUCT_CATEGORIES.map((category, index) => (
              <CategoryCard
                key={category.title}
                category={category}
                index={index}
                className={`${CATEGORY_SPANS[index]} ${
                  index % 2 === 1 ? "md:mt-14" : ""
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* WHY INSTYLE */}
      <section
        className={`${SECTION} bg-[#058dd0]/[0.06] dark:bg-white/[0.03]`}
      >
        <div className={`${CONTAINER} grid gap-12 lg:grid-cols-12 lg:gap-16`}>
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <h2 className="hm-display text-4xl font-semibold leading-[1.04] text-neutral-900 dark:text-white sm:text-5xl">
                Made to fit.
                <br />
                Built to last.
              </h2>
              <p className="mt-4 max-w-sm text-base leading-relaxed text-neutral-600 dark:text-neutral-400 sm:text-lg">
                Premium fabric, sized to your windows and fitted by our team,
                with a five-year warranty behind it.
              </p>
              <a
                href="/estimate"
                className="hm-focus group mt-7 inline-flex items-center gap-2 font-medium text-[#0373ab] hover:text-[#058dd0] dark:text-[#4db8ee] dark:hover:text-white"
              >
                Get a free quote
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </a>
            </div>
          </div>

          <ul className="divide-y divide-neutral-900/10 border-y border-neutral-900/10 dark:divide-white/10 dark:border-white/10 lg:col-span-7">
            {BENEFITS.map((benefit) => (
              <li key={benefit.title} className="group flex gap-5 py-7 sm:py-8">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-[#0373ab] ring-1 ring-neutral-900/10 transition-colors duration-300 group-hover:bg-[#f59e0b] group-hover:text-[#062a3d] group-hover:ring-transparent dark:bg-neutral-900 dark:text-[#4db8ee] dark:ring-white/10">
                  {benefit.icon}
                </span>
                <div>
                  <h3 className="hm-display text-xl font-semibold text-neutral-900 dark:text-white">
                    {benefit.title}
                  </h3>
                  <p className="mt-1 text-neutral-600 dark:text-neutral-400">
                    {benefit.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className={SECTION}>
        <div className={CONTAINER}>
          <SectionHeading
            title="Featured products"
            aside={
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <a
                  href="/products"
                  className="hm-focus group inline-flex items-center gap-2 font-medium text-neutral-800 hover:text-[#058dd0] dark:text-neutral-200 dark:hover:text-[#4db8ee]"
                >
                  View all products
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </a>
                <a
                  href="/catalogue"
                  className="hm-focus inline-flex items-center gap-2 rounded-full border border-[#058dd0]/50 px-4 py-2 text-sm font-semibold text-[#0373ab] transition-colors duration-200 hover:border-[#058dd0] hover:bg-[#058dd0] hover:text-white dark:text-[#4db8ee] dark:hover:text-white"
                >
                  <BookOpen className="h-4 w-4" />
                  Virtual flip catalogue
                </a>
              </div>
            }
          />

          <div
            aria-busy={loadingProducts}
            className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4"
          >
            {loadingProducts ? (
              <div className="col-span-full py-16 flex items-center justify-center">
                <Spinner fullScreen={false} text="Loading signature collection..." />
              </div>
            ) : previewProducts.length > 0 ? (
              previewProducts.map((p, idx) => (
                <div
                  key={p.id}
                  className="hm-pop w-full"
                  style={{ animationDelay: `${idx * 70}ms` }}
                >
                  <ProductCard
                    product={p}
                    onViewDetails={() => setSelectedProduct(p)}
                  />
                </div>
              ))
            ) : (
              <div className="col-span-full rounded-2xl border border-dashed border-neutral-300 px-6 py-14 text-center dark:border-neutral-700">
                <p className="hm-display text-xl font-semibold text-neutral-900 dark:text-white">
                  Our product list is being updated
                </p>
                <p className="mx-auto mt-2 max-w-md text-neutral-600 dark:text-neutral-400">
                  Browse the virtual catalogue, or tell us what you need and
                  we’ll point you to the right range.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <a
                    href="/catalogue"
                    className="hm-focus rounded-full border border-[#058dd0]/50 px-5 py-2.5 text-sm font-semibold text-[#0373ab] transition-colors hover:bg-[#058dd0] hover:text-white dark:text-[#4db8ee] dark:hover:text-white"
                  >
                    Open the catalogue
                  </a>
                  <a
                    href="/contact"
                    className="hm-focus rounded-full bg-[#f59e0b] px-5 py-2.5 text-sm font-semibold text-[#062a3d] transition-colors hover:bg-[#fbb53a]"
                  >
                    Contact us
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* OUR WORK (renders its own heading) */}
      <section className={SECTION}>
        <div className={CONTAINER}>
          {loadingWork ? (
            <div className="py-16 flex items-center justify-center">
              <Spinner fullScreen={false} text="Loading our portfolio..." />
            </div>
          ) : (
            <OurWorkPublic previewCount={5} isEmbedded={true} />
          )}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className={SECTION}>
        <div className={CONTAINER}>
          <SectionHeading title="What our customers say">
            Hear from the people who’ve had Instyle in their homes — the
            products, the fitting and the service.
          </SectionHeading>
          <div className="w-full">
            <Reviews localReviews={testimonials} isEmbedded={true} />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={SECTION}>
        <div className={CONTAINER}>
          <div className="relative overflow-hidden rounded-[2rem] bg-[#062a3d] p-8 text-white sm:p-12 lg:p-16">
            <div aria-hidden className="hm-pleats pointer-events-none absolute inset-0" />
            <div
              aria-hidden
              className="hm-sun pointer-events-none absolute inset-y-0 -left-1/3 w-2/3"
            />

            <div className="relative grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-7">
                <h2 className="hm-display text-4xl font-semibold leading-[1.02] sm:text-5xl lg:text-6xl">
                  Let’s see your windows.
                </h2>
                <p className="mt-5 max-w-lg text-lg leading-relaxed text-white/75">
                  Book a free doorstep consultation. One of our window decor
                  specialists will visit, and you’ll get a detailed quote.
                </p>

                <div className="mt-9 flex flex-wrap gap-3">
                  <a
                    href="/contact"
                    className="hm-focus inline-flex items-center justify-center rounded-full bg-[#f59e0b] px-7 py-3.5 font-semibold text-[#062a3d] transition-all duration-200 hover:bg-[#fbb53a] hover:shadow-[0_8px_30px_-8px_rgba(245,158,11,0.7)] active:translate-y-px"
                  >
                    Book consultation
                  </a>
                  <a
                    href="/estimate"
                    className="hm-focus inline-flex items-center justify-center rounded-full border border-white/30 px-7 py-3.5 font-medium text-white transition-colors duration-200 hover:bg-white/10 active:translate-y-px"
                  >
                    Get free quote
                  </a>
                </div>
              </div>

              {/* A real sequence, so numbering earns its place here */}
              <ol className="relative space-y-8 lg:col-span-5">
                <span
                  aria-hidden
                  className="absolute bottom-4 left-[17px] top-4 w-px bg-white/15"
                />
                {VISIT_STEPS.map((step, i) => (
                  <li key={step.title} className="relative flex gap-4">
                    <span
                      className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                        i === VISIT_STEPS.length - 1
                          ? "bg-[#f59e0b] text-[#062a3d]"
                          : "bg-[#062a3d] text-[#4db8ee] ring-1 ring-[#058dd0]/60"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <div className="pt-1">
                      <p className="hm-display text-lg font-semibold">
                        {step.title}
                      </p>
                      <p className="mt-0.5 text-white/70">{step.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Product modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
};

export default Home;