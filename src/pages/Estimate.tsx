import { useState, useEffect } from "react";
import {
  FileText,
  Download,
  Layout,
  Calculator,
  Printer,
  Clock,
} from "lucide-react";

const quotaionImageUrl =
  "https://res.cloudinary.com/ds6um53cx/image/upload/v1767439623/aduvouzvmvmex5rof5ej.jpg";
export default function Estimate() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Badges data for infinite animation
  const badges = [
    "Professional Design",
    "Instant Download",
    "24/7 Access",
    "Real-time Updates",
    "Secure Storage",
    "Multi-currency",
    "A4 Standard",
    "PDF Format",
    "Mobile Friendly",
    "Tax Included",
    "Digital Signature",
    "Auto Calculations",
  ];
  const features = [
    { label: "Professional PDF", icon: FileText, color: "blue" },
    { label: "A4 Standard", icon: Layout, color: "purple" },
    { label: "Instant Download", icon: Download, color: "green" },
    { label: "Auto Calculations", icon: Calculator, color: "orange" },
    { label: "Print Ready", icon: Printer, color: "pink" },
    { label: "24/7 Access", icon: Clock, color: "teal" },
  ];

  const duplicatedFeatures = [...features, ...features];

  // Duplicate badges for seamless loop
  const duplicatedBadges = [...badges, ...badges];

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 dark:from-blue-900/10 dark:via-transparent dark:to-purple-900/10" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 text-center">
          {/* Badge Animation */}
          <div className="mb-8 overflow-hidden">
            <div className="relative flex overflow-hidden">
              <div className="flex animate-marquee whitespace-nowrap py-3">
                {duplicatedBadges.map((badge, index) => (
                  <span
                    key={index}
                    className="mx-3 inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-neutral-800 dark:to-neutral-800 text-neutral-800 dark:text-neutral-200 text-sm font-medium border border-blue-200 dark:border-neutral-700 shadow-sm"
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Main Hero Content */}
          <div
            className={`transition-all duration-1000 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-neutral-900 dark:text-white mb-6">
              Professional
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Quotation Preview
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto mb-10 leading-relaxed">
              Preview your quotations exactly as they’ll appear in PDF clean,
              professional, and easy to read. Our system automatically creates
              beautiful, A4-standard quotations in seconds.
            </p>

            {/* Features Animation */}
            {/* Features Animation */}
            <div className="mb-8 overflow-hidden">
              <div className="relative flex overflow-hidden">
                <div className="flex animate-marquee-reverse whitespace-nowrap py-3">
                  {duplicatedFeatures.map(
                    ({ label, icon: Icon, color }, index) => (
                      <span
                        key={index}
                        className={`
            mx-3 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
            border shadow-sm
            bg-${color}-100 text-${color}-800 border-${color}-200
            dark:bg-neutral-800 dark:text-${color}-400 dark:border-neutral-700
          `}
                      >
                        <Icon size={16} />
                        {label}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Top Image Section */}
      <div
        id="preview"
        className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800">
          {/* PDF Header Bar */}
          <div className="bg-neutral-50 dark:bg-neutral-900 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <span className="dark:text-white text-sm font-medium">
                your_quotation.pdf • 100%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-neutral-400 text-sm">Preview</span>
            </div>
          </div>

          {/* Clipped PDF Preview */}
          <div className="relative overflow-hidden">
            {/* Gradient Overlay for Clipping Effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white dark:to-neutral-950 z-10 pointer-events-none" />

            {/* Your Image */}
            <div className="relative">
              <img
                src={quotaionImageUrl}
                alt="Quotation PDF Preview"
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* How to Read Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-4 py-2 rounded-full mb-4">
            <span className="text-sm font-medium">
              Understanding Your Quotation
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-4">
            How to Read Our Quotations
          </h2>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto">
            Our quotations are designed for clarity and ease of understanding
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Section 1 */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 shadow-lg border border-neutral-200 dark:border-neutral-800 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <span className="text-white font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 dark:text-white">
                Header & Contact Info
              </h3>
            </div>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              Clear display of company details, quotation number, and dates for
              easy reference.
            </p>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-neutral-800 dark:to-neutral-800 rounded-lg p-4 border border-blue-200 dark:border-neutral-700">
              <div className="text-sm text-blue-600 dark:text-blue-400 mb-2">
                Section Preview:
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">
                    Company:
                  </span>
                  <span className="text-neutral-900 dark:text-white font-medium">
                    YourCompany LLC
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">
                    Date:
                  </span>
                  <span className="text-neutral-900 dark:text-white font-medium">
                    Nov 15, 2023
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">
                    Status:
                  </span>
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    Pending
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 shadow-lg border border-neutral-200 dark:border-neutral-800 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                <span className="text-white font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 dark:text-white">
                Clear Item Breakdown
              </h3>
            </div>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              Each service listed separately with descriptions and pricing for
              complete transparency.
            </p>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-neutral-800 dark:to-neutral-800 rounded-lg p-4 border border-green-200 dark:border-neutral-700">
              <div className="text-sm text-green-600 dark:text-green-400 mb-2">
                Section Preview:
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-900 dark:text-white">
                    Website Design
                  </span>
                  <span className="text-neutral-600 dark:text-neutral-400">
                    1 × $2,500
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-900 dark:text-white">
                    SEO Optimization
                  </span>
                  <span className="text-neutral-600 dark:text-neutral-400">
                    1 × $800
                  </span>
                </div>
                <div className="border-t border-neutral-200 dark:border-neutral-700 pt-3">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-neutral-900 dark:text-white">
                      Subtotal
                    </span>
                    <span className="text-neutral-900 dark:text-white">
                      $3,300
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3 */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 shadow-lg border border-neutral-200 dark:border-neutral-800 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 dark:text-white">
                Simple Totals Calculation
              </h3>
            </div>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              Automatic calculations with clear breakdown of subtotal, taxes,
              and final amount.
            </p>
            <div className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-neutral-800 dark:to-neutral-800 rounded-lg p-4 border border-purple-200 dark:border-neutral-700">
              <div className="text-sm text-purple-600 dark:text-purple-400 mb-2">
                Section Preview:
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">
                    Subtotal
                  </span>
                  <span className="text-neutral-900 dark:text-white">
                    $4,300.00
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">
                    Tax (10%)
                  </span>
                  <span className="text-neutral-900 dark:text-white">
                    $430.00
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t border-neutral-200 dark:border-neutral-700 text-lg font-bold">
                  <span className="text-neutral-900 dark:text-white">
                    Total
                  </span>
                  <span className="text-purple-600 dark:text-purple-400">
                    $4,730.00
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4 */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 shadow-lg border border-neutral-200 dark:border-neutral-800 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <span className="text-white font-bold">4</span>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 dark:text-white">
                Professional Formatting
              </h3>
            </div>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              Clean A4 layout with proper spacing, readable fonts, and
              professional styling.
            </p>
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-neutral-800 dark:to-neutral-800 rounded-lg p-4 border border-orange-200 dark:border-neutral-700">
              <div className="text-sm text-orange-600 dark:text-orange-400 mb-2">
                Section Preview:
              </div>
              <div className="flex flex-col items-center">
                <div className="w-24 h-32 border-2 border-neutral-300 dark:border-neutral-600 rounded bg-gradient-to-b from-white to-neutral-100 dark:from-neutral-800 dark:to-neutral-900 mb-3"></div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  A4 Standard • 210 × 297mm
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dimension Guide */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-r from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800 rounded-2xl p-8 shadow-xl border border-neutral-200 dark:border-neutral-800">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-3">
              Perfect A4 Dimensions
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              Optimized for both digital viewing and professional printing
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="relative">
              <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-lg border border-neutral-300 dark:border-neutral-700">
                <div className="aspect-[1/1.414] max-w-md mx-auto relative">
                  {/* A4 Paper Outline */}
                  <div className="absolute inset-0 border-2 border-neutral-400 dark:border-neutral-500 rounded-lg"></div>

                  {/* Content Areas */}
                  <div className="absolute inset-2 p-4">
                    {/* Header Area */}
                    <div className="h-1/6 border-b border-neutral-300 dark:border-neutral-600 mb-4 pb-2">
                      <div className="h-4 bg-blue-200 dark:bg-blue-900/50 rounded mb-2"></div>
                      <div className="h-3 bg-blue-100 dark:bg-blue-900/30 rounded w-2/3"></div>
                    </div>

                    {/* Content Area */}
                    <div className="h-3/6 border-b border-neutral-300 dark:border-neutral-600 mb-4 pb-2">
                      <div className="space-y-2">
                        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
                        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-5/6"></div>
                        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-4/6"></div>
                      </div>
                    </div>

                    {/* Footer Area */}
                    <div className="h-1/6">
                      <div className="h-4 bg-green-200 dark:bg-green-900/50 rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-green-100 dark:bg-green-900/30 rounded w-1/3"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">
                    Standard A4 Format
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    Our quotations use the international A4 standard (210 ×
                    297mm), perfect for:
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
                    <div className="text-blue-600 dark:text-blue-400 font-medium mb-2">
                      Digital Viewing
                    </div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400">
                      Perfect aspect ratio for screens and PDF viewers
                    </div>
                  </div>

                  <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
                    <div className="text-green-600 dark:text-green-400 font-medium mb-2">
                      Professional Printing
                    </div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400">
                      Standard size fits all printers worldwide
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
                  <div className="text-sm text-neutral-600 dark:text-neutral-400">
                    <div className="font-medium text-neutral-900 dark:text-white mb-2">
                      Optimal Readability:
                    </div>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Clear 12pt font size</li>
                      <li>Ample margins for notes</li>
                      <li>Proper line spacing</li>
                      <li>High contrast text</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-10 text-center shadow-2xl relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                backgroundSize: "30px",
              }}
            ></div>
          </div>

          <div className="relative z-10 text-center px-4 sm:px-0">
  <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
    Ready to Access Your Quotations?
  </h2>

  <p className="text-blue-100 text-base sm:text-lg mb-6 max-w-md mx-auto">
    Sign in to view, download, and manage all your professional quotations in one place.
  </p>

  {/* Buttons */}
  <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mb-8">
    {/* Regular Sign In */}
    <a
      href="/login"
      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg text-base transition hover:bg-gray-100"
    >
      Sign In
    </a>

    {/* Google Sign In */}
    <a
      href="/login"
      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-800 font-semibold rounded-lg text-base transition hover:bg-gray-100"
    >
      <img
        src="https://res.cloudinary.com/ds6um53cx/image/upload/v1767443974/kfz6yztoc4ovt40qehvj.svg"
        alt="Google Logo"
        className="w-5 h-5"
      />
      Sign in with Google
    </a>
  </div>

  {/* Stats */}
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
    <div className="text-center">
      <div className="text-white font-bold text-xl">24/7</div>
      <div className="text-blue-200 text-sm">Access</div>
    </div>
    <div className="text-center">
      <div className="text-white font-bold text-xl">PDF</div>
      <div className="text-blue-200 text-sm">Download</div>
    </div>
    <div className="text-center">
      <div className="text-white font-bold text-xl">Real-time</div>
      <div className="text-blue-200 text-sm">Updates</div>
    </div>
    <div className="text-center">
      <div className="text-white font-bold text-xl">Secure</div>
      <div className="text-blue-200 text-sm">Storage</div>
    </div>
  </div>
</div>

        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-marquee {
          animation: marquee 30s linear infinite;
        }

        .animate-marquee:hover {
          animation-play-state: paused;
        }

        /* Responsive clipping */
        @media (max-width: 640px) {
          .clip-mask {
            max-height: 300px;
            mask-image: linear-gradient(to bottom, black 70%, transparent 100%);
            -webkit-mask-image: linear-gradient(to bottom, black 70%, transparent 100%);
          }
        }
        
        @media (min-width: 641px) and (max-width: 768px) {
          .clip-mask {
            max-height: 400px;
            mask-image: linear-gradient(to bottom, black 80%, transparent 100%);
            -webkit-mask-image: linear-gradient(to bottom, black 80%, transparent 100%);
          }
        }
        
        @media (min-width: 769px) {
          .clip-mask {
            max-height: 500px;
            mask-image: linear-gradient(to bottom, black 85%, transparent 100%);
            -webkit-mask-image: linear-gradient(to bottom, black 85%, transparent 100%);
          }
        }
      `}</style>
    </div>
  );
}
