import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getAuth, applyActionCode } from "../config/firebase";

export default function Verified() {
  const auth = getAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const verifyEmail = async () => {
      const oobCode = searchParams.get("oobCode");
      if (!oobCode) {
        navigate("/profile");
        return;
      }

      try {
        await applyActionCode(auth, oobCode);
        setStatus("success");
        setMessage("Your email has been successfully verified!");
        redirectTo("/login");
      } catch (err: any) {
        const user = auth.currentUser;
        if (user?.emailVerified) {
          setStatus("success");
          setMessage("Your email is already verified!");
          redirectTo("/login");
        } else {
          setStatus("error");
          // Provide a friendly, slightly detailed reason where possible
          const reason =
            err?.code === "auth/invalid-action-code"
              ? "Invalid or expired verification link."
              : err?.message || "Failed to verify email. Please try again.";
          setMessage(reason);
        }
      }
    };

    verifyEmail();
  }, []);

  const redirectTo = (path: string) => {
    setTimeout(() => navigate(path), 4000);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white dark:bg-slate-950 px-6">
      <style>{`
        @keyframes floatUp { from { transform: translateY(8px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        @keyframes tearMove { 0% { transform: translateY(0) rotate(0deg) } 50% { transform: translateY(-6px) rotate(-6deg) } 100% { transform: translateY(0) rotate(0deg) } }
        .fade-in { animation: floatUp 420ms ease both; }
        .tear-anim { animation: tearMove 900ms ease-in-out infinite; transform-origin: center; }
      `}</style>

      <div className="max-w-xl w-full text-center">
        {/* Big SVG area */}
        <div className="flex flex-col items-center gap-6">
          <div
            className="w-56 h-40 flex items-center justify-center rounded-xl shadow-lg bg-white dark:bg-slate-800/50 fade-in"
            aria-hidden="true"
            role="img"
          >
            {/* Success SVG */}
            {status === "loading" && (
              <svg viewBox="0 0 160 116" className="w-40 h-28">
                {/* envelope box */}
                <rect x="8" y="20" width="144" height="76" rx="8" className="fill-gray-100 dark:fill-slate-700" stroke="#e6e7ea" />
                {/* flap */}
                <polygon points="8,20 80,64 152,20" className="fill-indigo-50 dark:fill-slate-600" />
                {/* spinner center */}
                <g transform="translate(80,50)">
                  <circle r="14" className="fill-indigo-100 dark:fill-slate-500" />
                  <g className="animate-spin" style={{ transformOrigin: "80px 50px" }}>
                    <path d="M-6 -10 a6 6 0 0 1 12 0" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" fill="none" />
                  </g>
                </g>
              </svg>
            )}

            {/* Success - envelope with check */}
            {status === "success" && (
              <svg viewBox="0 0 160 116" className="w-44 h-32">
                <rect x="6" y="22" width="148" height="74" rx="10" className="fill-white dark:fill-slate-700" stroke="#eef2ff" strokeWidth="1.5" />
                <polygon points="6,22 80,4 154,22" className="fill-gray-50 dark:fill-slate-600" stroke="#eef2ff" />
                <polyline points="18,28 80,66 142,28" className="fill-gray-100 dark:fill-slate-500" stroke="#e2e8f0" />
                {/* big green check badge */}
                <g transform="translate(80,58)">
                  <circle r="18" className="fill-emerald-50 dark:fill-emerald-900/50" />
                  <path d="M-7 0 L-2 6 L9 -6" stroke="#10b981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </g>
                {/* little confetti */}
                <g>
                  <rect x="22" y="12" width="4" height="4" fill="#fde68a" transform="rotate(12 24 14)" />
                  <rect x="130" y="12" width="4" height="4" fill="#bfdbfe" transform="rotate(-20 132 14)" />
                  <rect x="40" y="6" width="3" height="6" fill="#fecdd3" transform="rotate(6 41 9)" />
                </g>
              </svg>
            )}

            {/* Error - torn envelope */}
            {status === "error" && (
              <svg viewBox="0 0 160 116" className="w-44 h-32">
                {/* left half */}
                <g className="tear-anim" transform="translate(0,0)">
                  <rect x="6" y="22" width="74" height="74" rx="10" className="fill-red-50 dark:fill-red-900/20" stroke="#fee2e2" />
                  <polygon points="6,22 44,60 80,22" className="fill-red-100 dark:fill-red-900/30" />
                </g>

                {/* right half moving opposite */}
                <g className="tear-anim" style={{ animationDelay: "120ms" }} transform="translate(0,0)">
                  <rect x="82" y="22" width="74" height="74" rx="10" className="fill-red-50 dark:fill-red-900/20" stroke="#fee2e2" />
                  <polygon points="80,22 116,60 154,22" className="fill-red-100 dark:fill-red-900/30" />
                </g>

                {/* jagged tear line */}
                <path d="M80 28 L75 42 L83 50 L75 58 L82 68 L75 78" stroke="#fca5a5" strokeWidth="2" strokeLinecap="round" fill="none" />

                {/* sad cross */}
                <g transform="translate(80,62)">
                  <circle r="18" className="fill-red-100 dark:fill-red-900/50" />
                  <path d="M-6 -6 L6 6 M6 -6 L-6 6" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
                </g>
              </svg>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-50">
            {status === "success" ? "Congratulations!" : status === "loading" ? "Almost there…" : "Oops! something went wrong"}
          </h1>

          {/* Subtext / reason */}
          <p className="text-gray-600 dark:text-gray-400 max-w-lg mx-auto mt-2">
            {status === "success"
              ? message || "Your email has been verified. You can now log in."
              : status === "loading"
              ? message || "Verifying your email — this may take a few seconds."
              : message || "We couldn't verify your email. Please check the link or try again."}
          </p>

          {/* If error, show a small 'reason' box that is subtle */}
          {status === "error" && (
            <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-500/30 text-red-700 dark:text-red-300 rounded-md px-4 py-3 text-sm max-w-md mx-auto">
              <strong className="block font-medium">Reason:</strong>
              <span className="block mt-1">{message}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-6 flex gap-3 justify-center">
            <button
              onClick={() => navigate("/login")}
              className="px-5 py-2 rounded-lg bg-gray-900 text-white font-medium shadow-sm hover:bg-gray-800 transition focus:outline-none focus:ring-0"
            >
              Go to Login
            </button>

            {/* Retry only shown when error */}
            {status === "error" && (
              <button
                onClick={() => {
                  // retry: re-run effect by forcing a reload of the page query param handling
                  const oob = searchParams.get("oobCode");
                  if (oob) {
                    setStatus("loading");
                    // quick re-run: attempt again
                    applyActionCode(auth, oob)
                      .then(() => {
                        setStatus("success");
                        setMessage("Your email has been successfully verified!");
                        
                      })
                      .catch((err: any) => {
                        const reason =
                          err?.code === "auth/invalid-action-code"
                            ? "Invalid or expired verification link."
                            : err?.message || "Failed to verify email. Please try again.";
                        setStatus("error");
                        setMessage(reason);
                      });
                  } else {
                    navigate("/profile");
                  }
                }}
                className="px-5 py-2 rounded-lg bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-800 dark:text-gray-50 font-medium shadow-sm hover:bg-gray-50 dark:hover:bg-slate-600 transition focus:outline-none focus:ring-0"
              >
                Retry
              </button>
            )}
          </div>

          {/* small helper text */}
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
            Ready to roll? Tap above to jump in!
          </p>
        </div>
      </div>
    </div>
  );
}
