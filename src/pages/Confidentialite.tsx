import { motion } from "framer-motion";
import { Lock, Eye, Bell, Share2, Shield } from "lucide-react";
import { useState } from "react";
import MobileLayout, { PageTransition } from "@/components/MobileLayout";
import MobileHeader from "@/components/MobileHeader";

const settings = [
  { icon: Eye, label: "Visibilité du profil", subtitle: "Qui peut voir votre profil", defaultOn: true },
  { icon: Bell, label: "Notifications push", subtitle: "Recevoir des alertes en temps réel", defaultOn: true },
  { icon: Share2, label: "Partage de position", subtitle: "Partager votre position en course", defaultOn: false },
  { icon: Lock, label: "Authentification 2FA", subtitle: "Sécuriser votre compte", defaultOn: false },
];

const Confidentialite = () => {
  const [toggled, setToggled] = useState<boolean[]>(settings.map((s) => s.defaultOn));

  const toggle = (i: number) =>
    setToggled((prev) => prev.map((v, idx) => (idx === i ? !v : v)));

  return (
    <MobileLayout>
      <PageTransition>
        <MobileHeader title="Confidentialité" />
        <div className="px-4 pb-4 space-y-4">
          <div className="rounded-2xl bg-card border border-border overflow-hidden">
            {settings.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className={`flex items-center gap-4 px-5 py-4 ${i < settings.length - 1 ? "border-b border-border" : ""}`}
                >
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body font-medium text-sm">{item.label}</p>
                    <p className="text-muted-foreground text-xs font-body">{item.subtitle}</p>
                  </div>
                  <button
                    onClick={() => toggle(i)}
                    className={`relative w-12 h-6 rounded-full transition-colors duration-200 shrink-0 ${toggled[i] ? "bg-primary" : "bg-secondary border border-border"}`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200 ${toggled[i] ? "left-6" : "left-0.5"}`}
                    />
                  </button>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/20"
          >
            <Shield className="w-5 h-5 text-primary shrink-0" />
            <p className="text-xs font-body text-muted-foreground">
              Vos données sont chiffrées et protégées selon les normes RGPD.
            </p>
          </motion.div>
        </div>
      </PageTransition>
    </MobileLayout>
  );
};

export default Confidentialite;
