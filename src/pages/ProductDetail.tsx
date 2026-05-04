import { useParams, Link, useNavigate } from "react-router-dom";
  import { motion } from "framer-motion";
  import { ArrowLeft, ShoppingBag, CreditCard, Check, Loader2 } from "lucide-react";
  import { useState } from "react";
  import Navbar from "@/components/Navbar";
  import Footer from "@/components/Footer";
  import { Button } from "@/components/ui/button";
  import { products, formatPrice, calculateInstallment } from "@/data/products";
  import { Slider } from "@/components/ui/slider";
  import { useAuth } from "@/contexts/AuthContext";
  import { supabase } from "@/integrations/supabase/client";
  import { toast } from "sonner";

  const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const product = products.find((p) => p.id === id);
    const [depositAmount, setDepositAmount] = useState(product ? product.minDeposit : 0);
    const [loadingPayment, setLoadingPayment] = useState(false);

    if (!product) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-display font-bold text-foreground mb-4">Product not found</h2>
            <Link to="/shop">
              <Button className="bg-gradient-gold text-accent-foreground">Back to Shop</Button>
            </Link>
          </div>
        </div>
      );
    }

    const installment = calculateInstallment(product.price, depositAmount);

    const handlePayment = async (type: "full_payment" | "deposit") => {
      if (!user) {
        toast.error("Please log in to make a purchase");
        navigate("/login");
        return;
      }

      setLoadingPayment(true);
      try {
        const amount = type === "full_payment" ? product.price : depositAmount;

        // Step 1: Create order in DB
        const { data: order, error: orderError } = await supabase
          .from("orders")
          .insert({
            user_id: user.id,
            product_id: product.id,
            product_name: product.name,
            product_price: product.price,
            payment_type: type,
            deposit_amount: type === "deposit" ? depositAmount : product.price,
            interest_rate: type === "deposit" ? installment.interestRate : 0,
            total_payable: type === "deposit" ? installment.totalPayable : product.price,
            remaining_balance: type === "deposit" ? installment.balance : 0,
            total_paid: 0,
            installment_months: type === "deposit" ? product.maxInstallmentMonths : 0,
            status: "pending",
          })
          .select()
          .single();

        if (orderError || !order) {
          throw new Error(orderError?.message || "Failed to create order");
        }

        // Step 2: Initialize KoraPay payment via Edge Function
        const redirectUrl = `${window.location.origin}/payment/callback?order_id=${order.id}`;

        const { data, error } = await supabase.functions.invoke("initialize-kora-payment", {
          body: {
            order_id: order.id,
            amount,
            customer_email: user.email,
            customer_name: user.user_metadata?.full_name || user.email,
            redirect_url: redirectUrl,
          },
        });

        if (error) throw new Error(error.message || "Payment init failed");

        const url = data?.checkout_url || data?.payment_url;
        if (url) {
          window.location.href = url;
        } else {
          throw new Error("No payment URL received");
        }
      } catch (err: any) {
        console.error("Payment error:", err);
        toast.error(err.message || "Payment initialization failed. Please try again.");
      } finally {
        setLoadingPayment(false);
      }
    };

    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-24 pb-16">
          <div className="container mx-auto px-4 lg:px-8">
            <Link to="/shop" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Shop
            </Link>

            <div className="grid lg:grid-cols-2 gap-12">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-secondary/50 rounded-3xl p-8 lg:p-12 aspect-square flex items-center justify-center"
              >
                <img src={product.image} alt={product.name} className="max-w-full max-h-full object-contain" width={800} height={800} />
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
                <span className="inline-block px-3 py-1 bg-accent/10 text-accent text-sm font-medium rounded-full mb-4">
                  {product.brand}
                </span>
                <h1 className="text-3xl lg:text-4xl font-display font-bold text-foreground mb-4">{product.name}</h1>
                <p className="text-muted-foreground mb-6">{product.description}</p>

                <div className="flex flex-wrap gap-2 mb-8">
                  {product.features.map((feat) => (
                    <span key={feat} className="flex items-center gap-1 px-3 py-1.5 bg-secondary rounded-full text-xs font-medium text-foreground">
                      <Check className="w-3 h-3 text-accent" /> {feat}
                    </span>
                  ))}
                </div>

                <div className="text-3xl font-display font-bold text-foreground mb-6">{formatPrice(product.price)}</div>

                <div className="mb-6">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl text-sm font-medium text-blue-700">
                    <span className="text-base">🔵</span> Secure payment powered by KoraPay
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <Button
                    onClick={() => handlePayment("full_payment")}
                    disabled={loadingPayment}
                    className="w-full bg-gradient-gold text-accent-foreground font-semibold py-6 text-base rounded-xl hover:opacity-90 shadow-gold"
                  >
                    {loadingPayment ? <Loader2 className="mr-2 w-5 h-5 animate-spin" /> : <ShoppingBag className="mr-2 w-5 h-5" />}
                    Buy Now – {formatPrice(product.price)}
                  </Button>

                  <div className="bg-card border border-border rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <CreditCard className="w-5 h-5 text-accent" />
                      <h3 className="font-display font-semibold text-foreground">EasyBuy Installment</h3>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Deposit Amount</span>
                        <span className="font-semibold text-foreground">{formatPrice(depositAmount)}</span>
                      </div>
                      <Slider value={[depositAmount]} onValueChange={([val]) => setDepositAmount(val)} min={product.minDeposit} max={product.price} step={5000} className="mb-4" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Min: {formatPrice(product.minDeposit)}</span>
                        <span>Full: {formatPrice(product.price)}</span>
                      </div>
                    </div>

                    <div className="bg-secondary/50 rounded-xl p-4 space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Product Price</span>
                        <span className="text-foreground">{formatPrice(product.price)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Interest ({(installment.interestRate * 100).toFixed(0)}%)</span>
                        <span className="text-foreground">{formatPrice(installment.interestAmount)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold border-t border-border pt-2">
                        <span className="text-foreground">Total Payable</span>
                        <span className="text-foreground">{formatPrice(installment.totalPayable)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Your Deposit</span>
                        <span className="text-accent font-medium">{formatPrice(depositAmount)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold">
                        <span className="text-foreground">Remaining Balance</span>
                        <span className="text-destructive">{formatPrice(installment.balance)}</span>
                      </div>
                    </div>

                    {depositAmount / product.price >= 0.5 && (
                      <p className="text-xs text-accent font-medium mb-3">Great! You qualify for the lowest interest rate (10%)</p>
                    )}

                    <Button
                      onClick={() => handlePayment("deposit")}
                      disabled={loadingPayment}
                      variant="outline"
                      className="w-full border-accent text-accent hover:bg-accent hover:text-accent-foreground py-5 rounded-xl"
                    >
                      {loadingPayment ? <Loader2 className="mr-2 w-5 h-5 animate-spin" /> : <CreditCard className="mr-2 w-5 h-5" />}
                      Pay Deposit – {formatPrice(depositAmount)}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  };

  export default ProductDetail;
  