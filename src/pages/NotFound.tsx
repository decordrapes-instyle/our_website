import { Link } from "react-router-dom";

const links = [
  { name: "Home", to: "/" },
  { name: "Catalogue", to: "/catalogue" },
  { name: "About", to: "/about" },
  { name: "Contact", to: "/contact" },
];

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-12 text-center">
      
      {/* Funny SVG */}
      <div className="mb-8 max-w-lg">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 400 300"
          className="w-full h-auto"
        >
          <rect x="50" y="50" width="300" height="200" rx="12" fill="#e2e8f0" />
          <rect x="50" y="50" width="300" height="40" rx="12" fill="#94a3b8" />
          <circle cx="70" cy="70" r="6" fill="#ef4444" />
          <circle cx="90" cy="70" r="6" fill="#facc15" />
          <circle cx="110" cy="70" r="6" fill="#22c55e" />
          <text x="200" y="180" textAnchor="middle" fontSize="20" fill="#64748b" fontWeight="bold">
            PAGE NOT FOUND
          </text>
          <text x="200" y="210" textAnchor="middle" fontSize="14" fill="#94a3b8">
            (it went on vacation)
          </text>
          <path d="M150 140 q50 -40 100 0" stroke="#3b82f6" strokeWidth="3" fill="none" />
        </svg>
      </div>

      {/* Funny Message */}
      <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
        Well... This is awkward
      </h1>
      <p className="text-gray-500 max-w-md mb-10">
        The page packed its bags and left. While we try to find it,  
        maybe you can head somewhere more familiar.
      </p>

      {/* Navigation Pills */}
      <div className="flex flex-wrap justify-center gap-3">
        {links.map(({ name, to }) => (
          <Link
            key={to}
            to={to}
            className="px-5 py-2 rounded-full border border-gray-300 bg-gray-100 hover:bg-blue-500 hover:text-white font-medium shadow-sm transition-all duration-300"
          >
            {name}
          </Link>
        ))}
      </div>
    </div>
  );
}
