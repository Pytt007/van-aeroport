import { motion } from "framer-motion";
import { CheckCircle2, Home, MessageCircle, ArrowRight, FileText, Loader2, Star, Plus } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import MobileLayout, { PageTransition } from "@/components/MobileLayout";
import { useTranslation } from "react-i18next";
import { generateReceiptPDF } from "@/utils/receiptGenerator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import BoardingPass from "@/components/BoardingPass";
import html2canvas from "html2canvas";

const Success = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { type, data } = location.state || { type: "booking", data: null };
    const [downloading, setDownloading] = useState(false);
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

    const handleDownloadReceipt = async () => {
        if (!data) {
            toast.error("Aucune donnée disponible pour le reçu.");
            return;
        }
        setDownloading(true);
        try {
            const receiptId = data.id || Math.random().toString(36).substring(2, 8).toUpperCase();
            await generateReceiptPDF(receiptId, data);
            toast.success("Votre reçu a été téléchargé.");
        } catch (error) {
            toast.error("Échec du téléchargement du reçu.");
        } finally {
            setDownloading(false);
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
                            {type === "rental" ? "Demande envoyée !" : "Réservation transmise !"}
                        </h1>
                        <p className="text-muted-foreground font-body leading-relaxed mb-6">
                            Votre demande a été envoyée avec succès sur WhatsApp. Notre équipe va vous répondre dans quelques instants pour finaliser la confirmation.
                        </p>

                        {!data && (
                            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl mb-6">
                                <p className="text-amber-500 text-xs font-medium">Note : Effectuez une réservation depuis l'application pour générer votre ticket personnalisé ici.</p>
                            </div>
                        )}

                        {/* Boarding Pass Component */}
                        {data && (
                            <div className="pb-8 w-full">
                                <BoardingPass data={data} />
                            </div>
                        )}
                    </motion.div>

                    {/* WhatsApp Hint */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="mt-8 p-4 rounded-2xl bg-secondary/50 border border-border flex items-center gap-4 text-left w-full max-w-sm"
                    >
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                            <MessageCircle className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                            <p className="font-heading font-bold text-xs uppercase tracking-wider text-green-500 mb-0.5">Suivi en direct</p>
                            <p className="text-[11px] text-muted-foreground font-body">La discussion continue sur votre application WhatsApp.</p>
                        </div>
                    </motion.div>

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
                        {data && (
                            <Button
                                onClick={handleCaptureBoardingPass}
                                disabled={isCapturing}
                                className="w-full h-14 rounded-2xl bg-neutral-900 border border-white/10 text-white font-heading font-semibold text-sm tracking-wide shadow-xl group mb-2"
                            >
                                {isCapturing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2 text-primary" />}
                                Enregistrer mon Ticket (PNG)
                            </Button>
                        )}

                        <Button
                            onClick={() => navigate("/")}
                            className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-heading font-semibold text-sm tracking-wide shadow-lg group"
                        >
                            Retour à l'accueil
                            <Home className="w-4 h-4 ml-2 group-hover:scale-110 transition-transform" />
                        </Button>

                        <Button
                            variant="secondary"
                            onClick={handleDownloadReceipt}
                            disabled={downloading}
                            className="w-full h-14 rounded-2xl bg-secondary text-foreground font-heading font-semibold text-sm group"
                        >
                            {downloading ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <FileText className="w-4 h-4 mr-2 text-primary" />
                            )}
                            Télécharger le reçu provisoire
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => navigate("/recents")}
                            className="w-full h-14 rounded-2xl border-border font-heading font-semibold text-sm group"
                        >
                            Voir mon historique
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </motion.div>

                    <footer className="absolute bottom-8 text-[10px] text-muted-foreground/40 font-body uppercase tracking-[0.2em]">
                        Vanaeroport Premium Service
                    </footer>
                </div>
            </PageTransition>
        </MobileLayout>
    );
};

export default Success;
