import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";
import { MapPin, ArrowRight, User, Phone, Calendar as LucideCalendar, Clock, Users, Star, ChevronRight, Gauge, Zap, MessageCircle, CheckCircle2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import MobileLayout, { PageTransition } from "@/components/MobileLayout";
import MobileHeader from "@/components/MobileHeader";
import SwipeButton from "@/components/SwipeButton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { saveBookingSafe, updateBookingSafe } from "@/lib/supabaseUtils";
import { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { cn, isTimeValid, getMinBookingDateTime } from "@/lib/utils";
import { initializePayment, generateTransactionId } from "@/lib/cinetpay";
import { getAutomaticDiscount, DiscountResult } from "@/lib/discounts";
import { useFavorites } from "@/hooks/useFavorites";
import ClockPicker from "@/components/ClockPicker";
import {
  Home as HomeIcon,
  Briefcase,
  Archive,
  Plus,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
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

import { CONFIG } from "@/constants/config";

const Booking = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { favorites } = useFavorites();
  const [vehicle, setVehicle] = useState(location.state?.vehicle || null);
  const incomingDestination = location.state?.destination || "";
  const incomingPickup = location.state?.pickup || "";

  // Vehicles Data State
  const [vehiclesData, setVehiclesData] = useState<any[]>([]);
  const [isVehicleDrawerOpen, setIsVehicleDrawerOpen] = useState(false);

  // Dynamic Data State
  const [communes, setCommunes] = useState<Database['public']['Tables']['communes']['Row'][]>([]);
  const [zoneRates, setZoneRates] = useState<Record<string, number>>({});
  const [airportHub, setAirportHub] = useState("Aéroport Félix Houphouët-Boigny");

  const [pickup, setPickup] = useState(incomingPickup);
  const [destination, setDestination] = useState(incomingDestination || "");
  const [basePrice, setBasePrice] = useState(0);
  const [discount, setDiscount] = useState<DiscountResult | null>(null);

  const estimatedPrice = discount ? discount.finalPrice : basePrice;

  // Fetch all dynamic data
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        // 1. Fetch Communes
        const { data: communesData } = await supabase.from("communes").select("*").order("display_order");
        if (communesData && communesData.length > 0) {
          setCommunes(communesData);
          if (!pickup && !incomingPickup) setPickup(communesData[0]?.name);
          if (!destination && !incomingDestination) setDestination(communesData[6]?.name || "");
        } else {
          // Fallback communes
          const fallbackCommunes = [
            { id: "c1", name: "Aéroport Félix Houphouët-Boigny", zone_letter: null, airport_price: 0, is_active: true, display_order: 1 },
            { id: "c2", name: "Marcory", zone_letter: "A", airport_price: 7500, is_active: true, display_order: 2 },
            { id: "c3", name: "Cocody", zone_letter: "A", airport_price: 10000, is_active: true, display_order: 3 },
            { id: "c4", name: "Yopougon", zone_letter: "C", airport_price: 15000, is_active: true, display_order: 4 },
            { id: "c5", name: "Plateau", zone_letter: "A", airport_price: 10000, is_active: true, display_order: 5 },
            { id: "c6", name: "Koumassi", zone_letter: "A", airport_price: 7500, is_active: true, display_order: 6 },
            { id: "c7", name: "Port-Bouët", zone_letter: "A", airport_price: 7500, is_active: true, display_order: 7 }
          ];
          setCommunes(fallbackCommunes);
          if (!pickup) setPickup(fallbackCommunes[0].name);
          if (!destination && !incomingDestination) setDestination(fallbackCommunes[2].name);
        }

        // 2. Fetch Zone Pricing
        const { data: zonesData } = await supabase.from("zone_pricing").select("*");
        if (zonesData && zonesData.length > 0) {
          const rates: Record<string, number> = {};
          zonesData.forEach((z) => {
            if (z.zone_letter) rates[z.zone_letter] = z.price;
          });
          setZoneRates(rates);
        } else {
          setZoneRates({ "A": 8000, "B": 12000, "C": 15000, "D": 20000 });
        }

        // 3. Fetch Settings
        const { data: settingsData } = await supabase.from("app_settings").select("*").eq("key", "airport_config").single();
        if (settingsData) {
          const value = settingsData.value as any;
          if (value?.hub_name) setAirportHub(value.hub_name);
        }
      } catch (error) {
        console.error("Error fetching booking pricing:", error);
        // Fallback on error
        setCommunes([
          { id: "c1", name: "Aéroport Félix Houphouët-Boigny", zone_letter: null, airport_price: 0, is_active: true, display_order: 1 },
          { id: "c2", name: "Marcory", zone_letter: "A", airport_price: 7500, is_active: true, display_order: 2 },
          { id: "c3", name: "Cocody", zone_letter: "A", airport_price: 10000, is_active: true, display_order: 3 }
        ]);
        setZoneRates({ "A": 8000, "B": 12000, "C": 15000, "D": 20000 });
      }
    };

    fetchPricing();

    // Fetch Vehicles for selection
    const fetchVehicles = async () => {
      try {
        const { data } = await supabase.from("vehicles").select("*").order("name");
        const defaultVehicles = [
          { id: "v1", name: "Bestune T55", rating: 4.8, speed: "190 km/h", seats: "5 Places", engine: "1.5L Turbo", image: taxiSedan },
          { id: "v2", name: "Bestune T77", rating: 4.9, speed: "192 km/h", seats: "5 Places", engine: "1.5L Turbo", image: taxiSuv },
          { id: "v3", name: "Nissan Kicks", rating: 4.7, speed: "180 km/h", seats: "5 Places", engine: "1.6L Essence", image: taxiVan },
        ];

        if (data && data.length > 0) {
          const mapped = data.map(v => {
            const localImg = v.name === "Bestune T55" ? taxiSedan :
              v.name === "Bestune T77" ? taxiSuv :
                v.name === "Nissan Kicks" ? taxiVan : null;
            const isPlaceholder = v.image_url && (v.image_url.includes("votre-bucket.supabase.co") || v.image_url.includes("placeholder"));
            return { ...v, image: isPlaceholder ? (localImg || v.image_url) : (v.image_url || localImg) };
          });
          setVehiclesData(mapped);
        } else {
          setVehiclesData(defaultVehicles);
        }
      } catch (error) {
        console.error("Error fetching vehicles:", error);
        setVehiclesData([
          { id: "v1", name: "Bestune T55", rating: 4.8, speed: "190 km/h", seats: "5 Places", engine: "1.5L Turbo", image: taxiSedan },
          { id: "v2", name: "Bestune T77", rating: 4.9, speed: "192 km/h", seats: "5 Places", engine: "1.5L Turbo", image: taxiSuv },
          { id: "v3", name: "Nissan Kicks", rating: 4.7, speed: "180 km/h", seats: "5 Places", engine: "1.6L Essence", image: taxiVan },
        ]);
      }
    };
    fetchVehicles();
  }, [pickup, destination, incomingDestination]);

  const calculateDynamicPrice = useCallback((p: string, d: string) => {
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
  }, [communes, zoneRates, airportHub]);

  useEffect(() => {
    setBasePrice(calculateDynamicPrice(pickup, destination));
  }, [pickup, destination, calculateDynamicPrice]);

  useEffect(() => {
    if (basePrice > 0 && user) {
      getAutomaticDiscount(user.id, basePrice).then(setDiscount);
    } else {
      setDiscount(null);
    }
  }, [basePrice, user]);

  const minDateTime = getMinBookingDateTime();
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [phone, setPhone] = useState("");
  const [pickupDate, setPickupDate] = useState<Date | undefined>(minDateTime.date);
  const [pickupTime, setPickupTime] = useState(minDateTime.time);
  const [returnDate, setReturnDate] = useState<Date | undefined>(undefined);
  const [returnTime, setReturnTime] = useState("18:00");
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
    if (!user) {
      toast.error("Vous devez être connecté pour effectuer une réservation.");
      return;
    }

    if (!firstName) { toast.error("Veuillez saisir votre prénom"); return; }
    if (!lastName) { toast.error("Veuillez saisir votre nom"); return; }
    if (!phone) { toast.error("Veuillez saisir votre numéro de téléphone"); return; }
    if (!pickup) { toast.error("Veuillez sélectionner un lieu de prise en charge"); return; }
    if (!destination) { toast.error("Veuillez sélectionner une destination"); return; }
    if (!pickupDate) { toast.error("Veuillez sélectionner une date de départ"); return; }
    if (!pickupTime) { toast.error("Veuillez sélectionner une heure de départ"); return; }
    if (!vehicle) {
      toast.error(t("booking.choose_vehicle"));
      navigate("/vehicles");
      return;
    }

    // Time Validation
    const timeCheck = isTimeValid(pickupDate, pickupTime);
    if (!timeCheck.isValid) {
      toast.error(timeCheck.error);
      return;
    }

    // 1. Check Availability via RPC
    try {
      const { data: isAvailable, error: checkError } = await supabase.rpc('check_vehicle_availability', {
        p_vehicle_id: vehicle.id,
        p_pickup_date: format(pickupDate, 'yyyy-MM-dd'),
        p_return_date: returnDate ? format(returnDate, 'yyyy-MM-dd') : null
      });

      if (checkError) throw checkError;

      if (isAvailable === false) {
        toast.error("Désolé, ce véhicule est déjà réservé pour ces dates.");
        return;
      }
    } catch (error) {
      console.error("Error checking availability:", error);
      // We continue but log the error if RPC fails (e.g. function not yet created)
    }

    const depositAmount = Math.round(estimatedPrice * 0.3);

    // 2. Save to Supabase
    const { data: savedBooking, error: saveError } = await saveBookingSafe({
      user_id: user?.id || null,
      vehicle_id: vehicle.id,
      vehicle_name: vehicle.name,
      pickup_address: pickup,
      destination,
      pickup_date: format(pickupDate, 'yyyy-MM-dd'),
      pickup_time: pickupTime,
      return_date: returnDate ? format(returnDate, 'yyyy-MM-dd') : null,
      return_time: returnTime || null,
      travelers: parseInt(travelers),
      total_price: estimatedPrice,
      deposit_amount: depositAmount,
      booking_type: "airport",
      status: "pending_payment",
      payment_status: "pending",
    });

    if (saveError || !savedBooking) {
      console.error("Error saving booking:", saveError);
      toast.error(`Erreur d'enregistrement : ${saveError?.message || 'Inconnu'}`);
      return;
    }

    const bookingId = savedBooking.id;

    // 3. Initiate Payment
    try {
      const paymentData = {
        transaction_id: generateTransactionId(),
        amount: depositAmount,
        currency: "XOF",
        description: `Acompte 30% - Réservation #${bookingId.slice(0, 8).toUpperCase()}`,
        customer_name: firstName,
        customer_surname: lastName,
        customer_phone_number: phone,
        customer_email: user?.email || "customer@example.com",
        customer_address: pickup,
        customer_city: "Abidjan",
        customer_country: "CI",
        customer_state: "CI",
        customer_zip_code: "00225",
      };

      const paymentResult: any = await initializePayment(paymentData);

      // With redirect method, payment is opened in the same tab (PENDING status)
      // Update booking with transaction_id and mark as pending
      await updateBookingSafe(bookingId, {
        status: "pending_payment",
        payment_status: "pending",
        transaction_id: paymentData.transaction_id
      });

      // Save data for the success page
      const successData = {
        type: "booking",
        data: {
          fullName: `${firstName} ${lastName}`,
          phone,
          pickupDate: pickupDate ? format(pickupDate, 'yyyy-MM-dd') : '',
          pickupTime,
          pickup,
          destination,
          vehicleName: vehicle.name,
          total: estimatedPrice,
          deposit: depositAmount,
          travelers,
          id: bookingId
        }
      };
      sessionStorage.setItem("pendingBooking", JSON.stringify(successData));

      toast.loading("Redirection vers le paiement sécurisé...", { duration: 3000 });
      await initializePayment(paymentData);
      return; // Stop execution during redirection
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(error.message || "Le paiement a échoué ou a été annulé.");
      return;
    }
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
              <Drawer open={isVehicleDrawerOpen} onOpenChange={setIsVehicleDrawerOpen}>
                <DrawerTrigger asChild>
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 border-t border-border bg-secondary/40 active:bg-secondary/70 transition-colors"
                  >
                    <span className="text-xs font-body text-muted-foreground">{t("booking.change_vehicle")}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                </DrawerTrigger>
                <DrawerContent className="px-4 pb-8">
                  <DrawerHeader className="px-0">
                    <DrawerTitle className="text-left font-heading">Changer de véhicule</DrawerTitle>
                    <DrawerDescription className="text-left font-body">Sélectionnez un autre modèle pour votre trajet.</DrawerDescription>
                  </DrawerHeader>
                  <div className="grid grid-cols-1 gap-3 mt-4 max-h-[60vh] overflow-y-auto pr-2 scroll-area pb-4">
                    {(vehiclesData.length > 0 ? vehiclesData : []).map((v) => (
                      <DrawerClose asChild key={v.id}>
                        <button
                          onClick={() => setVehicle(v)}
                          className={cn(
                            "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left",
                            vehicle?.id === v.id ? "border-primary bg-primary/5" : "border-border bg-card"
                          )}
                        >
                          <div className="w-20 h-14 bg-secondary rounded-xl flex items-center justify-center p-2 shrink-0">
                            <img src={v.image_url || v.image} alt={v.name} className="h-full w-full object-contain" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-heading font-bold text-sm truncate">{v.name}</h4>
                            <div className="flex items-center gap-1 mt-1">
                              <Star className="w-3 h-3 fill-primary text-primary" />
                              <span className="text-[10px] font-bold">{v.rating || "4.5"}</span>
                            </div>
                          </div>
                          {vehicle?.id === v.id && <CheckCircle2 className="w-5 h-5 text-primary ml-auto" />}
                        </button>
                      </DrawerClose>
                    ))}
                  </div>
                </DrawerContent>
              </Drawer>
            </motion.div>
          ) : (
            <Drawer>
              <DrawerTrigger asChild>
                <motion.button
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-card border border-dashed border-primary/40 active:border-primary transition-colors"
                >
                  <span className="text-sm font-body text-muted-foreground">{t("booking.choose_vehicle")}</span>
                  <ChevronRight className="w-4 h-4 text-primary" />
                </motion.button>
              </DrawerTrigger>
              <DrawerContent className="px-4 pb-8">
                <DrawerHeader className="px-0">
                  <DrawerTitle className="text-left font-heading">Choisir un véhicule</DrawerTitle>
                </DrawerHeader>
                <div className="grid grid-cols-1 gap-3 mt-4 max-h-[60vh] overflow-y-auto pr-2 scroll-area pb-4">
                  {(vehiclesData.length > 0 ? vehiclesData : []).map((v) => (
                    <DrawerClose asChild key={v.id}>
                      <button
                        onClick={() => setVehicle(v)}
                        className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card active:border-primary transition-all text-left"
                      >
                        <div className="w-20 h-14 bg-secondary rounded-xl flex items-center justify-center p-2 shrink-0">
                          <img src={v.image_url || v.image} alt={v.name} className="h-full w-full object-contain" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-heading font-bold text-sm truncate">{v.name}</h4>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-3 h-3 fill-primary text-primary" />
                            <span className="text-[10px] font-bold">{v.rating || "4.5"}</span>
                          </div>
                        </div>
                      </button>
                    </DrawerClose>
                  ))}
                </div>
              </DrawerContent>
            </Drawer>
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

          {/* Dates & Times Custom */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-card border border-border p-4 space-y-4"
          >
            <div className="space-y-3">
              <h3 className="font-heading font-semibold text-sm">{t("booking.pickup")} *</h3>
              <div className="flex gap-3">
                {/* Custom Date Picker Pickup */}
                <Drawer>
                  <DrawerTrigger asChild>
                    <div className={cn(inputClass, "cursor-pointer flex items-center gap-3 flex-1 overflow-hidden")}>
                      <CalendarIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="truncate">
                        {pickupDate ? format(pickupDate, "PPP", { locale: fr }) : t("booking.date")}
                      </span>
                    </div>
                  </DrawerTrigger>
                  <DrawerContent className="p-4">
                    <DrawerHeader className="px-0">
                      <DrawerTitle className="text-left font-heading">Date de départ</DrawerTitle>
                    </DrawerHeader>
                    <div className="flex justify-center p-2">
                      <Calendar
                        mode="single"
                        selected={pickupDate}
                        onSelect={(date) => setPickupDate(date)}
                        initialFocus
                        locale={fr}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        className="rounded-xl border border-border shadow-sm"
                      />
                    </div>
                    <DrawerFooter className="px-0 pt-4">
                      <DrawerClose asChild>
                        <Button className="w-full h-12 rounded-xl">Confirmer la date</Button>
                      </DrawerClose>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>

                {/* Custom Time Picker Pickup */}
                <Drawer>
                  <DrawerTrigger asChild>
                    <div className={cn(inputClass, "cursor-pointer flex items-center gap-3 flex-1 overflow-hidden")}>
                      <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="truncate">{pickupTime}</span>
                    </div>
                  </DrawerTrigger>
                  <DrawerContent className="px-4 pb-8">
                    <DrawerHeader className="px-0">
                      <DrawerTitle className="text-left font-heading">Heure de départ</DrawerTitle>
                    </DrawerHeader>
                    <div className="py-4">
                      <ClockPicker
                        value={pickupTime}
                        onChange={(val) => setPickupTime(val)}
                      />
                    </div>
                    <DrawerFooter className="px-0 pt-2 pb-6">
                      <DrawerClose asChild>
                        <Button className="w-full h-12 rounded-xl">Confirmer l'heure</Button>
                      </DrawerClose>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-heading font-semibold text-sm pt-1">{t("booking.return_date")}</h3>
              <div className="flex gap-3">
                {/* Custom Date Picker Return */}
                <Drawer>
                  <DrawerTrigger asChild>
                    <div className={cn(inputClass, "cursor-pointer flex items-center gap-3 flex-1 overflow-hidden")}>
                      <CalendarIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="truncate text-foreground/80">
                        {returnDate ? format(returnDate, "PPP", { locale: fr }) : "Sélectionner une date"}
                      </span>
                    </div>
                  </DrawerTrigger>
                  <DrawerContent className="p-4">
                    <DrawerHeader className="px-0">
                      <DrawerTitle className="text-left font-heading">Date de retour</DrawerTitle>
                    </DrawerHeader>
                    <div className="flex justify-center p-2">
                      <Calendar
                        mode="single"
                        selected={returnDate}
                        onSelect={(date) => setReturnDate(date)}
                        initialFocus
                        locale={fr}
                        disabled={(date) => (pickupDate ? date < pickupDate : date < new Date(new Date().setHours(0, 0, 0, 0)))}
                        className="rounded-xl border border-border shadow-sm"
                      />
                    </div>
                    <DrawerFooter className="px-0 pt-4">
                      <DrawerClose asChild>
                        <Button className="w-full h-12 rounded-xl">Confirmer la date</Button>
                      </DrawerClose>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>

                {/* Custom Time Picker Return */}
                <Drawer>
                  <DrawerTrigger asChild>
                    <div className={cn(inputClass, "cursor-pointer flex items-center gap-3 flex-1 overflow-hidden")}>
                      <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="truncate">{returnTime}</span>
                    </div>
                  </DrawerTrigger>
                  <DrawerContent className="px-4 pb-8">
                    <DrawerHeader className="px-0">
                      <DrawerTitle className="text-left font-heading">Heure de retour</DrawerTitle>
                    </DrawerHeader>
                    <div className="py-4">
                      <ClockPicker
                        value={returnTime}
                        onChange={(val) => setReturnTime(val)}
                      />
                    </div>
                    <DrawerFooter className="px-0 pt-2 pb-6">
                      <DrawerClose asChild>
                        <Button className="w-full h-12 rounded-xl">Confirmer l'heure</Button>
                      </DrawerClose>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>
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
            <div className="flex flex-col items-center gap-0.5">
              {discount && discount.discountAmount > 0 && (
                <span className="text-xs text-muted-foreground line-through decoration-red-500/50">
                  {basePrice.toLocaleString('fr-FR')} F
                </span>
              )}
              <div className="flex items-baseline justify-center gap-1.5">
                <span className="text-2xl font-heading font-bold text-primary">
                  {estimatedPrice > 0 ? estimatedPrice.toLocaleString('fr-FR') : "--"}
                </span>
                <span className="text-sm font-heading font-semibold text-primary">F CFA</span>
              </div>
            </div>

            {discount?.discountReason && (
              <div className="flex items-center justify-center gap-2 bg-green-500/10 text-green-600 p-2 rounded-xl border border-green-500/20">
                <Gift className="w-4 h-4 shrink-0" />
                <span className="text-[10px] font-bold font-body">{discount.discountReason}</span>
              </div>
            )}

            <div className="pt-2 border-t border-primary/20 flex flex-col gap-2">
              <div className="flex justify-between items-center px-2">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Acompte (30%)</span>
                <span className="text-sm font-bold text-primary">
                  {estimatedPrice > 0 ? (Math.round(estimatedPrice * 0.3)).toLocaleString('fr-FR') : "--"} F
                </span>
              </div>
              <div className="flex justify-between items-center px-2 bg-background/50 rounded-lg p-1.5">
                <span className="text-[10px] text-foreground uppercase font-bold">Reste à payer sur place</span>
                <span className="text-sm font-bold text-foreground">
                  {estimatedPrice > 0 ? (estimatedPrice - Math.round(estimatedPrice * 0.3)).toLocaleString('fr-FR') : "--"} F
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground font-body italic leading-tight mt-1">
                * Frais de parking et frais d'attente non inclus
              </p>
              <p className="text-[10px] text-primary font-body font-bold">
                Paiement sécurisé de l'acompte après validation
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
