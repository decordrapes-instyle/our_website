import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import Verified from "./pages/Verified";
import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import NotFound from "./pages/NotFound";
import Home from "./pages/Home";
import Login from "./components/auth/Login";
import Catalogue from "./pages/Catalogue";
import Profile from "./pages/Profile";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Estimate from "./pages/Estimate";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import FaviconUpdater from "./components/FaviconUpdater";
import Auth from "../src/context/Auth";
import OurWorkPublic from "./pages/OurWork";
import { gapi } from "gapi-script";
import TermsPage from "./pages/Terms";
import ResetPassword from "./pages/ResetPassword";
import TitleUpdater from "./components/common/TitleUpdater";
import AuthHandler from "../src/context/Auth";
import Sitemap from "./pages/Sitemap";
import MaintenancePage from "./pages/MaintenancePage";

function LayoutWrapper() {
  const location = useLocation();
  const mainRoutes = [
    "/",
    "/catalogue",
    "/terms",
    "/cart",
    "/about",
    "/contact",
    "/estimate",
    "/privacy",
    "/our-work",
    "/profile",
  ];

  const hideHeaderFooter =
    !mainRoutes.includes(location.pathname) ||
    location.pathname === "/login" || location.pathname === "/privacy" || location.pathname === "/terms" ||
    location.pathname.startsWith("/auth/reset-password") ||
    location.pathname === "/auth/verified";

  return (
    <div className="min-h-screen bg-gray-50">
      <TitleUpdater />

      {!hideHeaderFooter && <Navbar />}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/catalogue" element={<Catalogue />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/estimate" element={<Estimate />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/our-work" element={<OurWorkPublic />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/sitemap" element={<Sitemap />} />
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

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!hideHeaderFooter && <Footer />}

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { background: "#363636", color: "#fff" },
        }}
      />
    </div>
  );
}

function App() {
  useEffect(() => {
    function start() {
      gapi.client.init({
        clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      });
    }
    gapi.load("client:auth2", start);
  }, []);

  // ✅ Maintenance mode toggle (from .env)
  const isMaintenanceMode = import.meta.env.VITE_MAINTENANCE_MODE === "true";

  if (isMaintenanceMode) {
    // ✅ Show maintenance page and skip everything else
    return <MaintenancePage />;
  }

  return (
    <AuthProvider>
      <FaviconUpdater />
      <CartProvider>
        <Router>
          <LayoutWrapper />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
