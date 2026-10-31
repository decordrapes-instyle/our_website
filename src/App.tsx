import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Suspense, lazy, useState, useEffect } from "react";
import Home from "./pages/Home";
import Products from "./pages/Products";
import Catalogue from "./pages/Catalogue";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Estimate from "./pages/Estimate";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import OurWorkPublic from "./pages/OurWork";
import TermsPage from "./pages/Terms";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PageRouteGuard from "./components/common/PageRouteGuard";
import Spinner from "./components/common/Spinner";

const Login = lazy(() => import("./components/auth/Login"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Verified = lazy(() => import("./pages/Verified"));
const AuthHandler = lazy(() => import("./context/Auth"));
const Warranty = lazy(() => import("./pages/Warranty"));
const Navbar = lazy(() => import("./components/common/Navbar"));
const Footer = lazy(() => import("./components/common/Footer"));
const TitleUpdater = lazy(() => import("./components/common/TitleUpdater"));
import { Toaster } from "react-hot-toast";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}

function App() {
  const location = useLocation();
  const isMobile = useIsMobile();

  // Track whether an active A4 catalogue group or detail sheet view is opened
  const [catalogueGroupOpen, setCatalogueGroupOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    const hash = window.location.hash;
    return hash.startsWith("#/c/");
  });

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      setCatalogueGroupOpen(hash.startsWith("#/c/"));
    };
    window.addEventListener("hashchange", handleHash);
    window.addEventListener("popstate", handleHash);
    return () => {
      window.removeEventListener("hashchange", handleHash);
      window.removeEventListener("popstate", handleHash);
    };
  }, []);

  // When on Catalogue Homepage (/catalogue without group hash), header and footer are visible!
  const isCatalogueGroup = location.pathname.startsWith("/catalogue") && catalogueGroupOpen;

  const hideHeaderFooter =
    location.pathname.startsWith("/profile") ||
    isCatalogueGroup ||
    location.pathname.startsWith("/warranty") ||
    location.pathname.startsWith("/check-warranty") ||
    location.pathname === "/terms" ||
    location.pathname === "/privacy" ||
    location.pathname === "/login" ||
    location.pathname.startsWith("/auth") ||
    location.pathname === "/notfound";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 transition-colors duration-200">
      <Suspense fallback={null}>
        <TitleUpdater />
      </Suspense>

      {!hideHeaderFooter && (
        <Suspense fallback={null}>
          <Navbar />
        </Suspense>
      )}

      <main>
        <Suspense fallback={<Spinner fullScreen text="Loading page..." />}>
          <Routes>
            <Route
              path="/"
              element={
                <PageRouteGuard page="home" pageName="Home">
                  <Home />
                </PageRouteGuard>
              }
            />
            <Route
              path="/products"
              element={
                <PageRouteGuard page="products" pageName="Products">
                  <Products />
                </PageRouteGuard>
              }
            />
            <Route
              path="/catalogue"
              element={
                <PageRouteGuard page="catalogue" pageName="Catalogue">
                  <Catalogue />
                </PageRouteGuard>
              }
            />
            <Route
              path="/catalogue/*"
              element={
                <PageRouteGuard page="catalogue" pageName="Catalogue">
                  <Catalogue />
                </PageRouteGuard>
              }
            />
            <Route
              path="/about"
              element={
                <PageRouteGuard page="about" pageName="About Us">
                  <About />
                </PageRouteGuard>
              }
            />
            <Route
              path="/contact"
              element={
                <PageRouteGuard page="contact" pageName="Contact Us">
                  <Contact />
                </PageRouteGuard>
              }
            />
            <Route
              path="/estimate"
              element={
                <PageRouteGuard page="estimate" pageName="Cost Estimator">
                  <Estimate />
                </PageRouteGuard>
              }
            />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route
              path="/our-work"
              element={
                <PageRouteGuard page="ourWork" pageName="Our Work">
                  <OurWorkPublic />
                </PageRouteGuard>
              }
            />
            <Route path="/terms" element={<TermsPage />} />
            <Route
              path="/warranty"
              element={
                <PageRouteGuard page="warranty" pageName="Warranty Verification">
                  <Warranty />
                </PageRouteGuard>
              }
            />
            <Route path="/check-warranty" element={<Navigate to="/warranty" replace />} />
            <Route path="/login" element={<Login />} />

            <Route path="/auth/reset-password" element={<ResetPassword />} />
            <Route path="/auth/verified" element={<Verified />} />
            <Route path="/auth" element={<AuthHandler />} />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route path="/notfound" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/notfound" />} />
          </Routes>
        </Suspense>
      </main>

      {!hideHeaderFooter && (
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
      )}

      <Toaster
          position={isMobile ? "top-center" : "top-right"}
          containerClassName="app-toaster-container"
          containerStyle={{
            top: isMobile ? "calc(env(safe-area-inset-top, 0px) + 8px)" : 24,
            right: isMobile ? 12 : 24,
            left: isMobile ? 12 : "auto",
            zIndex: 999999,
          }}
          toastOptions={{
            duration: 3200,
            className: "app-notch-toast",
            success: {
              iconTheme: {
                primary: "#10b981",
                secondary: "#ffffff",
              },
            },
            error: {
              iconTheme: {
                primary: "#f43f5e",
                secondary: "#ffffff",
              },
            },
          }}
        />
    </div>
  );
}

export default App;
