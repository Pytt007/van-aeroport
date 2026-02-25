import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, RotateCcw, Calendar, MapPin, Car, MessageCircle, AlertCircle, CheckCircle2, XCircle, FileText, Plus } from "lucide-react";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import MobileLayout, { PageTransition } from "@/components/MobileLayout";
import MobileHeader from "@/components/MobileHeader";
import { Button } from "@/components/ui/button";
import { generateReceiptPDF } from "@/utils/receiptGenerator";
import { toast } from "sonner";

const History = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchBookings();
  }, [user]);

  const fetchBookings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) {
      setBookings(data || []);
    }
    setLoading(false);
  };

  const formatDate = (dateStr: string, timeStr: string) => {
    try {
      const d = new Date(`${dateStr}T${timeStr}`);
      const locale = i18n.language.startsWith("fr") ? fr : enUS;
      return format(d, "EEE d MMM, HH:mm", { locale });
    } catch {
      return dateStr;
    }
  };

  const handleDownload = async (booking: any) => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("user_id", user?.id)
        .single();

      const receiptId = booking.id.split("-")[0].toUpperCase();
      await generateReceiptPDF(receiptId, {
        fullName: profile?.full_name,
        phone: profile?.phone,
        vehicleName: booking.vehicle_name,
        pickup: booking.pickup_address,
        destination: booking.destination,
        date: booking.pickup_date,
        startTime: booking.pickup_time,
        total: booking.total_price || "À confirmer",
      });
      toast.success("Reçu téléchargé !");
    } catch (error) {
      toast.error("Erreur lors du téléchargement.");
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'envoyée':
      case 'envoyee':
      case 'en_attente':
      case 'attente':
        return {
          label: "Envoyé",
          icon: MessageCircle,
          color: "text-blue-500",
          bg: "bg-blue-500/10",
          border: "border-blue-500/20"
        };
      case 'confirmee':
      case 'termine':
        return {
          label: "Confirmée",
          icon: CheckCircle2,
          color: "text-green-500",
          bg: "bg-green-500/10",
          border: "border-green-500/20"
        };
      case 'annulee':
        return {
          label: "Annulée",
          icon: XCircle,
          color: "text-red-500",
          bg: "bg-red-500/10",
          border: "border-red-500/20"
        };
      default:
        return {
          label: status || "Inconnu",
          icon: Clock,
          color: "text-muted-foreground",
          bg: "bg-muted/10",
          border: "border-muted/20"
        };
    }
  };

  return (
    <MobileLayout>
      <PageTransition>
        <MobileHeader title={t("nav.history")} showProfile={true} />
        <div className="px-4 pb-24 space-y-4">

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground font-body">{t("common.loading")}</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-20 space-y-6">
              <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto">
                <Clock className="w-10 h-10 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="font-heading font-bold text-lg">Aucun historique</h3>
                <p className="text-sm text-muted-foreground font-body px-10">Vos réservations et courses apparaîtront ici.</p>
              </div>
              <Button
                onClick={() => navigate("/")}
                className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-heading font-semibold text-sm tracking-wide shadow-lg"
              >
                Réserver maintenant
              </Button>
            </div>
          ) : (
            bookings.map((booking, i) => {
              const status = getStatusConfig(booking.status);
              const StatusIcon = status.icon;
              const isRental = booking.booking_type === "rental";

              return (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-3xl bg-card border border-border overflow-hidden shadow-sm"
                >
                  <div className="p-5 space-y-5">
                    {/* Header: Date + Status */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-body">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(booking.pickup_date, booking.pickup_time)}
                      </div>
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${status.bg} ${status.color} ${status.border}`}>
                        <StatusIcon className="w-3 h-3" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">{status.label}</span>
                      </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center shrink-0">
                        {isRental ? <Car className="w-6 h-6 text-primary" /> : <MapPin className="w-6 h-6 text-primary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            {booking.pickup_address && (
                              <p className="text-[10px] text-muted-foreground font-body truncate mb-0.5">
                                De: {booking.pickup_address}
                              </p>
                            )}
                            <h4 className="font-heading font-bold text-sm truncate uppercase tracking-tight">Vers: {booking.destination}</h4>
                          </div>
                          {booking.total_price && (
                            <div className="text-right shrink-0">
                              <span className="text-sm font-heading font-bold text-primary">
                                {Number(booking.total_price).toLocaleString('fr-FR')} F
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground font-body mt-1 truncate">{booking.vehicle_name}</p>
                      </div>
                    </div>

                    {/* Details Row */}
                    <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-muted-foreground font-body">Départ</span>
                          <span className="text-xs font-heading font-semibold">{booking.pickup_time.slice(0, 5)}</span>
                        </div>
                        {booking.return_date && (
                          <div className="flex flex-col border-l border-border/50 pl-4">
                            <span className="text-[10px] text-muted-foreground font-body">Retour le</span>
                            <span className="text-xs font-heading font-semibold">{booking.return_date.split('-').reverse().join('/')}</span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          if (isRental) navigate("/rentals");
                          else navigate("/ride-booking");
                        }}
                        className="flex items-center gap-1.5 text-primary text-[11px] font-bold font-heading hover:underline active:scale-95 transition-all"
                      >
                        <RotateCcw className="w-3.5 h-3.5 mr-1" />
                        {t("common.book_again") || "Réserver"}
                      </button>
                    </div>

                    {/* Receipt Button - Now as the primary action like requested */}
                    <Button
                      onClick={() => handleDownload(booking)}
                      className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-heading font-bold text-sm shadow-md active:scale-[0.98] transition-all border-none"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Télécharger le reçu
                    </Button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </PageTransition>
    </MobileLayout>
  );
};

export default History;
