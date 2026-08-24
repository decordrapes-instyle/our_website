export default function MaintenancePage() {
  return (
    <main className="h-dvh overflow-hidden bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex items-center justify-center px-4 sm:px-6">
      <div className="w-full max-w-xl text-center">

        {/* Error Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-3 py-1 text-xs font-mono text-red-600 dark:text-red-400">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          ERROR 500
        </div>

        {/* Heading */}
        <h1 className="mt-5 text-3xl sm:text-4xl font-bold tracking-tight">
          Something went wrong
        </h1>

        {/* Description */}
        <p className="mt-3 mx-auto max-w-md text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
          An unexpected error occurred while loading this website.
          Please try again later.
        </p>

        {/* Error Details */}
        <div className="mt-6 mx-auto max-w-md rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-left font-mono text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
          <div>ERROR: INTERNAL_SERVER_ERROR</div>
          <div className="mt-1">STATUS_CODE: 500</div>
          <div className="mt-1">APPLICATION_FAILED_TO_LOAD</div>
        </div>

        {/* Try Again */}
        <button
          onClick={() => window.location.reload()}
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-gray-900 dark:bg-white px-5 py-2.5 text-sm font-medium text-white dark:text-gray-900 transition-colors hover:bg-gray-800 dark:hover:bg-gray-200"
        >
          Try Again
        </button>

      </div>
    </main>
  );
}
