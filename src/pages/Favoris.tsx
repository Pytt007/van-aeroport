import { motion } from "framer-motion";
import { Star, Users, Gauge, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import MobileLayout, { PageTransition } from "@/components/MobileLayout";
import MobileHeader from "@/components/MobileHeader";
import { Button } from "@/components/ui/button";
import taxiSedan from "@/assets/taxi-sedan.png";
import taxiSuv from "@/assets/taxi-suv.png";
import taxiVan from "@/assets/taxi-van.png";

const FAVORITES_KEY = "vtc_favorites";

const allVehicles = [
  {
    id: 0,
    name: "Bestune T55",
    image: taxiSedan,
    rating: 4.8,
    speed: "190 km/h",
    engine: "1.5L Turbo",
    seats: "5 Places",
  },
  {
    id: 1,
    name: "Bestune T77",
    image: taxiSuv,
    rating: 4.9,
    speed: "192 km/h",
    engine: "1.5L Turbo",
    seats: "5 Places",
  },
  {
    id: 2,
    name: "Nissan Kicks",
    image: taxiVan,
    rating: 4.7,
    speed: "180 km/h",
    engine: "1.6L Essence",
    seats: "5 Places",
  },
];

const Favoris = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const favorites = allVehicles.filter((v) => favoriteIds.has(v.id));

  const removeFavorite = (id: number) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify([...next]));
      return next;
    });
  };

  return (
    <MobileLayout>
      <PageTransition>
        <MobileHeader title={t("nav.favoris")} showProfile={true} />
        <div className="px-4 pb-4">
          {favorites.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center pt-20 px-8 text-center"
            >
              <Star className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="font-heading font-semibold text-base">Aucun favori</p>
              <p className="text-muted-foreground text-sm font-body mt-2">
                Ajoutez des véhicules à vos favoris depuis la liste des véhicules.
              </p>
              <Button
                onClick={() => navigate("/vehicles")}
                className="mt-6 w-full h-14 rounded-2xl bg-primary text-primary-foreground font-heading font-semibold text-sm tracking-wide"
              >
                Explorer les véhicules
              </Button>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {favorites.map((vehicle, i) => (
                <motion.div
                  key={vehicle.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="rounded-2xl bg-card border border-border overflow-hidden"
                >
                  {/* Image */}
                  <div className="relative h-36 bg-secondary">
                    <img src={vehicle.image} alt={vehicle.name} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeFavorite(vehicle.id)}
                      className="absolute top-3 right-3 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform"
                    >
                      <Star className="w-4 h-4 fill-primary text-primary" />
                    </button>
                  </div>

                  {/* Info */}
                  <div className="p-3.5">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="font-heading font-bold text-base">{vehicle.name}</h2>
                      <div className="flex items-center gap-1 bg-secondary px-2.5 py-1 rounded-full">
                        <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                        <span className="font-heading font-semibold text-xs">{vehicle.rating}</span>
                      </div>
                    </div>

                    {/* Specs */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {[
                        { icon: Gauge, value: vehicle.speed },
                        { icon: Zap, value: vehicle.engine },
                        { icon: Users, value: vehicle.seats },
                      ].map((spec, j) => (
                        <div key={j} className="flex flex-col items-center py-2 rounded-xl bg-secondary">
                          <spec.icon className="w-3.5 h-3.5 text-muted-foreground mb-1" />
                          <span className="text-[10px] font-heading font-semibold text-foreground">{spec.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Price + CTA */}
                    <div className="flex items-center justify-end">
                      <Button
                        onClick={() => navigate("/vehicle-detail", { state: { vehicle } })}
                        className="h-12 px-8 rounded-xl bg-primary text-primary-foreground font-heading font-semibold text-sm tracking-wide shadow-lg"
                      >
                        Réserver
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

        </div>
      </PageTransition>
    </MobileLayout>
  );
};

export default Favoris;
