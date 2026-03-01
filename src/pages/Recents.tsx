import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, RotateCcw, Calendar, MapPin, Car, MessageCircle, AlertCircle, CheckCircle2, XCircle, FileText } from "lucide-react";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import MobileLayout, { PageTransition } from "@/components/MobileLayout";
import MobileHeader from "@/components/MobileHeader";
import { Button } from "@/components/ui/button";
import { generateReceiptPDF } from "@/utils/receiptGenerator";
import { updateBookingSafe } from "@/lib/supabaseUtils";
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

  const extractMeta = (dest: string) => {
    if (!dest || !dest.includes("[META:")) return {};
    try {
      const metaStr = dest.split("[META:")[1].split("]")[0];
      const parts = metaStr.split(", ");
      const meta: any = {};
      parts.forEach(p => {
        const [key, val] = p.split(": ");
        if (key === "PayStat") meta.payment_status = val;
        if (key === "Status") meta.status = val;
        if (key === "Acompte") meta.deposit_amount = parseFloat(val);
      });
      return meta;
    } catch (e) {
      return {};
    }
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

  const handleMarkAsFullyPaid = async (booking: any) => {
    try {
      // Instant UI update
      setBookings(prev => prev.map(b =>
        b.id === booking.id ? { ...b, status: 'fully_paid', payment_status: 'fully_paid' } : b
      ));

      const { error } = await updateBookingSafe(booking.id, {
        payment_status: "fully_paid",
        status: "fully_paid",
        deposit_amount: booking.total_price
      });

      if (error) throw error;
      toast.success("Réservée marquée comme payée !");
      fetchBookings();
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Échec de la mise à jour.");
    }
  };

  const handleDownload = async (booking: any) => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("user_id", user?.id)
        .single();

      const meta = extractMeta(booking.destination);
      const effectiveDeposit = meta.deposit_amount || booking.deposit_amount || 0;

      const receiptId = booking.id.split("-")[0].toUpperCase();
      await generateReceiptPDF(receiptId, {
        fullName: profile?.full_name,
        phone: profile?.phone,
        vehicleName: booking.vehicle_name,
        pickup: booking.pickup_address,
        destination: booking.destination,
        date: booking.pickup_date,
        startDate: booking.pickup_date,
        endDate: booking.return_date,
        startTime: booking.pickup_time,
        endTime: booking.return_time,
        hours: booking.duration_hours,
        days: booking.total_days,
        travelers: booking.travelers,
        total: booking.total_price || 0,
        deposit: effectiveDeposit,
        bookingType: booking.booking_type
      });
      toast.success("Reçu téléchargé !");
    } catch (error) {
      toast.error("Erreur lors du téléchargement.");
    }
  };

  const getStatusConfig = (status: string, paymentStatus: string) => {
    const isFullyPaid = paymentStatus === 'fully_paid' || status?.toLowerCase() === 'fully_paid';

    if (isFullyPaid) {
      return {
        label: "Totalement Payée",
        icon: CheckCircle2,
        color: "text-white",
        bg: "bg-neutral-900",
        border: "border-neutral-900"
      };
    }

    if (paymentStatus === 'paid' || status?.toLowerCase() === 'paid') {
      return {
        label: "Acompte Payé",
        icon: CheckCircle2,
        color: "text-green-600",
        bg: "bg-green-500/10",
        border: "border-green-500/20"
      };
    }

    switch (status?.toLowerCase()) {
      case 'envoyée':
      case 'envoyee':
      case 'en_attente':
      case 'attente':
      case 'pending':
      case 'pending_payment':
        return {
          label: "Attente Acompte",
          icon: Clock,
          color: "text-orange-500",
          bg: "bg-orange-500/10",
          border: "border-orange-500/20"
        };
      case 'confirmee':
      case 'completed':
        return {
          label: "Confirmée",
          icon: CheckCircle2,
          color: "text-blue-500",
          bg: "bg-blue-500/10",
          border: "border-blue-500/20"
        };
      case 'termine':
        return {
          label: "Terminée",
          icon: CheckCircle2,
          color: "text-neutral-500",
          bg: "bg-neutral-500/10",
          border: "border-neutral-500/20"
        };
      case 'annulee':
      case 'cancelled':
        return {
          label: "Annulée",
          icon: XCircle,
          color: "text-red-500",
          bg: "bg-red-500/10",
          border: "border-red-500/20"
        };
      default:
        return {
          label: status || "En attente",
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
              const meta = extractMeta(booking.destination);
              const effectiveStatus = meta.status || booking.status;
              const effectivePaymentStatus = meta.payment_status || booking.payment_status;

              const status = getStatusConfig(effectiveStatus, effectivePaymentStatus);
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
                            <h4 className="font-heading font-bold text-sm truncate uppercase tracking-tight">Vers: {booking.destination?.split(" | [META:")[0]}</h4>
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

                    {/* Action Buttons based on status or payment */}
                    {(effectivePaymentStatus === 'fully_paid' || effectiveStatus === 'fully_paid') ? (
                      <Button
                        onClick={() => handleDownload(booking)}
                        className="w-full h-12 rounded-2xl bg-neutral-900 border border-white/10 text-white font-heading font-bold text-sm shadow-md active:scale-[0.98] transition-all"
                      >
                        <FileText className="w-4 h-4 mr-2 text-primary" />
                        Télécharger la Facture Finale
                      </Button>
                    ) : (effectivePaymentStatus === 'paid' || ['paid', 'confirmee', 'termine', 'completed'].includes(effectiveStatus?.toLowerCase())) ? (
                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={() => handleDownload(booking)}
                          variant="outline"
                          className="w-full h-12 rounded-2xl border-border font-heading font-bold text-sm active:scale-[0.98] transition-all"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Télécharger reçu acompte
                        </Button>
                        <Button
                          onClick={() => handleMarkAsFullyPaid(booking)}
                          className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-heading font-bold text-sm shadow-lg active:scale-[0.98] transition-all"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Confirmer paiement final
                        </Button>
                      </div>
                    ) : (status.label !== "Annulée" && (
                      <Button
                        onClick={() => navigate("/tracking", { state: { bookingId: booking.id } })}
                        variant="secondary"
                        className="w-full h-12 rounded-2xl font-heading font-bold text-sm active:scale-[0.98] transition-all"
                      >
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Suivre la commande
                      </Button>
                    ))}
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
