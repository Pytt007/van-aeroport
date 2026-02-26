import { motion } from "framer-motion";
import { MapPin, Clock, Star, Car, Search, ChevronRight, Plane } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import MobileLayout from "@/components/MobileLayout";
import MobileHeader from "@/components/MobileHeader";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/theme-provider";
import { supabase } from "@/integrations/supabase/client";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import taxiSedan from "@/assets/taxi-sedan.png";
import taxiSuv from "@/assets/taxi-suv.png";
import taxiVan from "@/assets/taxi-van.png";
import Logo from "@/assets/Logo.png";
import LogoLight from "@/assets/logolight.png";

const popularVehicles = [
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

const locations = [
  "Aéroport Félix Houphouët-Boigny",
  "Abobo",
  "Adjamé",
  "Attécoubé",
  "Anyama",
  "Bingerville",
  "Cocody",
  "Koumassi",
  "Marcory",
  "Plateau",
  "Port-Bouët",
  "Songon",
  "Treichville",
  "Yopougon"
];

interface Vehicle {
  name: string;
  image?: string;
  image_url?: string;
  rating: number;
  speed: string;
  seats: string;
  engine: string;
}

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [destination, setDestination] = useState("");
  const [profile, setProfile] = useState<{ full_name: string | null } | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setProfile(data);
      });
  }, [user]);

  const displayName = profile?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "Voyageur";

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    supabase
      .from("vehicles")
      .select("*")
      .order("rating", { ascending: false })
      .limit(3)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setVehicles(data as Vehicle[]);
        }
      });
  }, []);

  const handleDestinationSearch = () => {
    if (destination.trim()) {
      navigate("/booking", { state: { destination } });
    } else {
      navigate("/vehicles");
    }
  };

  return (
    <MobileLayout>
      <MobileHeader
        title={
          <img
            src={theme === "dark" ? Logo : LogoLight}
            alt="Vanaeroport"
            className="h-8 w-auto object-contain mt-1"
          />
        }
        showBack={false}
        showProfile={true}
      />
      <div className="px-4 pb-4">
        {/* Header */}
        <div className="pb-2 flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm font-body">{t("home.greeting", { name: displayName })}</p>
            <h1 className="text-xl font-heading font-bold leading-tight">
              {t("home.question")}<span className="text-primary">?</span>
            </h1>
          </div>
        </div>


        {/* Search bar (Bottom Sheet) */}
        <div className="mt-3">
          <Drawer>
            <DrawerTrigger asChild>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-2 p-3.5 rounded-2xl bg-card border border-border cursor-pointer active:scale-[0.98] transition-all"
              >
                <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-sm font-body text-muted-foreground">
                    {destination || t("home.search_placeholder")}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </motion.div>
            </DrawerTrigger>
            <DrawerContent className="px-4 pb-8">
              <DrawerHeader className="px-0">
                <DrawerTitle className="text-left font-heading">{t("home.search_placeholder")}</DrawerTitle>
                <DrawerDescription className="text-left font-body">
                  Choisissez votre destination parmi nos zones de service
                </DrawerDescription>
              </DrawerHeader>
              <div className="grid grid-cols-1 gap-2 mt-4 max-h-[50vh] overflow-y-auto pr-2 scroll-area">
                {locations.map((loc) => (
                  <DrawerClose asChild key={loc}>
                    <button
                      onClick={() => {
                        setDestination(loc);
                        navigate("/booking", { state: { destination: loc } });
                      }}
                      className="flex items-center gap-3 p-4 rounded-xl bg-secondary/40 active:bg-secondary transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-body font-medium text-sm">{loc}</span>
                    </button>
                  </DrawerClose>
                ))}
              </div>
            </DrawerContent>
          </Drawer>
        </div>

        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-4 grid grid-cols-3 gap-3"
        >
          {[
            { icon: Plane, label: t("nav.explorer"), path: "/booking" },
            { icon: Car, label: t("nav.rentals"), path: "/rentals" },
            { icon: Clock, label: t("nav.rides"), path: "/ride-booking" },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border shadow-sm active:scale-95 transition-all text-center"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-1">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <span className="text-[11px] font-heading font-semibold text-foreground leading-tight">{item.label}</span>
            </button>
          ))}
        </motion.div>


        {/* Popular vehicles */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-6"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-semibold text-base">{t("home.popular_vehicles")}</h2>
            <button
              onClick={() => navigate("/vehicles")}
              className="text-primary text-xs font-body font-medium"
            >
              {t("home.see_all")}
            </button>
          </div>

          <div className="space-y-4">
            {(vehicles.length > 0 ? vehicles : popularVehicles).map((car, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25 + i * 0.1 }}
                className="group relative bg-card rounded-[32px] border border-border overflow-hidden active:scale-[0.98] transition-all shadow-sm"
              >
                {/* Image Section */}
                <div
                  onClick={() => navigate("/vehicle-detail", { state: { vehicle: car } })}
                  className="relative h-48 bg-secondary/50 flex items-center justify-center p-6"
                >
                  <img
                    src={car.image_url || car.image}
                    alt={car.name}
                    className="w-full h-full object-contain transform group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Star Button */}
                  <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-background/80 backdrop-blur-md flex items-center justify-center shadow-sm active:scale-90 transition-transform">
                    <Star className="w-5 h-5 text-foreground/70" />
                  </button>
                </div>

                {/* Info Section */}
                <div
                  onClick={() => navigate("/vehicle-detail", { state: { vehicle: car } })}
                  className="p-6 flex items-center justify-between"
                >
                  <div>
                    <h3 className="font-heading font-extrabold text-xl text-foreground tracking-tight">{car.name}</h3>
                    <p className="text-muted-foreground text-[11px] font-body mt-1 uppercase tracking-wider">{car.seats || car.seats} · {car.engine || car.engine}</p>
                  </div>

                  {/* Rating Badge - Matches screenshot style */}
                  <div className="flex items-center gap-1.5 bg-foreground/5 backdrop-blur-md px-4 py-2 rounded-2xl border border-border/50">
                    <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                    <span className="text-sm font-heading font-bold text-foreground">{car.rating}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </MobileLayout>
  );
};

export default Index;
