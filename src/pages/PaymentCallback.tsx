import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");

  useEffect(() => {
    const verify = async () => {
      const reference = searchParams.get("reference") || searchParams.get("tx_ref");
      const gateway = searchParams.get("gateway") || "paystack";
      const orderId = searchParams.get("order_id");

      if (!reference || !orderId) {
        setStatus("failed");
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke("verify-kora-payment", {
          body: { reference, gateway, order_id: orderId },
        });

        if (error || !data?.verified) {
          setStatus("failed");
        } else {
          setStatus("success");
        }
      } catch {
        setStatus("failed");
      }
    };

    verify();
  }, [searchParams]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-16 flex items-center justify-center min-h-[80vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto px-4"
        >
          {status === "loading" && (
            <>
              <Loader2 className="w-16 h-16 text-accent animate-spin mx-auto mb-6" />
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                Verifying Payment...
              </h2>
              <p className="text-muted-foreground">Please wait while we confirm your payment.</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                Payment Successful! 🎉
              </h2>
              <p className="text-muted-foreground mb-8">
                Your payment has been confirmed. You can track your order from your dashboard.
              </p>
              <div className="flex gap-4 justify-center">
                <Link to="/dashboard">
                  <Button className="bg-gradient-gold text-accent-foreground">
                    View Dashboard
                  </Button>
                </Link>
                <Link to="/shop">
                  <Button variant="outline">Continue Shopping</Button>
                </Link>
              </div>
            </>
          )}

          {status === "failed" && (
            <>
              <XCircle className="w-20 h-20 text-destructive mx-auto mb-6" />
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                Payment Failed
              </h2>
              <p className="text-muted-foreground mb-8">
                We couldn't verify your payment. Please try again or contact support.
              </p>
              <div className="flex gap-4 justify-center">
                <Link to="/shop">
                  <Button className="bg-gradient-gold text-accent-foreground">
                    Try Again
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button variant="outline">Contact Support</Button>
                </Link>
              </div>
            </>
          )}
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default PaymentCallback;
