import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Calendar, Clock, User, Phone, Mail, ChevronRight, CheckCircle2, MessageCircle, ArrowLeft, Info, Timer, Navigation, MessageSquare, Gauge } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import MobileLayout, { PageTransition } from "@/components/MobileLayout";
import MobileHeader from "@/components/MobileHeader";
import SwipeButton from "@/components/SwipeButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/hooks/useFavorites";
import {
    Home as HomeIcon,
    Briefcase,
    Star
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
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import ClockPicker from "@/components/ClockPicker";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import taxiSedan from "@/assets/taxi-sedan.png";
import taxiSuv from "@/assets/taxi-suv.png";
import taxiVan from "@/assets/taxi-van.png";

import { CONFIG } from "@/constants/config";

// Configuration
const WHATSAPP_NUMBER = CONFIG.WHATSAPP_NUMBER;

const RideBooking = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { favorites } = useFavorites();
    const [step, setStep] = useState(1); // 1: Vehicle, 2: Details, 3: Summary

    // Dynamic Data State
    const [vehicles, setVehicles] = useState<Database['public']['Tables']['vehicles']['Row'][]>([]);
    const [pricing, setPricing] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: vData } = await supabase.from("vehicles").select("*");
                if (vData && vData.length > 0) {
                    const mappedVehicles = vData.map(v => {
                        const localImg = v.name === "Bestune T55" ? taxiSedan :
                            v.name === "Bestune T77" ? taxiSuv :
                                v.name === "Nissan Kicks" ? taxiVan : null;

                        const isPlaceholder = v.image_url && (
                            v.image_url.includes("votre-bucket.supabase.co") ||
                            v.image_url.includes("placeholder")
                        );

                        return {
                            ...v,
                            image_url: isPlaceholder ? (localImg || v.image_url) : (v.image_url || localImg)
                        };
                    });
                    setVehicles(mappedVehicles);
                } else {
                    // Fallback vehicles
                    setVehicles([
                        { id: "v1", name: "Bestune T55", category: "T-Series", image_url: taxiSedan, rating: 4.8, created_at: "", engine: null, is_available: true, seats: null, speed: null },
                        { id: "v2", name: "Bestune T77", category: "T-Series", image_url: taxiSuv, rating: 4.9, created_at: "", engine: null, is_available: true, seats: null, speed: null },
                        { id: "v3", name: "Nissan Kicks", category: "Kicks", image_url: taxiVan, rating: 4.7, created_at: "", engine: null, is_available: true, seats: null, speed: null }
                    ]);
                }

                const { data: pData } = await supabase.from("app_settings").select("*").eq("key", "hourly_pricing").single();
                if (pData) {
                    setPricing(pData.value);
                } else {
                    // Fallback pricing
                    setPricing({
                        t_series: { first_hour: 15000, additional_hour: 7000 },
                        kicks: { first_hour: 10000, additional_hour: 7000 }
                    });
                }
            } catch (error) {
                console.error("Error fetching ride booking data:", error);
                // Set fallback data anyway on error
                setVehicles([
                    { id: "v1", name: "Bestune T55", category: "T-Series", image_url: taxiSedan, rating: 4.8, created_at: "", engine: null, is_available: true, seats: null, speed: null },
                    { id: "v2", name: "Bestune T77", category: "T-Series", image_url: taxiSuv, rating: 4.9, created_at: "", engine: null, is_available: true, seats: null, speed: null },
                    { id: "v3", name: "Nissan Kicks", category: "Kicks", image_url: taxiVan, rating: 4.7, created_at: "", engine: null, is_available: true, seats: null, speed: null }
                ]);
                setPricing({
                    t_series: { first_hour: 15000, additional_hour: 7000 },
                    kicks: { first_hour: 10000, additional_hour: 7000 }
                });
            }
        };
        fetchData();
    }, []);

    const getAddressIcon = (type: string) => {
        switch (type) {
            case 'home': return HomeIcon;
            case 'work': return Briefcase;
            default: return MapPin;
        }
    };

    // Form State
    const [formData, setFormData] = useState({
        vehicleId: "",
        fullName: "",
        phone: "",
        email: user?.email || "",
        date: "",
        startTime: "08:00",
        hours: "1",
        pickup: "",
        destination: "",
        comment: "",
    });

    // Pre-fill user info from profile
    useEffect(() => {
        if (!user) return;
        supabase
            .from("profiles")
            .select("full_name, phone")
            .eq("user_id", user.id)
            .single()
            .then(({ data }) => {
                if (data) {
                    setFormData(prev => ({
                        ...prev,
                        fullName: data.full_name || "",
                        phone: data.phone || "",
                        date: new Date().toISOString().split('T')[0] // Initialize with today's date string if empty
                    }));
                }
            });
    }, [user]);

    const selectedVehicle = useMemo(() =>
        vehicles.find(v => v.id === formData.vehicleId),
        [formData.vehicleId, vehicles]
    );

    // Logic: Calculation
    const calculation = useMemo(() => {
        if (!formData.vehicleId || !pricing) return null;

        const hours = parseInt(formData.hours) || 1;
        const isTSeries = selectedVehicle?.category === "T-Series";
        const categoryKey = isTSeries ? "t_series" : "kicks";
        const config = pricing[categoryKey];

        if (!config) return null;

        const firstHourPrice = config.first_hour;
        const additionalHourPrice = config.additional_hour;

        const total = hours === 1 ? firstHourPrice : firstHourPrice + (hours - 1) * additionalHourPrice;

        return {
            hours,
            total,
            formattedTotal: new Intl.NumberFormat('fr-FR').format(total) + " F CFA"
        };
    }, [formData, selectedVehicle, pricing]);

    const handleBooking = async () => {
        if (!formData.fullName || !formData.phone || !formData.date || !formData.startTime || !formData.pickup) {
            toast.error("Veuillez remplir tous les champs obligatoires");
            return;
        }

        const msg = `Bonjour, je souhaite réserver une course.

*NOM :* ${formData.fullName}
*TÉLÉPHONE :* ${formData.phone}
*EMAIL :* ${formData.email || 'Non renseigné'}

*VÉHICULE :* ${selectedVehicle?.name}
*DATE :* ${formData.date}
*HEURE DE DÉBUT :* ${formData.startTime}
*DURÉE :* ${formData.hours} heure(s)
*PRISE EN CHARGE :* ${formData.pickup}
*DESTINATION :* ${formData.destination || 'Non spécifiée'}

*PRIX ESTIMÉ :* ${calculation?.formattedTotal}

${formData.comment ? `*COMMENTAIRE :* ${formData.comment}` : ''}

Merci de confirmer la disponibilité.`;

        const encodedMsg = encodeURIComponent(msg);

        // Save to Supabase if user is logged in
        if (user) {
            await supabase.from("bookings").insert({
                user_id: user.id,
                vehicle_name: selectedVehicle?.name || "Véhicule",
                pickup_address: formData.pickup,
                destination: formData.destination || "Course urbaine",
                pickup_date: formData.date,
                pickup_time: formData.startTime,
                travelers: 1,
                total_price: calculation?.total,
                booking_type: "hourly",
                status: "envoyée",
            });
        }

        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMsg}`, '_blank');
        toast.success("Redirection vers WhatsApp...");
        navigate("/success", {
            state: {
                type: "ride",
                data: {
                    fullName: formData.fullName,
                    phone: formData.phone,
                    date: formData.date,
                    startTime: formData.startTime,
                    hours: formData.hours,
                    pickup: formData.pickup,
                    destination: formData.destination,
                    vehicleName: selectedVehicle?.name,
                    total: calculation?.total
                }
            }
        });
    };

    return (
        <MobileLayout>
            <PageTransition>
                <MobileHeader
                    title={step === 1 ? "Réserver une course" : step === 2 ? "Détails de la course" : "Récapitulatif"}
                    showBack={step > 1}
                    onBack={() => setStep(step - 1)}
                />

                <div className="px-4 pb-24 pt-2">

                    {/* STEPS INDICATOR */}
                    <div className="flex items-center justify-center gap-2 mb-6">
                        {[1, 2, 3].map(i => (
                            <div
                                key={i}
                                className={`h-1.5 rounded-full transition-all duration-300 ${step === i ? 'w-8 bg-primary' : 'w-4 bg-muted'}`}
                            />
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <div className="mb-4">
                                    <h2 className="text-xl font-heading font-bold">Choisissez votre véhicule</h2>
                                    <p className="text-sm text-muted-foreground font-body">Réservation à l'heure avec chauffeur</p>
                                </div>

                                {vehicles.map((v) => (
                                    <button
                                        key={v.id}
                                        onClick={() => {
                                            setFormData(prev => ({ ...prev, vehicleId: v.id }));
                                            setStep(2);
                                        }}
                                        className={`w-full p-4 rounded-3xl border-2 transition-all flex items-center gap-4 text-left ${formData.vehicleId === v.id ? 'border-primary bg-primary/5' : 'border-border bg-card'
                                            }`}
                                    >
                                        <div className="w-24 h-16 bg-secondary rounded-2xl flex items-center justify-center p-2">
                                            <img src={v.image_url} alt={v.name} className="h-full w-full object-contain" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-heading font-bold text-base">{v.name}</h3>
                                            <div className="flex items-center gap-1 mt-1">
                                                <Star className="w-3 h-3 fill-primary text-primary" />
                                                <span className="text-[10px] font-bold">{v.rating}</span>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                    </button>
                                ))}

                                <div className="mt-8 p-6 rounded-3xl bg-secondary/30 border border-border">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                            <Info className="w-5 h-5 text-primary" />
                                        </div>
                                        <h4 className="font-heading font-bold text-sm">Tarification indicative</h4>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="p-3 rounded-2xl bg-background/50 border border-border/50">
                                            <p className="text-[10px] font-bold uppercase text-primary mb-1">Berline & SUV (T-Series)</p>
                                            <p className="text-xs font-body text-foreground">15 000 F / 1ère heure</p>
                                            <p className="text-[10px] text-muted-foreground">7 000 F / heure supp.</p>
                                        </div>
                                        <div className="p-3 rounded-2xl bg-background/50 border border-border/50">
                                            <p className="text-[10px] font-bold uppercase text-primary mb-1">SUV Compact (Kicks)</p>
                                            <p className="text-xs font-body text-foreground">10 000 F / 1ère heure</p>
                                            <p className="text-[10px] text-muted-foreground">7 000 F / heure supp.</p>
                                        </div>
                                    </div>
                                    <p className="mt-4 text-[11px] text-muted-foreground font-body italic">
                                        * Carburant inclus. Tarifs valables pour la zone urbaine.
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                {/* Personal Info */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <User className="w-4 h-4 text-primary" />
                                        <h3 className="font-heading font-bold text-sm">Informations personnelles</h3>
                                    </div>
                                    <div className="space-y-3">
                                        <Input
                                            placeholder="Nom complet *"
                                            value={formData.fullName}
                                            onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                                            className="h-12 rounded-xl bg-secondary/50 border-none px-4"
                                        />
                                        <div className="grid grid-cols-2 gap-3">
                                            <Input
                                                placeholder="Téléphone *"
                                                value={formData.phone}
                                                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                                className="h-12 rounded-xl bg-secondary/50 border-none px-4"
                                            />
                                            <Input
                                                placeholder="Email (optionnel)"
                                                value={formData.email}
                                                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                                className="h-12 rounded-xl bg-secondary/50 border-none px-4"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Ride details */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Navigation className="w-4 h-4 text-primary" />
                                        <h3 className="font-heading font-bold text-sm">Détails de la course</h3>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            {/* Custom Date Picker */}
                                            <Drawer>
                                                <DrawerTrigger asChild>
                                                    <div className="group w-full h-12 rounded-xl bg-secondary/50 flex items-center gap-3 px-3 cursor-pointer hover:bg-secondary/70 transition-colors">
                                                        <Calendar className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                                        <span className={cn("text-xs font-body", !formData.date && "text-muted-foreground")}>
                                                            {formData.date ? format(new Date(formData.date), "PPP", { locale: fr }) : "Date *"}
                                                        </span>
                                                    </div>
                                                </DrawerTrigger>
                                                <DrawerContent className="p-4">
                                                    <DrawerHeader className="px-0">
                                                        <DrawerTitle className="text-left font-heading">Date de départ</DrawerTitle>
                                                    </DrawerHeader>
                                                    <div className="flex justify-center p-2">
                                                        <CalendarComponent
                                                            mode="single"
                                                            selected={formData.date ? new Date(formData.date) : undefined}
                                                            onSelect={(date) => setFormData(prev => ({ ...prev, date: date ? date.toISOString().split('T')[0] : "" }))}
                                                            initialFocus
                                                            locale={fr}
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

                                            {/* Custom Time Picker */}
                                            <Drawer>
                                                <DrawerTrigger asChild>
                                                    <div className="group w-full h-12 rounded-xl bg-secondary/50 flex items-center gap-3 px-3 cursor-pointer hover:bg-secondary/70 transition-colors">
                                                        <Clock className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                                        <span className="text-xs font-body">{formData.startTime}</span>
                                                    </div>
                                                </DrawerTrigger>
                                                <DrawerContent className="px-4 pb-8">
                                                    <DrawerHeader className="px-0">
                                                        <DrawerTitle className="text-left font-heading">Heure de départ</DrawerTitle>
                                                    </DrawerHeader>
                                                    <div className="py-4">
                                                        <ClockPicker
                                                            value={formData.startTime}
                                                            onChange={(val) => setFormData(prev => ({ ...prev, startTime: val }))}
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

                                        <div className="relative">
                                            <Drawer>
                                                <DrawerTrigger asChild>
                                                    <div className="w-full h-12 rounded-xl bg-secondary/50 flex items-center gap-3 px-3 cursor-pointer hover:bg-secondary/70 transition-colors">
                                                        <Timer className="w-4 h-4 text-muted-foreground" />
                                                        <span className="text-sm font-body text-foreground">
                                                            {formData.hours} heure{parseInt(formData.hours) > 1 ? 's' : ''}
                                                        </span>
                                                        <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                                                    </div>
                                                </DrawerTrigger>
                                                <DrawerContent className="px-4 pb-8">
                                                    <DrawerHeader className="px-0">
                                                        <DrawerTitle className="text-left font-heading">Durée de la course</DrawerTitle>
                                                        <DrawerDescription className="text-left font-body">
                                                            Combien de temps avez-vous besoin du véhicule ?
                                                        </DrawerDescription>
                                                    </DrawerHeader>
                                                    <div className="grid grid-cols-2 gap-2 mt-4 max-h-[50vh] overflow-y-auto pr-2 scroll-area">
                                                        {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map(h => (
                                                            <DrawerClose asChild key={h}>
                                                                <button
                                                                    onClick={() => setFormData(prev => ({ ...prev, hours: h.toString() }))}
                                                                    className={cn(
                                                                        "flex items-center justify-center p-4 rounded-xl border transition-all font-heading font-semibold",
                                                                        formData.hours === h.toString()
                                                                            ? "bg-primary/10 border-primary text-primary"
                                                                            : "bg-secondary/40 border-transparent hover:bg-secondary"
                                                                    )}
                                                                >
                                                                    {h} heure{h > 1 ? 's' : ''}
                                                                </button>
                                                            </DrawerClose>
                                                        ))}
                                                    </div>
                                                </DrawerContent>
                                            </Drawer>
                                        </div>

                                        <div className="relative">
                                            <Drawer>
                                                <DrawerTrigger asChild>
                                                    <div className="w-full h-12 rounded-xl bg-secondary/50 flex items-center gap-3 px-3 cursor-pointer hover:bg-secondary/70 transition-colors">
                                                        <MapPin className="w-4 h-4 text-muted-foreground" />
                                                        <span className={cn("text-sm font-body truncate", !formData.pickup && "text-muted-foreground")}>
                                                            {formData.pickup || "Lieu de prise en charge *"}
                                                        </span>
                                                        <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                                                    </div>
                                                </DrawerTrigger>
                                                <DrawerContent className="px-4 pb-8">
                                                    <DrawerHeader className="px-0 text-left">
                                                        <DrawerTitle className="font-heading">Lieu de prise en charge</DrawerTitle>
                                                        <DrawerDescription className="font-body">Choisissez une adresse favorite ou saisissez-en une.</DrawerDescription>
                                                    </DrawerHeader>
                                                    <div className="space-y-4 mt-2">
                                                        {/* Favorite Addresses */}
                                                        {favorites.length > 0 && (
                                                            <div className="space-y-2">
                                                                <div className="flex items-center gap-2 px-1">
                                                                    <Star className="w-3 h-3 text-primary fill-primary" />
                                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Vos favoris</span>
                                                                </div>
                                                                <div className="grid grid-cols-1 gap-2 max-h-[30vh] overflow-y-auto pr-1">
                                                                    {favorites.map((addr) => {
                                                                        const Icon = getAddressIcon(addr.type);
                                                                        return (
                                                                            <DrawerClose asChild key={addr.id}>
                                                                                <button
                                                                                    onClick={() => setFormData(prev => ({ ...prev, pickup: addr.address }))}
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
                                                                </div>
                                                                <div className="h-px bg-border my-2" />
                                                            </div>
                                                        )}

                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2 px-1">
                                                                <Navigation className="w-3 h-3 text-muted-foreground" />
                                                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Saisie libre</span>
                                                            </div>
                                                            <Input
                                                                placeholder="Saisissez une adresse..."
                                                                value={formData.pickup}
                                                                onChange={(e) => setFormData(prev => ({ ...prev, pickup: e.target.value }))}
                                                                className="h-14 rounded-2xl bg-secondary/50 border-none px-6 focus-visible:ring-primary"
                                                            />
                                                        </div>
                                                        <DrawerClose asChild>
                                                            <Button className="w-full h-14 rounded-2xl mt-2 font-heading font-bold">Confirmer</Button>
                                                        </DrawerClose>
                                                    </div>
                                                </DrawerContent>
                                            </Drawer>
                                        </div>

                                        <div className="relative">
                                            <Drawer>
                                                <DrawerTrigger asChild>
                                                    <div className="w-full h-12 rounded-xl bg-secondary/50 flex items-center gap-3 px-3 cursor-pointer hover:bg-secondary/70 transition-colors">
                                                        <Navigation className="w-4 h-4 text-muted-foreground" />
                                                        <span className={cn("text-sm font-body truncate", !formData.destination && "text-muted-foreground")}>
                                                            {formData.destination || "Lieu de destination (optionnel)"}
                                                        </span>
                                                        <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                                                    </div>
                                                </DrawerTrigger>
                                                <DrawerContent className="px-4 pb-8">
                                                    <DrawerHeader className="px-0 text-left">
                                                        <DrawerTitle className="font-heading">Destination</DrawerTitle>
                                                        <DrawerDescription className="font-body">Choisissez une adresse favorite ou saisissez-en une.</DrawerDescription>
                                                    </DrawerHeader>
                                                    <div className="space-y-4 mt-2">
                                                        {/* Favorite Addresses */}
                                                        {favorites.length > 0 && (
                                                            <div className="space-y-2">
                                                                <div className="flex items-center gap-2 px-1">
                                                                    <Star className="w-3 h-3 text-primary fill-primary" />
                                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Vos favoris</span>
                                                                </div>
                                                                <div className="grid grid-cols-1 gap-2 max-h-[30vh] overflow-y-auto pr-1">
                                                                    {favorites.map((addr) => {
                                                                        const Icon = getAddressIcon(addr.type);
                                                                        return (
                                                                            <DrawerClose asChild key={addr.id}>
                                                                                <button
                                                                                    onClick={() => setFormData(prev => ({ ...prev, destination: addr.address }))}
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
                                                                </div>
                                                                <div className="h-px bg-border my-2" />
                                                            </div>
                                                        )}

                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2 px-1">
                                                                <Navigation className="w-3 h-3 text-muted-foreground" />
                                                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Saisie libre</span>
                                                            </div>
                                                            <Input
                                                                placeholder="Saisissez une adresse..."
                                                                value={formData.destination}
                                                                onChange={(e) => setFormData(prev => ({ ...prev, destination: e.target.value }))}
                                                                className="h-14 rounded-2xl bg-secondary/50 border-none px-6 focus-visible:ring-primary"
                                                            />
                                                        </div>
                                                        <DrawerClose asChild>
                                                            <Button className="w-full h-14 rounded-2xl mt-2 font-heading font-bold">Confirmer</Button>
                                                        </DrawerClose>
                                                    </div>
                                                </DrawerContent>
                                            </Drawer>
                                        </div>

                                        <div className="relative">
                                            <MessageSquare className="absolute left-3 top-4 w-4 h-4 text-muted-foreground" />
                                            <Textarea
                                                placeholder="Commentaires ou besoins spécifiques..."
                                                value={formData.comment}
                                                onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                                                className="min-h-[80px] rounded-xl bg-secondary/50 border-none pl-10 pt-3"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    onClick={() => setStep(3)}
                                    disabled={!formData.fullName || !formData.phone || !formData.date || !formData.pickup}
                                    className="mt-4 w-full h-14 rounded-2xl bg-primary text-primary-foreground font-heading font-semibold text-sm tracking-wide shadow-lg"
                                >
                                    Suivant
                                    <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                                </Button>
                            </motion.div>
                        )}

                        {step === 3 && calculation && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-6"
                            >
                                <div className="text-center mb-6">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                                        <CheckCircle2 className="w-8 h-8 text-primary" />
                                    </div>
                                    <h2 className="text-2xl font-heading font-bold">Récapitulatif</h2>
                                    <p className="text-sm text-muted-foreground font-body">Une étape de plus vers votre course</p>
                                </div>

                                <div className="p-6 rounded-3xl bg-secondary/30 border border-border space-y-4">
                                    <div className="flex justify-between items-center pb-3 border-b border-border/50">
                                        <span className="text-xs font-body text-muted-foreground">Véhicule</span>
                                        <span className="text-xs font-heading font-bold">{selectedVehicle?.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center pb-3 border-b border-border/50">
                                        <span className="text-xs font-body text-muted-foreground">Date & Heure</span>
                                        <span className="text-xs font-heading font-bold">{formData.date} à {formData.startTime}</span>
                                    </div>
                                    <div className="flex justify-between items-center pb-3 border-b border-border/50">
                                        <span className="text-xs font-body text-muted-foreground">Durée</span>
                                        <span className="text-xs font-heading font-bold">{calculation.hours} heure{calculation.hours > 1 ? 's' : ''}</span>
                                    </div>
                                    <div className="flex flex-col gap-1 pb-3 border-b border-border/50">
                                        <span className="text-xs font-body text-muted-foreground">Prise en charge</span>
                                        <span className="text-xs font-heading font-bold truncate">{formData.pickup}</span>
                                    </div>

                                    <div className="pt-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-base font-heading font-semibold">Prix Total Estimé</span>
                                            <span className="text-xl font-heading font-bold text-primary">{calculation.formattedTotal}</span>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground text-right mt-1 font-body">Carburant inclus *</p>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-4">
                                    <SwipeButton
                                        label="Glisser pour confirmer"
                                        icon={MessageCircle}
                                        onConfirm={handleBooking}
                                        className="h-20"
                                    />
                                    <Button
                                        variant="outline"
                                        onClick={() => setStep(2)}
                                        className="w-full h-14 rounded-2xl border-border font-heading font-semibold text-sm tracking-wide"
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Modifier les infos
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </PageTransition>
        </MobileLayout>
    );
};

export default RideBooking;
