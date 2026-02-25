import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff } from "lucide-react";
import MobileLayout from "@/components/MobileLayout";
import MobileHeader from "@/components/MobileHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async () => {
    if (!password || !confirm) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    if (password !== confirm) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    if (password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Mot de passe mis à jour !");
      navigate("/", { replace: true });
    }
  };

  if (!isRecovery) {
    return (
      <MobileLayout showNav={false}>
        <MobileHeader title="Lien invalide" />
        <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
          <h2 className="text-xl font-heading font-bold mb-2">Lien invalide</h2>
          <p className="text-muted-foreground font-body text-sm mb-6">
            Ce lien de réinitialisation est invalide ou a expiré.
          </p>
          <Button
            onClick={() => navigate("/forgot-password")}
            className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-heading font-semibold text-sm tracking-wide shadow-lg active:scale-[0.98] transition-all"
          >
            Demander un nouveau lien
          </Button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout showNav={false}>
      <MobileHeader title="Réinitialisation" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col min-h-screen px-6 pb-10"
      >
        <div className="mb-10">
          <h1 className="text-3xl font-heading font-bold">
            Nouveau mot de passe<span className="text-primary">.</span>
          </h1>
          <p className="text-muted-foreground font-body mt-2">
            Choisissez un nouveau mot de passe sécurisé.
          </p>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Nouveau mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-14 pl-12 pr-12 rounded-2xl bg-card border-border font-body"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5 text-muted-foreground" />
              ) : (
                <Eye className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Confirmer le mot de passe"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="h-14 pl-12 rounded-2xl bg-card border-border font-body"
            />
          </div>

          <Button
            onClick={handleReset}
            disabled={loading}
            className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-heading font-semibold text-sm tracking-wide shadow-lg active:scale-[0.98] transition-all"
          >
            {loading ? "Mise à jour..." : "Mettre à jour"}
          </Button>
        </div>
      </motion.div>
    </MobileLayout>
  );
};

export default ResetPassword;
