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
  ChevronDown,
  ChevronRight,
  Star,
  Palette,
  Sparkles,
  Scissors,
  Ruler,
  Wrench,
  MessageCircle,
  Shield,
  Zap,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { ref, onValue } from "firebase/database";
import { database } from "../../config/firebase";
import { SiteSettings } from "../../types";
import TestimonialForm from "../testimonials/TestimonialForm";
import ThemeToggle from "./ThemeToggle";

type NavItem = {
  label: string;
  to?: string;
  icon?: JSX.Element;
  children?: NavItem[];
};

const Navbar: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showTestimonialForm, setShowTestimonialForm] = useState(false);
  const [mobileFeaturesOpen, setMobileFeaturesOpen] = useState(false);
  const [settings, setSettings] = useState<SiteSettings[]>([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const { currentUser, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Scroll handler for floating navbar
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const displayName =
    currentUser?.displayName ||
    currentUser?.email?.split?.("@")?.[0] ||
    "User";
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

      // Features dropdown
      if (
        dropdownOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [profileMenuOpen, dropdownOpen]);

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
    return currentUser &&
           (currentUser.role === "admin" ||
            currentUser.role === "employee" ||
            currentUser.role === "production");
  };

  const handleDashboardClick = () => {
    const dashboardPath = getDashboardPath();
    if (dashboardPath.startsWith('http')) {
      window.open(dashboardPath, '_blank');
    } else {
      navigate(dashboardPath);
    }
    setProfileMenuOpen(false);
  };

  const handleProfileMenuNavigation = (path: string) => {
    setProfileMenuOpen(false);
    navigate(path);
  };

  // Features mega menu items with different colors and descriptions
  const featuresItems = [
    {
      label: "Curtains & Drapes",
      to: "/catalogue?category=curtains",
      icon: <Sparkles size={16} />,
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      description: "Elegant window treatments"
    },
    {
      label: "Blinds & Shades",
      to: "/catalogue?category=blinds",
      icon: <Ruler size={16} />,
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      description: "Precision light control"
    },
    {
      label: "Mesh & Screens",
      to: "/catalogue?category=mesh",
      icon: <Shield size={16} />,
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      description: "Privacy & insect protection"
    },
    {
      label: "Upholstery Fabrics",
      to: "/catalogue?category=upholstery",
      icon: <Scissors size={16} />,
      color: "text-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      description: "Premium furniture materials"
    },
    {
      label: "Installation Service",
      to: "/installation",
      icon: <Wrench size={16} />,
      color: "text-red-500",
      bgColor: "bg-red-50 dark:bg-red-900/20",
      description: "Professional fitting"
    },
    {
      label: "Repair & Maintenance",
      to: "/repair",
      icon: <Zap size={16} />,
      color: "text-yellow-500",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
      description: "Fix & restore existing"
    },
    {
      label: "Free Consultation",
      to: "/consultation",
      icon: <MessageCircle size={16} />,
      color: "text-indigo-500",
      bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
      description: "Expert advice & quotes"
    },
    {
      label: "Custom Solutions",
      to: "/catalogue?category=custom",
      icon: <Palette size={16} />,
      color: "text-pink-500",
      bgColor: "bg-pink-50 dark:bg-pink-900/20",
      description: "Tailored to your space"
    },
  ];

  // Clean minimal navigation links
  const navLinks: NavItem[] = [
    {
      label: "Home",
      to: "/",
      icon: <Home size={14} />
    },
    {
      label: "Features",
      icon: <Palette size={14} />,
      children: featuresItems
    },
    {
      label: "Our Work",
      to: "/our-work",
      icon: <Star size={14} />
    },
    {
      label: "About",
      to: "/about",
      icon: <Info size={14} />
    },
    {
      label: "Contact",
      to: "/contact",
      icon: <Phone size={14} />
    },
  ];

  return (
    <>
      <nav className={`bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm font-sans transition-all duration-300 ${
        isScrolled
          ? 'fixed top-0 left-0 right-0 z-40 shadow-lg bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm'
          : 'relative'
      }`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Left Section - Logo & Navigation */}
            <div className="flex items-center space-x-8">
              {/* Logo */}
              <Link
                to="/"
                className="flex items-center space-x-2 flex-shrink-0"
              >
                <img
                  src="https://res.cloudinary.com/dmiwq3l2s/image/upload/v1764652764/rvviqyfeuud02wmq0jcr.png"
                  alt="Decor Drapes Logo"
                  className="w-7 h-7 sm:w-10 sm:h-10 object-cover "
                />
                <span className="font-bold text-lg sm:text-xl text-gray-900 dark:text-white leading-tight">
                  {storeName}
                </span>
              </Link>

              {/* Desktop Navigation Links - Left Aligned */}
              <div className="hidden lg:flex items-center space-x-6">
                {navLinks.map((item) => (
                  <div
                    key={item.label}
                    className="relative"
                    ref={item.children ? dropdownRef : null}
                    onMouseEnter={() => item.children && setDropdownOpen(true)}
                    onMouseLeave={() => item.children && setDropdownOpen(false)}
                  >
                    {item.to ? (
                      <Link
                        to={item.to}
                        className={`flex items-center space-x-1.5 px-2 py-2 text-xs font-medium transition-all duration-200 border-b-2 ${
                          location.pathname === item.to
                            ? "text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400"
                            : "text-gray-700 dark:text-gray-300 border-transparent hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-600 dark:hover:border-blue-400"
                        }`}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </Link>
                    ) : (
                      <div className="relative">
                        <button
                          className={`flex items-center space-x-1.5 px-2 py-2 text-xs font-medium transition-all duration-200 border-b-2 ${
                            dropdownOpen
                              ? "text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400"
                              : "text-gray-700 dark:text-gray-300 border-transparent hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-600 dark:hover:border-blue-400"
                          }`}
                        >
                          {item.icon}
                          <span>{item.label}</span>
                          <ChevronDown
                            size={12}
                            className={`transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                          />
                        </button>

                        {/* Enhanced Features Mega Menu with Colors and Descriptions */}
                        {dropdownOpen && item.children && (
                          <div className="absolute left-0 mt-2 w-[600px] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 z-50 animate-fadeIn">
                            <div className="grid grid-cols-2 gap-4">
                              {featuresItems.map((child, _index) => (
                                <Link
                                  key={child.label}
                                  to={child.to || "#"}
                                  className={`flex items-start space-x-3 p-3 rounded-lg transition-all duration-200 group hover:scale-105 ${child.bgColor}`}
                                  onClick={() => setDropdownOpen(false)}
                                >
                                  <div className={`${child.color} group-hover:scale-110 transition-transform duration-200 flex-shrink-0 mt-0.5`}>
                                    {child.icon}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-gray-900 dark:text-white text-sm group-hover:text-gray-700 dark:group-hover:text-gray-300">
                                      {child.label}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                      {child.description}
                                    </div>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
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
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
              ) : currentUser ? (
                <div className="relative">
                  <button
                    ref={profileButtonRef}
                    onClick={() => setProfileMenuOpen((o) => !o)}
                    className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                  >
                    {currentUser.profileImage ? (
                      <img
                        src={currentUser.profileImage}
                        alt="Avatar"
                        className="w-8 h-8 rounded-full object-cover border border-gray-300 dark:border-gray-600"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center border border-blue-200 dark:border-blue-700">
                        <UserIcon size={16} className="text-blue-600 dark:text-blue-400" />
                      </div>
                    )}
                  </button>

                  {/* Enhanced Profile Card */}
                  {profileMenuOpen && (
                    <div
                      ref={profileMenuRef}
                      className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 animate-fadeIn overflow-hidden"
                    >
                      {/* Profile Header */}
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="space-y-1">
                          <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                            {displayName}
                          </h3>
                          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                            {userEmail}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 capitalize font-medium">
                            {currentUser.role || "Member"} Account
                          </p>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        <button
                          onClick={() => handleProfileMenuNavigation("/profile")}
                          className="flex items-center space-x-3 w-full px-4 py-3 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 font-medium border-b border-gray-100 dark:border-gray-700"
                        >
                          <UserIcon size={14} className="text-gray-500" />
                          <span>My Profile</span>
                        </button>

                        {shouldShowDashboard() && (
                          <button
                            onClick={handleDashboardClick}
                            className="flex items-center space-x-3 w-full px-4 py-3 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 font-medium border-b border-gray-100 dark:border-gray-700"
                          >
                            <Users size={14} className="text-blue-500" />
                            <span>{getDashboardLabel()}</span>
                          </button>
                        )}

                        <button
                          onClick={handleLogout}
                          className="flex items-center space-x-3 w-full px-4 py-3 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 font-medium"
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
                    className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 hidden sm:block"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/login"
                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
                  >
                    Get Started
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
              >
                <AlignRight size={18} className="text-gray-600 dark:text-gray-400" />
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
          <div
            className="fixed inset-0 bg-black bg-opacity-30 transition-all duration-200"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-900 shadow-xl border-l border-gray-200 dark:border-gray-700 transform transition-transform duration-200 ease-out animate-slideInRight font-sans">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <Link
                  to="/"
                  className="flex items-center space-x-2"
                  onClick={() => setSidebarOpen(false)}
                >
                  <img
                    src="https://res.cloudinary.com/ds6um53cx/image/upload/v1756727077/a0jd950p5c8m7wgdylyq.webp"
                    alt="Logo"
                    className="w-8 h-8 object-cover rounded-lg"
                  />
                  <div className="font-bold text-gray-900 dark:text-white text-sm">
                    {storeName}
                  </div>
                </Link>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                >
                  <X size={18} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              {/* User Info */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                {!authLoading && currentUser ? (
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-gray-900 dark:text-white">
                      {displayName}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {userEmail}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 capitalize font-medium">
                      {currentUser.role || "Member"} Account
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-sm font-bold text-gray-900 dark:text-white">Welcome!</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      Sign in to your account
                    </div>
                    <Link
                      to="/login"
                      onClick={() => setSidebarOpen(false)}
                      className="inline-block px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200 shadow-sm"
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
                    <div key={item.label}>
                      {item.to ? (
                        <Link
                          to={item.to}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center space-x-3 px-3 py-2.5 text-xs transition-colors duration-200 font-medium ${
                            location.pathname === item.to
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                          }`}
                        >
                          {item.icon}
                          <span>{item.label}</span>
                        </Link>
                      ) : (
                        <div>
                          <button
                            onClick={() => setMobileFeaturesOpen(!mobileFeaturesOpen)}
                            className="flex items-center justify-between w-full px-3 py-2.5 text-xs text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 font-medium"
                          >
                            <div className="flex items-center space-x-3">
                              {item.icon}
                              <span>{item.label}</span>
                            </div>
                            <ChevronRight
                              size={14}
                              className={`transition-transform duration-200 ${mobileFeaturesOpen ? 'rotate-90' : ''}`}
                            />
                          </button>

                          {/* Enhanced Mobile Features Menu with Colors and Icons */}
                          {mobileFeaturesOpen && item.children && (
                            <div className="ml-4 mt-1 space-y-2 border-l border-gray-200 dark:border-gray-700 pl-3 py-2">
                              {featuresItems.map((child) => (
                                <Link
                                  key={child.label}
                                  to={child.to || "#"}
                                  onClick={() => {
                                    setSidebarOpen(false);
                                    setMobileFeaturesOpen(false);
                                  }}
                                  className="flex items-center space-x-2 py-2 text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 font-medium group"
                                >
                                  <div className={`${child.color} group-hover:scale-110 transition-transform duration-200`}>
                                    {child.icon}
                                  </div>
                                  <div>
                                    <div className="font-medium">{child.label}</div>
                                    <div className="text-gray-400 dark:text-gray-500 text-[10px]">
                                      {child.description}
                                    </div>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Links */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">Theme</span>
                  <ThemeToggle />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <Link
                    to="/privacy-policy"
                    onClick={() => setSidebarOpen(false)}
                    className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 font-medium"
                  >
                    Privacy Policy
                  </Link>
                  <button
                    onClick={() => {
                      setSidebarOpen(false);
                      setShowTestimonialForm(true);
                    }}
                    className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 font-medium"
                  >
                    Rate Us
                  </button>
                </div>

                {!authLoading && currentUser && shouldShowDashboard() && (
                  <button
                    onClick={handleDashboardClick}
                    className="flex items-center space-x-2 w-full px-3 py-2 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors duration-200 font-medium"
                  >
                    <Users size={12} />
                    <span>{getDashboardLabel()}</span>
                  </button>
                )}

                {!authLoading && currentUser && (
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 w-full px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200 font-medium"
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
