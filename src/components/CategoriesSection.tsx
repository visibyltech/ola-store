import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { categories } from "@/data/products";

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.2 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 60, scale: 0.85, rotateX: 15 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: { duration: 0.6, ease: [0.215, 0.61, 0.355, 1] as const },
  },
};

const CategoriesSection = () => {
  return (
    <section className="py-20 lg:py-28 bg-secondary/50 overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="text-center mb-12"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-sm font-medium text-accent uppercase tracking-wider"
          >
            Browse
          </motion.span>
          <h2 className="text-3xl lg:text-4xl font-display font-bold text-foreground mt-2">
            Shop by Category
          </h2>
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="h-1 w-16 bg-gradient-gold rounded-full mx-auto mt-4 origin-center"
          />
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
        >
          {categories.map((cat) => (
            <motion.div key={cat.name} variants={cardVariants}>
              <Link
                to={`/shop?category=${encodeURIComponent(cat.name)}`}
                className="group block bg-card rounded-2xl p-6 text-center shadow-card hover:shadow-card-hover transition-all duration-300 border border-border/50 hover:border-accent/30"
              >
                <motion.span
                  className="text-4xl mb-3 block"
                  whileHover={{ scale: 1.3, rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.4 }}
                >
                  {cat.icon}
                </motion.span>
                <h3 className="font-display font-semibold text-sm text-foreground">{cat.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{cat.count} products</p>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default CategoriesSection;
