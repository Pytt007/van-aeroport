import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";
import MobileLayout from "@/components/MobileLayout";
import MobileHeader from "@/components/MobileHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      toast.error("Veuillez entrer votre email");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
    }
  };

  return (
    <MobileLayout showNav={false}>
      <MobileHeader title="Mot de passe oublié" onBack={() => navigate("/login")} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col min-h-screen px-6 pb-10"
      >
        <div className="mb-10">
          <h1 className="text-3xl font-heading font-bold">
            Mot de passe oublié<span className="text-primary">?</span>
          </h1>
          <p className="text-muted-foreground font-body mt-2">
            Entrez votre email pour recevoir un lien de réinitialisation.
          </p>
        </div>

        {sent ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center mb-6">
              <Mail className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-xl font-heading font-bold mb-2">Email envoyé !</h2>
            <p className="text-muted-foreground font-body text-sm max-w-[260px]">
              Vérifiez votre boîte de réception et suivez le lien pour réinitialiser votre mot de passe.
            </p>
            <Button
              onClick={() => navigate("/login", { replace: true })}
              variant="outline"
              className="mt-8 h-14 rounded-2xl px-8 font-heading font-semibold text-sm tracking-wide"
            >
              Retour à la connexion
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 pl-12 rounded-2xl bg-card border-border font-body"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-heading font-semibold text-sm tracking-wide shadow-lg active:scale-[0.98] transition-all"
            >
              {loading ? "Envoi..." : "Envoyer le lien"}
            </Button>
          </div>
        )}
      </motion.div>
    </MobileLayout>
  );
};

export default ForgotPassword;
