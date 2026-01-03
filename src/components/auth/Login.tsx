import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
} from "firebase/auth";
import {
  ref,
  query,
  orderByChild,
  equalTo,
  get,
  set,
  update,
} from "../../config/firebase";
import {
  Eye,
  EyeOff,
  Check,
  X,
  ExternalLink,
  User as UserIcon,
  Shield,
  PenIcon,
  ArrowLeft,
} from "lucide-react";

import { database as db, auth } from "../../config/firebase";
const provider = new GoogleAuthProvider();

function firebaseErrorToMessage(errorCode: string): string {
  switch (errorCode) {
    case "auth/email-already-in-use":
      return "This email is already in use.";
    case "auth/invalid-email":
      return "Invalid email address.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/user-not-found":
      return "No user found with this email.";
    case "auth/wrong-password":
      return "Incorrect password.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    case "auth/popup-closed-by-user":
      return "Google sign-in was canceled.";
    case "auth/popup-blocked":
      return "Popup was blocked by your browser. Please allow popups for this site.";
    case "auth/operation-not-allowed":
      return "Google sign-in is not enabled. Please contact support.";
    case "auth/api-key-not-valid":
      return "Authentication error. Please check your Firebase configuration.";
    default:
      return "Something went wrong. Please try again.";
  }
}

const validatePasswordStrength = (password: string) => {
  const requirements = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  };

  const isValid =
    requirements.minLength &&
    requirements.hasUpperCase &&
    requirements.hasLowerCase;
  const isStrong = Object.values(requirements).every(Boolean);

  return {
    requirements,
    isValid,
    isStrong,
    score: Object.values(requirements).filter(Boolean).length,
  };
};

