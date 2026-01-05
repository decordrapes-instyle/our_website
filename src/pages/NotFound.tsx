import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-white px-6 py-24 dark:bg-neutral-950 sm:py-32 lg:px-8">
      <div className="text-center">
        <p className="text-5xl font-semibold text-gray-700 dark:text-gray-300">404</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
          Page not found
        </h1>
        <p className="mt-6 text-base leading-7 text-gray-600 dark:text-gray-400">
          Sorry, we couldn’t find the page you’re looking for.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link
            to="/"
            className="rounded-full bg-gray-800 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200 dark:focus-visible:outline-gray-100"
          >
            Go back home
          </Link>
          <Link to="/contact" className="text-sm flex flex-row justify-content-center items-center font-semibold text-gray-900 dark:text-white">
            Contact support <ChevronRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </main>
  );
}
