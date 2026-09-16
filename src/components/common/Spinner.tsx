import React from "react";

const Spinner: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-50/80 backdrop-blur-sm dark:bg-neutral-950/80">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="relative h-12 w-12">
          {/* Soft brand glow */}
          <div className="absolute inset-0 rounded-full bg-sky-400/20 blur-xl" />

          {/* Base ring */}
          <div className="absolute inset-0 rounded-full border-[3px] border-neutral-200 dark:border-neutral-800" />

          {/* Animated ring */}
          <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-t-sky-500 border-r-amber-400 dark:border-t-sky-400 dark:border-r-amber-300" />

          {/* Center dot */}
          <div className="absolute inset-0 m-auto h-2 w-2 rounded-full bg-sky-500 dark:bg-sky-400" />
        </div>

        {/* Loading text */}
        <div className="flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400">
          <span>Loading</span>
          <span className="flex gap-1">
            <span className="h-1 w-1 animate-pulse rounded-full bg-sky-500" />
            <span className="h-1 w-1 animate-pulse rounded-full bg-sky-500 [animation-delay:150ms]" />
            <span className="h-1 w-1 animate-pulse rounded-full bg-amber-400 [animation-delay:300ms]" />
          </span>
        </div>
      </div>
    </div>
  );
};

export default Spinner;