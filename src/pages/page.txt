import { useState } from "react";
import { Mail, Globe, Send, Facebook, Instagram } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function MaintenancePage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "success" | "error" | "loading"
  >("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const formData = new FormData();
      formData.append("access_key", import.meta.env.VITE_WEB3_FORM);
      formData.append("email", email);
      formData.append("subject", "New Maintenance Notification Signup");
      formData.append(
        "message",
        `A user requested maintenance notification:\n\nEmail: ${email}`
      );

      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setStatus("success");
        setEmail("");
        toast.success("Thank you! We'll notify you when we're back.");
      } else {
        setStatus("error");
        toast.error("Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      toast.error("Connection error. Please check your internet.");
    }
  };

  return (
    <>
      <Toaster position="top-center" />
      <section className="flex flex-col md:flex-row h-screen bg-white overflow-hidden">
        <div className="md:hidden flex items-center justify-center py-8 px-4">
          <img
            src="https://i.ibb.co/G4Yf1jc6/maintain-new.png"
            alt="Website under maintenance"
            className="w-full max-w-xs object-contain"
          />
        </div>

        <div className="flex flex-col justify-center items-center px-6 sm:px-8 md:px-16 lg:px-20 py-8 md:py-12 md:w-1/2 text-center md:text-left space-y-8 overflow-auto">
          <div className="space-y-4 max-w-md w-full">
            <h1 className="flex flex-col items-center w-full text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
              Coming Back Soon!
            </div>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed text-center">
              We're currently upgrading our site with new designs and features.
              Please check back shortly.
            </p>
          </div>

          <div className="flex flex-col items-center w-full max-w-sm space-y-3">
            <span className="text-sm text-gray-600 font-medium">
              Get notified when we're live
            </span>
            <form
              onSubmit={handleSubmit}
              className="flex items-center bg-white rounded-lg border border-gray-300 overflow-hidden w-full shadow-sm focus-within:ring-2 focus-within:ring-gray-900 focus-within:border-transparent transition-all"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={status === "loading"}
                className="flex-1 px-4 py-3 text-sm bg-transparent focus:outline-none placeholder-gray-400 w-full"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="px-4 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50 flex-shrink-0"
                title="Notify me"
              >
                {status === "loading" ? (
                  <svg
                    className="w-4 h-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    ></path>
                  </svg>
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
          </div>

          <div className="pt-4 w-full max-w-sm">
            <p className="text-sm mb-3 text-gray-600 font-medium text-center">
              Follow Us
            </p>
            <div className="flex justify-center gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Facebook className="w-4 h-4 text-gray-600" />
              </a>
              <a
                href="https://instagram.com/decor.drapesinstyle"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Instagram className="w-4 h-4 text-gray-600" />
              </a>
              <a
                href="https://m.decordrapesinstyle.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Globe className="w-4 h-4 text-gray-600" />
              </a>
              <a
                href="mailto:contact@decordrapesinstyle.com"
                className="p-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Mail className="w-4 h-4 text-gray-600" />
              </a>
            </div>
          </div>
        </div>

        <div className="hidden md:flex md:w-1/2 bg-gray-50 items-center justify-center overflow-hidden">
          <img
            src="https://i.ibb.co/LhbsG65w/under-maintenance.png"
            alt="Website under maintenance"
            className="w-full h-full object-cover"
          />
        </div>
      </section>
    </>
  );
}
