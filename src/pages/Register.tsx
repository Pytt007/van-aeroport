import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import MobileLayout from "@/components/MobileLayout";
import MobileHeader from "@/components/MobileHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Register = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    if (password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName.trim() },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Vérifiez votre email pour confirmer votre inscription !");
      navigate("/register-success", { replace: true });
    }
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) toast.error(error.message);
  };

  return (
    <MobileLayout showNav={false}>
      <MobileHeader title="Inscription" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col px-6 pb-10"
      >
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-heading font-bold">
            Créer un compte<span className="text-primary">.</span>
          </h1>
          <p className="text-muted-foreground font-body mt-2">Inscrivez-vous pour commencer</p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Nom complet"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-14 pl-12 rounded-2xl bg-card border-border font-body"
            />
          </div>

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

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Mot de passe"
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

          <Button
            onClick={handleRegister}
            disabled={loading}
            className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-heading font-semibold text-sm tracking-wide shadow-lg active:scale-[0.98] transition-all"
          >
            {loading ? "Inscription..." : "S'inscrire"}
          </Button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-muted-foreground text-xs font-body">ou continuer avec</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Social */}
          <Button
            variant="outline"
            onClick={() => handleOAuth("google")}
            className="w-full h-14 rounded-2xl border-border font-heading font-semibold text-sm tracking-wide flex items-center justify-center gap-2 hover:border-primary/50 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M5.26 9.76A7.48 7.48 0 0 1 12 4.5c1.77 0 3.37.61 4.63 1.63l3.45-3.45A12.2 12.2 0 0 0 12 0 12 12 0 0 0 1.24 6.65l4.02 3.11Z" />
              <path fill="#34A853" d="M16.04 18.01A7.4 7.4 0 0 1 12 19.5a7.48 7.48 0 0 1-6.74-4.26l-4.02 3.11A12 12 0 0 0 12 24c3.04 0 5.83-1.13 7.96-3l-3.92-2.99Z" />
              <path fill="#4A90D9" d="M19.96 21A11.94 11.94 0 0 0 24 12c0-.82-.1-1.65-.29-2.44H12v4.94h6.73A5.88 5.88 0 0 1 16.04 18l3.92 3Z" />
              <path fill="#FBBC05" d="M5.26 15.24A7.4 7.4 0 0 1 4.5 12c0-1.14.28-2.22.76-3.24L1.24 5.65A12 12 0 0 0 0 12c0 1.93.46 3.75 1.24 5.35l4.02-2.11Z" />
            </svg>
            Continuer avec Google
          </Button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-muted-foreground text-sm font-body">
            Déjà un compte ?{" "}
            <button onClick={() => navigate("/login")} className="text-primary font-semibold">
              Se connecter
            </button>
          </p>
        </div>
      </motion.div>
    </MobileLayout>
  );
};

export default Register;
