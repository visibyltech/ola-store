import { motion } from "framer-motion";
import { CreditCard, Clock, CheckCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/data/products";

const EasyBuy = () => {
  const steps = [
    { icon: "1", title: "Choose Your Product", desc: "Browse our catalog and pick the appliance you need." },
    { icon: "2", title: "Select Save to Buy", desc: "Choose the installment option and set your deposit amount." },
    { icon: "3", title: "Pay Your Deposit", desc: "Make the initial payment securely via KoraPay." },
    { icon: "4", title: "Complete Payments", desc: "Pay monthly installments and get your product upon completion." },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-16">
        {/* Hero */}
        <section className="bg-gradient-hero py-20">
          <div className="container mx-auto px-4 lg:px-8 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <span className="inline-block px-4 py-1.5 rounded-full bg-accent/20 text-gold-light text-sm font-medium mb-6 border border-gold/20">
                Flexible Payment Plans
              </span>
              <h1 className="text-4xl lg:text-6xl font-display font-bold text-primary-foreground mb-4">
                Save to Buy <span className="text-gradient-gold">Installments</span>
              </h1>
              <p className="text-primary-foreground/60 text-lg max-w-2xl mx-auto mb-8">
                Own your dream electronics today with our affordable installment plans.
                No interest, flexible terms.
              </p>
              <Link to="/shop">
                <Button className="bg-gradient-gold text-accent-foreground font-semibold px-8 py-6 text-base rounded-xl shadow-gold">
                  Browse Products <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* How it works intro */}
        <section className="py-16 container mx-auto px-4 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-display font-bold text-foreground">How It Works</h2>
            <p className="text-muted-foreground mt-2">Simple steps to own your dream appliance</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-card rounded-2xl p-8 border-2 border-accent shadow-card text-center"
            >
              <div className="w-12 h-12 bg-gradient-gold rounded-xl flex items-center justify-center mb-4 mx-auto">
                <CheckCircle className="w-6 h-6 text-accent-foreground" />
              </div>
              <h3 className="font-display font-bold text-xl text-foreground mb-2">No Interest</h3>
              <p className="text-muted-foreground mb-4">Pay only the product price — no hidden charges</p>
              <div className="bg-secondary/50 rounded-xl p-4 text-sm text-muted-foreground">
                <p><strong className="text-foreground">Example:</strong> Product = {formatPrice(100000)}</p>
                <p>You pay exactly: {formatPrice(100000)}</p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-card rounded-2xl p-8 border border-border shadow-card text-center"
            >
              <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center mb-4 mx-auto">
                <CreditCard className="w-6 h-6 text-foreground" />
              </div>
              <h3 className="font-display font-bold text-xl text-foreground mb-2">Low Deposit</h3>
              <p className="text-muted-foreground mb-4">Start with as low as 20% deposit</p>
              <div className="bg-secondary/50 rounded-xl p-4 text-sm text-muted-foreground">
                <p><strong className="text-foreground">Example:</strong> Product = {formatPrice(200000)}</p>
                <p>Deposit from: {formatPrice(40000)}</p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-card rounded-2xl p-8 border border-border shadow-card text-center"
            >
              <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Clock className="w-6 h-6 text-foreground" />
              </div>
              <h3 className="font-display font-bold text-xl text-foreground mb-2">Up to 9 Months</h3>
              <p className="text-muted-foreground mb-4">Spread payments at your own pace</p>
              <div className="bg-secondary/50 rounded-xl p-4 text-sm text-muted-foreground">
                <p><strong className="text-foreground">Flexible:</strong> Monthly payments</p>
                <p>tailored to your budget</p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Steps */}
        <section className="py-20 bg-secondary/50">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-display font-bold text-foreground">Step by Step</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((step, i) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-card rounded-2xl p-6 text-center shadow-card border border-border/50"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-gold text-accent-foreground font-display font-bold text-lg flex items-center justify-center mx-auto mb-4">
                    {step.icon}
                  </div>
                  <h3 className="font-display font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default EasyBuy;