const CompactPasswordStrength = ({ password }: { password: string }) => {
  const validation = validatePasswordStrength(password);

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
          Strength:
        </span>
        <span
          className={`text-xs font-medium ${
            validation.isStrong
              ? "text-green-600"
              : validation.isValid
              ? "text-yellow-600"
              : "text-red-600"
          }`}
        >
          {validation.isStrong
            ? "Strong"
            : validation.isValid
            ? "Good"
            : "Weak"}
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all duration-300 ${
            validation.isStrong
              ? "bg-green-500 w-full"
              : validation.isValid
              ? "bg-yellow-500 w-3/4"
              : "bg-red-500 w-1/3"
          }`}
        />
      </div>
    </div>
  );
};

const CompactPasswordRequirements = ({
  password,
  showAll = false,
}: {
  password: string;
  showAll?: boolean;
}) => {
  const validation = validatePasswordStrength(password);

  if (!password || (validation.isValid && !showAll)) return null;

  const requiredMet = [
    validation.requirements.minLength,
    validation.requirements.hasUpperCase,
    validation.requirements.hasLowerCase,
  ].every(Boolean);

  if (!requiredMet || showAll) {
    return (
      <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
          Requirements:
        </p>
        <div className="grid grid-cols-1 gap-1">
          <RequirementItem
            met={validation.requirements.minLength}
            text="8+ characters"
          />
          <RequirementItem
            met={validation.requirements.hasUpperCase}
            text="Uppercase letter"
          />
          <RequirementItem
            met={validation.requirements.hasLowerCase}
            text="Lowercase letter"
          />
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
            <Check size={12} className="mr-1 text-gray-400" />
            Numbers & special chars recommended
          </div>
        </div>
      </div>
    );
  }

  return null;
};

const RequirementItem = ({ met, text }: { met: boolean; text: string }) => (
  <div className="flex items-center">
    <div
      className={`flex-shrink-0 w-3 h-3 rounded-full flex items-center justify-center mr-2 ${
        met
          ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
          : "bg-gray-100 text-gray-400 dark:bg-gray-700"
      }`}
    >
      {met ? <Check size={10} /> : <X size={10} />}
    </div>
    <span
      className={`text-xs ${
        met
          ? "text-green-700 dark:text-green-400"
          : "text-gray-600 dark:text-gray-400"
      }`}
    >
      {text}
    </span>
  </div>
);

const AdminPrivilegeModal = ({
  isOpen,
  onClose,
  onConfirm,
  user,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  user: any;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-sm mx-4 animate-fadeIn">
        <div className="flex items-center space-x-3 mb-4">
          {user?.profileImage ? (
            <img
              src={user.profileImage}
              alt="Avatar"
              className="w-12 h-12 rounded-full object-cover border border-gray-300 dark:border-gray-600"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center border border-blue-200 dark:border-blue-700">
              <UserIcon
                size={20}
                className="text-blue-600 dark:text-blue-400"
              />
            </div>
          )}
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">
              {user?.displayName || user?.email?.split("@")[0]}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
              {user?.role} Privileges
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <Shield size={16} className="text-blue-600 dark:text-blue-400" />
          <p className="text-sm text-gray-700 dark:text-gray-300">
            You have administrative access. Would you like to proceed to the
            admin panel?
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200"
          >
            Stay on Main Site
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <span>Go to Admin</span>
            <ExternalLink size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

const Login = () => {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [step, setStep] = useState<
    | "email"
    | "login"
    | "forgot_password"
    | "signup_name"
    | "signup_password"
    | "verify_email"
  >("email");

  const [email, setEmail] = useState("");
  const [_userExists, setUserExists] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [tempEmailError, setTempEmailError] = useState("");

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [displayName, setDisplayName] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [signupError, setSignupError] = useState("");
  const [showPasswordGuide, setShowPasswordGuide] = useState(false);

  const [forgotPasswordError, setForgotPasswordError] = useState("");
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState("");

  const [loading, setLoading] = useState(false);

  const [_verificationSent, setVerificationSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [emailForVerification, setEmailForVerification] = useState("");

  const [showGoogleError, setShowGoogleError] = useState("");

  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [_isAdminUser, setIsAdminUser] = useState(false);
  const [hasProcessedAdmin, setHasProcessedAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await user.reload(); // Make sure to get the latest user state
        if (user.emailVerified) {
          const userRef = ref(db, `users/${user.uid}`);
          const snapshot = await get(userRef);

          if (snapshot.exists()) {
            const userData = snapshot.val();
            const hasAdminRole = ["admin", "employee", "production"].includes(
              userData.role
            );

            if (hasAdminRole && !hasProcessedAdmin) {
              setAdminUser(userData);
              setIsAdminUser(true);
              setShowAdminModal(true);
              setHasProcessedAdmin(true);
            } else {
              navigate("/profile");
            }
          } else {
            navigate("/profile");
          }
        } else {
          setEmailForVerification(user.email || "");
          await auth.signOut();
          setVerificationRequired(true);
        }
      } else {
        setAuthChecked(true);
        setHasProcessedAdmin(false);
      }
    });

    return () => {
      unsubscribe();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [navigate, hasProcessedAdmin]);

  async function isDisposableEmail(email: string) {
    try {
      const domain = email.split("@")[1];
      const res = await fetch(
        `https://open.kickbox.com/v1/disposable/${domain}`
      );
      const data = await res.json();
      return data.disposable;
    } catch {
      return false;
    }
  }

  const checkEmailExists = async (email: string) => {
    const q = query(
      ref(db, "users"),
      orderByChild("email"),
      equalTo(email.trim().toLowerCase())
    );
    const snapshot = await get(q);
    return snapshot.exists();
  };

  const saveUserToDB = async (
    user: User,
    name: string,
    createdWith: "email" | "gmail"
  ) => {
    const userRef = ref(db, `users/${user.uid}`);
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
      await update(userRef, {
        lastLogin: new Date().toISOString(),
      });
    } else {
      const userData = {
        displayName: name || user.displayName || "",
        uid: user.uid,
        email: user.email,
        profileImage: "",
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        createdWith: createdWith,
      };
      await set(userRef, userData);
    }
  };

  const handleGoogleUser = async (user: User) => {
    const userRef = ref(db, `users/${user.uid}`);
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
      const userData = snapshot.val();
      const updates: any = {
        lastLogin: new Date().toISOString(),
      };

      if (
        (!userData.displayName || userData.displayName === "") &&
        user.displayName
      ) {
        updates.displayName = user.displayName;
      }

      if (
        (!userData.profileImage || userData.profileImage === "") &&
        user.photoURL
      ) {
        updates.profileImage = user.photoURL;
      }

      if (Object.keys(updates).length > 1) {
        await update(userRef, updates);
      }
    } else {
      const userData = {
        displayName: user.displayName || "",
        uid: user.uid,
        email: user.email,
        profileImage: user.photoURL || "",
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        createdWith: "gmail",
      };
      await set(userRef, userData);
    }
  };

  const pollEmailVerification = (user: User) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(async () => {
      try {
        await user.reload();
        if (user.emailVerified) {
          setEmailVerified(true);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          navigate("/profile");
        }
      } catch (error) {
        console.error("Error checking email verification:", error);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      }
    }, 3000);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    setTempEmailError("");
    setLoading(true);

    if (!email.includes("@")) {
      setEmailError("Please enter a valid email.");
      setLoading(false);
      return;
    }

    const disposable = await isDisposableEmail(email);
    if (disposable) {
      setTempEmailError("Temporary/disposable emails are not allowed.");
      setLoading(false);
      return;
    }

    try {
      const exists = await checkEmailExists(email);
      setUserExists(exists);
      if (exists) setStep("login");
      else setStep("signup_name");
    } catch (error) {
      console.error("Error checking email:", error);
      setEmailError("Failed to check email. Try again.");
    }
    setLoading(false);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setLoginError(firebaseErrorToMessage(err.code || ""));
    }
    setLoading(false);
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordError("");
    setForgotPasswordSuccess("");
    setLoading(true);
    if (!email || !email.includes("@")) {
      setForgotPasswordError("Please enter a valid email.");
      setLoading(false);
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setForgotPasswordSuccess(
        "Password reset email sent. Please check your inbox."
      );
    } catch (err: any) {
      setForgotPasswordError(firebaseErrorToMessage(err.code || ""));
    }
    setLoading(false);
  };

  const handleSignupNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError("");
    if (!displayName.trim()) {
      setSignupError("Please enter your name.");
      return;
    }
    setStep("signup_password");
  };

  const handleSignupPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError("");

    const validation = validatePasswordStrength(signupPassword);

    if (!validation.isValid) {
      setSignupError(
        "Please meet the minimum password requirements to continue."
      );
      setShowPasswordGuide(true);
      return;
    }

    if (signupPassword !== confirmPassword) {
      setSignupError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const newUser = await createUserWithEmailAndPassword(
        auth,
        email,
        signupPassword
      );
      await sendEmailVerification(newUser.user);
      await saveUserToDB(newUser.user, displayName, "email");
      setVerificationSent(true);
      setStep("verify_email");
      pollEmailVerification(newUser.user);
    } catch (err: any) {
      setSignupError(firebaseErrorToMessage(err.code || ""));
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setShowGoogleError("");
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      await handleGoogleUser(result.user);
    } catch (err: any) {
      const errorMessage = firebaseErrorToMessage(err.code || "");
      setShowGoogleError(errorMessage);
      console.error("Google sign-in error:", err);
    }
    setLoading(false);
  };

  const handleAdminRedirect = () => {
    const sessionToken =
      Math.random().toString(36).substring(2) + Date.now().toString(36);
    const redirectData = {
      token: sessionToken,
      email: adminUser.email,
      timestamp: Date.now(),
      source: "main_site",
    };
    sessionStorage.setItem("adminRedirectData", JSON.stringify(redirectData));
    const adminUrl = `https://admin.decordrapesinstyle.com?token=${sessionToken}&email=${encodeURIComponent(
      adminUser.email
    )}&source=main_site`;
    window.open(adminUrl, "_blank");

    setShowAdminModal(false);
    navigate("/profile");
  };

  const handleAdminModalClose = () => {
    setShowAdminModal(false);
    navigate("/profile");
  };

  const VerificationStep = () => (
    <div className="text-center space-y-4">
      <p className="text-lg font-semibold text-gray-900 dark:text-white">
        Verification email sent to <strong>{email}</strong>.
      </p>
      <p className="text-gray-600 dark:text-gray-400">
        Please check your inbox and verify your email.
      </p>
      {emailVerified ? (
        <p className="text-green-600 font-semibold">
          Email verified! Redirecting...
        </p>
      ) : (
        <p className="text-gray-600 dark:text-gray-400 italic">
          Waiting for verification...
        </p>
      )}
      <button
        className="mt-4 text-blue-600 dark:text-blue-400 hover:underline"
        onClick={() => navigate("/")}
      >
        Verify later
      </button>
    </div>
  );

  if (!authChecked && !verificationRequired) {
    return (
      <div className="min-h-screen w-full bg-gray-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Please wait...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {verificationRequired ? (
      <div className="min-h-screen w-full bg-gray-50 dark:bg-neutral-950 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white dark:bg-neutral-900 shadow-xl rounded-2xl p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Email Verification Required</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Your email <span className="font-medium">{emailForVerification}</span> is not verified. Please verify your email before logging in.
            </p>
          </div>
          <button
            onClick={() => {
              setVerificationRequired(false);
              setEmailForVerification("");
              setStep("login");
            }}
            className="w-full bg-neutral-900 text-neutral-100 py-3 rounded-full font-medium hover:bg-neutral-800 transition"
          >
            I have verified my email
          </button>
        </div>
      </div>
    ) : (
      <div className="min-h-screen w-full bg-gray-50 dark:bg-neutral-950 flex flex-col items-center justify-center px-4 py-12 transition-colors duration-200 relative">
        {step === "email" && (
          <Link
            to="/"
            className="absolute top-8 left-8 z-10 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-neutral-950 rounded-lg shadow-sm hover:bg-neutral-800 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-neutral-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Home
          </Link>
        )}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <img
              src="https://res.cloudinary.com/dmiwq3l2s/image/upload/v1763815775/dchfnweml4bh0epchpjv.svg"
              alt="Decor Drapes Instyle"
              className="h-16 mx-auto mb-4"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Blinds & curtains, Designed your way
            </p>
          </Link>
        </div>

        <div className="w-full max-w-md bg-white dark:bg-neutral-900 shadow-xl rounded-2xl p-6 md:p-8 lg:p-8 space-y-6 transition-colors duration-200">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full flex justify-center items-center gap-2 border border-gray-300 dark:border-gray-600 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition disabled:opacity-50"
            disabled={loading}
          >
            <img
              src="https://res.cloudinary.com/ds6um53cx/image/upload/v1754730922/goypyiizaob8qcc6luzj.png"
              alt="Google"
              className="h-5 w-5"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {loading ? "Signing in..." : "Continue with Google"}
            </span>
          </button>
          {showGoogleError && (
            <p className="text-red-600 text-center mt-1">{showGoogleError}</p>
          )}

          <div className="flex items-center space-x-4 my-4">
            <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
            <span className="text-gray-400 dark:text-gray-500 text-sm">or</span>
            <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
          </div>

          {step === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3
rounded-xl
bg-white dark:bg-neutral-900
text-neutral-900 dark:text-neutral-100
placeholder-neutral-400 dark:placeholder-neutral-500
border border-neutral-300 dark:border-neutral-700
focus:outline-none
focus:border-neutral-900 dark:focus:border-neutral-100
focus:ring-0
transition"
                  placeholder="Enter your email"
                />
                {emailError && (
                  <p className="text-red-600 text-sm mt-1">{emailError}</p>
                )}
                {tempEmailError && (
                  <p className="text-red-600 text-sm mt-1">{tempEmailError}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-neutral-900 text-neutral-100 py-3 rounded-full font-medium hover:bg-neutral-800 transition disabled:opacity-50 disabled:cursor-not-allowed dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
              >
                {loading ? "Checking..." : "Continue"}
              </button>
            </form>
          )}

          {step === "login" && (
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <div
                className="
  flex items-center 
  text-xs
  text-neutral-700 dark:text-neutral-300
  mb-2
  overflow-hidden
  whitespace-nowrap
"
              >
                <span className="shrink-0">Signed in as</span>

                <strong
                  className="
      ml-1
      max-w-[55%]
      truncate
      font-medium
      text-neutral-900 dark:text-neutral-100
    "
                  title={email}
                >
                  {email}
                </strong>

                <button
                  type="button"
                  className="
      ml-2
      shrink-0
      text-neutral-700 dark:text-neutral-300
      hover:text-neutral-900 dark:hover:text-neutral-100
      hover:underline
      transition
      font-medium
    "
                  onClick={() => {
                    setStep("email");
                    setEmail("");
                    setPassword("");
                    setLoginError("");
                  }}
                >
                  <PenIcon size={14} />
                </button>
              </div>

              <div className="relative">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 pr-10
rounded-xl
bg-white dark:bg-neutral-900
text-neutral-900 dark:text-neutral-100
placeholder-neutral-400 dark:placeholder-neutral-500
border border-neutral-300 dark:border-neutral-700
focus:outline-none
focus:border-neutral-900 dark:focus:border-neutral-100
focus:ring-0
transition"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute top-10 right-4 text-gray-500 dark:text-gray-400"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
                {loginError && (
                  <p className="text-red-600 text-sm mt-1">{loginError}</p>
                )}
              </div>

              <div className="flex justify-between items-center">
                <button
                  type="button"
                  className="text-sm
text-neutral-700 dark:text-neutral-300
hover:text-neutral-900 dark:hover:text-neutral-100
hover:underline
transition"
                  onClick={() => {
                    setForgotPasswordError("");
                    setForgotPasswordSuccess("");
                    setStep("forgot_password");
                  }}
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-neutral-900 text-neutral-100 py-3 rounded-full font-medium hover:bg-neutral-800 transition disabled:opacity-50 disabled:cursor-not-allowed dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>
          )}

          {step === "forgot_password" && (
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="forgotEmail"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Enter your email to reset password
                </label>
                <input
                  type="email"
                  id="forgotEmail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3
rounded-xl
bg-white dark:bg-neutral-900
text-neutral-900 dark:text-neutral-100
placeholder-neutral-400 dark:placeholder-neutral-500
border border-neutral-300 dark:border-neutral-700
focus:outline-none
focus:border-neutral-900 dark:focus:border-neutral-100
focus:ring-0
transition"
                  placeholder="Your email"
                />
                {forgotPasswordError && (
                  <p className="text-red-600 text-sm mt-1">
                    {forgotPasswordError}
                  </p>
                )}
                {forgotPasswordSuccess && (
                  <p className="text-green-600 text-sm mt-1">
                    {forgotPasswordSuccess}
                  </p>
                )}
              </div>

              <div className="flex justify-between items-center">
                <button
                  type="button"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:underline"
                  onClick={() => {
                    setForgotPasswordError("");
                    setForgotPasswordSuccess("");
                    setPassword("");
                    setLoginError("");
                    setStep("login");
                  }}
                >
                  Back to login
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-neutral-900 text-neutral-100 py-3 rounded-full font-medium hover:bg-neutral-800 transition disabled:opacity-50 disabled:cursor-not-allowed dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
              >
                {loading ? "Sending reset email..." : "Send Reset Email"}
              </button>
            </form>
          )}

          {step === "signup_name" && (
            <>
              <div
                className="
  flex items-center gap-1
  text-xs italic
  text-neutral-600 dark:text-neutral-400
  mb-4
  overflow-hidden
  whitespace-nowrap
"
              >
                <span className="shrink-0">Setting up your account for</span>

                <strong
                  className="
      ml-1
      max-w-[55%]
      truncate
      not-italic
      font-medium
      text-emerald-700/80 dark:text-emerald-300/80
    "
                  title={email}
                >
                  {email}
                </strong>

                <button
                  type="button"
                  className="
      ml-2
      shrink-0
      not-italic
      text-neutral-600 dark:text-neutral-400
      hover:text-neutral-900 dark:hover:text-neutral-100
      hover:underline
      transition
      font-medium
    "
                  onClick={() => {
                    setStep("email");
                    setEmail("");
                    setDisplayName("");
                    setSignupPassword("");
                    setConfirmPassword("");
                    setSignupError("");
                  }}
                >
                  <PenIcon size={14} />
                </button>
              </div>

              <form onSubmit={handleSignupNameSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="displayName"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    className="w-full px-4 py-3
rounded-xl
bg-white dark:bg-neutral-900
text-neutral-900 dark:text-neutral-100
placeholder-neutral-400 dark:placeholder-neutral-500
border border-neutral-300 dark:border-neutral-700
focus:outline-none
focus:border-neutral-900 dark:focus:border-neutral-100
focus:ring-0
transition"
                    placeholder="Your full name"
                  />
                  {signupError && (
                    <p className="text-red-600 text-sm mt-1">{signupError}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-neutral-900 text-neutral-100 py-3 rounded-full font-medium hover:bg-neutral-800 transition disabled:opacity-50 disabled:cursor-not-allowed dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
                >
                  Continue
                </button>
              </form>
            </>
          )}

          {step === "signup_password" && (
            <>
              <div className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                Creating account for <strong>{email}</strong>{" "}
                <button
                  type="button"
                  className="text-neutral-700 dark:text-neutral-300
hover:text-neutral-900 dark:hover:text-neutral-100
hover:underline
ml-2
transition"
                  onClick={() => {
                    setStep("signup_name");
                    setSignupError("");
                    setShowPasswordGuide(false);
                  }}
                >
                  Change
                </button>
              </div>

              <form onSubmit={handleSignupPasswordSubmit} className="space-y-4">
                <div className="relative">
                  <label
                    htmlFor="signupPassword"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Password
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="signupPassword"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    onFocus={() => setShowPasswordGuide(true)}
                    required
                    className="w-full px-4 py-3
rounded-xl
bg-white dark:bg-neutral-900
text-neutral-900 dark:text-neutral-100
placeholder-neutral-400 dark:placeholder-neutral-500
border border-neutral-300 dark:border-neutral-700
focus:outline-none
focus:border-neutral-900 dark:focus:border-neutral-100
focus:ring-0
transition"
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    className="absolute top-10 right-4 text-gray-500 dark:text-gray-400"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>

                  <CompactPasswordStrength password={signupPassword} />
                </div>

                <CompactPasswordRequirements
                  password={signupPassword}
                  showAll={
                    showPasswordGuide || signupError.includes("requirements")
                  }
                />

                <div className="relative">
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Confirm Password
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3
rounded-xl
bg-white dark:bg-neutral-900
text-neutral-900 dark:text-neutral-100
placeholder-neutral-400 dark:placeholder-neutral-500
border border-neutral-300 dark:border-neutral-700
focus:outline-none
focus:border-neutral-900 dark:focus:border-neutral-100
focus:ring-0
transition"
                    placeholder="Confirm your password"
                  />
                </div>

                {signupError && (
                  <p className="text-red-600 text-sm mt-1">{signupError}</p>
                )}

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    className="text-gray-500 dark:text-gray-400 underline"
                    onClick={() => {
                      setStep("signup_name");
                      setSignupError("");
                      setShowPasswordGuide(false);
                    }}
                  >
                    Back
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-neutral-900 text-neutral-100
px-6 py-3 rounded-xl
font-medium
hover:bg-neutral-800
transition
disabled:opacity-50 disabled:cursor-not-allowed
dark:bg-neutral-100 dark:text-neutral-900
dark:hover:bg-neutral-200
"
                  >
                    {loading ? "Creating..." : "Create Account"}
                  </button>
                </div>
              </form>
            </>
          )}

          {step === "verify_email" && <VerificationStep />}
        </div>
      </div>
)}
      <AdminPrivilegeModal
        isOpen={showAdminModal}
        onClose={handleAdminModalClose}
        onConfirm={handleAdminRedirect}
        user={adminUser}
      />
    </>
  );
};

export default Login;
