import { useState } from "react";
import { motion } from "framer-motion";
import { Star, Gauge, Users, Zap } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import MobileLayout, { PageTransition } from "@/components/MobileLayout";
import MobileHeader from "@/components/MobileHeader";
import { Button } from "@/components/ui/button";

const FAVORITES_KEY = "vtc_favorites";

const vehicleDescriptions: Record<string, string> = {
  "Bestune T55": "Le Bestune T55 est un SUV crossover compact alliant un design avant-gardiste, un confort raffiné et des technologies de pointe pour une expérience de conduite exceptionnelle.",
  "Bestune T77": "Le Bestune T77 redéfinit le SUV compact avec son moteur 1.5L Turbo performant, son design audacieux et un intérieur spacieux doté d'équipements technologiques de pointe.",
  "Nissan Kicks": "Le Nissan Kicks est un SUV compact agile et connecté, parfait pour naviguer en ville avec style tout en profitant d'une consommation de carburant optimisée.",
};

const VehicleDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const vehicle = location.state?.vehicle;
  const [readMore, setReadMore] = useState(false);

  const getInitialLiked = () => {
    if (!vehicle?.id && !vehicle?.name) return false;
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      const ids: string[] = stored ? JSON.parse(stored) : [];
      return ids.includes(vehicle.id || vehicle.name);
    } catch {
      return false;
    }
  };
  const [liked, setLiked] = useState(getInitialLiked);

  const toggleLike = () => {
    if (!vehicle?.id && !vehicle?.name) return;
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      const ids: string[] = stored ? JSON.parse(stored) : [];
      const currentId = vehicle.id || vehicle.name;
      let updated: string[];
      if (ids.includes(currentId)) {
        updated = ids.filter((id) => id !== currentId);
      } else {
        updated = [...ids, currentId];
      }
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      setLiked(!liked);
    } catch { }
  };

  if (!vehicle) {
    navigate("/vehicles");
    return null;
  }

  const description = vehicleDescriptions[vehicle.name] || "Un véhicule premium pour tous vos déplacements.";


  return (
    <MobileLayout>
      <PageTransition>
        <div className="min-h-screen bg-background flex flex-col">
          <MobileHeader
            title="Détails du véhicule"
            showStar
            starActive={liked}
            onStar={toggleLike}
          />

          {/* Vehicle Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="relative mx-4 mt-2 rounded-3xl bg-secondary/50 flex items-center justify-center overflow-hidden h-52"
          >
            <img src={vehicle.image_url || vehicle.image} alt={vehicle.name} className="h-full w-full object-contain" />
          </motion.div>

          {/* Info */}
          <div className="px-4 mt-5 flex-1 text-center">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-bold text-2xl text-foreground">{vehicle.name}</h2>
              <div className="flex items-center gap-1.5 bg-secondary px-3 py-1.5 rounded-full">
                <Star className="w-4 h-4 fill-primary text-primary" />
                <span className="font-heading font-semibold text-sm text-foreground">{vehicle.rating}</span>
              </div>
            </div>

            <p className="text-muted-foreground font-body text-sm mt-3 leading-relaxed text-left">
              {readMore ? description : `${description.slice(0, 80)}...`}
              <button
                onClick={() => setReadMore(!readMore)}
                className="text-primary font-semibold ml-1"
              >
                {readMore ? " Moins" : " Lire plus"}
              </button>
            </p>

            {/* Specs */}
            <h3 className="font-heading font-bold text-base mt-5 mb-3 text-foreground text-left">Caractéristiques</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Gauge, label: "Vitesse max", value: vehicle.speed },
                { icon: Zap, label: "Moteur", value: vehicle.engine },
                { icon: Users, label: "Capacité", value: vehicle.seats },
              ].map((spec) => (
                <motion.div
                  key={spec.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex flex-col items-center p-4 rounded-2xl bg-secondary border border-border"
                >
                  <spec.icon className="w-5 h-5 text-muted-foreground mb-2" />
                  <span className="text-[11px] text-muted-foreground font-body">{spec.label}</span>
                  <span className="text-sm font-heading font-bold mt-1 text-foreground">{spec.value}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Bottom Booking Bar */}
          <motion.div
            initial={{ y: 80 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="mx-4 mb-6 mt-6 rounded-3xl bg-card border border-border p-5"
          >
            <Button
              onClick={() => navigate("/booking", { state: { vehicle } })}
              className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-heading font-semibold text-sm tracking-wide shadow-lg"
            >
              Réserver maintenant
            </Button>
          </motion.div>
        </div>
      </PageTransition>
    </MobileLayout>
  );
};

export default VehicleDetail;
