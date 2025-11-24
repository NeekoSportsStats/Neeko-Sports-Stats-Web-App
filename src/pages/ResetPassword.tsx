// src/pages/ResetPassword.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

import {
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle,
  Trophy,
  Loader2,
} from "lucide-react";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // form state
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // process state
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [success, setSuccess] = useState(false);

  /** -----------------------------------------------------------
   * PATCH #1 — Create a SAFE Supabase client for token recovery
   * -----------------------------------------------------------
   */
  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false, // ⛔ DO NOT consume recovery token
      },
    }
  );

  /** STEP 1 — Detect token BEFORE Supabase eats it */
  useEffect(() => {
    const hash = window.location.hash || "";

    console.log("RESET → hash:", hash);

    const hasToken =
      hash.includes("type=recovery") && hash.includes("access_token");

    console.log("RESET → hasToken:", hasToken);

    setTokenValid(hasToken);
    setChecking(false);
  }, []);

  /** STEP 2 — Invalid link → redirect */
  useEffect(() => {
    if (!checking && !tokenValid) {
      toast({
        title: "Invalid or expired link",
        description: "Please request a new password reset link.",
        variant: "destructive",
      });

      navigate("/forgot-password");
    }
  }, [checking, tokenValid, navigate, toast]);

  /** STEP 3 — Submit new password */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tokenValid) return;

    if (password !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Both fields must match.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 10) {
      toast({
        title: "Password too short",
        description: "Must be at least 10 characters.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      console.log("RESET → updating user password…");

      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      setSuccess(true);

      toast({
        title: "Password updated",
        description: "You can now sign in.",
      });

      setTimeout(() => navigate("/auth"), 2000);
    } catch (err: any) {
      console.error("RESET → update error:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to update password.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /** LOADING SCREEN */
  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  /** SUCCESS SCREEN */
  if (success) {
    return (
      <div className="container max-w-md py-12 flex items-center justify-center min-h-[70vh]">
        <Card className="w-full text-center">
          <CardHeader>
            <div className="flex justify-center mb-3">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle>Password Reset Successful</CardTitle>
            <CardDescription>Redirecting you to sign in…</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full" onClick={() => navigate("/auth")}>
              Sign In Now
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  /** PASSWORD RESET FORM */
  return (
    <div className="container max-w-md py-12 flex items-center justify-center min-h-[70vh]">
      <Card className="w-full">
        <CardHeader>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/auth")}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>

          <div className="flex items-center gap-2 mb-2">
            <Trophy className="h-6 w-6 text-primary" />
            <CardTitle>Choose a New Password</CardTitle>
          </div>

          <CardDescription>
            Enter and confirm your new password.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* NEW PASSWORD */}
            <div className="space-y-2">
              <Label>New Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  placeholder="New password"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* CONFIRM PASSWORD */}
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <div className="relative">
                <Input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  placeholder="Confirm password"
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </CardContent>

          <CardFooter>
            <Button className="w-full" disabled={loading} type="submit">
              {loading ? "Updating…" : "Update Password"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default ResetPassword;
