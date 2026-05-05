import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { products as staticProducts, formatPrice } from "@/data/products";
import { supabase } from "@/integrations/supabase/client";

interface DBProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  images: string[] | null;
  available: boolean;
  min_deposit: number;
  max_installment_months: number;
}

const Shop = () => {
  const [dbProducts, setDbProducts] = useState<DBProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, brand, category, price, images, available, min_deposit, max_installment_months")
        .eq("available", true)
        .order("created_at", { ascending: false });
      if (!error && data) setDbProducts(data);
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const useStatic = dbProducts.length === 0;

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <h1 className="text-3xl lg:text-5xl font-display font-bold text-foreground">Our Products</h1>
            <p className="text-muted-foreground mt-2">Premium electronics for your home</p>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-card rounded-2xl overflow-hidden border border-border/50 animate-pulse">
                  <div className="aspect-square bg-secondary/50" />
                  <div className="p-5 space-y-2">
                    <div className="h-3 bg-secondary rounded w-1/3" />
                    <div className="h-4 bg-secondary rounded w-3/4" />
                    <div className="h-4 bg-secondary rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : useStatic ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {staticProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                >
                  <Link to={`/product/${product.id}`} className="group block">
                    <div className="bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 border border-border/50">
                      <div className="relative aspect-square bg-secondary/50 p-6 overflow-hidden">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <span className="absolute top-4 left-4 px-3 py-1 bg-accent text-accent-foreground text-xs font-semibold rounded-full">
                          {product.brand}
                        </span>
                      </div>
                      <div className="p-5">
                        <p className="text-xs text-muted-foreground mb-1">{product.category}</p>
                        <h3 className="font-display font-semibold text-foreground mb-3 line-clamp-2 group-hover:text-accent transition-colors">
                          {product.name}
                        </h3>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-lg font-bold text-foreground">{formatPrice(product.price)}</p>
                            <p className="text-xs text-accent font-medium">EasyBuy Available</p>
                          </div>
                          <Button size="icon" variant="outline" className="rounded-full border-accent/30 text-accent hover:bg-accent hover:text-accent-foreground">
                            <ShoppingBag className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {dbProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                >
                  <Link to={`/product/${product.id}`} className="group block">
                    <div className="bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 border border-border/50">
                      <div className="relative aspect-square bg-secondary/50 p-6 overflow-hidden">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="w-16 h-16 text-muted-foreground/30" />
                          </div>
                        )}
                        <span className="absolute top-4 left-4 px-3 py-1 bg-accent text-accent-foreground text-xs font-semibold rounded-full">
                          {product.brand}
                        </span>
                      </div>
                      <div className="p-5">
                        <p className="text-xs text-muted-foreground mb-1">{product.category}</p>
                        <h3 className="font-display font-semibold text-foreground mb-3 line-clamp-2 group-hover:text-accent transition-colors">
                          {product.name}
                        </h3>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-lg font-bold text-foreground">{formatPrice(product.price)}</p>
                            <p className="text-xs text-accent font-medium">EasyBuy Available</p>
                          </div>
                          <Button size="icon" variant="outline" className="rounded-full border-accent/30 text-accent hover:bg-accent hover:text-accent-foreground">
                            <ShoppingBag className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Shop;
