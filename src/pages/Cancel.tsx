import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";

export default function Cancel() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-secondary">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
            <XCircle className="w-10 h-10 text-orange-600 dark:text-orange-400" />
          </div>
          <CardTitle className="text-3xl font-bold">Checkout Cancelled</CardTitle>
          <CardDescription className="text-lg">
            Your payment was not processed
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-muted border rounded-lg p-6 space-y-3">
            <h3 className="font-semibold">What Happened?</h3>
            <p className="text-sm text-muted-foreground">
              You cancelled the checkout process or closed the payment window. 
              No charges were made to your account.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Need Help?</h4>
            <p className="text-sm text-muted-foreground">
              If you experienced any issues during checkout or have questions about 
              Neeko+ subscription, please contact our support team at{" "}
              <a href="mailto:admin@neekostats.com.au" className="text-primary hover:underline">
                admin@neekostats.com.au
              </a>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button asChild className="flex-1">
              <Link to="/neeko-plus">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
