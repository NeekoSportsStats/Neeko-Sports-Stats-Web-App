import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setEmailSent(true);
      toast({
        title: "Password reset email sent",
        description: "Check your email for the password reset link",
      });
    } catch (error: any) {
      console.error("Error sending reset email:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send password reset email",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="container max-w-md py-12 flex items-center justify-center min-h-[70vh]">
        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Mail className="h-16 w-16 text-primary" />
            </div>
            <CardTitle>Check Your Email</CardTitle>
            <CardDescription>
              We've sent a password reset link to {email}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Click the link in the email to reset your password. The link will expire in 1 hour.
            </p>
            <p className="text-sm text-muted-foreground">
              Didn't receive the email? Check your spam folder or try again.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button
              onClick={() => setEmailSent(false)}
              variant="outline"
              className="w-full"
            >
              Send Another Email
            </Button>
            <Button onClick={() => navigate("/auth")} variant="ghost" className="w-full">
              Back to Sign In
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-md py-12 flex items-center justify-center min-h-[70vh]">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Forgot Password</CardTitle>
          <CardDescription>
            Enter your email address and we'll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
            <Button
              type="button"
              onClick={() => navigate("/auth")}
              variant="ghost"
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Sign In
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default ForgotPassword;
