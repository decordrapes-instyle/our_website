// src/components/Navbar.tsx
import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  AlignRight,
  X,
  User as UserIcon,
  LogOut,
  Users,
  Info,
  Home,
  Phone,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { ref, onValue } from "firebase/database";
import { database } from "../../config/firebase";
import { SiteSettings } from "../../types";
import TestimonialForm from "../testimonials/TestimonialForm";

type NavItem = {
  label: string;
  to?: string;
  icon?: JSX.Element;
};

const Navbar: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showTestimonialForm, setShowTestimonialForm] = useState(false);
  const [settings, setSettings] = useState<SiteSettings[]>([]);
  const { currentUser, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const settingsRef = ref(database, "siteSettings");
    const unsub = onValue(settingsRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setSettings(Object.keys(data).map((key) => ({ id: key, ...data[key] })));
      }
    });
    return () => unsub();
  }, []);

  const getSetting = (key: string) =>
    settings.find((s) => s.key === key)?.value || "";
  const storeName = getSetting("store_name") || "Decor Drapes";

  // Extract first name only
  const displayName =
    currentUser?.displayName ||
    currentUser?.email?.split?.("@")?.[0] ||
    "User";
  const firstName = displayName.split(' ')[0]; // Extract first name only

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      setSidebarOpen(false);
      setProfileMenuOpen(false);
      navigate("/");
    }
  };

  const navLinks: NavItem[] = [
    { label: "Home", to: "/", icon: <Home size={16} /> },
    { label: "Catalogue", to: "/catalogue", icon: <Users size={16} /> },
    { label: "About Us", to: "/about", icon: <Info size={16} /> },
    { label: "Contact Us", to: "/contact", icon: <Phone size={16} /> },
  ];

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (
        profileMenuOpen &&
        profileMenuRef.current &&
        profileButtonRef.current &&
        !profileMenuRef.current.contains(e.target as Node) &&
        !profileButtonRef.current.contains(e.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [profileMenuOpen]);

  // Fixed role checking functions
  const getDashboardPath = () => {
  if (currentUser?.role === "production") {
    return "https://admin.decordrapesinstyle.com";
  }
  if (currentUser?.role === "admin" || currentUser?.role === "employee") {
    return "https://admin.decordrapesinstyle.com";
  }
  return "/";
};


  const getDashboardLabel = () => {
    if (currentUser?.role === "production") return "Production";
    if (currentUser?.role === "admin") return "Admin Panel";
    if (currentUser?.role === "employee") return "Dashboard";
    return "";
  };

  const shouldShowDashboard = () => {
    return currentUser &&
           (currentUser.role === "admin" ||
            currentUser.role === "employee" ||
            currentUser.role === "production");
  };

  // Handle navigation for profile menu items
  const handleProfileMenuNavigation = (path: string) => {
    setProfileMenuOpen(false);
    navigate(path);
  };

  return (
    <>
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1 transition-transform hover:scale-102">
            <img
              src="https://res.cloudinary.com/ds6um53cx/image/upload/v1756727077/a0jd950p5c8m7wgdylyq.webp"
              alt="Logo"
              className="w-full h-10 object-cover rounded-lg"
            />
            <span className="font-semibold text-gray-800 text-lg">Drapes</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map(({ label, to }) => (
              <Link
                key={label}
                to={to || "/"}
                className={`relative text-sm font-medium px-3 py-2 rounded-md transition-all duration-200 ${
                  location.pathname === to
                    ? "text-blue-600 bg-blue-50 font-semibold"
                    : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                }`}
              >
                {label}
                {location.pathname === to && (
                  <span className="absolute inset-x-1 -bottom-2 h-0.5 bg-blue-600 rounded-full transition-all duration-300"></span>
                )}
              </Link>
            ))}

            {/* Profile / Login */}
            {authLoading ? (
              <div className="w-16 h-8 bg-gray-200 rounded-md animate-pulse" />
            ) : currentUser ? (
              <div className="relative">
                <button
                  ref={profileButtonRef}
                  onClick={() => setProfileMenuOpen((o) => !o)}
                  className="flex items-center gap-1 focus:outline-none transition-all duration-200"
                >
                  {currentUser.profileImage ? (
                    <img
                      src={currentUser.profileImage}
                      alt="Avatar"
                      className="w-9 h-9 rounded-full object-cover border-2 border-gray-200 transition-all duration-300 hover:border-blue-500"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200 transition-all duration-300 hover:border-blue-500">
                      <UserIcon size={18} />
                    </div>
                  )}
                  <span className="text-sm text-gray-700">{firstName}</span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${profileMenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {profileMenuOpen && (
                  <div
                    ref={profileMenuRef}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 animate-fadeIn"
                  >
                    <button
                      onClick={() => handleProfileMenuNavigation("/profile")}
                      className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                    >
                      <UserIcon size={16} /> My Profile
                    </button>
                    {shouldShowDashboard() && (
                      <button
                        onClick={() => handleProfileMenuNavigation(getDashboardPath())}
                        className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                      >
                        <Users size={16} /> {getDashboardLabel()}
                      </button>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
                    >
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 border border-gray-200 rounded-md text-sm hover:bg-gray-50 transition-all duration-200 hover:border-gray-300"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile */}
          <div className="flex items-center gap-2 md:hidden">
            {authLoading ? (
              <div className="w-16 h-8 bg-gray-200 rounded-md animate-pulse" />
            ) : currentUser ? (
              <div className="relative">
                <button
                  ref={profileButtonRef}
                  onClick={() => setProfileMenuOpen((o) => !o)}
                  className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-md text-sm hover:bg-gray-50 transition-all duration-200"
                >
                  {currentUser.profileImage ? (
                    <img
                      src={currentUser.profileImage}
                      alt="Avatar"
                      className="w-7 h-7 rounded-full object-cover border border-gray-200"
                    />
                  ) : (
                    <UserIcon size={16} className="text-gray-700" />
                  )}
                  <span className="text-gray-700 text-sm truncate max-w-[80px]">
                    {firstName}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${profileMenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Floating User Menu */}
                {profileMenuOpen && (
                  <div
                    ref={profileMenuRef}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-50 animate-fadeIn"
                  >
                    <button
                      onClick={() => handleProfileMenuNavigation("/profile")}
                      className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                    >
                      <UserIcon size={16} /> My Profile
                    </button>
                    {shouldShowDashboard() && (
                      <button
                        onClick={() => handleProfileMenuNavigation(getDashboardPath())}
                        className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                      >
                        <Users size={16} /> {getDashboardLabel()}
                      </button>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                    >
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="px-3 py-1.5 border border-gray-200 rounded-md text-sm hover:bg-gray-50 transition-all duration-200"
              >
                Login
              </Link>
            )}
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors duration-200"
            >
              <AlignRight size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="flex-1 bg-black bg-opacity-30 backdrop-blur-sm animate-fadeIn"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="w-72 bg-white h-full shadow-xl p-5 flex flex-col justify-between animate-slideInRight">
            <div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
                <Link
                  to="/"
                  className="flex items-center gap-3"
                  onClick={() => setSidebarOpen(false)}
                >
                  <img
                    src="https://res.cloudinary.com/ds6um53cx/image/upload/v1756727077/a0jd950p5c8m7wgdylyq.webp"
                    alt="Logo"
                    className="w-10 h-10 object-cover rounded-lg"
                  />
                  <div>
                    <div className="font-semibold text-sm">{storeName}</div>
                    <div className="text-xs text-gray-500">Menu</div>
                  </div>
                </Link>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-md transition-colors duration-200"
                >
                  <X size={22} />
                </button>
              </div>

              {/* User Info */}
              <div className="mb-6 border-b border-gray-100 pb-4">
                {!authLoading && currentUser ? (
                  <div className="flex items-center gap-3">
                    {currentUser.profileImage ? (
                      <img
                        src={currentUser.profileImage}
                        alt="Avatar"
                        className="w-12 h-12 rounded-full object-cover border-2 border-blue-100"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center border-2 border-blue-100">
                        <UserIcon size={18} />
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-sm">{firstName}</div>
                      <div className="text-xs text-gray-500 capitalize">
                        {currentUser.role || "Member"}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-sm font-medium text-gray-800">
                      Welcome
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                      Sign in to access your account
                    </div>
                    <Link
                      to="/login"
                      onClick={() => setSidebarOpen(false)}
                      className="inline-block px-4 py-2 border border-gray-200 rounded-md text-sm hover:bg-gray-50 transition-all duration-200"
                    >
                      Login
                    </Link>
                  </div>
                )}
              </div>

              {/* Menu Links */}
              <div className="flex flex-col gap-1">
                {navLinks.map(({ label, to, icon }, idx) => (
                  <Link
                    key={idx}
                    to={to || "/"}
                    onClick={() => setSidebarOpen(false)}
                    className={`py-3 px-3 rounded-lg flex items-center gap-3 transition-all duration-200 ${
                      location.pathname === to
                        ? "bg-blue-50 text-blue-600 font-medium"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    {icon && <span className="text-gray-500">{icon}</span>}
                    <span>{label}</span>
                  </Link>
                ))}
              </div>

              {/* Footer links */}
              <div className="text-xs text-gray-500 mt-6 mb-4">
                <Link
                  to="/privacy-policy"
                  onClick={() => setSidebarOpen(false)}
                  className="block mb-2 hover:text-blue-600 transition-colors duration-200"
                >
                  Privacy Policy
                </Link>
                <button
                  onClick={() => {
                    setSidebarOpen(false);
                    setShowTestimonialForm(true);
                  }}
                  className="block hover:text-blue-600 transition-colors duration-200 text-left w-full"
                >
                  Rate Us
                </button>
              </div>
            </div>

            {/* Bottom Links */}
            <div className="border-t border-gray-100 pt-4 flex flex-col gap-1">
              {!authLoading && currentUser ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setSidebarOpen(false)}
                    className="py-2.5 px-3 rounded-lg hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-600 transition-colors duration-200"
                  >
                    <UserIcon size={16} />
                    My Profile
                  </Link>
                  {shouldShowDashboard() && (
                    <Link
                      to={getDashboardPath()}
                      onClick={() => setSidebarOpen(false)}
                      className="py-2.5 px-3 rounded-lg hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-600 transition-colors duration-200"
                    >
                      <Users size={16} />
                      {getDashboardLabel()}
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="text-red-600 py-2.5 px-3 rounded-lg hover:bg-red-50 text-left flex items-center gap-3 text-sm transition-colors duration-200"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </>
              ) : (
                <span className="text-gray-500 text-sm">Not signed in</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Testimonial Modal */}
      <TestimonialForm
        isOpen={showTestimonialForm}
        onClose={() => setShowTestimonialForm(false)}
      />

      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-slideInRight {
          animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `}</style>
    </>
  );
};

export default Navbar;
