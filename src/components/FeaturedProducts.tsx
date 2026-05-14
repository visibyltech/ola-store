import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/data/products";
import { supabase } from "@/integrations/supabase/client";

interface DBProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  images: string[] | null;
  available: boolean;
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 80, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.7, ease: [0.215, 0.61, 0.355, 1] as const },
  },
};

const FeaturedProducts = () => {
  const [products, setProducts] = useState<DBProduct[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, brand, category, price, images, available")
        .eq("available", true)
        .order("created_at", { ascending: false })
        .limit(4);
      if (!error && data) setProducts(data);
    };
    fetchProducts();
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="py-20 lg:py-28 bg-background overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="flex items-end justify-between mb-12"
        >
          <div>
            <span className="text-sm font-medium text-accent uppercase tracking-wider">Featured</span>
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-foreground mt-2">
              Popular Products
            </h2>
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="h-1 w-16 bg-gradient-gold rounded-full mt-3 origin-left"
            />
          </div>
          <Link to="/shop" className="hidden sm:flex items-center gap-2 text-accent font-medium group">
            <span>View All</span>
            <motion.div animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
              <ArrowRight className="w-4 h-4" />
            </motion.div>
          </Link>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6"
        >
          {products.map((product) => (
            <motion.div key={product.id} variants={cardVariants}>
              <Link to={`/product/${product.id}`} className="group block">
                <motion.div
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 border border-border/50 hover:border-accent/30"
                >
                  <div className="relative aspect-square bg-secondary/50 p-6 overflow-hidden">
                    <motion.img
                      src={product.images?.[0] || "/placeholder.svg"}
                      alt={product.name}
                      className="w-full h-full object-contain"
                      whileHover={{ scale: 1.1, rotate: 2 }}
                      transition={{ duration: 0.5 }}
                      loading="lazy"
                      width={800}
                      height={800}
                    />
                    <motion.span
                      initial={{ x: -60, opacity: 0 }}
                      whileInView={{ x: 0, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 }}
                      className="absolute top-4 left-4 px-3 py-1 bg-accent text-accent-foreground text-xs font-semibold rounded-full"
                    >
                      {product.brand}
                    </motion.span>
                  </div>
                  <div className="p-5">
                    <p className="text-xs text-muted-foreground mb-1">{product.category}</p>
                    <h3 className="font-display font-semibold text-foreground mb-3 line-clamp-2 group-hover:text-accent transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-bold text-foreground">{formatPrice(product.price)}</p>
                        <p className="text-xs text-accent font-medium">Save to Buy Available</p>
                      </div>
                      <motion.div whileHover={{ scale: 1.2, rotate: 15 }} whileTap={{ scale: 0.9 }}>
                        <Button size="icon" className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm flex-shrink-0">
                          <ShoppingBag className="w-4 h-4" />
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <div className="sm:hidden mt-8 text-center">
          <Link to="/shop">
            <Button variant="outline" className="border-accent text-accent">
              View All Products <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
