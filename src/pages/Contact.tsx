import { motion } from "framer-motion";
import { Phone, Mail, MapPin, Send } from "lucide-react";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const Contact = () => {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Will integrate with backend later
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">Contact Us</h1>
            <p className="text-muted-foreground text-lg">We'd love to hear from you</p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Contact Info */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
              {[
                { icon: Phone, title: "Phone", info: "+234 800 olas-bs", sub: "Mon-Sat, 8am-6pm" },
                { icon: Mail, title: "Email", info: "info@olasbs.com", sub: "We reply within 24 hours" },
                { icon: MapPin, title: "Location", info: "Lagos, Nigeria", sub: "Visit our showroom" },
              ].map(({ icon: Icon, title, info, sub }) => (
                <div key={title} className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-gold flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-foreground">{title}</h3>
                    <p className="text-foreground">{info}</p>
                    <p className="text-sm text-muted-foreground">{sub}</p>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Contact Form */}
            <motion.form
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleSubmit}
              className="bg-card rounded-2xl p-8 shadow-card border border-border/50 space-y-5"
            >
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your full name"
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your@email.com"
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Message</label>
                <Textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="How can we help you?"
                  rows={5}
                  className="rounded-xl"
                />
              </div>
              <Button className="w-full bg-gradient-gold text-accent-foreground font-semibold py-5 rounded-xl hover:opacity-90 shadow-gold">
                <Send className="mr-2 w-4 h-4" /> Send Message
              </Button>
            </motion.form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Contact;
