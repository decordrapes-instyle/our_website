export default function MaintenancePage() {
  return (
    <main className="h-dvh overflow-hidden flex items-center justify-center bg-white dark:bg-gray-950 px-5">
      <div className="w-full max-w-lg">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 sm:p-8 shadow-sm">

          {/* Status */}
          <div className="flex items-center gap-2.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-xs font-mono tracking-wide text-gray-500 dark:text-gray-400">
              ERROR 500
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
            Something went wrong
          </h1>

          <p className="mt-3 text-sm sm:text-base leading-6 text-gray-600 dark:text-gray-400 max-w-md">
            An unexpected error occurred while loading this website.
            Please try again later.
          </p>

          {/* Error details */}
          <div className="mt-6 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-4 py-3 font-mono text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
            <div>INTERNAL_SERVER_ERROR</div>
            <div className="mt-1">APPLICATION_FAILED_TO_LOAD</div>
          </div>

          {/* Action */}
          <button
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-gray-900 dark:bg-white px-4 py-2.5 text-sm font-medium text-white dark:text-gray-900 transition-colors hover:bg-gray-800 dark:hover:bg-gray-200"
          >
            Try Again
          </button>

        </div>
      </div>
    </main>
  );
}
