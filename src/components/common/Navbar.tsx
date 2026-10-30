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
  ArrowRight,
  ShoppingBag,
  BookOpen,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  Star,
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

  const [aboutMenuOpen, setAboutMenuOpen] = useState(false);
  const aboutMenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const aboutMenuRef = useRef<HTMLDivElement>(null);

  const handleAboutMouseEnter = () => {
    if (aboutMenuTimeoutRef.current) clearTimeout(aboutMenuTimeoutRef.current);
    setAboutMenuOpen(true);
  };

  const handleAboutMouseLeave = () => {
    aboutMenuTimeoutRef.current = setTimeout(() => {
      setAboutMenuOpen(false);
    }, 160);
  };

  useEffect(() => {
    setAboutMenuOpen(false);
  }, [location.pathname]);

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
      // About mega menu
      if (
        aboutMenuOpen &&
        aboutMenuRef.current &&
        !aboutMenuRef.current.contains(e.target as Node)
      ) {
        setAboutMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [profileMenuOpen, aboutMenuOpen]);

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
      label: "Products",
      to: "/products",
      icon: <ShoppingBag size={14} />,
    },
    // {
    //   label: "Catalogue",
    //   to: "/catalogue",
    //   icon: <BookOpen size={14} />,
    // },
    // {
    //   label: "Our Work",
    //   to: "/our-work",
    //   icon: <Star size={14} />,
    // },
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
    {
      label: "Estimate",
      to: "/estimate",
      icon: <ArrowRight size={14} />,
    },
  ];

  // Quick action links for features (used in mobile sidebar only)
  const quickFeatureLinks = [
    {
      label: "Our Work",
      to: "/our-work",
      icon: <Star size={12} />,
    },
    {
      label: "Virtual Catalogue",
      to: "/catalogue",
      icon: <BookOpen size={12} />,
    },
    {
      label: "Check Warranty",
      to: "/warranty",
      icon: <ShieldCheck size={12} />,
    },
    {
      label: "About Us",
      to: "/about",
      icon: <Info size={12} />,
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left Section - Logo & Navigation */}
            <div className="flex items-center space-x-8">
              {/* Minimal Brand Identity */}
              <Link
                to="/"
                className="flex items-center gap-2 flex-shrink-0 group focus:outline-none"
                title={storeName || "Decor Drapes Instyle"}
              >
                <img
                  src="https://res.cloudinary.com/dmiwq3l2s/image/upload/v1764768203/vfw82jmca7zl5p86czhy.png"
                  alt="Instyle Logo"
                  className="w-7 h-7 sm:w-8 sm:h-8 object-contain transition-transform duration-300 group-hover:scale-105"
                />
                <span className="font-display font-bold text-base sm:text-lg tracking-tight text-neutral-900 dark:text-white group-hover:text-neutral-700 dark:group-hover:text-neutral-200 transition-colors">
                  Instyle
                </span>
              </Link>

              {/* Desktop Navigation Links - Simple and Clean */}
              <div className="hidden lg:flex items-center space-x-1">
                {navLinks.map((item) => {
                  if (item.label === "About") {
                    const isAboutActive =
                      location.pathname === "/about" ||
                      location.pathname === "/our-work" ||
                      location.pathname === "/catalogue" ||
                      location.pathname === "/warranty";

                    return (
                      <div
                        key="About"
                        ref={aboutMenuRef}
                        className="relative"
                        onMouseEnter={handleAboutMouseEnter}
                        onMouseLeave={handleAboutMouseLeave}
                      >
                        <Link
                          to="/about"
                          className={`flex items-center space-x-1.5 px-3 py-2 text-sm font-medium transition-all duration-200 rounded-full ${
                            isAboutActive
                              ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                              : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-white"
                          }`}
                        >
                          <Info size={14} />
                          <span>About</span>
                          <ChevronDown
                            size={12}
                            className={`transition-transform duration-300 ease-out ${
                              aboutMenuOpen ? "rotate-180 text-emerald-600 dark:text-emerald-400" : ""
                            }`}
                          />
                        </Link>

                        {/* Mega Menu Dropdown */}
                        {aboutMenuOpen && (
                          <div
                            className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50"
                            onMouseEnter={handleAboutMouseEnter}
                            onMouseLeave={handleAboutMouseLeave}
                          >
                            <div className="w-[620px] rounded-3xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border border-neutral-200/90 dark:border-neutral-800 shadow-2xl p-4 overflow-hidden animate-mega-menu">
                              <div className="grid grid-cols-[1.05fr_1.35fr] gap-4">
                                {/* Featured Showcase Image Card */}
                                <Link
                                  to="/about"
                                  onClick={() => setAboutMenuOpen(false)}
                                  className="group relative rounded-2xl overflow-hidden bg-neutral-950 flex flex-col justify-end p-5 min-h-[260px] border border-neutral-200/50 dark:border-neutral-800 animate-mega-showcase"
                                >
                                  <img
                                    src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=700&q=80"
                                    alt="Decor Drapes luxury curtains & blinds"
                                    className="absolute inset-0 w-full h-full object-cover opacity-65 group-hover:scale-105 transition-transform duration-500"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent" />
                                  <div className="relative z-10 space-y-1 text-white">
                                    <span className="inline-block text-[10px] font-mono uppercase tracking-widest text-sky-400 font-semibold">
                                      Decor Drapes Instyle
                                    </span>
                                    <h4 className="text-base font-semibold leading-tight">
                                      Bespoke Curtains &amp; Automation
                                    </h4>
                                    <p className="text-xs text-neutral-300 line-clamp-2">
                                      Crafting luxury window dressings and motorization across 500+ homes &amp; offices.
                                    </p>
                                    <span className="inline-flex items-center gap-1 text-xs text-sky-400 font-medium pt-1 group-hover:translate-x-1 transition-transform">
                                      Read our story →
                                    </span>
                                  </div>
                                </Link>

                                {/* Mega Menu Links: Our Work, Catalogue, Warranty, About Us */}
                                <div className="flex flex-col justify-between space-y-1 py-0.5">
                                  <Link
                                    to="/our-work"
                                    onClick={() => setAboutMenuOpen(false)}
                                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-neutral-100/70 dark:hover:bg-neutral-800/70 transition-all duration-150 group animate-mega-item"
                                  >
                                    <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                      <Star size={16} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center justify-between">
                                        <span>Our Work</span>
                                        <ChevronRight size={13} className="text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
                                      </div>
                                      <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                                        Explore residential &amp; corporate installations
                                      </p>
                                    </div>
                                  </Link>

                                  <Link
                                    to="/catalogue"
                                    onClick={() => setAboutMenuOpen(false)}
                                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-neutral-100/70 dark:hover:bg-neutral-800/70 transition-all duration-150 group animate-mega-item [animation-delay:40ms]"
                                  >
                                    <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-400/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                      <BookOpen size={16} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center justify-between">
                                        <span>Catalogue</span>
                                        <ChevronRight size={13} className="text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
                                      </div>
                                      <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                                        Browse fabrics, motorized tracks &amp; blinds
                                      </p>
                                    </div>
                                  </Link>

                                  <Link
                                    to="/warranty"
                                    onClick={() => setAboutMenuOpen(false)}
                                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-neutral-100/70 dark:hover:bg-neutral-800/70 transition-all duration-150 group animate-mega-item [animation-delay:80ms]"
                                  >
                                    <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                      <ShieldCheck size={16} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center justify-between">
                                        <span>Warranty</span>
                                        <ChevronRight size={13} className="text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
                                      </div>
                                      <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                                        Verify certificate &amp; product warranty coverage
                                      </p>
                                    </div>
                                  </Link>

                                  <Link
                                    to="/about"
                                    onClick={() => setAboutMenuOpen(false)}
                                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-neutral-100/70 dark:hover:bg-neutral-800/70 transition-all duration-150 group animate-mega-item [animation-delay:120ms]"
                                  >
                                    <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-400/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                      <Info size={16} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center justify-between">
                                        <span>About Us</span>
                                        <ChevronRight size={13} className="text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
                                      </div>
                                      <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                                        Our history, craftsmanship, team &amp; values
                                      </p>
                                    </div>
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
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
                  );
                })}
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
  fixed right-0 top-0 h-full w-72
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
                  className="flex items-center gap-2"
                  onClick={() => setSidebarOpen(false)}
                >
                  <img
                    src="https://res.cloudinary.com/dmiwq3l2s/image/upload/v1764768203/vfw82jmca7zl5p86czhy.png"
                    alt="Instyle Logo"
                    className="w-7 h-7 object-contain"
                  />
                  <div className="font-display font-bold text-neutral-900 dark:text-white text-base">
                    Instyle
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
                  <>
                    <div className="flex items-center space-x-3">
                      {currentUser.profileImage ? (
                        <img
                          src={currentUser.profileImage}
                          alt="Avatar"
                          className="w-10 h-10 rounded-full object-cover border border-neutral-300 dark:border-neutral-600"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-700 flex items-center justify-center border border-neutral-300 dark:border-neutral-600">
                          <UserIcon
                            size={20}
                            className="text-neutral-600 dark:text-neutral-400"
                          />
                        </div>
                      )}
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-2">
                          <div className="text-sm font-bold text-neutral-900 dark:text-white">
                            {displayName}
                          </div>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200 capitalize">
                            {currentUser.role || "Member"}
                          </span>
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                          {userEmail}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1"></div>
                  </>
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
