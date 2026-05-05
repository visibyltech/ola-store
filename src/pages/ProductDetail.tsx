import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ShoppingBag, CreditCard, Check, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { products as staticProducts, formatPrice, calculateInstallment } from "@/data/products";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import korapayLogo from "@/assets/korapay-logo.png";

type Gateway = "korapay";

interface ProductData {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  description: string;
  image: string;
  features: string[];
  minDeposit: number;
  maxInstallmentMonths: number;
}

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState(0);
  const [selectedGateway] = useState<Gateway>("korapay");
  const [loadingPayment, setLoadingPayment] = useState(false);

  useEffect(() => {
    const load = async () => {
      // First check static products (IDs: "1","2","3","4")
      const staticMatch = staticProducts.find((p) => p.id === id);
      if (staticMatch) {
        setProduct({
          id: staticMatch.id,
          name: staticMatch.name,
          brand: staticMatch.brand,
          category: staticMatch.category,
          price: staticMatch.price,
          description: staticMatch.description,
          image: staticMatch.image,
          features: staticMatch.features,
          minDeposit: staticMatch.minDeposit,
          maxInstallmentMonths: staticMatch.maxInstallmentMonths,
        });
        setDepositAmount(staticMatch.minDeposit);
        setLoading(false);
        return;
      }

      // Otherwise fetch from Supabase by UUID (admin-added products)
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (!error && data) {
        setProduct({
          id: data.id,
          name: data.name,
          brand: data.brand || "Olas & Bs",
          category: data.category || "Electronics",
          price: data.price,
          description: data.description || "",
          image: data.images?.[0] || "",
          features: data.features || [],
          minDeposit: data.min_deposit || Math.round(data.price * 0.2),
          maxInstallmentMonths: data.max_installment_months || 6,
        });
        setDepositAmount(data.min_deposit || Math.round(data.price * 0.2));
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const installment = product ? calculateInstallment(product.price, depositAmount) : null;

  const handlePayment = async (type: "full_payment" | "deposit") => {
    if (!user) {
      toast.error("Please log in to make a purchase");
      navigate("/login");
      return;
    }
    if (!product || !installment) return;

    setLoadingPayment(true);
    try {
      const amount = type === "full_payment" ? product.price : depositAmount;
      const callbackUrl = `${window.location.origin}/payment/callback?gateway=${selectedGateway}`;

      const { data, error } = await supabase.functions.invoke("initialize-payment", {
        body: {
          gateway: selectedGateway,
          amount,
          email: user.email,
          product_id: product.id,
          product_name: product.name,
          product_price: product.price,
          payment_type: type,
          deposit_amount: type === "deposit" ? depositAmount : product.price,
          interest_rate: type === "deposit" ? installment.interestRate : 0,
          total_payable: type === "deposit" ? installment.totalPayable : product.price,
          remaining_balance: type === "deposit" ? installment.balance : 0,
          installment_months: type === "deposit" ? product.maxInstallmentMonths : 0,
          callback_url: `${callbackUrl}&order_id=${encodeURIComponent("PENDING")}`,
        },
      });

      if (error) throw error;
      if (data?.payment_url) {
        window.location.href = data.payment_url;
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground/40" />
          <h2 className="text-2xl font-display font-bold text-foreground mb-2">Product not found</h2>
          <p className="text-muted-foreground mb-6">This product may have been removed or is no longer available.</p>
          <Link to="/shop">
            <Button className="bg-gradient-gold text-accent-foreground">Back to Shop</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 lg:px-8">
          <Link to="/shop" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Shop
          </Link>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Image */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-secondary/50 rounded-3xl p-8 lg:p-12 aspect-square flex items-center justify-center"
            >
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="max-w-full max-h-full object-contain"
                  width={800}
                  height={800}
                />
              ) : (
                <ShoppingBag className="w-32 h-32 text-muted-foreground/30" />
              )}
            </motion.div>

            {/* Details */}
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
              <span className="inline-block px-3 py-1 bg-accent/10 text-accent text-sm font-medium rounded-full mb-4">
                {product.brand}
              </span>
              <h1 className="text-3xl lg:text-4xl font-display font-bold text-foreground mb-4">
                {product.name}
              </h1>
              {product.description && (
                <p className="text-muted-foreground mb-6">{product.description}</p>
              )}

              {/* Features */}
              {product.features.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-8">
                  {product.features.map((feat) => (
                    <span key={feat} className="flex items-center gap-1 px-3 py-1.5 bg-secondary rounded-full text-xs font-medium text-foreground">
                      <Check className="w-3 h-3 text-accent" />
                      {feat}
                    </span>
                  ))}
                </div>
              )}

              <div className="text-3xl font-display font-bold text-foreground mb-6">
                {formatPrice(product.price)}
              </div>

              {/* Payment secured by KoraPay */}
              <div className="flex items-center gap-2 mb-5 px-3 py-2 bg-secondary/60 rounded-xl border border-border w-fit">
                <span className="text-xs text-muted-foreground font-medium">Secured by</span>
                <img src={korapayLogo} alt="KoraPay" className="h-5 object-contain" />
              </div>

              {/* Purchase Options */}
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
                    <Slider
                      value={[depositAmount]}
                      onValueChange={([val]) => setDepositAmount(val)}
                      min={product.minDeposit}
                      max={product.price}
                      step={5000}
                      className="mb-4"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Min: {formatPrice(product.minDeposit)}</span>
                      <span>Full: {formatPrice(product.price)}</span>
                    </div>
                  </div>

                  {installment && (
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
                  )}

                  {depositAmount / product.price >= 0.5 && (
                    <p className="text-xs text-accent font-medium mb-3">
                      ✨ Great! You qualify for the lowest interest rate (10%)
                    </p>
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
