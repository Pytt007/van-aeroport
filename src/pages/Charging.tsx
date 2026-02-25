import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Power, Clock, DollarSign, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import MobileLayout, { PageTransition } from "@/components/MobileLayout";
import MobileHeader from "@/components/MobileHeader";
import taxiTop from "@/assets/taxi-topview.png";

const Charging = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!started) return;
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(timer);
          return 100;
        }
        return p + 1;
      });
    }, 40);
    return () => clearInterval(timer);
  }, [started]);

  useEffect(() => {
    if (progress >= 100) {
      const timeout = setTimeout(() => navigate("/booking"), 600);
      return () => clearTimeout(timeout);
    }
  }, [progress, navigate]);

  return (
    <MobileLayout>
      <PageTransition>
        <div className="min-h-screen bg-background flex flex-col">
          <MobileHeader title={started ? "Chargement..." : "Préparation"} />

          {/* Vehicle info */}
          <div className="px-6 flex items-center justify-between">
            <div>
              <h2 className="font-heading font-bold text-2xl text-foreground">Van</h2>
              <p className="text-sm text-muted-foreground font-body">Élégant & Moderne</p>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              <div className="text-right">
                <span className="font-heading font-bold text-xl text-foreground">{progress}%</span>
                <p className="text-[10px] text-muted-foreground font-body">niveau</p>
              </div>
            </div>
          </div>

          {/* Dot indicators */}
          <div className="flex justify-center gap-2 mt-6">
            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
            <div className="w-2.5 h-2.5 rounded-full bg-muted" />
          </div>

          {/* Car with glow */}
          <div className="flex-1 flex flex-col items-center justify-center relative px-6">
            <div className="relative">
              {/* Glow rings */}
              <motion.div
                className="absolute inset-0 -m-10 rounded-full"
                style={{
                  background: "radial-gradient(circle, hsl(42 97% 49% / 0.2) 0%, hsl(42 97% 49% / 0.08) 40%, transparent 70%)",
                }}
                animate={{ scale: started ? [1, 1.1, 1] : 1, opacity: started ? [0.6, 1, 0.6] : 0.4 }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <motion.div
                className="absolute inset-0 -m-20 rounded-full"
                style={{
                  background: "radial-gradient(circle, hsl(42 97% 49% / 0.1) 0%, transparent 60%)",
                }}
                animate={{ scale: started ? [1, 1.15, 1] : 1 }}
                transition={{ duration: 2.5, repeat: Infinity }}
              />
              <img
                src={taxiTop}
                alt="Vehicle top view"
                className="w-56 h-auto relative z-10 drop-shadow-2xl"
              />
            </div>

            {/* Time & cost indicators */}
            <div className="flex items-center justify-between w-full mt-4 px-4">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-sm font-body text-foreground">5 min</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-body text-foreground">2:07</span>
                <DollarSign className="w-4 h-4 text-primary" />
              </div>
            </div>

            {/* Animated dots */}
            <div className="flex flex-col items-center gap-1.5 mt-6">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-primary"
                  animate={{ opacity: started ? [0.3, 1, 0.3] : 0.3 }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          </div>

          {/* Power button */}
          <div className="flex justify-center pb-8">
            <motion.button
              onClick={() => setStarted(true)}
              whileTap={{ scale: 0.92 }}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${started
                  ? "bg-primary shadow-[0_0_30px_hsl(42_97%_49%/0.5)]"
                  : "bg-secondary border-2 border-primary/40"
                }`}
            >
              <Power className={`w-8 h-8 transition-colors ${started ? "text-primary-foreground" : "text-primary"}`} />
            </motion.button>
          </div>
        </div>
      </PageTransition>
    </MobileLayout>
  );
};

export default Charging;
