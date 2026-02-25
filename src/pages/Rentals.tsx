import { motion, AnimatePresence } from "framer-motion";
import { Star, MapPin, Calendar, Clock, User, Phone, Mail, ChevronRight, CheckCircle2, AlertCircle, MessageCircle, ArrowLeft, Info, Gauge } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import MobileLayout, { PageTransition } from "@/components/MobileLayout";
import MobileHeader from "@/components/MobileHeader";
import SwipeButton from "@/components/SwipeButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";
import taxiSedan from "@/assets/taxi-sedan.png";
import taxiSuv from "@/assets/taxi-suv.png";
import taxiVan from "@/assets/taxi-van.png";

import { CONFIG } from "@/constants/config";

// Configuration
const WHATSAPP_NUMBER = CONFIG.WHATSAPP_NUMBER;

const Rentals = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [step, setStep] = useState(1); // 1: Vehicle Selection, 2: Form/Details, 3: Summary

    // Dynamic Data State
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [pricing, setPricing] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: vData } = await (supabase as any).from("vehicles").select("*");
                if (vData && vData.length > 0) {
                    setVehicles(vData);
                } else {
                    // Fallback vehicles
                    setVehicles([
                        { id: "v1", name: "Bestune T55", category: "T-Series", image: taxiSedan, rating: 4.8 },
                        { id: "v2", name: "Bestune T77", category: "T-Series", image: taxiSuv, rating: 4.9 },
                        { id: "v3", name: "Nissan Kicks", category: "Kicks", image: taxiVan, rating: 4.7 }
                    ]);
                }

                const { data: pData } = await (supabase as any).from("app_settings").select("*").eq("key", "rental_pricing").single();
                if (pData) {
                    setPricing(pData.value);
                } else {
                    // Fallback pricing
                    setPricing({
                        t_series: {
                            abidjan: { base: 45000, long_term: 40000 },
                            interior: { base: 50000, long_term: 45000, high_km: 60000 }
                        },
                        kicks: {
                            abidjan: { base: 35000, long_term: 30000 },
                            interior: { base: 40000, long_term: 35000, high_km: 45000 }
                        }
                    });
                }
            } catch (error) {
                console.error("Error fetching rental data:", error);
                // Set fallback data anyway
                setVehicles([
                    { id: "v1", name: "Bestune T55", category: "T-Series", image: taxiSedan, rating: 4.8 },
                    { id: "v2", name: "Bestune T77", category: "T-Series", image: taxiSuv, rating: 4.9 },
                    { id: "v3", name: "Nissan Kicks", category: "Kicks", image: taxiVan, rating: 4.7 }
                ]);
                setPricing({
                    t_series: {
                        abidjan: { base: 45000, long_term: 40000 },
                        interior: { base: 50000, long_term: 45000, high_km: 60000 }
                    },
                    kicks: {
                        abidjan: { base: 35000, long_term: 30000 },
                        interior: { base: 40000, long_term: 35000, high_km: 45000 }
                    }
                });
            }
        };
        fetchData();
    }, []);

    // Form State
    const [formData, setFormData] = useState({
        vehicleId: "",
        fullName: "",
        phone: "",
        email: user?.email || "",
        zone: "Abidjan",
        startDate: "",
        startTime: "08:00",
        endDate: "",
        endTime: "08:00",
        kilometers: "",
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
                        phone: data.phone || ""
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
        if (!formData.startDate || !formData.endDate || !formData.vehicleId || !pricing) return null;

        const start = new Date(`${formData.startDate}T${formData.startTime}`);
        const end = new Date(`${formData.endDate}T${formData.endTime}`);

        if (end <= start) return { error: "La date de retour doit être après le départ" };

        // Calcul de la durée en jours (toute journée commencée est due)
        const diffInMs = end.getTime() - start.getTime();
        const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
        const days = Math.max(1, diffInDays);

        const isTSeries = selectedVehicle?.category === "T-Series";
        const categoryKey = isTSeries ? "t_series" : "kicks";
        const isAbidjan = formData.zone === "Abidjan";
        const kms = parseInt(formData.kilometers) || 0;

        const categoryConfig = pricing[categoryKey];
        if (!categoryConfig) return null;

        let pricePerDay = 0;
        if (isAbidjan) {
            pricePerDay = days <= 5 ? categoryConfig.abidjan.base : categoryConfig.abidjan.long_term;
        } else {
            if (kms <= 300) {
                pricePerDay = days <= 5 ? categoryConfig.interior.base : categoryConfig.interior.long_term;
            } else {
                pricePerDay = categoryConfig.interior.high_km;
            }
        }

        const total = days * pricePerDay;

        return {
            days,
            pricePerDay,
            total,
            formattedTotal: new Intl.NumberFormat('fr-FR').format(total) + " F CFA"
        };
    }, [formData, selectedVehicle, pricing]);

    const handleBooking = async () => {
        if (!formData.fullName || !formData.phone || !formData.startDate || !formData.endDate) {
            toast.error("Veuillez remplir tous les champs obligatoires");
            return;
        }

        if (formData.zone === "Intérieur du pays" && !formData.kilometers) {
            toast.error("Veuillez renseigner le kilométrage estimé");
            return;
        }

        const msg = `Bonjour, je souhaite louer un véhicule.

*NOM :* ${formData.fullName}
*TÉLÉPHONE :* ${formData.phone}
*EMAIL :* ${formData.email || 'Non renseigné'}

*VÉHICULE :* ${selectedVehicle?.name}
*ZONE :* ${formData.zone}
*DÉPART :* ${formData.startDate} à ${formData.startTime}
*RETOUR :* ${formData.endDate} à ${formData.endTime}
*DURÉE :* ${calculation?.days} jour(s)
${formData.zone === 'Intérieur du pays' ? `*KM ESTIMÉ :* ${formData.kilometers} km` : ''}

*PRIX ESTIMÉ :* ${calculation?.formattedTotal}

Merci de confirmer la disponibilité.`;

        const encodedMsg = encodeURIComponent(msg);

        // Save to Supabase if user is logged in
        if (user) {
            await supabase.from("bookings").insert({
                user_id: user.id,
                vehicle_name: selectedVehicle?.name || "Véhicule",
                pickup_address: `Agence / Zone: ${formData.zone}`,
                destination: `Location - ${formData.zone}`,
                pickup_date: formData.startDate,
                pickup_time: formData.startTime,
                return_date: formData.endDate,
                return_time: formData.endTime,
                travelers: 1,
                total_price: calculation?.total,
                booking_type: "rental",
                status: "envoyée",
            });
        }

        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMsg}`, '_blank');
        toast.success("Redirection vers WhatsApp...");
        navigate("/success", {
            state: {
                type: "rental",
                data: {
                    fullName: formData.fullName,
                    phone: formData.phone,
                    startDate: formData.startDate,
                    startTime: formData.startTime,
                    endDate: formData.endDate,
                    endTime: formData.endTime,
                    zone: formData.zone,
                    vehicleName: selectedVehicle?.name,
                    days: calculation?.days,
                    total: calculation?.total
                }
            }
        });
    };

    return (
        <MobileLayout>
            <PageTransition>
                <MobileHeader
                    title={step === 1 ? "Location" : step === 2 ? "Détails" : "Récapitulatif"}
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
                                    <h2 className="text-xl font-heading font-bold">Choisissez un véhicule</h2>
                                    <p className="text-sm text-muted-foreground font-body">Sélectionnez le modèle qui vous convient</p>
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
                                            <img src={v.image_url || v.image} alt={v.name} className="w-full h-auto object-contain" />
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
                                        <h4 className="font-heading font-bold text-sm">À savoir</h4>
                                    </div>
                                    <ul className="space-y-2">
                                        <li className="flex items-start gap-2 text-[11px] font-body text-muted-foreground">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                                            <span>Carburant à la charge du client.</span>
                                        </li>
                                        <li className="flex items-start gap-2 text-[11px] font-body text-muted-foreground">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                                            <span>Paiement hors application (direct ou WhatsApp).</span>
                                        </li>
                                        <li className="flex items-start gap-2 text-[11px] font-body text-muted-foreground">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                                            <span>Toute journée commencée est facturée.</span>
                                        </li>
                                    </ul>
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
                                {/* Form Section: Personal Info */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <User className="w-4 h-4 text-primary" />
                                        <h3 className="font-heading font-bold text-sm">Informations personnelles</h3>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="fullName" className="text-[11px] ml-1">Nom complet *</Label>
                                            <Input
                                                id="fullName"
                                                placeholder="Votre nom"
                                                value={formData.fullName}
                                                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                                                className="h-12 rounded-xl bg-secondary/50 border-none px-4"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="phone" className="text-[11px] ml-1">Téléphone *</Label>
                                                <Input
                                                    id="phone"
                                                    placeholder="07..."
                                                    value={formData.phone}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                                    className="h-12 rounded-xl bg-secondary/50 border-none px-4"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="email" className="text-[11px] ml-1">Email (optionnel)</Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    placeholder="votre@email.com"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                                    className="h-12 rounded-xl bg-secondary/50 border-none px-4"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Form Section: Rental Details */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <MapPin className="w-4 h-4 text-primary" />
                                        <h3 className="font-heading font-bold text-sm">Détails de la location</h3>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-[11px] ml-1">Zone d'utilisation</Label>
                                            <Drawer>
                                                <DrawerTrigger asChild>
                                                    <div className="w-full h-12 rounded-xl bg-secondary/50 flex items-center gap-3 px-3 cursor-pointer hover:bg-secondary/70 transition-colors">
                                                        <MapPin className="w-4 h-4 text-muted-foreground" />
                                                        <span className="text-sm font-body text-foreground">
                                                            {formData.zone}
                                                        </span>
                                                        <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                                                    </div>
                                                </DrawerTrigger>
                                                <DrawerContent className="px-4 pb-8">
                                                    <DrawerHeader className="px-0">
                                                        <DrawerTitle className="text-left font-heading">Zone d'utilisation</DrawerTitle>
                                                        <DrawerDescription className="text-left font-body">
                                                            Où comptez-vous circuler avec le véhicule ?
                                                        </DrawerDescription>
                                                    </DrawerHeader>
                                                    <div className="grid grid-cols-1 gap-2 mt-4">
                                                        {["Abidjan", "Intérieur du pays"].map(zone => (
                                                            <DrawerClose asChild key={zone}>
                                                                <button
                                                                    onClick={() => setFormData(prev => ({ ...prev, zone }))}
                                                                    className={cn(
                                                                        "flex items-center justify-between p-4 rounded-xl border transition-all text-left group",
                                                                        formData.zone === zone
                                                                            ? "bg-primary/10 border-primary"
                                                                            : "bg-secondary/40 border-transparent"
                                                                    )}
                                                                >
                                                                    <div>
                                                                        <p className={cn("font-heading font-bold text-sm", formData.zone === zone ? "text-primary" : "text-foreground")}>
                                                                            {zone}
                                                                        </p>
                                                                        <p className="text-[11px] text-muted-foreground font-body">
                                                                            {zone === "Abidjan" ? "Circulation limitée à la ville d'Abidjan" : "Toutes les villes de Côte d'Ivoire"}
                                                                        </p>
                                                                    </div>
                                                                    {formData.zone === zone && <CheckCircle2 className="w-5 h-5 text-primary" />}
                                                                </button>
                                                            </DrawerClose>
                                                        ))}
                                                    </div>
                                                </DrawerContent>
                                            </Drawer>
                                        </div>

                                        {formData.zone === "Intérieur du pays" && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                className="space-y-1.5"
                                            >
                                                <Label htmlFor="kms" className="text-[11px] ml-1">Kilométrage estimé (km) *</Label>
                                                <Input
                                                    id="kms"
                                                    type="number"
                                                    placeholder="Ex: 450"
                                                    value={formData.kilometers}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, kilometers: e.target.value }))}
                                                    className="h-12 rounded-xl bg-secondary/50 border-none px-4"
                                                />
                                            </motion.div>
                                        )}

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="start" className="text-[11px] ml-1">Départ *</Label>
                                                <div className="relative">
                                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                                                    <Input
                                                        id="start"
                                                        type="date"
                                                        value={formData.startDate}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                                                        className="h-12 rounded-xl bg-secondary/30 border-none pl-9 pr-2 text-xs"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="startTime" className="text-[11px] ml-1">Heure *</Label>
                                                <div className="relative">
                                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                                                    <Input
                                                        id="startTime"
                                                        type="time"
                                                        value={formData.startTime}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                                                        className="h-12 rounded-xl bg-secondary/30 border-none pl-9 pr-2 text-xs"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="end" className="text-[11px] ml-1">Retour *</Label>
                                                <div className="relative">
                                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                                                    <Input
                                                        id="end"
                                                        type="date"
                                                        value={formData.endDate}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                                                        className="h-12 rounded-xl bg-secondary/30 border-none pl-9 pr-2 text-xs"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="endTime" className="text-[11px] ml-1">Heure *</Label>
                                                <div className="relative">
                                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                                                    <Input
                                                        id="endTime"
                                                        type="time"
                                                        value={formData.endTime}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                                                        className="h-12 rounded-xl bg-secondary/30 border-none pl-9 pr-2 text-xs"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    onClick={() => setStep(3)}
                                    disabled={!formData.fullName || !formData.phone || !formData.startDate || !formData.endDate}
                                    className="mt-4 w-full h-14 rounded-2xl bg-primary text-primary-foreground font-heading font-semibold text-sm tracking-wide shadow-lg"
                                >
                                    Calculer l'estimation
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
                                <div className="text-center mb-8">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                                        <CheckCircle2 className="w-8 h-8 text-primary" />
                                    </div>
                                    <h2 className="text-2xl font-heading font-bold">Votre Estimation</h2>
                                    <p className="text-sm text-muted-foreground">Vérifiez les détails avant de commander</p>
                                </div>

                                <div className="p-6 rounded-3xl bg-secondary/30 border border-border space-y-4">
                                    <div className="flex justify-between items-center pb-4 border-b border-border/50">
                                        <span className="text-sm font-body text-muted-foreground">Véhicule</span>
                                        <span className="text-sm font-heading font-bold">{selectedVehicle?.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center pb-4 border-b border-border/50">
                                        <span className="text-sm font-body text-muted-foreground">Zone</span>
                                        <span className="text-sm font-heading font-bold">{formData.zone}</span>
                                    </div>
                                    <div className="flex justify-between items-center pb-4 border-b border-border/50">
                                        <span className="text-sm font-body text-muted-foreground">Durée</span>
                                        <span className="text-sm font-heading font-bold">{calculation.days} {calculation.days > 1 ? 'jours' : 'jour'}</span>
                                    </div>

                                    <div className="pt-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-base font-heading font-semibold">Total Estimé</span>
                                            <div className="text-right">
                                                <span className="text-xl font-heading font-bold text-primary">{calculation.formattedTotal}</span>
                                                <p className="text-[10px] text-muted-foreground">Soit {new Intl.NumberFormat('fr-FR').format(calculation.pricePerDay)} J / jour</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-amber-600">Information importante</p>
                                        <p className="text-[11px] text-amber-700/80 leading-relaxed font-body">Le carburant est entièrement à la charge du client. Ce montant est une estimation, la confirmation finale se fait sur WhatsApp.</p>
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

export default Rentals;
