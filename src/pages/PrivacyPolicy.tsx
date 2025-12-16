import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
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
    <main className="min-h-screen bg-white text-gray-800">
      {/* Header */}
      <section className="bg-gray-50 border-b">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Privacy Policy</h1>
          <p className="mt-3 text-sm md:text-base text-gray-600">
            This Privacy Policy describes how <span className="font-medium">{settings["store_name"] || "Our Company"} </span> 
            collects, uses, and protects your personal information when you use our website and services. 
            As we grow, features like online ordering and order tracking will be introduced, and this policy will continue to evolve.
          </p>
          <p className="mt-1 text-xs text-gray-500">Last updated: 30 Aug 2025</p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid gap-6">
          {/* Information We Collect */}
          <article className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">1) Information We Collect</h2>
            <ul className="mt-3 list-disc pl-5 space-y-1 text-sm leading-6 text-gray-700">
              <li>Basic contact details (name, phone, email) when you reach out to us.</li>
              <li>Future features like orders may require shipping addresses and payment preferences.</li>
              <li>Technical details such as browser type and usage data (for improving website performance).</li>
            </ul>
          </article>

          {/* How We Use Information */}
          <article className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">2) How We Use Your Information</h2>
            <ul className="mt-3 list-disc pl-5 space-y-1 text-sm leading-6 text-gray-700">
              <li>To respond to inquiries and provide customer support.</li>
              <li>To process and deliver orders (once online ordering is introduced).</li>
              <li>To improve our website, services, and customer experience.</li>
              <li>To send service updates, offers, and important notices (only if you opt in).</li>
            </ul>
          </article>

          {/* Data Security */}
          <article className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">3) Data Security</h2>
            <p className="mt-3 text-sm leading-6 text-gray-700">
              We implement reasonable safeguards to protect your personal information. When features like online 
              payments are added, we will use encryption and secure gateways to protect sensitive data. 
              However, please note that no system is 100% secure.
            </p>
          </article>

          {/* Sharing of Information */}
          <article className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">4) Sharing of Information</h2>
            <p className="mt-3 text-sm leading-6 text-gray-700">
              We do not sell or rent your personal information. Your details may be shared only with:
            </p>
            <ul className="mt-3 list-disc pl-5 space-y-1 text-sm leading-6 text-gray-700">
              <li>Service providers who assist in running our business (e.g., delivery partners).</li>
              <li>When required by law or to protect our legal rights.</li>
              <li>With your consent, in case of future promotional collaborations.</li>
            </ul>
          </article>

          {/* Cookies & Tracking */}
          <article className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">5) Cookies & Tracking</h2>
            <p className="mt-3 text-sm leading-6 text-gray-700">
              Our website may use cookies to remember preferences, improve functionality, and analyze traffic. 
              As we roll out advanced features such as order tracking, cookies may also be used for personalization.
            </p>
          </article>

          {/* Your Rights */}
          <article className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">6) Your Rights</h2>
            <ul className="mt-3 list-disc pl-5 space-y-1 text-sm leading-6 text-gray-700">
              <li>Request access to the personal data we hold about you.</li>
              <li>Request corrections or updates to your information.</li>
              <li>Request deletion of your information, subject to legal obligations.</li>
              <li>Opt out of promotional communications.</li>
            </ul>
          </article>

          {/* Contact */}
          <article className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">7) Contact Us</h2>
            <div className="mt-3 text-sm leading-6 text-gray-700">
              <p><span className="font-medium">{settings["store_name"] || "Our Company"}</span></p>
              <p>{settings["store_address"] || "Business Address"}</p>
              <p>Phone: {settings["primary_phone"] || "Phone"}</p>
              <p>Email: {settings["primary_email"] || "Email"}</p>
            </div>
          </article>

          {/* Updates */}
          <div className="rounded-2xl border bg-amber-50 p-6 shadow-sm">
            <p className="text-sm leading-6 text-gray-800">
              This Privacy Policy may be updated from time to time as we add new services like 
              online orders and tracking. Please review this page periodically for the latest updates.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
