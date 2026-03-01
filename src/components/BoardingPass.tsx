import { motion } from "framer-motion";
import { QrCode, Plane, MapPin, User, Calendar, Clock, ShieldCheck, Car } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface BoardingPassProps {
    data: {
        id?: string;
        fullName?: string;
        vehicleName?: string;
        pickup?: string;
        destination?: string;
        pickupDate?: string;
        startDate?: string;
        endDate?: string;
        pickupTime?: string;
        startTime?: string;
        endTime?: string;
        total?: number;
        deposit?: number;
        travelers?: string | number;
        zone?: string;
        hours?: string | number;
        days?: string | number;
        type?: string;
    };
}

const BoardingPass = ({ data }: BoardingPassProps) => {
    const depositPaid = data.deposit || 0;
    const remainingAmount = (data.total || 0) - depositPaid;
    const reference = data.id?.slice(0, 8).toUpperCase() || "PENDING";

    // Normalize data for different services (Ride, Rental, Airport)
    const displayPickup = data.pickup || (data.zone ? `Agence (${data.zone})` : "");
    const displayDestination = data.destination || (data.zone ? `Location (${data.zone})` : "");
    const displayDate = data.pickupDate || data.startDate;
    const displayTime = data.pickupTime || data.startTime;

    const isRental = !!data.endDate || data.type === 'rental';
    const isHourly = !!data.hours || data.type === 'ride' || data.type === 'hourly';
    const isAirport = data.type === 'booking' || data.type === 'airport';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm mx-auto overflow-hidden bg-white text-black rounded-3xl shadow-2xl font-sans"
            id="boarding-pass-capture"
        >
            {/* Top Section - Brand & Ref */}
            <div className="bg-neutral-900 text-white px-5 py-5 flex justify-between items-center border-b border-white/10 gap-4">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
                        <Car className="w-5 h-5 text-black" />
                    </div>
                    <span className="font-heading font-extrabold text-[13px] italic uppercase leading-relaxed py-1">Vanaeroport</span>
                </div>
                <div className="text-right shrink-0">
                    <p className="text-[9px] uppercase tracking-widest text-neutral-400">Référence</p>
                    <p className="font-heading font-bold text-primary text-sm min-h-6 py-0.5">#{reference}</p>
                </div>
            </div>

            {/* Main Ticket Body */}
            <div className="p-6 space-y-5 relative">
                {/* Passenger Info */}
                <div className="grid grid-cols-2 gap-6 pb-2">
                    <div className="space-y-1.5 min-w-0 flex flex-col items-start">
                        <div className="flex items-center gap-2 text-neutral-400">
                            <User className="w-4 h-4 shrink-0" />
                            <p className="text-[10px] uppercase font-bold">Passager</p>
                        </div>
                        <p className="font-bold text-sm tracking-tight capitalize py-0.5 leading-relaxed truncate text-neutral-900 w-full text-left">
                            {data.fullName || "Client Premium"}
                        </p>
                    </div>
                    <div className="space-y-1.5 min-w-0 text-right">
                        <div className="flex items-center gap-2 justify-end text-neutral-400">
                            <p className="text-[10px] uppercase font-bold">Véhicule</p>
                            <Car className="w-4 h-4 shrink-0" />
                        </div>
                        <p className="font-bold text-sm py-0.5 leading-relaxed truncate text-neutral-900">
                            {data.vehicleName || "Van Premium"}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 items-start gap-8 py-4 border-y border-neutral-100">
                    <div className="space-y-1.5 min-w-0 flex flex-col items-start">
                        <div className="flex items-center gap-2 text-neutral-400">
                            <MapPin className="w-4 h-4 shrink-0" />
                            <p className="text-[10px] uppercase font-bold">Départ</p>
                        </div>
                        <p className="font-bold text-sm uppercase text-neutral-900 py-0.5 leading-relaxed truncate w-full text-left">
                            {displayPickup?.split(' ')[0] || "Abidjan"}
                        </p>
                        <p className="text-[10px] text-neutral-500 leading-normal text-left">{displayPickup || "--"}</p>
                    </div>

                    <div className="space-y-1.5 min-w-0 text-right">
                        <div className="flex items-center gap-2 justify-end text-neutral-400">
                            <p className="text-[10px] uppercase font-bold">Destination</p>
                            <MapPin className="w-4 h-4 shrink-0" />
                        </div>
                        <p className="font-bold text-sm uppercase text-neutral-900 py-0.5 leading-relaxed truncate">
                            {displayDestination?.split(' ')[0] || "Aéroport"}
                        </p>
                        <p className="text-[10px] text-neutral-500 leading-normal text-right">{displayDestination || "--"}</p>
                    </div>
                </div>

                {/* Dynamic Service Info */}
                <div className="grid grid-cols-2 gap-4 py-4 border-b border-neutral-100">
                    <div className="space-y-1.5 flex flex-col items-start">
                        <div className="flex items-center gap-2 text-neutral-400">
                            <Calendar className="w-4 h-4 shrink-0" />
                            <p className="text-[10px] uppercase font-bold">
                                {isRental ? "Date de début" : "Date de départ"}
                            </p>
                        </div>
                        <p className="font-bold text-sm text-left py-0.5 leading-relaxed text-neutral-900">
                            {(displayDate && !isNaN(new Date(displayDate).getTime()))
                                ? format(new Date(displayDate), "dd MMM yyyy", { locale: fr })
                                : "--"}
                        </p>
                    </div>
                    <div className="text-right space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2 justify-end text-neutral-400">
                            <p className="text-[10px] uppercase font-bold">
                                {isRental ? "Début" : "Embarquement"}
                            </p>
                            <Clock className="w-4 h-4 shrink-0" />
                        </div>
                        <p className="font-bold text-sm py-0.5 leading-relaxed text-neutral-900">{displayTime || "--"}</p>
                    </div>
                </div>

                {isRental && data.endDate && (
                    <div className="grid grid-cols-2 gap-4 py-4 border-b border-neutral-100">
                        <div className="space-y-1.5 flex flex-col items-start">
                            <div className="flex items-center gap-2 text-neutral-400">
                                <Calendar className="w-4 h-4 shrink-0" />
                                <p className="text-[10px] uppercase font-bold">Date de retour</p>
                            </div>
                            <p className="font-bold text-sm text-left py-0.5 leading-relaxed text-neutral-900">
                                {(!isNaN(new Date(data.endDate).getTime()))
                                    ? format(new Date(data.endDate), "dd MMM yyyy", { locale: fr })
                                    : "--"}
                            </p>
                        </div>
                        <div className="text-right space-y-1.5 min-w-0">
                            <div className="flex items-center gap-2 justify-end text-neutral-400">
                                <p className="text-[10px] uppercase font-bold">Fin</p>
                                <Clock className="w-4 h-4 shrink-0" />
                            </div>
                            <p className="font-bold text-sm py-0.5 leading-relaxed text-neutral-900">{data.endTime || "18:00"}</p>
                        </div>
                    </div>
                )}

                {(isRental || isHourly || isAirport) && (
                    <div className="py-3 border-b border-neutral-100">
                        <div className="flex justify-between items-center bg-neutral-50 px-4 py-2.5 rounded-xl">
                            <div className="flex items-center gap-2">
                                <p className="text-[10px] uppercase font-bold text-neutral-400">Détails Service</p>
                            </div>
                            <p className="font-bold text-xs text-neutral-900">
                                {isRental && data.days ? `${data.days} jour${Number(data.days) > 1 ? 's' : ''}` :
                                    isHourly && data.hours ? `${data.hours} heure${Number(data.hours) > 1 ? 's' : ''}` :
                                        isAirport && data.travelers ? `${data.travelers} passager${Number(data.travelers) > 1 ? 's' : ''}` :
                                            "--"}
                            </p>
                        </div>
                    </div>
                )}

                <div className="pt-4">
                    <div className="flex items-center gap-2 mb-3">
                        <p className="text-[10px] uppercase font-bold text-neutral-400">Statut Financier</p>
                        <div className="h-px flex-1 bg-neutral-100" />
                        <div className="flex items-center justify-center gap-1 px-2 py-0.5 bg-green-500/10 rounded-full">
                            <ShieldCheck className="w-2.5 h-2.5 text-green-600" />
                            <span className="text-[8px] font-bold text-green-600 uppercase">ACOMPTE 30% PAYÉ</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-neutral-50 p-3 rounded-2xl text-left">
                            <p className="text-[9px] text-neutral-500 font-bold uppercase mb-1">Total</p>
                            <p className="font-bold text-sm">{(data.total || 0).toLocaleString('fr-FR')} F</p>
                        </div>
                        <div className="bg-neutral-900 text-white p-3 rounded-2xl text-right">
                            <p className="text-[9px] text-white/50 font-bold uppercase mb-1">Reste à payer</p>
                            <p className="font-bold text-sm text-primary">{remainingAmount.toLocaleString('fr-FR')} F</p>
                        </div>
                    </div>
                </div>

                {/* Notched Bottom Divider */}
                <div className="absolute -bottom-4 left-0 right-0 flex justify-between px-0 overflow-hidden">
                    <div className="w-8 h-8 rounded-full bg-neutral-100 -ml-4" />
                    <div className="flex-1 border-b-2 border-dashed border-neutral-100 mb-4 mx-2" />
                    <div className="w-8 h-8 rounded-full bg-neutral-100 -mr-4" />
                </div>
            </div>

            {/* Bottom QR Section */}
            <div className="bg-neutral-100/50 p-6 flex items-center gap-6">
                <div className="w-20 h-20 bg-white p-2 rounded-xl shadow-inner flex items-center justify-center border border-neutral-200">
                    {/* Visual Mock for QR Code */}
                    <div className="relative">
                        <QrCode className="w-14 h-14 text-neutral-800" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-white p-0.5 rounded-sm">
                                <Car className="w-3 h-3 text-primary fill-primary" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex-1">
                    <div className="w-full py-1 text-center border-y border-neutral-200 mt-2">
                        <span className="text-[10px] font-mono tracking-widest text-neutral-600">*{reference}*</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default BoardingPass;
