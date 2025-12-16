import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Home,
  Info,
  BookOpen,
  FolderTree,
  FileText,
  Phone,
  Shield,
  Sun,
  Moon,
  Code2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SitemapPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const mainPages = [
    { title: "About", path: "/about", icon: Info },
    { title: "Catalogue", path: "/catalogue", icon: BookOpen },
    { title: "Our Work", path: "/our-work", icon: FolderTree },
    { title: "Estimate", path: "/estimate", icon: FileText },
    { title: "Contact", path: "/contact", icon: Phone },
  ];

  const legalPages = [
    { title: "Privacy Policy", path: "/privacy", icon: Shield },
    { title: "Terms & Conditions", path: "/terms", icon: FileText },
  ];

  const xmlData = `
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://www.decordrapesinstyle.com/</loc></url>
  <url><loc>https://www.decordrapesinstyle.com/about</loc></url>
  <url><loc>https://www.decordrapesinstyle.com/catalogue</loc></url>
  <url><loc>https://www.decordrapesinstyle.com/our-work</loc></url>
  <url><loc>https://www.decordrapesinstyle.com/estimate</loc></url>
  <url><loc>https://www.decordrapesinstyle.com/contact</loc></url>
  <url><loc>https://www.decordrapesinstyle.com/privacy</loc></url>
  <url><loc>https://www.decordrapesinstyle.com/terms</loc></url>
</urlset>`;

  return (
    <main
      className={`min-h-screen flex items-center justify-center px-4 py-10 transition-colors duration-500 ${
        darkMode
          ? "bg-gray-950 text-gray-100"
          : "bg-gradient-to-b from-gray-50 via-white to-gray-100 text-gray-900"
      }`}
    >
      <section className="relative w-full max-w-5xl text-center">
        {/* Controls */}
        <div className="absolute top-5 right-5 flex gap-2">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-full border ${
              darkMode
                ? "bg-gray-800 border-gray-700 hover:bg-gray-700"
                : "bg-white border-gray-200 hover:bg-gray-50"
            } transition`}
          >
            {darkMode ? (
              <Sun className="w-4 h-4 text-yellow-400" />
            ) : (
              <Moon className="w-4 h-4 text-gray-700" />
            )}
          </button>
          <button
            onClick={() => setShowRaw(!showRaw)}
            className={`p-2 rounded-full border ${
              darkMode
                ? "bg-gray-800 border-gray-700 hover:bg-gray-700"
                : "bg-white border-gray-200 hover:bg-gray-50"
            } transition`}
          >
            <Code2 className="w-4 h-4 text-blue-500" />
          </button>
        </div>

        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-12">
          Website Sitemap
        </h1>

        {/* Home Node */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={`inline-flex items-center gap-2 px-5 py-2 rounded-full border shadow-sm transition-all ${
            darkMode
              ? "bg-gray-800 border-gray-700 hover:bg-gray-700"
              : "bg-white border-gray-200 hover:shadow-md"
          }`}
        >
          <Home className="w-4 h-4 text-blue-600" />
          <Link
            to="/"
            className="font-medium hover:text-blue-600 transition-colors"
          >
            Home
          </Link>
        </motion.div>

        {/* Connectors */}
        <div
          className={`mx-auto w-px h-8 ${
            darkMode ? "bg-gray-700" : "bg-gray-300"
          }`}
        ></div>

        {/* Main Section */}
        <div className="flex flex-wrap justify-center gap-5">
          {mainPages.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className={`flex flex-col items-center gap-2`}
            >
              <div
                className={`w-px h-3 ${
                  darkMode ? "bg-gray-700" : "bg-gray-300"
                }`}
              ></div>
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border shadow-sm text-sm transition-all ${
                  darkMode
                    ? "bg-gray-800 border-gray-700 hover:bg-gray-700"
                    : "bg-white border-gray-200 hover:border-blue-200 hover:shadow-md"
                }`}
              >
                <p.icon
                  className={`w-4 h-4 ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                />
                <Link
                  to={p.path}
                  className={`font-medium ${
                    darkMode
                      ? "text-gray-200 hover:text-blue-400"
                      : "text-gray-800 hover:text-blue-600"
                  } transition-colors`}
                >
                  {p.title}
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Connector to Legal */}
        <div
          className={`mx-auto w-px h-8 mt-6 ${
            darkMode ? "bg-gray-700" : "bg-gray-300"
          }`}
        ></div>

        {/* Legal Section */}
        <div className="flex justify-center flex-wrap gap-3 mt-2">
          {legalPages.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm transition-all ${
                darkMode
                  ? "bg-gray-800 border-gray-700 hover:bg-gray-700"
                  : "bg-amber-50 border-amber-200 hover:bg-amber-100"
              }`}
            >
              <p.icon
                className={`w-4 h-4 ${
                  darkMode ? "text-amber-400" : "text-amber-600"
                }`}
              />
              <Link
                to={p.path}
                className={`font-medium ${
                  darkMode
                    ? "text-gray-200 hover:text-amber-400"
                    : "text-gray-800 hover:text-amber-700"
                } transition-colors`}
              >
                {p.title}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Raw XML View */}
        <AnimatePresence>
          {showRaw && (
            <motion.pre
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4 }}
              className={`mt-8 text-left text-xs overflow-x-auto rounded-lg border p-4 ${
                darkMode
                  ? "bg-gray-900 border-gray-700 text-green-300"
                  : "bg-gray-50 border-gray-200 text-gray-700"
              }`}
            >
              {xmlData.trim()}
            </motion.pre>
          )}
        </AnimatePresence>

        <p
          className={`mt-10 text-center text-xs ${
            darkMode ? "text-gray-500" : "text-gray-400"
          }`}
        >
          Sitemap auto-generated — updated{" "}
          <span
            className={`font-medium ${
              darkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            October 2025
          </span>
        </p>
      </section>
    </main>
  );
}
