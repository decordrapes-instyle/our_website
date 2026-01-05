import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { database, ref, onValue } from "../../config/firebase";
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
import FooterMadeWith from "./MadeWith";

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
    <footer className="relative bg-gray-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                <img
                  src="https://res.cloudinary.com/dmiwq3l2s/image/upload/v1764768203/vfw82jmca7zl5p86czhy.png"
                  alt="Store Logo"
                  className="w-8 h-8 object-contain"
                />
              </div>
              <span className="text-2xl font-bold">
                {getSetting("store_name")}
              </span>
            </div>
            <p className="text-gray-400 leading-relaxed">
              {getSetting("store_tagline")}
            </p>
            <div className="flex space-x-4">
              {[ 
                { href: getSetting("facebook_url"), Icon: Facebook },
                { href: getSetting("twitter_url"), Icon: Twitter },
                { href: getSetting("instagram_url"), Icon: Instagram },
                { href: getSetting("linkedin_url"), Icon: Linkedin },
              ].map(({ href, Icon }, i) => (
                <a
                  key={i}
                  href={href}
                  className="
        w-10 h-10 flex items-center justify-center rounded-lg
        border border-neutral-300 text-neutral-700
        hover:border-neutral-900 hover:text-neutral-900
        dark:border-neutral-700 dark:text-neutral-300
        dark:hover:border-neutral-100 dark:hover:text-neutral-100
        transition-colors
      "
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-6 text-neutral-900 dark:text-neutral-100">
              Quick Links
            </h3>

            <ul className="space-y-3">
              {[ 
                { to: "/", label: "Home" },
                { to: "/catalogue", label: "Catalogue" },
                { to: "/about", label: "About Us" },
                { to: "/contact", label: "Contact" },
                { to: "/estimate", label: "Get Estimate" },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="
            group flex items-center
            text-neutral-600 dark:text-neutral-400
            hover:text-neutral-900 dark:hover:text-neutral-100
            transition-colors
          "
                  >
                    <ArrowRight
                      className="
              w-4 h-4 mr-2
              opacity-0 -translate-x-1
              group-hover:opacity-100 group-hover:translate-x-0
              transition-all
            "
                    />
                    <span className="font-medium">{label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-6 text-neutral-900 dark:text-neutral-100">
              Our Services
            </h3>

            <ul className="space-y-3">
              <li className="flex items-center text-neutral-700 dark:text-neutral-300">
                <ShoppingBag className="w-4 h-4 mr-3 text-indigo-500 dark:text-indigo-400" />
                <span className="font-normal">Product Sales</span>
              </li>

              <li className="flex items-center text-neutral-700 dark:text-neutral-300">
                <Users className="w-4 h-4 mr-3 text-emerald-500 dark:text-emerald-400" />
                <span className="font-normal">Consultation</span>
              </li>

              <li className="flex items-center text-neutral-700 dark:text-neutral-300">
                <Shield className="w-4 h-4 mr-3 text-violet-500 dark:text-violet-400" />
                <span className="font-normal">Quality Assurance</span>
              </li>

              <li className="flex items-center text-neutral-700 dark:text-neutral-300">
                <Clock className="w-4 h-4 mr-3 text-rose-500 dark:text-rose-400" />
                <span className="font-normal">24/7 Support</span>
              </li>
            </ul>

            <div className="mt-6">
              <h4 className="text-sm font-medium mb-3 text-neutral-600 dark:text-neutral-400">
                Legal
              </h4>

              <ul className="space-y-2">
                <li>
                  <Link
                    to="/privacy"
                    className="
            text-sm
            text-neutral-600 dark:text-neutral-400
            hover:text-neutral-900 dark:hover:text-neutral-100
            transition-colors
          "
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <a
                    href="/terms"
                    className="
            text-sm
            text-neutral-600 dark:text-neutral-400
            hover:text-neutral-900 dark:hover:text-neutral-100
            transition-colors
          "
                  >
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-6 text-neutral-900 dark:text-neutral-100">
              Get in Touch
            </h3>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 mt-1 flex-shrink-0 text-indigo-500 dark:text-indigo-400" />
                <div className="text-neutral-700 dark:text-neutral-300 text-sm leading-relaxed">
                  {(
                    getSetting("store_address")
                  )
                    .split("\n")
                    .map((line, index) => (
                      <p key={index}>{line}</p>
                    ))}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 flex-shrink-0 text-emerald-500 dark:text-emerald-400" />
                <div className="text-neutral-700 dark:text-neutral-300 text-sm">
                  <p>
                    <a
                      href={`tel:${
                        getSetting("primary_phone")
                      }`}
                      className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                    >
                      {getSetting("primary_phone")}
                    </a>
                  </p>
                  <p>
                    <a
                      href={`tel:${
                        getSetting("secondary_phone")
                      }`}
                      className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                    >
                      {getSetting("secondary_phone")}
                    </a>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 flex-shrink-0 text-violet-500 dark:text-violet-400" />
                <div className="text-neutral-700 dark:text-neutral-300 text-sm">
                  <p>
                    <a
                      href={`mailto:${
                        getSetting("primary_email")
                      }`}
                      className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                    >
                      {getSetting("primary_email")}
                    </a>
                  </p>
                  <p>
                    <a
                      href={`mailto:${
                        getSetting("support_email")
                      }`}
                      className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                    >
                      {getSetting("support_email")}
                    </a>
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-medium mb-3 text-neutral-600 dark:text-neutral-400">
                Business Hours
              </h4>

              <div className="text-neutral-600 dark:text-neutral-400 text-sm space-y-1">
                {( 
                  getSetting("store_hours")
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

      <div className="border-t border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              © {currentYear} {getSetting("store_name")}™ All rights
              reserved.
            </p>

          </div>
        </div>

        <FooterMadeWith />
      </div>
    </footer>
  );
};

export default Footer;