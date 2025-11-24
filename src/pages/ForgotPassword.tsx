// src/pages/ForgotPassword.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Mail } from "lucide-react";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  /** 🔍 DEBUGGER: When this page loads */
  useEffect(() => {
    console.log("DEBUG → ForgetPassword PAGE LOADED");
    console.log("DEBUG → Current URL:", window.location.href);
    console.log("DEBUG → HASH:", window.location.hash);
    console.log("DEBUG → SEARCH:", window.location.search);
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormError(null);
    setFormSuccess(null);

    // 🔥 FIX: Force token to remain in hash instead of query
    const redirectUrl = import.meta.env.PROD
      ? "https://www.neekostats.com.au/reset-password#"
      : "http://localhost:5173/reset-password#";

    console.log("DEBUG → Sending reset request. RedirectTo:", redirectUrl);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      console.log("DEBUG → Reset email ERROR:", error);
      setFormError(error.message || "Something went wrong.");
    } else {
      console.log("DEBUG → Reset email SENT successfully");
      setFormSuccess("Password reset email sent. Check your inbox.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8 space-y-6">

        <Button
          onClick={() => navigate("/auth")}
          variant="ghost"
          size="sm"
          className="-mt-2 mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>

        <div className="text-center space-y-2">
          <Mail className="h-10 w-10 mx-auto text-primary" />
          <h2 className="text-xl font-semibold">Reset Password</h2>
          <p className="text-sm text-muted-foreground">
            Enter your email and we’ll send you a reset link.
          </p>
        </div>

        <form onSubmit={handleReset} className="space-y-4">
          <div className="space-y-2">
            <Label>Email Address</Label>
            <Input
              type="email"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <Button className="w-full" disabled={loading || !email}>
            {loading ? "Sending..." : "Send Reset Email"}
          </Button>

          {formError && (
            <p className="text-red-500 text-sm text-center mt-2">{formError}</p>
          )}
          {formSuccess && (
            <p className="text-green-500 text-sm text-center mt-2">
              {formSuccess}
            </p>
          )}
        </form>
      </Card>
    </div>
  );
}
