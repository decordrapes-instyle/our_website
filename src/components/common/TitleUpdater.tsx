import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const routeTitles: Record<string, string> = {
  "/": "Home | Decor Drapes Instyle",
  "/products": "Products | Decor Drapes Instyle",
  "/catalogue": "Virtual Catalogue | Decor Drapes Instyle",
  "/warranty": "Warranty Verification | Decor Drapes Instyle",
  "/terms": "Terms & Conditions | Decor Drapes Instyle",
  "/cart": "My Cart | Decor Drapes Instyle",
  "/about": "About Us | Decor Drapes Instyle",
  "/contact": "Contact Us | Decor Drapes Instyle",
  "/estimate": "Get an Estimate | Decor Drapes Instyle",
  "/privacy": "Privacy Policy | Decor Drapes Instyle",
  "/our-work": "Our Work | Decor Drapes Instyle",
  "/profile": "My Profile | Decor Drapes Instyle",
  "/admin": "Admin Dashboard | Decor Drapes Instyle",
  "/production": "Production Dashboard | Decor Drapes Instyle",
  "/auth/verified": "Account Verified | Decor Drapes Instyle",
  "/auth/reset-password": "Reset Password | Decor Drapes Instyle",
  "/payment": "Payment | Decor Drapes Instyle",
  "/login": "Login | Decor Drapes Instyle",

};

export default function TitleUpdater() {
  const location = useLocation();

  useEffect(() => {
    const newTitle =
      routeTitles[location.pathname] || "Decor Drapes Instyle";
    document.title = newTitle;
  }, [location.pathname]);

  return null;
}
