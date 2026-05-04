import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import somisteamLogo from "@/assets/somisteam-logo.jpg";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    if (hashParams.get("type") === "recovery") {
      setIsRecovery(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully!");
      navigate("/login");
    }
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md text-center">
          <div className="bg-card rounded-2xl p-8 shadow-card border border-border/50 space-y-4">
            <h1 className="text-xl font-display font-bold text-foreground">Invalid Reset Link</h1>
            <p className="text-muted-foreground text-sm">This link is invalid or has expired.</p>
            <Link to="/login">
              <Button className="bg-gradient-gold text-accent-foreground font-semibold rounded-xl hover:opacity-90 shadow-gold">
                Back to Sign In
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <img src={somisteamLogo} alt="Olas & Bs" className="h-12 w-auto rounded-lg object-contain" />
          </Link>
          <h1 className="text-2xl font-display font-bold text-foreground">Set New Password</h1>
          <p className="text-muted-foreground mt-1">Enter your new password below</p>
        </div>

        <form onSubmit={handleReset} className="bg-card rounded-2xl p-8 shadow-card border border-border/50 space-y-5">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">New Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              className="rounded-xl"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Confirm Password</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              className="rounded-xl"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-gold text-accent-foreground font-semibold py-5 rounded-xl hover:opacity-90 shadow-gold"
          >
            {loading ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
