import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ref, onValue } from "firebase/database";
import { database } from "../../config/firebase";
import { SiteSettings } from "../../types";
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  ShoppingBag,
  Users,
  Shield,
  Clock,
  ArrowRight,
} from "lucide-react";

const Footer: React.FC = () => {
  const [settings, setSettings] = useState<SiteSettings[]>([]);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const settingsRef = ref(database, "siteSettings");
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const settingsData = snapshot.val();
        const settingsList: SiteSettings[] = Object.keys(settingsData).map(
          (key) => ({
            id: key,
            ...settingsData[key],
          })
        );
        setSettings(settingsList);
      }
    });

    return () => unsubscribe();
  }, []);

  const getSetting = (key: string) => {
    const setting = settings.find((s) => s.key === key);
    return setting?.value || "";
  };

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">
                  {(getSetting("store_name") || "Shop").charAt(0)}
                </span>
              </div>
              <span className="text-2xl font-bold">
                {getSetting("store_name") || "Shop"}
              </span>
            </div>
            <p className="text-gray-400 leading-relaxed">
              {getSetting("store_tagline") ||
                "Your trusted business partner providing premium products and exceptional service. We deliver quality solutions that drive your success forward."}
            </p>
            <div className="flex space-x-4">
              <a
                href={getSetting("facebook_url") || "#"}
                className="w-10 h-10 bg-gray-800 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href={getSetting("twitter_url") || "#"}
                className="w-10 h-10 bg-gray-800 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href={getSetting("instagram_url") || "#"}
                className="w-10 h-10 bg-gray-800 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href={getSetting("linkedin_url") || "#"}
                className="w-10 h-10 bg-gray-800 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/"
                  className="text-gray-400 hover:text-white transition-colors flex items-center group"
                >
                  <ArrowRight className="w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/catalogue"
                  className="text-gray-400 hover:text-white transition-colors flex items-center group"
                >
                  <ArrowRight className="w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Catalogue
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-gray-400 hover:text-white transition-colors flex items-center group"
                >
                  <ArrowRight className="w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-gray-400 hover:text-white transition-colors flex items-center group"
                >
                  <ArrowRight className="w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  to="/estimate"
                  className="text-gray-400 hover:text-white transition-colors flex items-center group"
                >
                  <ArrowRight className="w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Get Estimate
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Our Services</h3>
            <ul className="space-y-3">
              <li className="text-gray-400 flex items-center">
                <ShoppingBag className="w-4 h-4 mr-3 text-blue-400" />
                Product Sales
              </li>
              <li className="text-gray-400 flex items-center">
                <Users className="w-4 h-4 mr-3 text-green-400" />
                Consultation
              </li>
              <li className="text-gray-400 flex items-center">
                <Shield className="w-4 h-4 mr-3 text-purple-400" />
                Quality Assurance
              </li>
              <li className="text-gray-400 flex items-center">
                <Clock className="w-4 h-4 mr-3 text-orange-400" />
                24/7 Support
              </li>
            </ul>

            <div className="mt-6">
              <h4 className="text-sm font-semibold mb-3 text-gray-300">
                Legal
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/privacy"
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <a
                    href="/terms"
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Get in Touch</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                <div className="text-gray-400">
                  {(
                    getSetting("store_address") ||
                    "123 Business Street\nCity, State 12345\nUnited States"
                  )
                    .split("\n")
                    .map((line, index) => (
                      <p key={index}>{line}</p>
                    ))}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-green-400 flex-shrink-0" />
                <div className="text-gray-400">
                  <p>
                    <a
                      href={`tel:${
                        getSetting("primary_phone") || "+1 (555) 123-4567"
                      }`}
                    >
                      {getSetting("primary_phone") || "+1 (555) 123-4567"}
                    </a>
                  </p>
                  <p>
                    <a
                      href={`tel:${
                        getSetting("secondary_phone") || "+1 (555) 987-6543"
                      }`}
                    >
                      {getSetting("secondary_phone") || "+1 (555) 987-6543"}
                    </a>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-purple-400 flex-shrink-0" />
                <div className="text-gray-400">
                  <p>
                    <a
                      href={`mailto:${
                        getSetting("primary_email") || "contact@shop.com"
                      }`}
                    >
                      {getSetting("primary_email") || "contact@shop.com"}
                    </a>
                  </p>
                  <p>
                    <a
                      href={`mailto:${
                        getSetting("support_email") || "support@shop.com"
                      }`}
                    >
                      {getSetting("support_email") || "support@shop.com"}
                    </a>
                  </p>
                </div>
              </div>
            </div>

            {/* Business Hours */}
            <div className="mt-6">
              <h4 className="text-sm font-semibold mb-3 text-gray-300">
                Business Hours
              </h4>
              <div className="text-gray-400 text-sm space-y-1">
                {(
                  getSetting("store_hours") ||
                  "Mon-Fri: 9AM-6PM\nSat: 10AM-4PM\nSun: Closed"
                )
                  .split("\n")
                  .map((line, index) => (
                    <div key={index}>{line}</div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Newsletter Signup */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h3 className="text-lg font-semibold mb-2">Stay Updated</h3>
              <p className="text-gray-400">
                Subscribe to our newsletter for the latest updates and offers.
              </p>
            </div>
            <div className="w-full md:w-auto flex flex-col sm:flex-row gap-2 sm:gap-0 sm:flex-nowrap">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full sm:w-64 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg sm:rounded-l-lg sm:rounded-r-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
              />
              <button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg sm:rounded-r-lg sm:rounded-l-none font-medium transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <p className="text-gray-400 text-sm">
              © {currentYear} {getSetting("store_name") || "Shop"}. All rights
              reserved.
            </p>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <a
                href="/sitemap"
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Sitemap
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Accessibility
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Cookies
              </a>
            </div>
          </div>
        </div>

        {/* Made by section */}
        <div className="bg-gray-900 text-center py-3">
          <p className="text-gray-500 text-xs">
            Made with{" "}
            <a
              // href=""
              className="hover:text-white"
            >
              ❤️
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
