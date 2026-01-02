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

export default function TermsPage() {
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
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-neutral-900 dark:text-white">Terms & Conditions</h1>
          <p className="mt-3 text-sm md:text-base text-neutral-600 dark:text-neutral-400">
            These Terms & Conditions ("Terms") govern your use of products and services offered by <span className="font-medium text-neutral-800 dark:text-neutral-200">{settings["store_name"] || "Company"}</span>, including blinds, window blinds, mosquito nets, and related accessories (collectively, the "Products"). By placing an order or using our services, you agree to these Terms.
          </p>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-500">Last updated: 30 Aug 2025</p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid gap-6">
          {/* Scope */}
          <article className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">1) Products & Services</h2>
            <ul className="mt-3 list-disc pl-5 space-y-1 text-sm leading-6 text-neutral-700 dark:text-neutral-400">
              <li>We supply and install blinds (roller, zebra, vertical, wooden/venetian, etc.), window blinds, mosquito net systems (shutter, hinged, sliding, pleated), and related fittings.</li>
              <li>Custom measurements, fabrication, delivery, and on-site installation are available where specified in your order/quotation.</li>
              <li>All images, swatches, and samples are indicative; minor colour/texture variations may occur batch-to-batch.</li>
            </ul>
          </article>

          {/* Pricing */}
          <article className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">2) Pricing, Taxes & Additional Charges</h2>
            <ul className="mt-3 list-disc pl-5 space-y-1 text-sm leading-6 text-neutral-700 dark:text-neutral-400">
              <li><span className="font-medium text-neutral-800 dark:text-neutral-200">Product price</span>: As per the quotation or invoice shared. Prices are exclusive of taxes unless stated otherwise.</li>
              <li><span className="font-medium text-neutral-800 dark:text-neutral-200">Installation charges are separate</span> and will be quoted per unit, per sqft, or per visit depending on the system.</li>
              <li><span className="font-medium text-neutral-800 dark:text-neutral-200">Transportation/Delivery charges are separate</span> and vary by distance, accessibility, and order size.</li>
              <li>Any <span className="font-medium text-neutral-800 dark:text-neutral-200">site access costs</span> (permits, parking, entry fees) and <span className="font-medium">height work</span> (ladders/scaffolding) are billed additionally if required.</li>
              <li>Prices may change for design revisions, size changes, fabric changes, or add-ons requested after order confirmation.</li>
            </ul>
          </article>

          {/* Orders & Payment */}
          <article className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">3) Orders, Advance & Payment Terms</h2>
            <ul className="mt-3 list-disc pl-5 space-y-1 text-sm leading-6 text-neutral-700 dark:text-neutral-400">
              <li>Orders are processed only after receipt of the approved quotation and the specified advance payment.</li>
              <li>Balance is payable prior to installation or immediately upon completion, as mentioned in the quotation.</li>
              <li>Custom-made Products are non-returnable and non-refundable once fabrication starts.</li>
              <li>Delays in payment may delay delivery/installation schedules.</li>
            </ul>
          </article>

          {/* Measurements & Installation */}
          <article className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">4) Measurements, Delivery & Installation</h2>
            <ul className="mt-3 list-disc pl-5 space-y-1 text-sm leading-6 text-neutral-700 dark:text-neutral-400">
              <li>Measurements will be taken by our team or must be provided in writing by the customer. We rely on the latest confirmed measurements for fabrication.</li>
              <li>Estimated timelines will be communicated in the quotation. Timelines may vary due to material availability, weather, site readiness, or circumstances beyond control.</li>
              <li>The customer must ensure <span className="font-medium text-neutral-800 dark:text-neutral-200">site readiness</span> (finished walls/frames, clear access, power supply) on the agreed installation date.</li>
              <li>Any dismantling/disposal of old blinds/nets/frames is <span className="font-medium text-neutral-800 dark:text-neutral-200">not included</span> unless explicitly mentioned and may attract additional charges.</li>
            </ul>
          </article>

          {/* Warranty */}
          <article className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">5) Warranty & After-Sales</h2>
            <ul className="mt-3 list-disc pl-5 space-y-1 text-sm leading-6 text-neutral-700 dark:text-neutral-400">
              <li>Manufacturer warranty (if any) applies to mechanisms/hardware as per brand terms. Fabric/mesh wear, discoloration due to sunlight, and physical damage are typically excluded.</li>
              <li>Improper use, mishandling, moisture seepage, pest/rodent damage, or alterations by third parties void the warranty.</li>
              <li>Service visits outside warranty or for user damage/misuse will be chargeable (visit + parts, if applicable).</li>
            </ul>
          </article>

          {/* Cancellations */}
          <article className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">6) Cancellations & Returns</h2>
            <ul className="mt-3 list-disc pl-5 space-y-1 text-sm leading-6 text-neutral-700 dark:text-neutral-400">
              <li>Since most Products are custom-fabricated, cancellations after approval/advance are subject to costs already incurred.</li>
              <li>Returns are not accepted for made-to-measure items. Any defects must be reported within 48 hours of delivery/installation with photos.</li>
            </ul>
          </article>

          {/* Liability */}
          <article className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">7) Liability & Limitations</h2>
            <ul className="mt-3 list-disc pl-5 space-y-1 text-sm leading-6 text-neutral-700 dark:text-neutral-400">
              <li>Our liability is limited to repair, replacement, or refund (not exceeding the Product price) for proven manufacturing defects.</li>
              <li>We are not responsible for indirect or consequential losses, delays due to third-party logistics, or force majeure events.</li>
            </ul>
          </article>

          {/* Use & Care */}
          <article className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">8) Use & Care</h2>
            <ul className="mt-3 list-disc pl-5 space-y-1 text-sm leading-6 text-neutral-700 dark:text-neutral-400">
              <li>Operate blinds and nets gently; avoid forcing mechanisms. Keep tracks, channels, and meshes free from dust and debris.</li>
              <li>Avoid exposure to water/chemicals unless the product is rated for such conditions. Clean with a soft brush or dry cloth.</li>
            </ul>
          </article>

          {/* IP & Privacy */}
          <article className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">9) Intellectual Property & Content</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-700 dark:text-neutral-400">
              All website content, catalogs, and design assets remain the property of {settings["store_name"] || "Company"} or respective owners. Reproduction without permission is prohibited.
            </p>
          </article>

          {/* Governing Law */}
          <article className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">10) Governing Law</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-700 dark:text-neutral-400">
              These Terms are governed by the laws of your local jurisdiction/state where the order is fulfilled. Disputes, if any, shall be subject to the courts located in our primary place of business.
            </p>
          </article>

          {/* Contact */}
          <article className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Contact</h2>
            <div className="mt-3 text-sm leading-6 text-neutral-700 dark:text-neutral-400">
              <p><span className="font-medium text-neutral-800 dark:text-neutral-200">{settings["store_name"] || "Company"}</span></p>
              <p>{settings["store_address"] || "Address"}</p>
              <p>Phone: {settings["primary_phone"] || "Phone"}</p>
              <p>Email: {settings["primary_email"] || "Email"}</p>
            </div>
          </article>

          {/* Acceptance */}
          <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/20 p-6 shadow-sm">
            <p className="text-sm leading-6 text-amber-900 dark:text-amber-200">
              By placing an order or using our services, you acknowledge that you have read, understood, and agree to be bound by these Terms.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}