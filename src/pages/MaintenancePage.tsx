export default function MaintenancePage() {
  return (
    <main className="min-h-screen h-dvh overflow-hidden bg-white dark:bg-black text-gray-900 dark:text-gray-100 flex items-center justify-center px-4 sm:px-6">
      <div className="w-full max-w-xl">

        {/* Error Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 px-3 py-1 text-xs font-mono text-gray-600 dark:text-gray-300">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          ERROR 500
        </div>

        {/* Heading */}
        <h1 className="mt-5 text-3xl sm:text-4xl font-bold tracking-tight">
          Something went wrong
        </h1>

        {/* Description */}
        <p className="mt-3 max-w-md text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
          An unexpected error occurred while loading this website.
          Please try again later.
        </p>

        {/* Compact Status */}
        <div className="mt-6 inline-flex items-center gap-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 px-3.5 py-2.5 font-mono text-xs">
          <span className="text-gray-500 dark:text-gray-500">
            STATUS
          </span>

          <span className="text-gray-900 dark:text-white font-semibold">
            500
          </span>

          <span className="h-3 w-px bg-gray-300 dark:bg-zinc-700" />

          <span className="text-red-600 dark:text-red-400">
            FAILED TO LOAD
          </span>
        </div>

        {/* Try Again */}
        <div>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-black rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
          >
            Try Again
          </button>
        </div>

      </div>
    </main>
  );
}
