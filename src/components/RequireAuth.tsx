import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";

export const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // 🔥 Allow certain pages to load WITHOUT requiring auth
  const allowedPaths = [
    "/success",        // Stripe return page MUST always bypass protection
    "/cancel",         // optional
    "/auth",           // login
    "/reset-password", // password reset
    "/forgot-password"
  ];

  const currentPath = location.pathname;

  const isAllowed =
    allowedPaths.some((p) => currentPath.startsWith(p));

  useEffect(() => {
    // ⛔ Do NOT redirect while session is still hydrating
    if (loading) return;

    // ⛔ If already allowed (success page), skip redirect entirely
    if (isAllowed) return;

    // 🔐 Redirect unauthenticated user ONCE hydration is finished
    if (!user) {
      navigate(`/auth?redirect=${encodeURIComponent(currentPath)}`);
    }
  }, [user, loading, navigate, currentPath, isAllowed]);

  // ⏳ Show loading screen ONLY while session is hydrating
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 🔓 Allow access to allowed pages even without auth
  if (isAllowed) {
    return <>{children}</>;
  }

  // 🚫 After hydration, if no user → block
  if (!user) {
    return null;
  }

  return <>{children}</>;
};
