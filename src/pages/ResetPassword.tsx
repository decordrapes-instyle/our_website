import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { getAuth, sendPasswordResetEmail, verifyPasswordResetCode, confirmPasswordReset } from "../config/firebase";
import { Mail, Lock, AlertTriangle, CheckCircle, ArrowLeft } from "lucide-react";

export default function ResetPassword() {
  const auth = getAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [oobCode, setOobCode] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const code = searchParams.get("oobCode");
    if (code) {
      setOobCode(code);
      setLoading(true);
      verifyPasswordResetCode(auth, code)
        .then((email) => {
          setVerifiedEmail(email);
          setError("");
        })
        .catch(() => {
          setError("Invalid or expired password reset link. Please try again.");
        })
        .finally(() => setLoading(false));
    } else {
      setOobCode(null);
      setVerifiedEmail(null);
      setError("");
    }
  }, [searchParams, auth]);

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!email) {
      setError("Please enter your email.");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email, {
        url: window.location.origin + "/reset-password",
        handleCodeInApp: true,
      });
      setMessage("Password reset email sent! Please check your inbox.");
      setEmailSent(true);
    } catch (err: any) {
      setError(err.message || "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 6) {
      setError("Password should be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!oobCode) {
      setError("Invalid password reset code.");
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setMessage("Password reset successful! You can now login with your new password.");
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err: any) {
        setError(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-950 px-4 transition-colors">
      <div className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl p-6 sm:p-10 border dark:border-neutral-800">
        <div className="absolute top-4 left-4">
            <Link
              to="/"
              className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Home
            </Link>
        </div>

        <h2 className="text-2xl font-semibold mb-6 text-center text-gray-900 dark:text-white pt-8">
          Reset Password
        </h2>

        {error && (
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm rounded-md">
              <AlertTriangle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {message && (
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-2 px-4 py-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-sm rounded-md">
              <CheckCircle size={18} className="shrink-0" />
              <span>{message}</span>
            </div>
          </div>
        )}

        {oobCode && verifiedEmail ? (
          <>
            <p className="mb-6 text-center text-gray-700 dark:text-neutral-300 text-base">
              Reset password for{" "}
              <strong className="text-blue-600 dark:text-blue-400">{verifiedEmail}</strong>
            </p>

            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-neutral-500"
                />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm transition-colors"
                  placeholder="Enter new password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs p-3 rounded-lg">
                Your password must be at least 6 characters.
              </div>

              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-neutral-500"
                />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm transition-colors"
                  placeholder="Confirm new password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>

              <div className="pt-2 flex justify-center">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-neutral-800 text-white hover:bg-neutral-900 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-neutral-300 py-2.5 px-8 rounded-full transition text-sm font-medium disabled:opacity-50"
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            {!message && (
                <p className="mb-4 text-center text-gray-700 dark:text-neutral-300 text-base">
                  Forgot your password? Enter your email below to receive a reset
                  link.
                </p>
            )}
            {!emailSent && (
              <form onSubmit={handleSendResetEmail} className="space-y-5">
                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-neutral-500"
                  />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm transition-colors"
                    placeholder="Enter your email"
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="pt-2 flex justify-center">
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-neutral-800 text-white hover:bg-neutral-900 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-neutral-300 py-2.5 px-8 rounded-full transition text-sm font-medium disabled:opacity-50"
                    >
                      {loading ? "Sending..." : "Send Reset Link"}
                    </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
