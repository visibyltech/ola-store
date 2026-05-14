import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { CreditCard, Calculator, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef } from "react";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.3 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 60, rotateY: 15 },
  visible: {
    opacity: 1,
    y: 0,
    rotateY: 0,
    transition: { duration: 0.7, ease: [0.215, 0.61, 0.355, 1] as const },
  },
};

const EasyBuyBanner = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);

  const features = [
    { icon: CreditCard, title: "Flexible Deposit", desc: "Start with as low as 20% deposit" },
    { icon: Calculator, title: "No Interest", desc: "Pay only the product price, nothing extra" },
    { icon: Clock, title: "Up to 9 Months", desc: "Spread payments at your own pace" },
  ];

  return (
    <section ref={ref} className="py-20 lg:py-28 relative overflow-hidden">
      <motion.div className="absolute inset-0 bg-gradient-hero" style={{ y: bgY }} />
      
      {/* Animated glow orbs */}
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full blur-[100px] opacity-20"
        style={{ background: "radial-gradient(circle, hsl(38 92% 50% / 0.5), transparent 70%)", left: "10%", top: "20%" }}
        animate={{ scale: [1, 1.3, 1], x: [-20, 20, -20] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-[300px] h-[300px] rounded-full blur-[80px] opacity-10"
        style={{ background: "radial-gradient(circle, hsl(38 92% 50% / 0.4), transparent 70%)", right: "15%", bottom: "10%" }}
        animate={{ scale: [1.2, 1, 1.2], y: [-15, 15, -15] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative container mx-auto px-4 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-14">
          <motion.span
            initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-block px-4 py-1.5 rounded-full bg-accent/20 text-gold-light text-sm font-medium mb-6 border border-gold/20"
          >
            Save to Buy Installment Plan
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.8 }}
            className="text-3xl lg:text-5xl font-display font-bold text-primary-foreground mb-4"
          >
            Buy Now, Pay <span className="text-gradient-gold">Gradually</span>
          </motion.h2>
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="h-1 w-16 bg-gradient-gold rounded-full mx-auto mb-4 origin-center"
          />
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-primary-foreground/60 text-lg"
          >
            Get your dream appliance today. Pay a deposit and spread the balance
            over months with our affordable Save to Buy plan.
          </motion.p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid md:grid-cols-3 gap-6 mb-12"
        >
          {features.map(({ icon: Icon, title, desc }) => (
            <motion.div
              key={title}
              variants={cardVariants}
              whileHover={{ y: -8, scale: 1.02 }}
              className="bg-primary-foreground/5 backdrop-blur-sm border border-primary-foreground/10 rounded-2xl p-8 text-center"
            >
              <motion.div
                className="w-14 h-14 rounded-xl bg-gradient-gold mx-auto mb-4 flex items-center justify-center"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <Icon className="w-6 h-6 text-accent-foreground" />
              </motion.div>
              <h3 className="font-display font-semibold text-primary-foreground text-lg mb-2">{title}</h3>
              <p className="text-primary-foreground/60 text-sm">{desc}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <Link to="/easybuy">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block">
              <Button className="bg-gradient-gold text-accent-foreground font-semibold px-8 py-6 text-base rounded-xl hover:opacity-90 shadow-gold">
                Learn More About Save to Buy <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default EasyBuyBanner;
