import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
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

const Login = lazy(() => import("./components/auth/Login"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Verified = lazy(() => import("./pages/Verified"));
const AuthHandler = lazy(() => import("./context/Auth"));
const Warranty = lazy(() => import("./pages/Warranty"));
const Navbar = lazy(() => import("./components/common/Navbar"));
const Footer = lazy(() => import("./components/common/Footer"));
const TitleUpdater = lazy(() => import("./components/common/TitleUpdater"));
const Toaster = lazy(() =>
  import("react-hot-toast").then((m) => ({ default: m.Toaster }))
);

function App() {
  const location = useLocation();

  const hideHeaderFooter =
    location.pathname.startsWith("/profile") ||
    location.pathname.startsWith("/catalogue") ||
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
        <Suspense fallback={null}>
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

export default App;
