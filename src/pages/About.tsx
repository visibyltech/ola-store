import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Shield, Award, Users, Zap } from "lucide-react";

const About = () => {
  const values = [
    { icon: Shield, title: "Genuine Products", desc: "We only stock verified, original products from authorized distributors." },
    { icon: Award, title: "Quality Assurance", desc: "Full manufacturer warranty on every product we sell." },
    { icon: Users, title: "Customer First", desc: "Dedicated support team to assist before and after purchase." },
    { icon: Zap, title: "Fast Delivery", desc: "Quick, reliable delivery across Nigeria." },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto text-center mb-16">
            <h1 className="text-4xl lg:text-5xl font-display font-bold text-foreground mb-6">
              About <span className="text-gradient-gold">Olas & Bs</span>
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Olas & Bs NIG Ltd is a premium household electronics showroom dedicated to
              making quality home appliances accessible to every Nigerian family. From Hisense to
              Samsung, LG and beyond — we bring you the best brands with flexible payment options.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            {values.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card rounded-2xl p-6 text-center shadow-card border border-border/50"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-gold mx-auto mb-4 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-accent-foreground" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-hero rounded-3xl p-8 lg:p-16 text-center"
          >
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-primary-foreground mb-4">
              Our Mission
            </h2>
            <p className="text-primary-foreground/70 text-lg max-w-2xl mx-auto">
              To make premium home electronics accessible to every household through
              genuine products, flexible payment plans, and exceptional customer service.
            </p>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default About;
