import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
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
    <main className="min-h-screen bg-white text-gray-800">
      {/* Header */}
      <section className="bg-gray-50 border-b">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Terms & Conditions</h1>
          <p className="mt-3 text-sm md:text-base text-gray-600">
            These Terms & Conditions ("Terms") govern your use of products and services offered by <span className="font-medium">{settings["store_name"] || "Company"}</span>, including blinds, window blinds, mosquito nets, and related accessories (collectively, the "Products"). By placing an order or using our services, you agree to these Terms.
          </p>
          <p className="mt-1 text-xs text-gray-500">Last updated: 30 Aug 2025</p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid gap-6">
          {/* Scope */}
          <article className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">1) Products & Services</h2>
            <ul className="mt-3 list-disc pl-5 space-y-1 text-sm leading-6 text-gray-700">
              <li>We supply and install blinds (roller, zebra, vertical, wooden/venetian, etc.), window blinds, mosquito net systems (shutter, hinged, sliding, pleated), and related fittings.</li>
              <li>Custom measurements, fabrication, delivery, and on-site installation are available where specified in your order/quotation.</li>
              <li>All images, swatches, and samples are indicative; minor colour/texture variations may occur batch-to-batch.</li>
            </ul>
          </article>

          {/* Pricing */}
          <article className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">2) Pricing, Taxes & Additional Charges</h2>
            <ul className="mt-3 list-disc pl-5 space-y-1 text-sm leading-6 text-gray-700">
              <li><span className="font-medium">Product price</span>: As per the quotation or invoice shared. Prices are exclusive of taxes unless stated otherwise.</li>
              <li><span className="font-medium">Installation charges are separate</span> and will be quoted per unit, per sqft, or per visit depending on the system.</li>
              <li><span className="font-medium">Transportation/Delivery charges are separate</span> and vary by distance, accessibility, and order size.</li>
              <li>Any <span className="font-medium">site access costs</span> (permits, parking, entry fees) and <span className="font-medium">height work</span> (ladders/scaffolding) are billed additionally if required.</li>
              <li>Prices may change for design revisions, size changes, fabric changes, or add-ons requested after order confirmation.</li>
            </ul>
          </article>

          {/* Orders & Payment */}
          <article className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">3) Orders, Advance & Payment Terms</h2>
            <ul className="mt-3 list-disc pl-5 space-y-1 text-sm leading-6 text-gray-700">
              <li>Orders are processed only after receipt of the approved quotation and the specified advance payment.</li>
              <li>Balance is payable prior to installation or immediately upon completion, as mentioned in the quotation.</li>
              <li>Custom-made Products are non-returnable and non-refundable once fabrication starts.</li>
              <li>Delays in payment may delay delivery/installation schedules.</li>
            </ul>
          </article>

          {/* Measurements & Installation */}
          <article className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">4) Measurements, Delivery & Installation</h2>
            <ul className="mt-3 list-disc pl-5 space-y-1 text-sm leading-6 text-gray-700">
              <li>Measurements will be taken by our team or must be provided in writing by the customer. We rely on the latest confirmed measurements for fabrication.</li>
              <li>Estimated timelines will be communicated in the quotation. Timelines may vary due to material availability, weather, site readiness, or circumstances beyond control.</li>
              <li>The customer must ensure <span className="font-medium">site readiness</span> (finished walls/frames, clear access, power supply) on the agreed installation date.</li>
              <li>Any dismantling/disposal of old blinds/nets/frames is <span className="font-medium">not included</span> unless explicitly mentioned and may attract additional charges.</li>
            </ul>
          </article>

          {/* Warranty */}
          <article className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">5) Warranty & After-Sales</h2>
            <ul className="mt-3 list-disc pl-5 space-y-1 text-sm leading-6 text-gray-700">
              <li>Manufacturer warranty (if any) applies to mechanisms/hardware as per brand terms. Fabric/mesh wear, discoloration due to sunlight, and physical damage are typically excluded.</li>
              <li>Improper use, mishandling, moisture seepage, pest/rodent damage, or alterations by third parties void the warranty.</li>
              <li>Service visits outside warranty or for user damage/misuse will be chargeable (visit + parts, if applicable).</li>
            </ul>
          </article>

          {/* Cancellations */}
          <article className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">6) Cancellations & Returns</h2>
            <ul className="mt-3 list-disc pl-5 space-y-1 text-sm leading-6 text-gray-700">
              <li>Since most Products are custom-fabricated, cancellations after approval/advance are subject to costs already incurred.</li>
              <li>Returns are not accepted for made-to-measure items. Any defects must be reported within 48 hours of delivery/installation with photos.</li>
            </ul>
          </article>

          {/* Liability */}
          <article className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">7) Liability & Limitations</h2>
            <ul className="mt-3 list-disc pl-5 space-y-1 text-sm leading-6 text-gray-700">
              <li>Our liability is limited to repair, replacement, or refund (not exceeding the Product price) for proven manufacturing defects.</li>
              <li>We are not responsible for indirect or consequential losses, delays due to third-party logistics, or force majeure events.</li>
            </ul>
          </article>

          {/* Use & Care */}
          <article className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">8) Use & Care</h2>
            <ul className="mt-3 list-disc pl-5 space-y-1 text-sm leading-6 text-gray-700">
              <li>Operate blinds and nets gently; avoid forcing mechanisms. Keep tracks, channels, and meshes free from dust and debris.</li>
              <li>Avoid exposure to water/chemicals unless the product is rated for such conditions. Clean with a soft brush or dry cloth.</li>
            </ul>
          </article>

          {/* IP & Privacy */}
          <article className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">9) Intellectual Property & Content</h2>
            <p className="mt-3 text-sm leading-6 text-gray-700">
              All website content, catalogs, and design assets remain the property of {settings["store_name"] || "Company"} or respective owners. Reproduction without permission is prohibited.
            </p>
          </article>

          {/* Governing Law */}
          <article className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">10) Governing Law</h2>
            <p className="mt-3 text-sm leading-6 text-gray-700">
              These Terms are governed by the laws of your local jurisdiction/state where the order is fulfilled. Disputes, if any, shall be subject to the courts located in our primary place of business.
            </p>
          </article>

          {/* Contact */}
          <article className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Contact</h2>
            <div className="mt-3 text-sm leading-6 text-gray-700">
              <p><span className="font-medium">{settings["store_name"] || "Company"}</span></p>
              <p>{settings["store_address"] || "Address"}</p>
              <p>Phone: {settings["primary_phone"] || "Phone"}</p>
              <p>Email: {settings["primary_email"] || "Email"}</p>
            </div>
          </article>

          {/* Acceptance */}
          <div className="rounded-2xl border bg-amber-50 p-6 shadow-sm">
            <p className="text-sm leading-6 text-gray-800">
              By placing an order or using our services, you acknowledge that you have read, understood, and agree to be bound by these Terms.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
