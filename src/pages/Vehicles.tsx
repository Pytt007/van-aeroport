import { motion } from "framer-motion";
import { Star, Gauge, Users, Zap, Car } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import MobileLayout, { PageTransition } from "@/components/MobileLayout";
import MobileHeader from "@/components/MobileHeader";
import { Button } from "@/components/ui/button";
import taxiSedan from "@/assets/taxi-sedan.png";
import taxiSuv from "@/assets/taxi-suv.png";
import taxiVan from "@/assets/taxi-van.png";

export const vehicles = [
  {
    name: "Bestune T55",
    image: taxiSedan,
    rating: 4.8,
    speed: "190 km/h",
    seats: "5 Places",
    engine: "1.5L Turbo",
  },
  {
    name: "Bestune T77",
    image: taxiSuv,
    rating: 4.9,
    speed: "192 km/h",
    seats: "5 Places",
    engine: "1.5L Turbo",
  },
  {
    name: "Nissan Kicks",
    image: taxiVan,
    rating: 4.7,
    speed: "180 km/h",
    seats: "5 Places",
    engine: "1.6L Essence",
  },
];

const FAVORITES_KEY = "vtc_favorites";

const Vehicles = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]));
  }, [favorites]);

  const [dynamicVehicles, setDynamicVehicles] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from("vehicles")
      .select("*")
      .order("name", { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) {
          // Map dynamic vehicles to local images if image_url is a placeholder
          const mappedData = data.map(dbCar => {
            const localCar = vehicles.find(v => v.name === dbCar.name);
            const isPlaceholder = dbCar.image_url && (
              dbCar.image_url.includes("votre-bucket.supabase.co") ||
              dbCar.image_url.includes("placeholder")
            );

            return {
              ...dbCar,
              image: isPlaceholder ? (localCar?.image || dbCar.image_url) : (dbCar.image_url || localCar?.image)
            };
          });
          setDynamicVehicles(mappedData);
        }
      });
  }, []);

  const displayVehicles = dynamicVehicles.length > 0 ? dynamicVehicles : (vehicles as any[]);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <MobileLayout>
      <PageTransition>
        <MobileHeader title={t("nav.explorer")} showBack={true} showStar={false} />
        <div className="px-4 pb-4 space-y-4">
          {displayVehicles.map((car, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl bg-card border border-border overflow-hidden"
            >
              {/* Car image */}
              <div className="relative h-48 bg-secondary/50 flex items-center justify-center overflow-hidden p-4">
                <img src={car.image_url || car.image} alt={car.name} className="h-full w-full object-contain" />
                <button
                  onClick={(e) => toggleFavorite(car.id || car.name, e)}
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-background/75 backdrop-blur-sm flex items-center justify-center shadow active:scale-90 transition-transform"
                >
                  <Star
                    className={`w-4 h-4 transition-colors ${favorites.has(car.id || car.name) ? "fill-primary text-primary" : "text-foreground"
                      }`}
                  />
                </button>
              </div>

              <div className="p-4">
                {/* Name + rating */}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-heading font-bold text-base">{car.name}</h3>
                  <div className="flex items-center gap-1 bg-secondary px-2.5 py-1 rounded-full">
                    <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                    <span className="font-body font-medium text-xs">{car.rating}</span>
                  </div>
                </div>

                {/* Specs */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { icon: Gauge, label: t("booking.specs.speed"), value: car.speed },
                    { icon: Zap, label: t("booking.specs.engine"), value: car.engine },
                    { icon: Users, label: t("booking.specs.seats"), value: car.seats },
                  ].map((spec) => (
                    <div key={spec.label} className="flex flex-col items-center p-2.5 rounded-xl bg-secondary">
                      <spec.icon className="w-3.5 h-3.5 text-muted-foreground mb-1" />
                      <span className="text-[9px] text-muted-foreground font-body">{spec.label}</span>
                      <span className="text-[11px] font-heading font-semibold mt-0.5">{spec.value}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => navigate("/vehicle-detail", { state: { vehicle: car } })}
                  className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-heading font-semibold text-sm tracking-wide shadow-lg"
                >
                  {t("booking.reserve_now")}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </PageTransition>
    </MobileLayout>
  );
};

export default Vehicles;
