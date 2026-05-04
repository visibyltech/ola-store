import { motion } from "framer-motion";

const brands = ["Hisense", "Samsung", "LG", "Haier", "Midea", "Maxi", "Scanfrost", "Thermocool"];

const BrandsMarquee = () => {
  return (
    <section className="py-12 bg-background border-y border-border/50 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="container mx-auto px-4 mb-6"
      >
        <p className="text-center text-sm text-muted-foreground font-medium uppercase tracking-wider">
          Trusted Brands We Carry
        </p>
      </motion.div>
      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-r from-background to-transparent" />
        <div className="absolute right-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-l from-background to-transparent" />
        <motion.div
          className="flex gap-16 items-center"
          animate={{ x: [0, -1200] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          {[...brands, ...brands, ...brands].map((brand, i) => (
            <motion.span
              key={i}
              whileHover={{ scale: 1.2, color: "hsl(38 92% 50%)" }}
              className="text-2xl font-display font-bold text-muted-foreground/30 whitespace-nowrap cursor-default transition-colors"
            >
              {brand}
            </motion.span>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default BrandsMarquee;
