import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { products as staticProducts, formatPrice } from "@/data/products";
import { supabase } from "@/integrations/supabase/client";

interface DisplayProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  imageUrl: string;
}

const toDisplay = (p: typeof staticProducts[0]): DisplayProduct => ({
  id: p.id,
  name: p.name,
  brand: p.brand,
  category: p.category,
  price: p.price,
  imageUrl: p.image,
});

const Shop = () => {
  const [products, setProducts] = useState<DisplayProduct[]>(
    staticProducts.map(toDisplay)
  );

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from("products")
          .select("id, name, brand, category, price, images")
          .eq("available", true)
          .order("created_at", { ascending: false });
        if (data && data.length > 0) {
          setProducts(
            data.map((p) => ({
              id: p.id,
              name: p.name,
              brand: p.brand || "Olas & Bs",
              category: p.category || "Electronics",
              price: p.price,
              imageUrl: p.images?.[0] || "",
            }))
          );
        }
      } catch {
        // keep static products on any error
      }
    })();
  }, []);

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
            <h1 className="text-3xl lg:text-5xl font-display font-bold text-foreground">
              Our Products
            </h1>
            <p className="text-muted-foreground mt-2">
              Premium electronics for your home
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
              >
                <Link to={`/product/${product.id}`} className="group block">
                  <div className="bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 border border-border/50">
                    <div className="relative aspect-square bg-secondary/50 p-6 overflow-hidden">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-20 h-20 text-muted-foreground/20" />
                        </div>
                      )}
                      <span className="absolute top-4 left-4 px-3 py-1 bg-accent text-accent-foreground text-xs font-semibold rounded-full">
                        {product.brand}
                      </span>
                    </div>
                    <div className="p-5">
                      <p className="text-xs text-muted-foreground mb-1">
                        {product.category}
                      </p>
                      <h3 className="font-display font-semibold text-foreground mb-3 line-clamp-2 group-hover:text-accent transition-colors">
                        {product.name}
                      </h3>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg font-bold text-foreground">
                            {formatPrice(product.price)}
                          </p>
                          <p className="text-xs text-accent font-medium">
                            Save to Buy Available
                          </p>
                        </div>
                        <Button
                          size="icon"
                          className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm flex-shrink-0"
                        >
                          <ShoppingBag className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Shop;
