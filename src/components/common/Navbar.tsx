// src/components/common/Navbar.tsx
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
  ChevronRight,
  Star,
  Palette,
  Sparkles,
  Wrench,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { ref, onValue } from "../../config/firebase";
import { database } from "../../config/firebase";
import { SiteSettings } from "../../types";
import TestimonialForm from "../testimonials/TestimonialForm";
import ThemeToggle from "./ThemeToggle";

type NavItem = {
  label: string;
  to?: string;
  icon?: JSX.Element;
};

const Navbar: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showTestimonialForm, setShowTestimonialForm] = useState(false);
  const [settings, setSettings] = useState<SiteSettings[]>([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const { currentUser, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Scroll handler for floating navbar
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const settingsRef = ref(database, "siteSettings");
    const unsub = onValue(settingsRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setSettings(
          Object.keys(data).map((key) => ({ id: key, ...data[key] }))
        );
      }
    });
    return () => unsub();
  }, []);

  const getSetting = (key: string) =>
    settings.find((s) => s.key === key)?.value || "";
  const storeName = getSetting("store_name") || "Decor Drapes";

  const displayName =
    currentUser?.displayName || currentUser?.email?.split?.("@")?.[0] || "User";
  const userEmail = currentUser?.email || "";

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      setSidebarOpen(false);
      setProfileMenuOpen(false);
      navigate("/");
    }
  };

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      // Profile menu
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
    if (currentUser?.role === "production") return "Production Panel";
    if (currentUser?.role === "admin") return "Admin Panel";
    if (currentUser?.role === "employee") return "Dashboard";
    return "";
  };

  const shouldShowDashboard = () => {
    return (
      currentUser &&
      (currentUser.role === "admin" ||
        currentUser.role === "employee" ||
        currentUser.role === "production")
    );
  };

  const handleDashboardClick = () => {
    const dashboardPath = getDashboardPath();
    if (dashboardPath.startsWith("http")) {
      window.open(dashboardPath, "_blank");
    } else {
      navigate(dashboardPath);
    }
    setProfileMenuOpen(false);
  };

  const handleProfileMenuNavigation = (path: string) => {
    setProfileMenuOpen(false);
    navigate(path);
  };

  // Clean minimal navigation links - no mega menus
  const navLinks: NavItem[] = [
    {
      label: "Home",
      to: "/",
      icon: <Home size={14} />,
    },
    {
      label: "Features",
      to: "/features",
      icon: <Palette size={14} />,
    },
    {
      label: "Our Work",
      to: "/our-work",
      icon: <Star size={14} />,
    },
    {
      label: "About",
      to: "/about",
      icon: <Info size={14} />,
    },
    {
      label: "Contact",
      to: "/contact",
      icon: <Phone size={14} />,
    },
  ];

  // Quick action links for features (used in mobile sidebar only)
  const quickFeatureLinks = [
    {
      label: "Browse Catalogue",
      to: "/catalogue",
      icon: <Sparkles size={12} />,
    },
    {
      label: "Our Services",
      to: "/services",
      icon: <Wrench size={12} />,
    },
  ];

  return (
    <>
      <nav
        className={`bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 shadow-sm font-sans transition-all duration-300 ${
          isScrolled
            ? "fixed top-0 left-0 right-0 z-40 shadow-lg bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm"
            : "relative"
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Left Section - Logo & Navigation */}
            <div className="flex items-center space-x-8">
              {/* Logo */}
              <Link
                to="/"
                className="flex items-center space-x-2 flex-shrink-0 group"
              >
                <img
                  src="https://res.cloudinary.com/dmiwq3l2s/image/upload/v1764768203/vfw82jmca7zl5p86czhy.png"
                  alt={`${storeName} Logo`}
                  className="w-8 h-8 sm:w-9 sm:h-9 object-contain transition-transform duration-300"
                />
                <div>
                  {/* Desktop: Single line, stylish */}
                  <span className="hidden sm:block font-semibold text-xl text-neutral-800 dark:text-white">
                    {storeName}
                  </span>
                  
                  {/* Mobile: Two lines */}
                  <div className="sm:hidden text-neutral-900 dark:text-white leading-tight">
                    <span className="font-bold text-2xl text-uppercase">
                      {storeName.split(" ")[0]}
                    </span>
                    <span className="block text-xs font-normal text-gray-500 dark:text-gray-400 -mt-1">
                      {storeName.split(" ").slice(1).join(" ")}
                    </span>
                  </div>
                </div>
              </Link>

              {/* Desktop Navigation Links - Simple and Clean */}
              <div className="hidden lg:flex items-center space-x-1">
                {navLinks.map((item) => (
                  <Link
                    key={item.label}
                    to={item.to || "#"}
                    className={`flex items-center space-x-1.5 px-3 py-2 text-sm font-medium transition-all duration-200 rounded-full ${
                      location.pathname === item.to
                        ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                        : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-white"
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Right Section - User Menu, Theme, Auth */}
            <div className="flex items-center space-x-3">
              {/* Theme Toggle - Desktop */}
              <div className="hidden lg:block">
                <ThemeToggle />
              </div>

              {/* User Menu / Auth Buttons */}
              {authLoading ? (
                <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-700 rounded-full animate-pulse" />
              ) : currentUser ? (
                <div className="relative">
                  <button
                    ref={profileButtonRef}
                    onClick={() => setProfileMenuOpen((o) => !o)}
                    className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all duration-200 border border-transparent hover:border-neutral-200 dark:hover:border-neutral-600"
                  >
                    {currentUser.profileImage ? (
                      <img
                        src={currentUser.profileImage}
                        alt="Avatar"
                        className="w-8 h-8 rounded-full object-cover border border-neutral-300 dark:border-neutral-600"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-700 flex items-center justify-center border border-neutral-300 dark:border-neutral-600">
                        <UserIcon
                          size={16}
                          className="text-neutral-600 dark:text-neutral-400"
                        />
                      </div>
                    )}
                  </button>

                  {/* Profile Card */}
                  {profileMenuOpen && (
                    <div
                      ref={profileMenuRef}
                      className="absolute right-0 mt-2 w-64 bg-white dark:bg-neutral-800 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-700 z-50 animate-fadeIn overflow-hidden"
                    >
                      {/* Profile Header */}
                      <div className="bg-neutral-50 dark:bg-neutral-900/50 p-4 border-b border-neutral-200 dark:border-neutral-700">
                        <div className="space-y-1">
                          <h3 className="font-bold text-neutral-900 dark:text-white text-sm">
                            {displayName}
                          </h3>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400 truncate">
                            {userEmail}
                          </p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-500 capitalize font-medium">
                            {currentUser.role || "Member"} Account
                          </p>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        <button
                          onClick={() =>
                            handleProfileMenuNavigation("/profile")
                          }
                          className="flex items-center space-x-3 w-full px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors duration-200 font-medium border-b border-neutral-100 dark:border-neutral-700"
                        >
                          <UserIcon size={14} className="text-neutral-500" />
                          <span>My Profile</span>
                        </button>

                        {shouldShowDashboard() && (
                          <button
                            onClick={handleDashboardClick}
                            className="flex items-center space-x-3 w-full px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors duration-200 font-medium border-b border-neutral-100 dark:border-neutral-700"
                          >
                            <Users size={14} className="text-neutral-500" />
                            <span>{getDashboardLabel()}</span>
                          </button>
                        )}

                        <button
                          onClick={handleLogout}
                          className="flex items-center space-x-3 w-full px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors duration-200 font-medium"
                        >
                          <LogOut size={14} />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 
             hover:text-neutral-900 dark:hover:text-white transition-colors duration-200 
             rounded-full hidden sm:inline-block"
                  >
                    Sign In
                  </Link>

                  <Link
                    to="/login"
                    className="px-5 py-2 text-sm font-medium 
             text-white dark:text-neutral-900 
             bg-neutral-800 dark:bg-neutral-200 
             hover:bg-neutral-900 dark:hover:bg-white 
             rounded-full shadow-md hover:shadow-lg 
             transition-all duration-200"
                  >
                    Get Started
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-200"
              >
                <AlignRight
                  size={18}
                  className="text-neutral-600 dark:text-neutral-400"
                />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Add spacing when navbar becomes fixed */}
      {isScrolled && <div className="h-16" />}

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-neutral-950/30 dark:bg-neutral-900/50 transition-all duration-200 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />

          {/* Sidebar */}
          <div
            className="
  fixed right-0 top-0 h-full w-64
  bg-white dark:bg-neutral-950
  shadow-xl
  border-l border-neutral-200 dark:border-neutral-700
  transform transition-transform duration-200 ease-out
  animate-slideInRight
  font-sans
"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
                <Link
                  to="/"
                  className="flex items-center space-x-2"
                  onClick={() => setSidebarOpen(false)}
                >
                  <img
                    src="https://res.cloudinary.com/dmiwq3l2s/image/upload/v1764768203/vfw82jmca7zl5p86czhy.png"
                    alt="Logo"
                    className="w-8 h-8"
                  />
                  <div className="font-bold text-neutral-900 dark:text-white text-sm">
                    {storeName}
                  </div>
                </Link>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors duration-200"
                >
                  <X
                    size={18}
                    className="text-neutral-600 dark:text-neutral-400"
                  />
                </button>
              </div>

              {/* User Info */}
              <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
                {!authLoading && currentUser ? (
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-neutral-900 dark:text-white">
                      {displayName}
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      {userEmail}
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 capitalize font-medium">
                      {currentUser.role || "Member"} Account
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-sm font-bold text-neutral-900 dark:text-white">
                      Welcome!
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
                      Sign in to your account
                    </div>
                    <Link
                      to="/login"
                      onClick={() => setSidebarOpen(false)}
                      className="inline-block px-4 py-2 text-xs font-semibold text-white bg-neutral-800 hover:bg-neutral-900 rounded-lg transition-colors duration-200 shadow-sm"
                    >
                      Sign In
                    </Link>
                  </div>
                )}
              </div>

              {/* Navigation Links */}
              <div className="flex-1 overflow-y-auto py-4">
                <div className="space-y-1 px-3">
                  {navLinks.map((item) => (
                    <Link
                      key={item.label}
                      to={item.to || "#"}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center space-x-3 px-3 py-3 text-sm transition-colors duration-200 font-medium rounded-lg ${
                        location.pathname === item.to
                          ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                          : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  ))}

                  {/* Quick Feature Links - Simple and clean */}
                  <div className="pt-4 mt-4 border-t border-neutral-200 dark:border-neutral-700">
                    <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider px-3 mb-2">
                      Quick Access
                    </div>
                    {quickFeatureLinks.map((item) => (
                      <Link
                        key={item.label}
                        to={item.to || "#"}
                        onClick={() => setSidebarOpen(false)}
                        className="flex items-center space-x-3 px-3 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors duration-200"
                      >
                        {item.icon}
                        <span>{item.label}</span>
                        <ChevronRight size={12} className="ml-auto" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer Links */}
              <div className="p-4 border-t border-neutral-200 dark:border-neutral-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-700 dark:text-neutral-300 font-medium">
                    Theme
                  </span>
                  <ThemeToggle />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <Link
                    to="/privacy"
                    onClick={() => setSidebarOpen(false)}
                    className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors duration-200 font-medium"
                  >
                    Privacy Policy
                  </Link>
                  <button
                    onClick={() => {
                      setSidebarOpen(false);
                      setShowTestimonialForm(true);
                    }}
                    className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors duration-200 font-medium"
                  >
                    Rate Us
                  </button>
                </div>

                {!authLoading && currentUser && shouldShowDashboard() && (
                  <button
                    onClick={handleDashboardClick}
                    className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors duration-200 font-medium"
                  >
                    <Users size={12} />
                    <span>{getDashboardLabel()}</span>
                  </button>
                )}

                {!authLoading && currentUser && (
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors duration-200 font-medium"
                  >
                    <LogOut size={12} />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
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
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slideInRight {
          animation: slideInRight 0.2s ease-out forwards;
        }

        .animate-fadeIn {
          animation: fadeIn 0.15s ease-out forwards;
        }
      `}</style>
    </>
  );
};

export default Navbar;
