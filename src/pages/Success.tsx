import { motion } from "framer-motion";
import { CheckCircle2, Home, MessageCircle, ArrowRight, FileText, Loader2, Star, Plus } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import MobileLayout, { PageTransition } from "@/components/MobileLayout";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import BoardingPass from "@/components/BoardingPass";
import html2canvas from "html2canvas";
import { CONFIG } from "@/constants/config";

const Success = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    // Setup initial data from state or session storage
    let initialType = "booking";
    let initialData = null;

    if (location.state?.data) {
        initialType = location.state.type;
        initialData = location.state.data;
    } else {
        const stored = sessionStorage.getItem("pendingBooking");
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                initialType = parsed.type;
                initialData = parsed.data;
            } catch (e) {
                console.error("Failed to parse stored booking", e);
            }
        }
    }

    const { type, data } = { type: initialType, data: initialData };
    const [saving, setSaving] = useState(false);
    const [savedAddresses, setSavedAddresses] = useState<string[]>([]);
    const [isCapturing, setIsCapturing] = useState(false);

    const handleSaveFavorite = async (address: string, label: string) => {
        if (!user || !address) return;
        setSaving(true);
        try {
            const { error } = await supabase.from("addresses").insert({
                user_id: user.id,
                label,
                address,
                type: "other"
            });
            if (error) throw error;
            setSavedAddresses(prev => [...prev, address]);
            toast.success(`"${label}" ajouté à vos adresses !`);
        } catch (error) {
            toast.error("Échec de l'enregistrement de l'adresse.");
        } finally {
            setSaving(false);
        }
    };

    const handleCaptureBoardingPass = async () => {
        const element = document.getElementById("boarding-pass-capture");
        if (!element) return;

        setIsCapturing(true);
        try {
            const canvas = await html2canvas(element, {
                scale: 3,
                backgroundColor: null,
                logging: false,
                useCORS: true
            });
            const link = document.createElement("a");
            link.download = `Vanaeroport_Ticket_${data?.id?.slice(0, 8) || 'Res'}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
            toast.success("Carte d'embarquement enregistrée !");
        } catch (error) {
            console.error("Capture failed", error);
            toast.error("Échec de la capture.");
        } finally {
            setIsCapturing(false);
        }
    };

    return (
        <MobileLayout showNav={false}>
            <PageTransition>
                <div className="min-h-dvh flex flex-col items-center justify-center p-6 text-center">
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-8"
                    >
                        <CheckCircle2 className="w-12 h-12 text-primary" />
                    </motion.div>

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="max-w-md space-y-4"
                    >
                        <h1 className="text-3xl font-heading font-bold text-foreground">
                            Paiement validé !
                        </h1>
                        <p className="text-muted-foreground font-body leading-relaxed mb-6">
                            Veuillez suivre les deux étapes ci-dessous pour confirmer définitivement votre réservation.
                        </p>

                        {!data && (
                            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl mb-6">
                                <p className="text-amber-500 text-xs font-medium">Note : Réservation introuvable. Veuillez vérifier vos reçus par email.</p>
                            </div>
                        )}

                        {/* Boarding Pass Component */}
                        {data && (
                            <div className="pb-8 w-full">
                                <BoardingPass data={data} />
                            </div>
                        )}
                    </motion.div>

                    {data && (
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="w-full max-w-sm space-y-6"
                        >
                            {/* Step 1 : Download Ticket */}
                            <div className="bg-secondary/30 rounded-3xl p-5 border border-border text-left">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-heading font-bold text-primary shrink-0">1</div>
                                    <h3 className="font-heading font-bold text-base">Enregistrez votre ticket</h3>
                                </div>
                                <p className="text-xs text-muted-foreground font-body mb-4 pl-11">
                                    Ce ticket contient les détails de votre réservation et le reste à payer au chauffeur.
                                </p>
                                <Button
                                    onClick={handleCaptureBoardingPass}
                                    disabled={isCapturing}
                                    className="w-full h-14 rounded-2xl bg-neutral-900 border border-white/10 text-white font-heading font-semibold text-sm tracking-wide shadow-xl group ml-2"
                                >
                                    {isCapturing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2 text-primary" />}
                                    ⬇️ Télécharger mon Ticket
                                </Button>
                            </div>

                            {/* Step 2 : WhatsApp */}
                            <div className="bg-green-500/10 rounded-3xl p-5 border border-green-500/20 text-left">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-heading font-bold shrink-0">2</div>
                                    <h3 className="font-heading font-bold text-base text-green-700">Confirmez votre réservation</h3>
                                </div>
                                <p className="text-xs text-green-700/80 font-body mb-4 pl-11">
                                    Cliquez ici pour ouvrir WhatsApp. Vous pourrez envoyer la photo de votre ticket pour confirmer votre réservation avec l'équipe.
                                </p>
                                <Button
                                    onClick={() => {
                                        const reference = (data.id || '').slice(0, 8).toUpperCase();
                                        const displayDate = data.pickupDate || data.startDate || '--';
                                        const displayTime = data.pickupTime || data.startTime || '--';
                                        const displayPickup = data.pickup || (data.zone ? `Agence (${data.zone})` : '--');
                                        const displayDestination = data.destination || (data.zone ? `Location (${data.zone})` : '--');

                                        const isRental = data.type === 'rental' || !!data.endDate;
                                        const isHourly = data.type === 'ride' || data.type === 'hourly' || !!data.hours;

                                        let serviceDetails = "";
                                        if (isRental) {
                                            serviceDetails = `📅 *Période :* du ${displayDate} au ${data.endDate || '--'}\n⏱️ *Heures :* de ${displayTime} à ${data.endTime || '18:00'}\n🏢 *Durée :* ${data.days || '--'} jour(s)`;
                                        } else if (isHourly) {
                                            serviceDetails = `📅 *Date :* ${displayDate}\n⏱️ *Horaires :* de ${displayTime} pour ${data.hours || '--'}h\n📍 *Départ :* ${displayPickup}`;
                                        } else {
                                            serviceDetails = `📅 *Date :* ${displayDate} à ${displayTime}\n📍 *Trajet :* ${displayPickup} ➡️ ${displayDestination}\n👥 *Passagers :* ${data.travelers || '1'}`;
                                        }

                                        const msg = `Bonjour, je vous envoie la preuve de mon paiement d'acompte pour ma réservation.

📌 *Référence :* #${reference}
👤 *Passager :* ${data.fullName || 'Client'}
${serviceDetails}
        
💰 *Acompte payé :* ${data.deposit ? data.deposit.toLocaleString('fr-FR') : 0} F CFA ✅
💳 *Reste à payer :* ${data.total && data.deposit ? (data.total - data.deposit).toLocaleString('fr-FR') : 0} F CFA

Veuillez trouver mon ticket en pièce jointe. Merci !`;
                                        const encodedMsg = encodeURIComponent(msg);
                                        window.open(`https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodedMsg}`, '_blank');
                                    }}
                                    className="w-full h-14 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-heading font-semibold text-sm tracking-wide shadow-lg group ml-2"
                                >
                                    <MessageCircle className="w-5 h-5 mr-2" />
                                    Continuer sur WhatsApp
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* Save Favorite Address Suggestions */}
                    {user && data && (data.pickup || data.destination) && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="mt-6 w-full max-w-sm space-y-2 text-left"
                        >
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Enregistrer pour plus tard ?</p>
                            <div className="flex flex-col gap-2">
                                {data.pickup && !savedAddresses.includes(data.pickup) && (
                                    <button
                                        onClick={() => handleSaveFavorite(data.pickup, "Départ frequent")}
                                        disabled={saving}
                                        className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border active:scale-[0.98] transition-all hover:border-primary/30"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                            <Star className="w-4 h-4 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold truncate">{data.pickup}</p>
                                            <p className="text-[10px] text-muted-foreground truncate">Mémoriser ce lieu de départ</p>
                                        </div>
                                        <Plus className="w-4 h-4 text-muted-foreground mr-1" />
                                    </button>
                                )}
                                {data.destination && !savedAddresses.includes(data.destination) && data.destination !== data.pickup && (
                                    <button
                                        onClick={() => handleSaveFavorite(data.destination, "Destination frequente")}
                                        disabled={saving}
                                        className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border active:scale-[0.98] transition-all hover:border-primary/30"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                            <Star className="w-3.5 h-3.5 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold truncate">{data.destination}</p>
                                            <p className="text-[10px] text-muted-foreground truncate">Mémoriser cette destination</p>
                                        </div>
                                        <Plus className="w-4 h-4 text-muted-foreground mr-1" />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="mt-8 w-full max-w-sm space-y-3"
                    >
                        <Button
                            onClick={() => navigate("/")}
                            className="w-full h-14 rounded-2xl bg-primary/10 border border-primary/20 text-foreground font-heading font-semibold text-sm tracking-wide shadow-sm group"
                        >
                            Retour à l'accueil
                            <Home className="w-4 h-4 ml-2 group-hover:scale-110 transition-transform text-primary" />
                        </Button>
                    </motion.div>

                </div>
            </PageTransition>
        </MobileLayout>
    );
};

export default Success;
