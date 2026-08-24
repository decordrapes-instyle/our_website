export default function MaintenancePage() {
  return (
    <main className="min-h-screen h-dvh overflow-hidden bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex items-center justify-center px-4 sm:px-6">
      <div className="w-full max-w-xl">
        <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-6 sm:p-8 shadow-sm bg-white dark:bg-gray-950">
          
          <div className="flex items-center gap-3 mb-5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
            <span className="text-xs sm:text-sm font-mono text-gray-500 dark:text-gray-400">
              APPLICATION ERROR
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
            Something went wrong
          </h1>

          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
            An unexpected error occurred while loading this website.
            Please try again later.
          </p>

          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 sm:p-4 font-mono text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 space-y-1.5">
            <p>ERROR: INTERNAL_SERVER_ERROR</p>
            <p>STATUS_CODE: 500</p>
            <p>APPLICATION_FAILED_TO_LOAD</p>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="mt-6 w-full sm:w-auto px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    </main>
  );
}
