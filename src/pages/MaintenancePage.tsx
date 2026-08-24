export default function MaintenancePage() {
  return (
    <main className="min-h-[100dvh] w-full overflow-hidden bg-white dark:bg-black text-gray-950 dark:text-white flex items-center justify-center px-5 sm:px-6">
      <div className="w-full max-w-xl text-center">

        {/* Error Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-zinc-950 px-3 py-1 text-xs font-mono text-gray-700 dark:text-gray-300">
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

        {/* Error Status */}
        <div className="mt-7 mx-auto max-w-md overflow-hidden rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 text-left">

          <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 px-4 py-3">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              SYSTEM STATUS
            </span>

            <span className="text-xs font-mono font-medium text-red-600 dark:text-red-400">
              FAILED
            </span>
          </div>

          <div className="px-4 py-3.5 font-mono text-xs">
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-500 dark:text-gray-500">
                STATUS_CODE
              </span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                500
              </span>
            </div>

            <div className="mt-2.5 flex items-center justify-between gap-4">
              <span className="text-gray-500 dark:text-gray-500">
                APPLICATION
              </span>
              <span className="text-gray-700 dark:text-gray-300">
                FAILED_TO_LOAD
              </span>
            </div>
          </div>

        </div>

        {/* Try Again */}
        <button
          onClick={() => window.location.reload()}
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-black dark:bg-white px-5 py-2.5 text-sm font-medium text-white dark:text-black transition-colors hover:bg-gray-800 dark:hover:bg-gray-200"
        >
          Try Again
        </button>

      </div>
    </main>
  );
}
