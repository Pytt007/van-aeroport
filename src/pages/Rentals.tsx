import { motion, AnimatePresence } from "framer-motion";
import { Star, MapPin, Calendar, Clock, User, Phone, Mail, ChevronRight, CheckCircle2, AlertCircle, MessageCircle, ArrowLeft, Info, Gauge, Home as HomeIcon, Briefcase } from "lucide-react";
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
import { saveBookingSafe, updateBookingSafe } from "@/lib/supabaseUtils";
import { cn, isTimeValid, getMinBookingDateTime } from "@/lib/utils";
import { initializePayment, generateTransactionId } from "@/lib/cinetpay";
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
                    const mappedVehicles = vData.map((v: any) => {
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
                        { id: "v1", name: "Bestune T55", category: "T-Series", image_url: taxiSedan, rating: 4.8 },
                        { id: "v2", name: "Bestune T77", category: "T-Series", image_url: taxiSuv, rating: 4.9 },
                        { id: "v3", name: "Nissan Kicks", category: "Kicks", image_url: taxiVan, rating: 4.7 }
                    ]);
                }

                const { data: pData } = await (supabase as any).from("app_settings").select("*").eq("key", "rental_pricing").single();
                if (pData) {
                    setPricing(pData.value);
                } else {
                    // Fallback pricing
                    setPricing({
                        abidjan: { day_price: 60000, half_day_price: 40000 },
                        interieur: { day_price: 85000, half_day_price: 55000 }
                    });
                }
            } catch (error) {
                console.error("Error fetching rental data:", error);
                // Set fallback data anyway
                setVehicles([
                    { id: "v1", name: "Bestune T55", category: "T-Series", image_url: taxiSedan, rating: 4.8, created_at: "", engine: null, is_available: true, seats: null, speed: null },
                    { id: "v2", name: "Bestune T77", category: "T-Series", image_url: taxiSuv, rating: 4.9, created_at: "", engine: null, is_available: true, seats: null, speed: null },
                    { id: "v3", name: "Nissan Kicks", category: "Kicks", image_url: taxiVan, rating: 4.7, created_at: "", engine: null, is_available: true, seats: null, speed: null }
                ]);
                setPricing({
                    abidjan: { day_price: 60000, half_day_price: 40000 },
                    interieur: { day_price: 85000, half_day_price: 55000 }
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
    const minDateTime = getMinBookingDateTime();
    const [formData, setFormData] = useState({
        vehicleId: "",
        fullName: "",
        phone: "",
        email: user?.email || "",
        startDate: format(minDateTime.date, 'yyyy-MM-dd'),
        endDate: format(new Date(minDateTime.date.getTime() + 86400000), 'yyyy-MM-dd'),
        startTime: minDateTime.time,
        endTime: "18:00",
        isHalfDay: false,
        zone: "Abidjan" as string,
        comment: "",
        kilometers: "0",
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
        if (!user) {
            toast.error("Vous devez être connecté pour effectuer une réservation.");
            return;
        }

        if (!formData.fullName) { toast.error("Veuillez saisir votre nom complet"); return; }
        if (!formData.phone) { toast.error("Veuillez saisir votre numéro de téléphone"); return; }
        if (!formData.startDate) { toast.error("Veuillez sélectionner une date de départ"); return; }
        if (!formData.endDate) { toast.error("Veuillez sélectionner une date de retour"); return; }
        if (formData.zone === "Intérieur du pays" && (!formData.kilometers || formData.kilometers === "0")) {
            toast.error("Veuillez renseigner le kilométrage estimé pour un trajet à l'intérieur");
            return;
        }

        // Time Validation
        const timeCheck = isTimeValid(new Date(formData.startDate), formData.startTime);
        if (!timeCheck.isValid) {
            toast.error(timeCheck.error);
            return;
        }

        if (formData.zone === "Intérieur du pays" && !formData.kilometers) {
            toast.error("Veuillez renseigner le kilométrage estimé");
            return;
        }

        const depositAmount = calculation ? Math.round(calculation.total * 0.3) : 0;
        let bookingId = "";

        // 1. Check Availability
        try {
            const { data: isAvailable, error: availError } = await (supabase as any).rpc('check_vehicle_availability', {
                p_vehicle_id: selectedVehicle?.id || "",
                p_pickup_date: formData.startDate,
                p_return_date: formData.endDate
            });
            if (availError) throw availError;
            if (isAvailable === false) {
                toast.error("Désolé, ce véhicule n'est plus disponible pour ces dates.");
                return;
            }
        } catch (error) {
            console.error("Error checking availability:", error);
        }

        // 2. Save to Supabase
        const { data: savedBooking, error: saveError } = await saveBookingSafe({
            user_id: user?.id || null,
            vehicle_id: selectedVehicle?.id,
            vehicle_name: selectedVehicle?.name || "Véhicule",
            pickup_address: `Agence / Zone: ${formData.zone}`,
            destination: `Location - ${formData.zone}`,
            pickup_date: formData.startDate,
            pickup_time: formData.startTime,
            return_date: formData.endDate,
            return_time: formData.endTime,
            travelers: 1,
            total_price: calculation?.total,
            deposit_amount: depositAmount,
            booking_type: "rental",
            status: "pending_payment",
            payment_status: "pending",
        });

        if (!saveError && savedBooking) {
            bookingId = savedBooking.id;
        } else if (saveError || !savedBooking) {
            console.error("Error saving booking:", saveError);
            toast.error(`Erreur d'enregistrement : ${saveError?.message || 'Inconnu'}`);
            return;
        }

        // 3. Initiate Payment
        try {
            const paymentData = {
                transaction_id: generateTransactionId(),
                amount: depositAmount,
                currency: "XOF",
                description: `Acompte 30% - Location #${bookingId.slice(0, 8).toUpperCase()}`,
                customer_name: formData.fullName.split(" ")[0] || "Customer",
                customer_surname: formData.fullName.split(" ").slice(1).join(" ") || formData.fullName,
                customer_phone_number: formData.phone,
                customer_email: formData.email || "customer@example.com",
                customer_address: `Zone: ${formData.zone}`,
                customer_city: "Abidjan",
                customer_country: "CI",
                customer_state: "CI",
                customer_zip_code: "00225",
            };

            const paymentResult: any = await initializePayment(paymentData);

            await updateBookingSafe(bookingId, {
                status: "pending_payment",
                payment_status: "pending",
                transaction_id: paymentData.transaction_id
            });
            toast.success("Page de paiement ouverte dans un nouvel onglet !");
        } catch (error: any) {
            console.error("Payment error:", error);
            toast.error(error.message || "Le paiement a échoué.");
            return;
        }

        const msg = `Bonjour, je souhaite confirmer ma location.${bookingId ? `\nRéférence : #${bookingId.slice(0, 8).toUpperCase()}` : ''}

*NOM :* ${formData.fullName}
*TÉLÉPHONE :* ${formData.phone}
*EMAIL :* ${formData.email || 'Non renseigné'}

*VÉHICULE :* ${selectedVehicle?.name}
*ZONE :* ${formData.zone}
*DÉPART :* ${formData.startDate} à ${formData.startTime}
*RETOUR :* ${formData.endDate} à ${formData.endTime}
*DURÉE :* ${calculation?.days} jour(s)

*STATUT PAIEMENT :* Acompte de 30% (${depositAmount.toLocaleString('fr-FR')} F) PAYÉ ✅

Merci de confirmer la mise à disposition.`;

        const encodedMsg = encodeURIComponent(msg);
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
                    total: calculation?.total,
                    deposit: depositAmount,
                    id: bookingId
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
                                            {/* Custom Start Date Picker */}
                                            <div className="space-y-1.5">
                                                <Label className="text-[11px] ml-1">Départ *</Label>
                                                <Drawer>
                                                    <DrawerTrigger asChild>
                                                        <div className="group w-full h-12 rounded-xl bg-secondary/30 flex items-center gap-3 px-3 cursor-pointer hover:bg-secondary/50 transition-colors">
                                                            <Calendar className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                                                            <span className={cn("text-xs font-body", !formData.startDate && "text-muted-foreground")}>
                                                                {formData.startDate ? format(new Date(formData.startDate), "PPP", { locale: fr }) : "Date *"}
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
                                                                selected={formData.startDate ? new Date(formData.startDate) : undefined}
                                                                onSelect={(date) => setFormData(prev => ({ ...prev, startDate: date ? date.toISOString().split('T')[0] : "" }))}
                                                                initialFocus
                                                                locale={fr}
                                                                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                                                className="rounded-xl border border-border shadow-sm"
                                                            />
                                                        </div>
                                                        <DrawerFooter className="px-0 pt-4">
                                                            <DrawerClose asChild>
                                                                <Button className="w-full h-12 rounded-xl">Confirmer</Button>
                                                            </DrawerClose>
                                                        </DrawerFooter>
                                                    </DrawerContent>
                                                </Drawer>
                                            </div>

                                            {/* Custom Start Time Picker */}
                                            <div className="space-y-1.5">
                                                <Label className="text-[11px] ml-1">Heure *</Label>
                                                <Drawer>
                                                    <DrawerTrigger asChild>
                                                        <div className="group w-full h-12 rounded-xl bg-secondary/30 flex items-center gap-3 px-3 cursor-pointer hover:bg-secondary/50 transition-colors">
                                                            <Clock className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
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
                                                                <Button className="w-full h-12 rounded-xl">Confirmer</Button>
                                                            </DrawerClose>
                                                        </DrawerFooter>
                                                    </DrawerContent>
                                                </Drawer>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            {/* Custom End Date Picker */}
                                            <div className="space-y-1.5">
                                                <Label className="text-[11px] ml-1">Retour *</Label>
                                                <Drawer>
                                                    <DrawerTrigger asChild>
                                                        <div className="group w-full h-12 rounded-xl bg-secondary/30 flex items-center gap-3 px-3 cursor-pointer hover:bg-secondary/50 transition-colors">
                                                            <Calendar className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                                                            <span className={cn("text-xs font-body", !formData.endDate && "text-muted-foreground")}>
                                                                {formData.endDate ? format(new Date(formData.endDate), "PPP", { locale: fr }) : "Date *"}
                                                            </span>
                                                        </div>
                                                    </DrawerTrigger>
                                                    <DrawerContent className="p-4">
                                                        <DrawerHeader className="px-0">
                                                            <DrawerTitle className="text-left font-heading">Date de retour</DrawerTitle>
                                                        </DrawerHeader>
                                                        <div className="flex justify-center p-2">
                                                            <CalendarComponent
                                                                mode="single"
                                                                selected={formData.endDate ? new Date(formData.endDate) : undefined}
                                                                onSelect={(date) => setFormData(prev => ({ ...prev, endDate: date ? date.toISOString().split('T')[0] : "" }))}
                                                                initialFocus
                                                                locale={fr}
                                                                disabled={(date) => date < (formData.startDate ? new Date(formData.startDate) : new Date(new Date().setHours(0, 0, 0, 0)))}
                                                                className="rounded-xl border border-border shadow-sm"
                                                            />
                                                        </div>
                                                        <DrawerFooter className="px-0 pt-4">
                                                            <DrawerClose asChild>
                                                                <Button className="w-full h-12 rounded-xl">Confirmer</Button>
                                                            </DrawerClose>
                                                        </DrawerFooter>
                                                    </DrawerContent>
                                                </Drawer>
                                            </div>

                                            {/* Custom End Time Picker */}
                                            <div className="space-y-1.5">
                                                <Label className="text-[11px] ml-1">Heure *</Label>
                                                <Drawer>
                                                    <DrawerTrigger asChild>
                                                        <div className="group w-full h-12 rounded-xl bg-secondary/30 flex items-center gap-3 px-3 cursor-pointer hover:bg-secondary/50 transition-colors">
                                                            <Clock className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                                                            <span className="text-xs font-body">{formData.endTime}</span>
                                                        </div>
                                                    </DrawerTrigger>
                                                    <DrawerContent className="px-4 pb-8">
                                                        <DrawerHeader className="px-0">
                                                            <DrawerTitle className="text-left font-heading">Heure de retour</DrawerTitle>
                                                        </DrawerHeader>
                                                        <div className="py-4">
                                                            <ClockPicker
                                                                value={formData.endTime}
                                                                onChange={(val) => setFormData(prev => ({ ...prev, endTime: val }))}
                                                            />
                                                        </div>
                                                        <DrawerFooter className="px-0 pt-2 pb-6">
                                                            <DrawerClose asChild>
                                                                <Button className="w-full h-12 rounded-xl">Confirmer</Button>
                                                            </DrawerClose>
                                                        </DrawerFooter>
                                                    </DrawerContent>
                                                </Drawer>
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

                                    <div className="pt-2 border-t border-border flex flex-col gap-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-base font-heading font-semibold">Total Estimé</span>
                                            <div className="text-right">
                                                <span className="text-xl font-heading font-bold text-primary">{calculation.formattedTotal}</span>
                                                <p className="text-[10px] text-muted-foreground">Soit {new Intl.NumberFormat('fr-FR').format(calculation.pricePerDay)} J / jour</p>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center bg-primary/5 p-2 rounded-xl">
                                            <span className="text-xs font-bold text-muted-foreground uppercase">Acompte 30%</span>
                                            <span className="text-sm font-bold text-primary">{(Math.round(calculation.total * 0.3)).toLocaleString('fr-FR')} F</span>
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
