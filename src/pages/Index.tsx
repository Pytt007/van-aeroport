import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Clock, Star, Car, Search, ChevronRight, Plane, ArrowLeft, Calendar, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import MobileLayout from "@/components/MobileLayout";
import MobileHeader from "@/components/MobileHeader";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/theme-provider";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
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
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi
} from "@/components/ui/carousel";
import { Gift, Zap, Trophy } from "lucide-react";

interface Vehicle {
  name: string;
  image?: string;
  image_url?: string;
  rating: number;
  speed: string;
  seats: string;
  engine: string;
}

const promos = [
  {
    title: "Offre de lancement",
    description: "-10% sur vos premières commandes jusqu'au 30 avril !",
    icon: Zap,
    color: "from-amber-400 to-orange-500",
  },
  {
    title: "Fidélité Récompensée",
    description: "-50% sur votre 15ème commande.",
    icon: Gift,
    color: "from-primary to-blue-600",
  },
  {
    title: "Le Graal du Voyageur",
    description: "Votre 20ème commande est 100% OFFERTE !",
    icon: Trophy,
    color: "from-indigo-500 to-purple-600",
  }
];

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [destination, setDestination] = useState("");
  const [pickup, setPickup] = useState("");
  const [profile, setProfile] = useState<{ full_name: string | null } | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [activeForm, setActiveForm] = useState<'none' | 'ride' | 'rental' | 'airport'>('none');

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

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  useEffect(() => {
    // Fetch vehicles
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

    // Fetch communes
    supabase
      .from("communes")
      .select("name")
      .order("display_order", { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setLocations(data.map(c => c.name));
        }
      });
  }, []);

  const displayName = profile?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "Voyageur";

  const handleDestinationSearch = () => {
    if (destination.trim()) {
      navigate("/booking", { state: { destination } });
    } else {
      navigate("/vehicles");
    }
  };

  const getVehicleImage = (vehicle: Vehicle) => {
    if (vehicle.image_url && !vehicle.image_url.includes('votre-bucket.supabase.co')) {
      return vehicle.image_url;
    }

    const name = vehicle.name.toLowerCase();
    if (name.includes('t55')) return taxiSedan;
    if (name.includes('t77')) return taxiSuv;
    if (name.includes('kicks')) return taxiVan;

    return taxiSedan; // Fallback
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

        {/* Promotion Slider */}
        <div className="mt-2 text-white">
          <Carousel
            setApi={setApi}
            plugins={[
              Autoplay({
                delay: 4000,
              }),
            ]}
            className="w-full"
          >
            <CarouselContent>
              {promos.map((promo, index) => (
                <CarouselItem key={index}>
                  <div className={`p-4 rounded-3xl bg-gradient-to-br ${promo.color} shadow-lg overflow-hidden relative active:scale-[0.98] transition-all`}>
                    <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12">
                      <promo.icon size={120} />
                    </div>
                    <div className="relative z-10 flex items-center gap-4 text-left">
                      <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                        <promo.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-heading font-bold text-sm tracking-wide uppercase">{promo.title}</h3>
                        <p className="text-white/90 text-[12px] font-body leading-tight mt-0.5 line-clamp-2">{promo.description}</p>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
          {/* Dots Indicator */}
          <div className="flex justify-center gap-1.5 mt-2.5">
            {promos.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "h-1 rounded-full transition-all duration-300",
                  current === index ? "w-6 bg-primary" : "w-1.5 bg-muted"
                )}
              />
            ))}
          </div>
        </div>

        {/* Search bar (Bottom Sheet) */}
        <div className="mt-4">
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
                  <Search className="w-4 h-4 text-muted-foreground" />
                </div>
              </motion.div>
            </DrawerTrigger>
            <DrawerContent className="px-4 pb-8">
              <DrawerHeader className="px-0">
                <DrawerTitle className="text-left font-heading">{t("home.where_to")}</DrawerTitle>
                <DrawerDescription className="text-left font-body">Sélectionnez votre commune de destination.</DrawerDescription>
              </DrawerHeader>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={t("home.search_placeholder")}
                  className="w-full bg-secondary rounded-xl py-3 pl-10 pr-4 text-sm font-body focus:outline-none focus:ring-1 focus:ring-primary"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleDestinationSearch()}
                />
              </div>
              <div className="grid grid-cols-1 gap-2 mt-4 max-h-[40vh] overflow-y-auto pr-1 scroll-area">
                {locations.filter(l => l.toLowerCase().includes(destination.toLowerCase())).map((loc) => (
                  <DrawerClose key={loc} asChild>
                    <button
                      onClick={() => {
                        setDestination(loc);
                        navigate("/booking", { state: { destination: loc } });
                      }}
                      className="flex items-center gap-3 p-3.5 rounded-xl hover:bg-secondary active:bg-secondary transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <span className="text-sm font-body font-medium">{loc}</span>
                    </button>
                  </DrawerClose>
                ))}
              </div>
            </DrawerContent>
          </Drawer>
        </div>

        {/* Categories / Airport Form */}
        <div className="mt-8">
          <AnimatePresence mode="wait">
            {activeForm === 'none' ? (
              <motion.div
                key="categories"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
                className="grid grid-cols-2 gap-4"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  onClick={() => setActiveForm('ride')}
                  className="p-5 rounded-3xl bg-secondary/40 border border-border group active:scale-[0.98] transition-all cursor-pointer overflow-hidden relative"
                >
                  <div className="absolute right-0 top-0 h-full w-1/2 opacity-5 flex items-center justify-center rotate-12 -translate-y-4 translate-x-4">
                    <Car size={80} className="text-primary" />
                  </div>
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary transition-colors">
                      <Car className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="font-heading font-bold text-sm tracking-tight mb-1">{t("home.ride_now")}</h3>
                    <p className="text-[11px] text-muted-foreground font-body leading-tight">{t("home.ride_now_desc")}</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  onClick={() => setActiveForm('rental')}
                  className="p-5 rounded-3xl bg-secondary/40 border border-border group active:scale-[0.98] transition-all cursor-pointer overflow-hidden relative"
                >
                  <div className="absolute right-0 top-0 h-full w-1/2 opacity-5 flex items-center justify-center rotate-12 -translate-y-4 translate-x-4">
                    <Clock size={80} className="text-primary" />
                  </div>
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary transition-colors">
                      <Clock className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="font-heading font-bold text-sm tracking-tight mb-1">{t("home.rentals")}</h3>
                    <p className="text-[11px] text-muted-foreground font-body leading-tight">{t("home.rentals_desc")}</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  onClick={() => setActiveForm('airport')}
                  className="col-span-2 p-5 rounded-3xl bg-secondary/40 border border-border group active:scale-[0.98] transition-all cursor-pointer overflow-hidden relative"
                >
                  <div className="absolute right-0 top-0 h-full w-1/3 opacity-5 flex items-center justify-center rotate-12">
                    <Plane size={120} className="text-primary" />
                  </div>
                  <div className="relative z-10 flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors">
                      <Plane className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-heading font-bold text-sm tracking-tight mb-1">{t("home.airport_van")}</h3>
                      <p className="text-[11px] text-muted-foreground font-body leading-tight">{t("home.airport_van_desc")}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors ml-auto" />
                  </div>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key={`${activeForm}-form`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-card border border-border rounded-[32px] p-6 shadow-xl relative overflow-hidden"
              >
                <div className="absolute right-0 top-0 opacity-[0.03] -translate-y-1/4 translate-x-1/4">
                  {activeForm === 'ride' && <Car size={200} />}
                  {activeForm === 'rental' && <Clock size={200} />}
                  {activeForm === 'airport' && <Plane size={200} />}
                </div>

                <div className="flex items-center gap-3 mb-6">
                  <button
                    onClick={() => setActiveForm('none')}
                    className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center active:scale-90 transition-all"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h3 className="font-heading font-bold text-lg">
                    {activeForm === 'ride' && "Commander une course"}
                    {activeForm === 'rental' && "Location de véhicule"}
                    {activeForm === 'airport' && "Réservation Aéroport"}
                  </h3>
                </div>

                <div className="space-y-4 relative z-10">
                  <Drawer>
                    <DrawerTrigger asChild>
                      <div className="p-4 rounded-2xl bg-secondary/50 border border-border flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-all">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                            {activeForm === 'rental' ? "Lieu de location" : "Lieu de prise en charge"}
                          </p>
                          <p className="text-sm font-body font-medium truncate">{pickup || "D'où partez-vous ?"}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </DrawerTrigger>
                    <DrawerContent className="px-4 pb-8">
                      <DrawerHeader className="px-0">
                        <DrawerTitle className="text-left font-heading">
                          {activeForm === 'rental' ? "Lieu de location" : "Prise en charge"}
                        </DrawerTitle>
                      </DrawerHeader>
                      <div className="grid grid-cols-1 gap-2 mt-4 max-h-[40vh] overflow-y-auto pr-1 scroll-area">
                        {locations.map((loc) => (
                          <DrawerClose key={loc} asChild>
                            <button
                              onClick={() => setPickup(loc)}
                              className="flex items-center gap-3 p-3.5 rounded-xl hover:bg-secondary active:bg-secondary transition-colors text-left"
                            >
                              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                                <MapPin className="w-4 h-4 text-muted-foreground" />
                              </div>
                              <span className="text-sm font-body font-medium">{loc}</span>
                            </button>
                          </DrawerClose>
                        ))}
                      </div>
                    </DrawerContent>
                  </Drawer>

                  {activeForm !== 'rental' && (
                    <Drawer>
                      <DrawerTrigger asChild>
                        <div className="p-4 rounded-2xl bg-secondary/50 border border-border flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-all">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Destination</p>
                            <p className="text-sm font-body font-medium truncate">{destination || "Où allez-vous ?"}</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </DrawerTrigger>
                      <DrawerContent className="px-4 pb-8">
                        <DrawerHeader className="px-0">
                          <DrawerTitle className="text-left font-heading">Destination</DrawerTitle>
                        </DrawerHeader>
                        <div className="grid grid-cols-1 gap-2 mt-4 max-h-[40vh] overflow-y-auto pr-1 scroll-area">
                          {locations.map((loc) => (
                            <DrawerClose key={loc} asChild>
                              <button
                                onClick={() => setDestination(loc)}
                                className="flex items-center gap-3 p-3.5 rounded-xl hover:bg-secondary active:bg-secondary transition-colors text-left"
                              >
                                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                                  <MapPin className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <span className="text-sm font-body font-medium">{loc}</span>
                              </button>
                            </DrawerClose>
                          ))}
                        </div>
                      </DrawerContent>
                    </Drawer>
                  )}

                  <div
                    onClick={() => {
                      const route = activeForm === 'rental' ? "/rentals" : activeForm === 'ride' ? "/ride-booking" : "/booking";
                      navigate(route, { state: { pickup, destination } });
                    }}
                    className="p-4 rounded-2xl bg-secondary/50 border border-border flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Date & Heure</p>
                      <p className="text-sm font-body font-medium">Choisir le moment du départ</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground ml-auto" />
                  </div>

                  <button
                    onClick={() => {
                      const route = activeForm === 'rental' ? "/rentals" : activeForm === 'ride' ? "/ride-booking" : "/booking";
                      navigate(route, { state: { pickup, destination } });
                    }}
                    className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-heading font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-all mt-2"
                  >
                    Continuer la réservation
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Popular vehicles */}
        <div className="mt-8 pb-10 text-left">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-heading font-bold">{t("home.popular_cars")}</h2>
            <button onClick={() => navigate("/vehicles")} className="text-primary text-xs font-bold font-heading hover:underline underline-offset-4">
              {t("common.see_all")}
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {vehicles.map((v, i) => (
              <motion.div
                key={v.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                onClick={() => navigate("/ride-booking", { state: { vehicle: v } })}
                className="flex items-center gap-4 p-4 rounded-3xl bg-card border border-border group active:scale-[0.98] transition-all cursor-pointer"
              >
                <div className="w-24 h-16 bg-secondary rounded-2xl flex items-center justify-center p-2 group-hover:bg-secondary/60 transition-colors">
                  <img src={getVehicleImage(v)} alt={v.name} className="h-full w-full object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading font-bold text-sm truncate">{v.name}</h3>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-3 h-3 fill-primary text-primary" />
                    <span className="text-[10px] font-bold">{v.rating}</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};

export default Index;
