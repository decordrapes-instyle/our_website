export default function MaintenancePage() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-2xl">
        <div className="border border-gray-200 rounded-lg p-8 sm:p-10 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-sm font-mono text-gray-500">
              APPLICATION ERROR
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Something went wrong
          </h1>

          <p className="text-gray-600 leading-relaxed mb-8">
            An unexpected error occurred while loading this website.
            Please try again later.
          </p>

          <div className="bg-gray-50 border border-gray-200 rounded-md p-4 font-mono text-xs sm:text-sm text-gray-500 space-y-2">
            <p>ERROR: INTERNAL_SERVER_ERROR</p>
            <p>STATUS_CODE: 500</p>
            <p>APPLICATION_FAILED_TO_LOAD</p>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="mt-8 px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    </main>
  );
}
