import React, { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, ArrowUpRight, Mail, X } from "lucide-react";
import { database, ref, runTransaction } from "../../config/firebase";
import { SiteSettings } from "../../types";

const LIKE_PATH = "like/fromFooter";
const LOCAL_QUEUE_KEY = "footer-like-queue";

/* ── Custom Added Apps (1 or 2 items only) ── */
interface CustomApp {
  id: string;
  name: string;
  url: string;
  favicon: string;
  isExternal: boolean;
}

const CUSTOM_APPS: CustomApp[] = [
  {
    id: "biblion",
    name: "Biblion",
    url: "https://biblion.in",
    favicon: "https://biblion.in/favicon.ico",
    isExternal: true,
  },
];

/* ── Inline Instagram Icon ── */
const InstagramIcon: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fillRule="evenodd"
      d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.566.683.748 1.15.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
      clipRule="evenodd"
    />
  </svg>
);

export default function FooterMadeWith({
  settings: _settings = [],
}: {
  settings?: SiteSettings[];
}) {
  const [open, setOpen] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);

  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const bufferRef = useRef(0);
  const flushTimeout = useRef<NodeJS.Timeout | null>(null);

  /* Load like state from localStorage */
  useEffect(() => {
    try {
      if (localStorage.getItem("hasLiked") === "true") {
        setHasLiked(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  /* Close on outside click or Escape */
  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  /* Flush like buffer to Firebase */
  const flushBuffer = () => {
    if (bufferRef.current === 0) return;
    const toAdd = bufferRef.current;
    bufferRef.current = 0;
    try {
      localStorage.setItem(LOCAL_QUEUE_KEY, "0");
      if (database) {
        const likeRef = ref(database, LIKE_PATH);
        runTransaction(likeRef, (currentData) => {
          if (currentData === null) return { count: toAdd };
          return { count: (currentData.count || 0) + toAdd };
        }).catch(() => {});
      }
    } catch {
      /* ignore */
    }
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasLiked) return;

    setHasLiked(true);
    try {
      localStorage.setItem("hasLiked", "true");
      bufferRef.current += 1;
      localStorage.setItem(LOCAL_QUEUE_KEY, String(bufferRef.current));
      if (flushTimeout.current) clearTimeout(flushTimeout.current);
      flushTimeout.current = setTimeout(flushBuffer, 100);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="relative inline-flex items-center select-none">
      {/* ── Footer Trigger: Made with ❤️ by Pankaj ── */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="group inline-flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer py-1"
        aria-expanded={open}
        aria-label="Open creator popover"
      >
        <span>Made with</span>
        <span
          onClick={handleLike}
          title="Send a like"
          className="inline-flex items-center cursor-pointer p-0.5"
        >
          <Heart
            className={`w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110 ${
              hasLiked
                ? "fill-red-500 text-red-500"
                : "fill-red-500/20 text-red-500 group-hover:fill-red-500/60"
            }`}
          />
        </span>
        <span>by</span>
        <span className="font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 underline underline-offset-4 decoration-neutral-300 dark:decoration-neutral-700 transition-colors">
          Pankaj
        </span>
      </button>

      {/* ── Mobile Dimmer Backdrop ── */}
      {open && (
        <div
          className="fixed inset-0 bg-neutral-950/20 dark:bg-neutral-950/50 backdrop-blur-[1px] z-40 sm:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Minimal Popover Card ── */}
      {open && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label="Creator details and projects"
          className="
            absolute
            bottom-full
            right-0
            mb-2.5
            z-50
            w-[290px]
            sm:w-[310px]
            rounded-2xl
            bg-white/95
            dark:bg-neutral-900/95
            backdrop-blur-xl
            border
            border-neutral-200/90
            dark:border-neutral-800
            shadow-xl
            shadow-neutral-900/10
            dark:shadow-black/60
            animate-popover-in
            text-left
            p-3.5
          "
        >
          {/* Top Section: Avatar + Name + Contact Mail + Instagram + Close */}
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src="https://avatars.githubusercontent.com/u/125809323?v=4"
                alt="Pankaj"
                className="w-9 h-9 rounded-full object-cover ring-2 ring-neutral-200 dark:ring-neutral-700/80 flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 leading-tight truncate">
                  Pankaj
                </h4>

                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  {/* Contact Mail Pill */}
                  <a
                    href="mailto:pkumar8782744.pku@gmail.com"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200/60 dark:border-neutral-700/60 transition-colors"
                    title="Send an email"
                  >
                    <Mail className="w-3 h-3 text-neutral-400 dark:text-neutral-500" />
                    <span>Contact</span>
                  </a>

                  {/* Instagram Pill */}
                  <a
                    href="https://instagram.com/pankajshah.1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 hover:bg-pink-100 dark:hover:bg-pink-900/40 border border-pink-200/60 dark:border-pink-800/60 transition-colors"
                    title="Instagram @pankajshah.1"
                  >
                    <InstagramIcon className="w-3 h-3" />
                    <span>@pankajshah.1</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex-shrink-0"
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* ── Separator: "More by me" ── */}
          <div className="relative my-3 flex items-center gap-2">
            <div className="h-px flex-1 bg-neutral-200/80 dark:bg-neutral-800" />
            <span className="text-[10px] font-bold tracking-widest uppercase text-neutral-400 dark:text-neutral-500 select-none">
              More by me
            </span>
            <div className="h-px flex-1 bg-neutral-200/80 dark:bg-neutral-800" />
          </div>

          {/* ── Apps Section: Favicon, Name, and Visit Icon in same row ── */}
          <div className="space-y-1.5">
            {CUSTOM_APPS.map((app) => {
              const rowContent = (
                <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-50/70 dark:bg-neutral-800/40 hover:bg-neutral-100/90 dark:hover:bg-neutral-800/90 border border-neutral-200/60 dark:border-neutral-800/80 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all duration-200 group/item cursor-pointer">
                  {/* Left: Favicon + App Name */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-700/70 p-0.5 shadow-2xs overflow-hidden">
                      <img
                        src={app.favicon}
                        alt=""
                        className="w-full h-full object-contain"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLElement;
                          target.style.display = "none";
                          if (target.parentElement) {
                            target.parentElement.innerText = app.name.charAt(0);
                            target.parentElement.className =
                              "w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200";
                          }
                        }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 group-hover/item:text-neutral-950 dark:group-hover/item:text-white transition-colors truncate">
                      {app.name}
                    </span>
                  </div>

                  {/* Right: Visit Icon */}
                  <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400 group-hover/item:text-amber-600 dark:group-hover/item:text-amber-400 transition-all duration-200 group-hover/item:translate-x-0.5 group-hover/item:-translate-y-0.5 flex-shrink-0" />
                </div>
              );

              if (app.isExternal) {
                return (
                  <a
                    key={app.id}
                    href={app.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block focus:outline-none"
                  >
                    {rowContent}
                  </a>
                );
              }

              return (
                <Link
                  key={app.id}
                  to={app.url}
                  onClick={() => setOpen(false)}
                  className="block focus:outline-none"
                >
                  {rowContent}
                </Link>
              );
            })}
          </div>

          {/* Pointer Triangle Arrow (Desktop only, connects popover to trigger) */}
          <div className="hidden sm:block absolute -bottom-1.5 right-6 w-3 h-3 bg-white dark:bg-neutral-900 border-r border-b border-neutral-200/90 dark:border-neutral-800 rotate-45 transform z-10" />
        </div>
      )}
    </div>
  );
}
