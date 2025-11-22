import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const path = location.pathname;

  useEffect(() => {
    if (loading) return;

    // 🚫 Never redirect on auth pages — this was breaking signup
    if (path.startsWith("/auth") || path.startsWith("/create-password")) {
      return;
    }

    if (!user) {
      navigate(`/auth?redirect=${path}`, { replace: true });
    }
  }, [user, loading, navigate, path]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
