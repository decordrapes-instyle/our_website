import { useEffect } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { getAuth, getRedirectResult } from "../config/firebase";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const auth = getAuth();

  useEffect(() => {
    const mode = searchParams.get("mode");
    const oobCode = searchParams.get("oobCode");
    const continueUrl = searchParams.get("continueUrl") || "/";

    if (mode && oobCode) {
      if (mode === "verifyEmail") {
        navigate(
          `/auth/verified?oobCode=${oobCode}&continueUrl=${continueUrl}`,
          { replace: true }
        );
      } else if (mode === "resetPassword") {
        navigate(
          `/auth/reset-password?oobCode=${oobCode}&continueUrl=${continueUrl}`,
          { replace: true }
        );
      } else {
        navigate("/404", { replace: true });
      }
      return;
    }

    if (location.pathname === "/auth/login") {
      getRedirectResult(auth)
        .then((result) => {
          if (result?.user) {
            navigate("/profile", { replace: true });
          } else {
            navigate("/login", { replace: true });
          }
        })
        .catch(() => {
          navigate("/login", { replace: true });
        });
    }
  }, [auth, location.pathname, navigate, searchParams]);

  return <p className="text-center mt-10">Processing authentication...</p>;
}
