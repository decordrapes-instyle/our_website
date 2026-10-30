import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { database, ref, onValue } from "../../config/firebase";
import { SiteSettings } from "../../types";
import {
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  Users,
  Shield,
  Clock,
  ArrowRight,
} from "lucide-react";
import FooterMadeWith from "./MadeWith";

const FacebookIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
  </svg>
);

const TwitterIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const InstagramIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
  </svg>
);

const LinkedinIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45c-.96 0-1.74.78-1.74 1.74s.78 1.74 1.74 1.74 1.74-.78 1.74-1.74-.78-1.74-1.74-1.74z" />
  </svg>
);
/**
 * Oversized brand name that always fits the container width exactly.
 * Re-fits on resize and once web fonts have loaded.
 */
const BigBrandName: React.FC<{ text: string }> = ({ text }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const el = textRef.current;
    if (!wrap || !el || !text) return;

    const MAX_FONT_SIZE = 320; // stops very short names from getting huge

    const fit = () => {
      el.style.fontSize = "100px";
      const textWidth = el.getBoundingClientRect().width;
      const available = wrap.clientWidth;
      if (!textWidth || !available) return;
      el.style.fontSize = `${Math.min((100 * available) / textWidth, MAX_FONT_SIZE)}px`;
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(wrap);
    document.fonts?.ready.then(fit);

    return () => observer.disconnect();
  }, [text]);

  if (!text) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 select-none" aria-hidden="true">
      <div ref={wrapRef} className="overflow-hidden">
        <span
          ref={textRef}
          style={{ paddingBottom: "0.1em" }}
          className="
            block w-max mx-auto whitespace-nowrap
            font-black tracking-tighter leading-none
            bg-gradient-to-b from-neutral-300 to-gray-100
            dark:from-neutral-700 dark:to-neutral-900
            bg-clip-text text-transparent
          "
        >
          {text}
        </span>
      </div>
    </div>
  );
};

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
                { href: getSetting("facebook_url"), Icon: FacebookIcon, name: "Facebook" },
                { href: getSetting("twitter_url"), Icon: TwitterIcon, name: "Twitter" },
                { href: getSetting("instagram_url"), Icon: InstagramIcon, name: "Instagram" },
                { href: getSetting("linkedin_url"), Icon: LinkedinIcon, name: "LinkedIn" },
              ].map(({ href, Icon, name }, i) => (
                <a
                  key={i}
                  href={href && href !== "#" ? href : "#"}
                  target={href && href !== "#" ? "_blank" : undefined}
                  rel={href && href !== "#" ? "noopener noreferrer" : undefined}
                  onClick={(e) => {
                    if (!href || href === "#" || !href.trim()) {
                      e.preventDefault();
                      toast("Adding this social link soon!");
                    }
                  }}
                  aria-label={name}
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
                { to: "/products", label: "Products" },
                { to: "/catalogue", label: "Virtual Catalogue" },
                { to: "/warranty", label: "Check Warranty" },
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
                      href={getSetting("primary_phone") ? `tel:${getSetting("primary_phone")}` : "#"}
                      onClick={(e) => {
                        if (!getSetting("primary_phone")) {
                          e.preventDefault();
                          toast("Adding phone contact soon!");
                        }
                      }}
                      className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                    >
                      {getSetting("primary_phone") || "Phone not available"}
                    </a>
                  </p>
                  {getSetting("secondary_phone") && (
                    <p>
                      <a
                        href={`tel:${getSetting("secondary_phone")}`}
                        className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                      >
                        {getSetting("secondary_phone")}
                      </a>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 flex-shrink-0 text-violet-500 dark:text-violet-400" />
                <div className="text-neutral-700 dark:text-neutral-300 text-sm">
                  <p>
                    <a
                      href={getSetting("primary_email") ? `mailto:${getSetting("primary_email")}` : "#"}
                      onClick={(e) => {
                        if (!getSetting("primary_email")) {
                          e.preventDefault();
                          toast("Adding email contact soon!");
                        }
                      }}
                      className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                    >
                      {getSetting("primary_email") || "Email not available"}
                    </a>
                  </p>
                  {getSetting("support_email") && (
                    <p>
                      <a
                        href={`mailto:${getSetting("support_email")}`}
                        className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                      >
                        {getSetting("support_email")}
                      </a>
                    </p>
                  )}
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
      <BigBrandName text={getSetting("store_name")} />

      <div className="border-t border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              © {currentYear} {getSetting("store_name")}™ All rights
              reserved.
            </p>
            <FooterMadeWith settings={settings} />
          </div>
        </div>
      </div>

    </footer>
  );
};

export default Footer;