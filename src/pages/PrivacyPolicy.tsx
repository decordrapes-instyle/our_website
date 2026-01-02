import { useEffect, useState } from "react";
import { ref, onValue } from "../config/firebase";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { database } from "../config/firebase";

interface SiteSettingsData {
  [key: string]: {
    key: string;
    value: string;
  };
}

export default function PrivacyPolicyPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    const settingsRef = ref(database, "siteSettings");
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data: SiteSettingsData = snapshot.val();
        const mapped: Record<string, string> = {};
        Object.values(data).forEach((item) => {
          mapped[item.key] = item.value;
        });
        setSettings(mapped);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950 transition-colors duration-200 text-neutral-800 dark:text-neutral-300">
      {/* Header */}
      <section className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="mb-8">
            <Link
              to="/"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-neutral-900 rounded-lg shadow-sm hover:bg-neutral-800 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-neutral-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Home
            </Link>
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-neutral-900 dark:text-white">Privacy Policy</h1>
          <p className="mt-3 text-sm md:text-base text-neutral-600 dark:text-neutral-400">
            This Privacy Policy describes how <span className="font-medium text-neutral-800 dark:text-neutral-200">{settings["store_name"] || "Our Company"} </span> 
            collects, uses, and protects your personal information when you use our website and services. 
            As we grow, features like online ordering and order tracking will be introduced, and this policy will continue to evolve.
          </p>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-500">Last updated: 30 Aug 2025</p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid gap-6">
          {/* Information We Collect */}
          <article className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">1) Information We Collect</h2>
            <ul className="mt-3 list-disc pl-5 space-y-1 text-sm leading-6 text-neutral-700 dark:text-neutral-400">
              <li>Basic contact details (name, phone, email) when you reach out to us.</li>
              <li>Future features like orders may require shipping addresses and payment preferences.</li>
              <li>Technical details such as browser type and usage data (for improving website performance).</li>
            </ul>
          </article>

          {/* How We Use Information */}
          <article className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">2) How We Use Your Information</h2>
            <ul className="mt-3 list-disc pl-5 space-y-1 text-sm leading-6 text-neutral-700 dark:text-neutral-400">
              <li>To respond to inquiries and provide customer support.</li>
              <li>To process and deliver orders (once online ordering is introduced).</li>
              <li>To improve our website, services, and customer experience.</li>
              <li>To send service updates, offers, and important notices (only if you opt in).</li>
            </ul>
          </article>

          {/* Data Security */}
          <article className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">3) Data Security</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-700 dark:text-neutral-400">
              We implement reasonable safeguards to protect your personal information. When features like online 
              payments are added, we will use encryption and secure gateways to protect sensitive data. 
              However, please note that no system is 100% secure.
            </p>
          </article>

          {/* Sharing of Information */}
          <article className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">4) Sharing of Information</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-700 dark:text-neutral-400">
              We do not sell or rent your personal information. Your details may be shared only with:
            </p>
            <ul className="mt-3 list-disc pl-5 space-y-1 text-sm leading-6 text-neutral-700 dark:text-neutral-400">
              <li>Service providers who assist in running our business (e.g., delivery partners).</li>
              <li>When required by law or to protect our legal rights.</li>
              <li>With your consent, in case of future promotional collaborations.</li>
            </ul>
          </article>

          {/* Cookies & Tracking */}
          <article className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">5) Cookies & Tracking</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-700 dark:text-neutral-400">
              Our website may use cookies to remember preferences, improve functionality, and analyze traffic. 
              As we roll out advanced features such as order tracking, cookies may also be used for personalization.
            </p>
          </article>

          {/* Your Rights */}
          <article className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">6) Your Rights</h2>
            <ul className="mt-3 list-disc pl-5 space-y-1 text-sm leading-6 text-neutral-700 dark:text-neutral-400">
              <li>Request access to the personal data we hold about you.</li>
              <li>Request corrections or updates to your information.</li>
              <li>Request deletion of your information, subject to legal obligations.</li>
              <li>Opt out of promotional communications.</li>
            </ul>
          </article>

          {/* Contact */}
          <article className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">7) Contact Us</h2>
            <div className="mt-3 text-sm leading-6 text-neutral-700 dark:text-neutral-400">
              <p><span className="font-medium text-neutral-800 dark:text-neutral-200">{settings["store_name"] || "Our Company"}</span></p>
              <p>{settings["store_address"] || "Business Address"}</p>
              <p>Phone: {settings["primary_phone"] || "Phone"}</p>
              <p>Email: {settings["primary_email"] || "Email"}</p>
            </div>
          </article>

          {/* Updates */}
          <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/20 p-6 shadow-sm">
            <p className="text-sm leading-6 text-amber-900 dark:text-amber-200">
              This Privacy Policy may be updated from time to time as we add new services like 
              online orders and tracking. Please review this page periodically for the latest updates.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}