import { motion } from "framer-motion";
import { ChevronRight, MessageCircle, Phone, Mail, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import MobileLayout, { PageTransition } from "@/components/MobileLayout";
import MobileHeader from "@/components/MobileHeader";
import { CONFIG } from "@/constants/config";

const faq = [
  {
    q: "Comment annuler une réservation ?",
    a: "Pour toute annulation, merci de nous contacter directement via WhatsApp en précisant :\n\nVotre nom\nLa date et l’heure de la course\nLe lieu de prise en charge\n\nNotre équipe vous répondra rapidement avec confirmation.\n\n⏳ Toute annulation tardive peut entraîner des frais selon le délai."
  },
  {
    q: "Quels sont les modes de paiement acceptés ?",
    a: "Nous acceptons :\n\nMobile Money\nVirement bancaire\nPaiement en espèces\n\nLes instructions de paiement vous seront communiquées via WhatsApp après validation de votre réservation."
  },
  {
    q: "Conditions tarifaires",
    a: "Course standard : 10 000 F CFA (1 heure incluse)\nHeure complémentaire d’attente : à partir de 7 000 F CFA\nFrais de parking : refacturés au client si applicables\n\nNos tarifs sont transparents et communiqués à l’avance, sans surprise."
  },
  {
    q: "Que faire si mon chauffeur est en retard ?",
    a: "Nous accordons une importance primordiale à la ponctualité.\n\nEn cas de retard exceptionnel, contactez-nous immédiatement via WhatsApp.\nNotre équipe assurera un suivi en temps réel et vous tiendra informé jusqu’à votre prise en charge.\n\nVotre confort et votre sérénité sont notre priorité."
  },
  {
    q: "Comment modifier ma réservation ?",
    a: "Pour toute modification (horaire, lieu, date), contactez-nous via WhatsApp avec :\n\nVotre nom\nLes détails de la réservation\nLes ajustements souhaités\n\nNous confirmerons la disponibilité dans les meilleurs délais."
  },
];

const contacts = [
  {
    icon: Phone,
    label: "Appeler le support",
    value: CONFIG.WHATSAPP_NUMBER,
    action: () => window.location.href = `tel:${CONFIG.WHATSAPP_NUMBER}`
  },
  {
    icon: Mail,
    label: "Envoyer un email",
    value: CONFIG.SUPPORT_EMAIL,
    action: () => window.location.href = `mailto:${CONFIG.SUPPORT_EMAIL}`
  },
  {
    icon: MessageCircle,
    label: "Chat en direct",
    value: "WhatsApp Support",
    action: () => window.open(`https://wa.me/${CONFIG.WHATSAPP_NUMBER}`, '_blank')
  },
];

const Aide = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <MobileLayout>
      <PageTransition>
        <MobileHeader title="Aide & Support" />
        <div className="px-4 pb-4 space-y-5">
          {/* Contact cards */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-body uppercase tracking-wider">Nous contacter</p>
            {contacts.map((c, i) => {
              const Icon = c.icon;
              return (
                <motion.button
                  key={c.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  onClick={c.action}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card border border-border active:border-primary/40 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-body font-medium text-sm">{c.label}</p>
                    <p className="text-muted-foreground text-xs font-body">{c.value}</p>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* FAQ */}
          <div>
            <p className="text-xs text-muted-foreground font-body uppercase tracking-wider mb-2">Questions fréquentes</p>
            <div className="rounded-2xl bg-card border border-border overflow-hidden">
              {faq.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 + i * 0.07 }}
                  className={i < faq.length - 1 ? "border-b border-border" : ""}
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center gap-3 px-5 py-4 text-left"
                  >
                    <HelpCircle className="w-4 h-4 text-primary shrink-0" />
                    <span className="flex-1 font-body text-sm font-medium">{item.q}</span>
                    <ChevronRight
                      className={`w-4 h-4 text-muted-foreground transition-transform ${openFaq === i ? "rotate-90" : ""}`}
                    />
                  </button>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      className="px-5 pb-4"
                    >
                      <p className="text-muted-foreground text-sm font-body leading-relaxed whitespace-pre-wrap">{item.a}</p>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </PageTransition>
    </MobileLayout>
  );
};

export default Aide;
