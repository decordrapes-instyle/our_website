import { BrowserRouter as Router, Routes, Route, useLocation, } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Home from "./pages/Home";
import Catalogue from "./pages/Catalogue";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Estimate from "./pages/Estimate";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import OurWorkPublic from "./pages/OurWork";
import TermsPage from "./pages/Terms";
import Profile from "./pages/Profile";
import Quotations from "./pages/Quotations";
import QuotationDetail from "./pages/QuotationDetail"; // Added import
import NotFound from "./pages/NotFound";
import MaintenancePage from "./pages/MaintenancePage";
const Login = lazy(() => import("./components/auth/Login"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Verified = lazy(() => import("./pages/Verified"));
const AuthHandler = lazy(() => import("./context/Auth"));
const Navbar = lazy(() => import("./components/common/Navbar"));
const Footer = lazy(() => import("./components/common/Footer"));
const TitleUpdater = lazy(() => import("./components/common/TitleUpdater"));
const FaviconUpdater = lazy(() => import("./components/FaviconUpdater"));
const Toaster = lazy(() =>
  import("react-hot-toast").then((m) => ({ default: m.Toaster }))
);

function LayoutWrapper() {
  const location = useLocation();

  const mainRoutes = [
    "/",
    "/catalogue",
    "/terms",
    "/about",
    "/contact",
    "/estimate",
    "/privacy",
    "/our-work",
    "/profile",
    "/quotations",
    // Dynamic route for quotation detail will be handled by startsWith in hideHeaderFooter
  ];

  const hideHeaderFooter =
    (!mainRoutes.includes(location.pathname) &&
    !location.pathname.startsWith("/quotations/")) || // Added this check
    location.pathname === "/login" ||
    location.pathname.startsWith("/auth");

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
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/catalogue" element={<Catalogue />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/estimate" element={<Estimate />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/our-work" element={<OurWorkPublic />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            <Route path="/auth/verified" element={<Verified />} />
            <Route path="/auth/login" element={<AuthHandler />} />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quotations"
              element={
                <ProtectedRoute>
                  <Quotations />
                </ProtectedRoute>
              }
            />
            <Route // Added this route
              path="/quotations/:quotationId"
              element={
                <ProtectedRoute>
                  <QuotationDetail />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>

      {!hideHeaderFooter && (
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
      )}

      <Suspense fallback={null}>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            className:
              "bg-neutral-900 text-neutral-100 dark:bg-neutral-100 dark:text-neutral-900 border border-neutral-800 dark:border-neutral-200",
          }}
        />
      </Suspense>
    </div>
  );
}

function App() {
  const isMaintenanceMode =
    import.meta.env.VITE_MAINTENANCE_MODE === "true";

  if (isMaintenanceMode) {
    return (
      <Suspense fallback={null}>
        <MaintenancePage />
      </Suspense>
    );
  }

  return (
    <AuthProvider>
      <Suspense fallback={null}>
        <FaviconUpdater />
      </Suspense>

      <Router>
        <LayoutWrapper />
      </Router>
    </AuthProvider>
  );
}

export default App;
