import React, { useState, useEffect } from "react";
import { ChevronLeft, Search, X } from "lucide-react";

export interface TabHeaderProps {
  eyebrow: string;
  title: string;
  meta?: React.ReactNode;
  search?: string;
  setSearch?: (value: string) => void;
  placeholder?: string;
  extra?: React.ReactNode;
  onBack?: () => void;
  /** optional overrides shown from md (tablet/desktop) upward — mobile keeps eyebrow/title */
  deskEyebrow?: string;
  deskTitle?: string;
  deskMeta?: React.ReactNode;
}

export const TabHeader: React.FC<TabHeaderProps> = ({
  eyebrow,
  title,
  meta,
  search,
  setSearch,
  placeholder,
  extra,
  onBack,
  deskEyebrow,
  deskTitle,
  deskMeta,
}) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const hasSearch = typeof setSearch === "function";
  const hasDeskTitle = !!deskTitle;

  useEffect(() => {
    setSearchOpen(false);
  }, [title]);

  return (
    <div className="desk-header app-header-sticky app-bleed rounded-t-none rounded-b-2xl bg-white px-5 py-3.5 shadow-xs dark:bg-neutral-900 sm:rounded-t-none sm:rounded-b-2xl sm:px-7 sm:py-4 md:rounded-t-none md:rounded-b-2xl md:border md:border-t-0 md:border-slate-200/80 dark:md:border-neutral-800/80 md:px-8 md:py-4 lg:px-10">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Go back"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}

          <div className={`h-11 min-w-0 flex-col justify-center ${hasDeskTitle ? "flex md:hidden" : "flex"}`}>
            {!!eyebrow && (
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                {eyebrow}
              </p>
            )}
            <h1 className={`truncate text-xl font-bold tracking-tight text-slate-900 dark:text-white ${eyebrow ? "mt-0.5" : ""}`}>
              {title}
            </h1>
          </div>

          {hasDeskTitle && (
            <div className="hidden h-11 min-w-0 flex-col justify-center md:flex">
              {!!deskEyebrow && (
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {deskEyebrow}
                </p>
              )}
              <h1 className="truncate text-2xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white">
                {deskTitle}
              </h1>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {extra}

          {hasSearch && (
            <>
              {/* tablet / desktop: search is always visible */}
              <div className="desk-search hidden h-10 w-64 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 transition focus-within:border-slate-400 focus-within:bg-white lg:w-80 md:flex dark:border-neutral-700 dark:focus-within:border-neutral-500">
                <Search className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch!(event.target.value)}
                  placeholder={placeholder}
                  aria-label={placeholder || "Search"}
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400 text-slate-900 dark:text-white"
                />
                {!!search && (
                  <button type="button" onClick={() => setSearch!("")} aria-label="Clear search" className="rounded-full p-1 text-slate-400 hover:text-slate-700">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* mobile: tap to expand */}
              <button
                type="button"
                onClick={() => setSearchOpen((current) => !current)}
                aria-label={searchOpen ? "Close search" : "Search"}
                className={`flex h-10 w-10 touch-manipulation items-center justify-center rounded-full transition active:scale-95 md:hidden ${
                  searchOpen
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-neutral-300"
                }`}
              >
                {searchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
              </button>
            </>
          )}
        </div>
      </div>

      {meta}

      {!!deskMeta && (
        <div className={`mt-3 hidden flex-wrap items-center gap-2 md:flex ${onBack ? "md:pl-9" : ""}`}>{deskMeta}</div>
      )}

      {hasSearch && searchOpen && (
        <div className="mt-3 flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 md:hidden dark:border-neutral-800 dark:bg-neutral-800">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            autoFocus
            value={search}
            onChange={(event) => setSearch!(event.target.value)}
            placeholder={placeholder}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400 text-slate-900 dark:text-white"
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

export default TabHeader;
