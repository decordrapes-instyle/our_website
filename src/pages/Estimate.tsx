import { ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Estimate = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-900 px-4">
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">
          Page Coming Soon
        </h1>

        <p className="text-neutral-600 dark:text-neutral-400 max-w-md mx-auto">
          We’re working on this feature. Please check back shortly.
        </p>
        <div className="flex flex-col items-center">
          <div className="mt-8 inline-flex items-center justify-center rounded-xl border border-neutral-200 dark:border-neutral-700 px-6 py-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Under Construction
          </div>

          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium
               text-neutral-700 hover:text-neutral-900
               dark:text-neutral-400 dark:hover:text-neutral-200"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Estimate;
