import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import somisteamLogo from "@/assets/somisteam-logo.jpg";

const PageLoader = () => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background"
        >
          <motion.img
            src={somisteamLogo}
            alt="Loading"
            className="h-10 w-10 rounded-lg object-contain"
            animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="mt-4 h-1 w-24 overflow-hidden rounded-full bg-muted"
          >
            <motion.div
              className="h-full rounded-full bg-gradient-gold"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
              style={{ width: "50%" }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PageLoader;
