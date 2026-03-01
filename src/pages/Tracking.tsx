import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Phone, MessageSquare, MapPin, Clock, Navigation } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import MobileLayout, { PageTransition } from "@/components/MobileLayout";
import MobileHeader from "@/components/MobileHeader";
import taxiSedan from "@/assets/taxi-sedan.png";

const Tracking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { vehicle, destination, pickup } = location.state || {
    vehicle: null,
    destination: "Abidjan",
    pickup: "Aéroport FHB"
  };

  const [eta, setEta] = useState(15);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(timer);
          return 100;
        }
        return p + 2;
      });
    }, 200);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      const timeout = setTimeout(() => navigate("/profile"), 1500);
      return () => clearTimeout(timeout);
    }
  }, [progress, navigate]);

  return (
    <MobileLayout>
      <PageTransition>
        <MobileHeader title="Course en cours" showBack={false} />
        <div className="px-5 pb-4">
          {/* Map area */}
          <div className="rounded-2xl bg-card border border-border h-56 relative overflow-hidden mb-5">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary via-muted to-card" />
            {/* Animated route dots */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-1">
                {Array.from({ length: 8 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-primary"
                    initial={{ opacity: 0.3 }}
                    animate={{ opacity: progress > i * 12 ? 1 : 0.3 }}
                    transition={{ duration: 0.3 }}
                  />
                ))}
              </div>
            </div>
            {/* Car indicator */}
            <motion.div
              className="absolute left-1/2 -translate-x-1/2"
              animate={{ top: `${Math.max(15, 80 - progress * 0.65)}%` }}
              transition={{ type: "spring", stiffness: 100 }}
            >
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center glow-amber">
                <Navigation className="w-5 h-5 text-primary-foreground" />
              </div>
            </motion.div>
            {/* Start & end pins */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <div className="w-6 h-6 rounded-full bg-primary/30 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-primary" />
              </div>
            </div>
            <div className="absolute top-4 left-1/2 -translate-x-1/2">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
          </div>

          {/* ETA card */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="rounded-2xl bg-card border border-border p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-muted-foreground text-xs font-body">Temps estimé</p>
                <p className="font-heading font-bold text-2xl">
                  {Math.max(0, Math.ceil(eta - (progress / 100) * eta))} min
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-sm font-body text-muted-foreground">En route</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>

          {/* Driver info */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-card border border-border p-4 mt-4 flex items-center gap-4"
          >
            <img src={taxiSedan} alt="Car" className="w-16 h-12 object-cover rounded-lg" />
            <div className="flex-1">
              <p className="font-heading font-semibold">Ahmad K.</p>
              <p className="text-xs text-muted-foreground font-body">{vehicle || 'Toyota Camry'} · AB-123-CD</p>
              <div className="flex items-center gap-1 mt-1">
                <div className="text-primary text-xs">★★★★★</div>
                <span className="text-xs text-muted-foreground">4.9</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                <Phone className="w-4 h-4 text-primary" />
              </button>
              <button className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-primary" />
              </button>
            </div>
          </motion.div>

          {/* Trip details */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl bg-card border border-border p-4 mt-4"
          >
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center gap-1 mt-1">
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                <div className="w-0.5 h-10 bg-border" />
                <div className="w-2.5 h-2.5 rounded-full border-2 border-primary bg-transparent" />
              </div>
              <div className="space-y-5 flex-1">
                <div>
                  <p className="text-xs text-muted-foreground font-body">Départ</p>
                  <p className="font-body font-medium text-sm">{pickup}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-body">Destination</p>
                  <p className="font-body font-medium text-sm">{destination}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </PageTransition>
    </MobileLayout>
  );
};

export default Tracking;
