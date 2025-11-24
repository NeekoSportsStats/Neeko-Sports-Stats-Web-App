import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
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
} from "lucide-react";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [success, setSuccess] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();

  /**
   * 🔥 REAL FIX:
   * Only allow page to load if URL contains:
   * #access_token=...&type=recovery
   */
  useEffect(() => {
    const hash = window.location.hash;

    const hasToken =
      hash.includes("type=recovery") &&
      (hash.includes("access_token") || hash.includes("refresh_token"));

    if (hasToken) {
      setReady(true);
      return;
    }

    // No valid token → redirect back
    toast({
      title: "Invalid or expired link",
      description: "Please request a new password reset link.",
      variant: "destructive",
    });

    navigate("/forgot-password");
  }, [navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ready) return;

    if (password !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Make sure both fields match.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 10) {
      toast({
        title: "Password too short",
        description: "Password must be at least 10 characters.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      setSuccess(true);

      toast({
        title: "Password updated",
        description: "You can now sign in with your new password.",
      });

      setTimeout(() => navigate("/auth"), 2500);
    } catch (error: any) {
      console.error("Error resetting password:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------
     SUCCESS SCREEN
  --------------------------------- */
  if (success) {
    return (
      <div className="container max-w-md py-12 flex items-center justify-center min-h-[70vh]">
        <Card className="w-full text-center">
          <CardHeader>
            <div className="flex justify-center mb-3">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle>Password Reset Successful</CardTitle>
            <CardDescription>
              Redirecting you to sign in...
            </CardDescription>
          </CardHeader>

          <CardFooter>
            <Button onClick={() => navigate("/auth")} className="w-full">
              Sign In Now
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  /* -------------------------------
     PASSWORD RESET FORM
  --------------------------------- */
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
                  placeholder="New password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-white/70" />
                  ) : (
                    <Eye className="h-4 w-4 text-white/70" />
                  )}
                </button>
              </div>
            </div>

            {/* CONFIRM PASSWORD */}
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <div className="relative">
                <Input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showConfirm ? (
                    <EyeOff className="h-4 w-4 text-white/70" />
                  ) : (
                    <Eye className="h-4 w-4 text-white/70" />
                  )}
                </button>
              </div>
            </div>
          </CardContent>

          <CardFooter>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default ResetPassword;
