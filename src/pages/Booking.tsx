import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, ArrowRight, User, Phone, Calendar, Clock, Users, Star, ChevronRight, Gauge, Zap, MessageCircle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import MobileLayout, { PageTransition } from "@/components/MobileLayout";
import MobileHeader from "@/components/MobileHeader";
import SwipeButton from "@/components/SwipeButton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/hooks/useFavorites";
import {
  Home as HomeIcon,
  Briefcase,
  Archive,
  Plus
} from "lucide-react";
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

import { CONFIG } from "@/constants/config";

const Booking = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { favorites } = useFavorites();
  const vehicle = location.state?.vehicle || null;
  const incomingDestination = location.state?.destination || "";

  // Dynamic Data State
  const [communes, setCommunes] = useState<any[]>([]);
  const [zoneRates, setZoneRates] = useState<Record<string, number>>({});
  const [airportHub, setAirportHub] = useState("Aéroport Félix Houphouët-Boigny");

  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState(incomingDestination || "");
  const [estimatedPrice, setEstimatedPrice] = useState(0);

  // Fetch all dynamic data
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        // 1. Fetch Communes
        const { data: communesData } = await (supabase as any).from("communes").select("*").order("display_order");
        if (communesData && communesData.length > 0) {
          setCommunes(communesData);
          if (!pickup) setPickup(communesData[0]?.name);
          if (!destination && !incomingDestination) setDestination(communesData[6]?.name || "");
        } else {
          // Fallback communes
          const fallbackCommunes = [
            { id: "c1", name: "Aéroport Félix Houphouët-Boigny", zone_letter: null, airport_price: 0 },
            { id: "c2", name: "Marcory", zone_letter: "A", airport_price: 7500 },
            { id: "c3", name: "Cocody", zone_letter: "A", airport_price: 10000 },
            { id: "c4", name: "Yopougon", zone_letter: "C", airport_price: 15000 },
            { id: "c5", name: "Plateau", zone_letter: "A", airport_price: 10000 },
            { id: "c6", name: "Koumassi", zone_letter: "A", airport_price: 7500 },
            { id: "c7", name: "Port-Bouët", zone_letter: "A", airport_price: 7500 }
          ];
          setCommunes(fallbackCommunes);
          if (!pickup) setPickup(fallbackCommunes[0].name);
          if (!destination && !incomingDestination) setDestination(fallbackCommunes[2].name);
        }

        // 2. Fetch Zone Pricing
        const { data: zonesData } = await (supabase as any).from("zone_pricing").select("*");
        if (zonesData && zonesData.length > 0) {
          const rates: Record<string, number> = {};
          zonesData.forEach((z: any) => rates[z.zone_letter] = z.price);
          setZoneRates(rates);
        } else {
          setZoneRates({ "A": 8000, "B": 12000, "C": 15000, "D": 20000 });
        }

        // 3. Fetch Settings
        const { data: settingsData } = await (supabase as any).from("app_settings").select("*").eq("key", "airport_config").single();
        if (settingsData) {
          setAirportHub(settingsData.value.hub_name);
        }
      } catch (error) {
        console.error("Error fetching booking pricing:", error);
        // Fallback on error
        setCommunes([
          { id: "c1", name: "Aéroport Félix Houphouët-Boigny", zone_letter: null, airport_price: 0 },
          { id: "c2", name: "Marcory", zone_letter: "A", airport_price: 7500 },
          { id: "c3", name: "Cocody", zone_letter: "A", airport_price: 10000 }
        ]);
        setZoneRates({ "A": 8000, "B": 12000, "C": 15000, "D": 20000 });
      }
    };

    fetchPricing();
  }, []);

  const calculateDynamicPrice = (p: string, d: string) => {
    if (!p || !d || p === d) return 0;

    const pickupObj = communes.find(c => c.name === p);
    const destObj = communes.find(c => c.name === d);

    if (!pickupObj || !destObj) return 0;

    // Airport Logic
    if (p === airportHub) return destObj.airport_price || 0;
    if (d === airportHub) return pickupObj.airport_price || 0;

    // Zone Logic
    const zoneP = pickupObj.zone_letter;
    const zoneD = destObj.zone_letter;
    if (!zoneP || !zoneD) return 0;

    const maxZone = zoneP > zoneD ? zoneP : zoneD;
    return zoneRates[maxZone] || 0;
  };

  useEffect(() => {
    setEstimatedPrice(calculateDynamicPrice(pickup, destination));
  }, [pickup, destination, communes, zoneRates, airportHub]);

  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [phone, setPhone] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [returnTime, setReturnTime] = useState("");
  const [travelers, setTravelers] = useState("1");

  // Pre-fill user info from profile
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("user_id", user.id)
      .single()
      .then((result) => {
        const data = result.data as Database['public']['Tables']['profiles']['Row'] | null;
        if (data) {
          const parts = (data.full_name || "").split(" ");
          setFirstName(parts[0] || "");
          setLastName(parts.slice(1).join(" ") || "");
          setPhone(data.phone || "");
        }
      });
  }, [user]);

  const getAddressIcon = (type: string) => {
    switch (type) {
      case 'home': return HomeIcon;
      case 'work': return Briefcase;
      default: return MapPin;
    }
  };

  const handleConfirm = async () => {
    if (!destination || !lastName || !firstName || !phone || !pickupDate || !pickupTime) {
      toast.error(t("common.error"));
      return;
    }
    if (!vehicle) {
      toast.error(t("booking.choose_vehicle"));
      navigate("/vehicles");
      return;
    }

    // Save to Supabase if user is logged in (optional but good for history)
    if (user) {
      await supabase.from("bookings").insert({
        user_id: user.id,
        vehicle_name: vehicle.name,
        pickup_address: pickup,
        destination,
        pickup_date: pickupDate,
        pickup_time: pickupTime,
        return_date: returnDate || null,
        return_time: returnTime || null,
        travelers: parseInt(travelers),
        total_price: estimatedPrice,
        booking_type: "airport",
        status: "envoyée",
      });
    }

    // Generate WhatsApp Message
    const message = `Bonjour, je souhaite réserver un van.

Nom : ${lastName} ${firstName}
Téléphone : ${phone}
Date : ${pickupDate}
Heure : ${pickupTime}
Départ : ${pickup}
Destination : ${destination}
Prix estimé : ${estimatedPrice.toLocaleString('fr-FR')} F CFA

Merci de confirmer la disponibilité.`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappNumber = CONFIG.WHATSAPP_NUMBER;
    window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, '_blank');

    navigate("/success", {
      state: {
        type: "booking",
        data: {
          fullName: `${firstName} ${lastName}`,
          phone,
          pickupDate,
          pickupTime,
          pickup,
          destination,
          vehicleName: vehicle.name,
          total: estimatedPrice,
          travelers
        }
      }
    });
  };

  const inputClass =
    "w-full bg-secondary rounded-xl px-4 py-3 text-sm font-body placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary text-foreground";

  return (
    <MobileLayout>
      <PageTransition>
        <MobileHeader title={t("booking.title")} />
        <div className="px-4 pb-8 flex flex-col gap-4">

          {/* Vehicle recap */}
          {vehicle ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-card border border-border overflow-hidden"
            >
              <div className="flex items-center gap-4 p-4">
                <div className="w-20 h-16 rounded-xl bg-secondary overflow-hidden shrink-0">
                  <img src={vehicle.image_url || vehicle.image} alt={vehicle.name} className="w-full h-full object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading font-bold text-base truncate">{vehicle.name}</h3>
                    <div className="flex items-center gap-1 ml-2 shrink-0">
                      <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                      <span className="text-xs font-heading font-semibold">{vehicle.rating}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    {vehicle.speed && (
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-body">
                        <Gauge className="w-3 h-3" /> {vehicle.speed}
                      </span>
                    )}
                    {vehicle.seats && (
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-body">
                        <Users className="w-3 h-3" /> {vehicle.seats}
                      </span>
                    )}
                    {vehicle.engine && (
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-body">
                        <Zap className="w-3 h-3" /> {vehicle.engine}
                      </span>
                    )}
                  </div>

                </div>
              </div>
              <button
                onClick={() => navigate("/vehicles")}
                className="w-full flex items-center justify-between px-4 py-3 border-t border-border bg-secondary/40 active:bg-secondary/70 transition-colors"
              >
                <span className="text-xs font-body text-muted-foreground">{t("booking.change_vehicle")}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </motion.div>
          ) : (
            <motion.button
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => navigate("/vehicles")}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-card border border-dashed border-primary/40 active:border-primary transition-colors"
            >
              <span className="text-sm font-body text-muted-foreground">{t("booking.choose_vehicle")}</span>
              <ChevronRight className="w-4 h-4 text-primary" />
            </motion.button>
          )}

          {/* Route */}
          <div className="rounded-2xl bg-card border border-border p-4">
            <h3 className="font-heading font-semibold text-sm mb-3">{t("booking.route")}</h3>
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <div className="w-0.5 h-8 bg-border" />
                <div className="w-3 h-3 rounded-full border-2 border-primary bg-transparent" />
              </div>
              <div className="flex-1 space-y-3">
                {/* Pickup Drawer */}
                <Drawer>
                  <DrawerTrigger asChild>
                    <div className={cn(inputClass, "cursor-pointer flex items-center justify-between")}>
                      <span className="truncate">{pickup || t("booking.pickup")}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </div>
                  </DrawerTrigger>
                  <DrawerContent className="px-4 pb-8">
                    <DrawerHeader className="px-0">
                      <DrawerTitle className="text-left font-heading">{t("booking.pickup")}</DrawerTitle>
                    </DrawerHeader>
                    <div className="grid grid-cols-1 gap-2 mt-4 max-h-[60vh] overflow-y-auto pr-2 scroll-area pb-4">
                      {/* Favorites Section */}
                      {favorites.length > 0 && (
                        <>
                          <div className="flex items-center gap-2 mb-1 mt-2 px-1">
                            <Star className="w-3 h-3 text-primary fill-primary" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Vos adresses favorites</span>
                          </div>
                          {favorites.map((addr) => {
                            const Icon = getAddressIcon(addr.type);
                            return (
                              <DrawerClose asChild key={addr.id}>
                                <button
                                  onClick={() => setPickup(addr.address)}
                                  className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20 active:bg-primary/10 transition-colors text-left"
                                >
                                  <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                                    <Icon className="w-4 h-4 text-primary" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-body font-bold text-sm truncate">{addr.label}</p>
                                    <p className="text-[10px] text-muted-foreground truncate font-body">{addr.address}</p>
                                  </div>
                                </button>
                              </DrawerClose>
                            )
                          })}
                          <div className="h-px bg-border my-4 mx-1" />
                        </>
                      )}

                      <div className="flex items-center gap-2 mb-1 px-1">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Communes d'Abidjan</span>
                      </div>
                      {communes.map((c) => (
                        <DrawerClose asChild key={c.id}>
                          <button
                            onClick={() => setPickup(c.name)}
                            className="flex items-center gap-3 p-4 rounded-xl bg-secondary/40 active:bg-secondary transition-colors text-left"
                          >
                            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <span className="font-body font-medium text-sm">{c.name}</span>
                          </button>
                        </DrawerClose>
                      ))}
                    </div>
                  </DrawerContent>
                </Drawer>

                {/* Destination Drawer */}
                <Drawer>
                  <DrawerTrigger asChild>
                    <div className={cn(inputClass, "cursor-pointer flex items-center justify-between")}>
                      <span className="truncate">{destination || t("booking.destination")}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </div>
                  </DrawerTrigger>
                  <DrawerContent className="px-4 pb-8">
                    <DrawerHeader className="px-0">
                      <DrawerTitle className="text-left font-heading">{t("booking.destination")}</DrawerTitle>
                    </DrawerHeader>
                    <div className="grid grid-cols-1 gap-2 mt-4 max-h-[60vh] overflow-y-auto pr-2 scroll-area pb-4">
                      {/* Favorites Section */}
                      {favorites.length > 0 && (
                        <>
                          <div className="flex items-center gap-2 mb-1 mt-2 px-1">
                            <Star className="w-3 h-3 text-primary fill-primary" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Vos adresses favorites</span>
                          </div>
                          {favorites.map((addr) => {
                            const Icon = getAddressIcon(addr.type);
                            return (
                              <DrawerClose asChild key={addr.id}>
                                <button
                                  onClick={() => setDestination(addr.address)}
                                  className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20 active:bg-primary/10 transition-colors text-left"
                                >
                                  <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                                    <Icon className="w-4 h-4 text-primary" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-body font-bold text-sm truncate">{addr.label}</p>
                                    <p className="text-[10px] text-muted-foreground truncate font-body">{addr.address}</p>
                                  </div>
                                </button>
                              </DrawerClose>
                            )
                          })}
                          <div className="h-px bg-border my-4 mx-1" />
                        </>
                      )}

                      <div className="flex items-center gap-2 mb-1 px-1">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Communes d'Abidjan</span>
                      </div>
                      {communes.map((c) => (
                        <DrawerClose asChild key={c.id}>
                          <button
                            onClick={() => setDestination(c.name)}
                            className="flex items-center gap-3 p-4 rounded-xl bg-secondary/40 active:bg-secondary transition-colors text-left"
                          >
                            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <span className="font-body font-medium text-sm">{c.name}</span>
                          </button>
                        </DrawerClose>
                      ))}
                    </div>
                  </DrawerContent>
                </Drawer>
              </div>
            </div>
          </div>

          {/* Traveler info */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-card border border-border p-4 space-y-3"
          >
            <h3 className="font-heading font-semibold text-sm">{t("booking.traveler_info")}</h3>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder={t("booking.last_name") + " *"} className={`${inputClass} pl-10`} />
            </div>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder={t("booking.first_name") + " *"} className={`${inputClass} pl-10`} />
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t("booking.phone") + " *"} type="tel" className={`${inputClass} pl-10`} />
            </div>
          </motion.div>

          {/* Dates */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-card border border-border p-4 space-y-3"
          >
            <h3 className="font-heading font-semibold text-sm">{t("booking.pickup")} *</h3>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} className={`${inputClass} pl-10`} />
              </div>
              <div className="relative flex-1">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="time" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} className={`${inputClass} pl-10`} />
              </div>
            </div>

            <h3 className="font-heading font-semibold text-sm pt-1">{t("booking.return_date")}</h3>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} className={`${inputClass} pl-10`} />
              </div>
              <div className="relative flex-1">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="time" value={returnTime} onChange={(e) => setReturnTime(e.target.value)} className={`${inputClass} pl-10`} />
              </div>
            </div>
          </motion.div>

          {/* Travelers count */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl bg-card border border-border p-4"
          >
            <Drawer>
              <DrawerTrigger asChild>
                <div className={cn(inputClass, "relative cursor-pointer flex items-center justify-between pl-10")}>
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <span>{t("booking.traveler_label", { count: parseInt(travelers) })}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </div>
              </DrawerTrigger>
              <DrawerContent className="px-4 pb-8">
                <DrawerHeader className="px-0">
                  <DrawerTitle className="text-left font-heading">{t("booking.travelers_count")}</DrawerTitle>
                </DrawerHeader>
                <div className="grid grid-cols-1 gap-2 mt-4 max-h-[50vh] overflow-y-auto pr-2 scroll-area">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <DrawerClose asChild key={n}>
                      <button
                        onClick={() => setTravelers(n.toString())}
                        className="flex items-center gap-3 p-4 rounded-xl bg-secondary/40 active:bg-secondary transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Users className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-body font-medium text-sm">
                          {t("booking.traveler_label", { count: n })}
                        </span>
                      </button>
                    </DrawerClose>
                  ))}
                </div>
              </DrawerContent>
            </Drawer>
          </motion.div>

          {/* Price estimation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            key={pickup + destination}
            className="rounded-2xl bg-primary/10 border border-primary/20 p-5 text-center space-y-2"
          >
            <p className="text-xs text-primary font-body uppercase tracking-wider">Prix estimé</p>
            <div className="flex items-baseline justify-center gap-1.5">
              <span className="text-2xl font-heading font-bold text-primary">
                {estimatedPrice > 0 ? estimatedPrice.toLocaleString('fr-FR') : "--"}
              </span>
              <span className="text-sm font-heading font-semibold text-primary">F CFA</span>
            </div>
            <div className="pt-2 border-t border-primary/10 flex flex-col gap-1">
              <p className="text-[10px] text-muted-foreground font-body italic">
                * Frais de parking et heures d'attente non inclus
              </p>
              <p className="text-[10px] text-muted-foreground font-body">
                Redirection vers WhatsApp pour confirmation
              </p>
            </div>
          </motion.div>

          <SwipeButton
            label="Glisser pour réserver"
            icon={MessageCircle}
            onConfirm={handleConfirm}
            className="h-20"
          />
        </div>
      </PageTransition>
    </MobileLayout>
  );
};

export default Booking;
