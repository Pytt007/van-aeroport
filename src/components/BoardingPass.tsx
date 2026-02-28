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
        pickupTime?: string;
        total?: number;
        deposit?: number;
        travelers?: string | number;
    };
}

const BoardingPass = ({ data }: BoardingPassProps) => {
    const depositPaid = data.deposit || 0;
    const remainingAmount = (data.total || 0) - depositPaid;
    const reference = data.id?.slice(0, 8).toUpperCase() || "PENDING";

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm mx-auto overflow-hidden bg-white text-black rounded-3xl shadow-2xl font-sans"
            id="boarding-pass-capture"
        >
            {/* Top Section - Brand & Ref */}
            <div className="bg-neutral-900 text-white px-5 py-5 flex justify-between items-center border-b border-white/10">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
                        <Plane className="w-5 h-5 text-black" />
                    </div>
                    <span className="font-heading font-extrabold tracking-tight text-lg italic uppercase truncate">Vanaeroport</span>
                </div>
                <div className="text-right shrink-0 ml-3">
                    <p className="text-[9px] uppercase tracking-widest text-neutral-400">Référence</p>
                    <p className="font-heading font-bold text-primary text-sm tracking-tight overflow-hidden">#{reference}</p>
                </div>
            </div>

            {/* Main Ticket Body */}
            <div className="p-6 space-y-5 relative">
                {/* Passenger Info */}
                <div className="flex justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                        <p className="text-[10px] uppercase font-bold text-neutral-400">Passager</p>
                        <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                            <p className="font-bold text-sm tracking-tight capitalize truncate">{data.fullName || "Client Premium"}</p>
                        </div>
                    </div>
                    <div className="text-right space-y-1 min-w-0">
                        <p className="text-[10px] uppercase font-bold text-neutral-400">Véhicule</p>
                        <div className="flex items-center gap-2 justify-end">
                            <Car className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                            <p className="font-bold text-sm truncate">{data.vehicleName || "Van Premium"}</p>
                        </div>
                    </div>
                </div>

                {/* Route Section */}
                <div className="flex items-center gap-2 py-4 border-y border-neutral-50/50">
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] uppercase font-bold text-neutral-400 mb-1">Départ</p>
                        <p className="font-heading font-bold text-base leading-tight uppercase truncate text-neutral-900">
                            {data.pickup?.split(' ')[0] || "Abidjan"}
                        </p>
                        <p className="text-[9px] text-neutral-500 truncate mt-1">{data.pickup || "--"}</p>
                    </div>

                    <div className="flex flex-col items-center shrink-0 px-2">
                        <div className="p-1.5 bg-primary/10 rounded-full">
                            <Plane className="w-3.5 h-3.5 text-primary rotate-90" />
                        </div>
                    </div>

                    <div className="flex-1 text-right min-w-0">
                        <p className="text-[10px] uppercase font-bold text-neutral-400 mb-1">Destination</p>
                        <p className="font-heading font-bold text-base leading-tight uppercase truncate text-neutral-900">
                            {data.destination?.split(' ')[0] || "Aéroport"}
                        </p>
                        <p className="text-[9px] text-neutral-500 truncate mt-1">{data.destination || "--"}</p>
                    </div>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-neutral-100">
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-neutral-400">
                            <Calendar className="w-3 h-3" />
                            <p className="text-[9px] uppercase font-bold">Date de départ</p>
                        </div>
                        <p className="font-bold text-sm">
                            {data.pickupDate ? format(new Date(data.pickupDate), "dd MMM yyyy", { locale: fr }) : "--"}
                        </p>
                    </div>
                    <div className="text-right space-y-1">
                        <div className="flex items-center gap-1.5 justify-end text-neutral-400">
                            <Clock className="w-3 h-3" />
                            <p className="text-[9px] uppercase font-bold">Embarquement</p>
                        </div>
                        <p className="font-bold text-sm">{data.pickupTime || "--"}</p>
                    </div>
                </div>

                {/* Payment Summary */}
                <div className="pt-2">
                    <div className="flex items-center gap-2 mb-3">
                        <p className="text-[10px] uppercase font-bold text-neutral-400">Statut Financier</p>
                        <div className="h-px flex-1 bg-neutral-100" />
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-green-500/10 rounded-full">
                            <ShieldCheck className="w-2.5 h-2.5 text-green-600" />
                            <span className="text-[8px] font-bold text-green-600">ACOMPTE 30% PAYÉ</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-neutral-50 p-3 rounded-2xl">
                            <p className="text-[9px] text-neutral-500 font-bold uppercase mb-1">Total</p>
                            <p className="font-bold text-sm">{(data.total || 0).toLocaleString('fr-FR')} F</p>
                        </div>
                        <div className="bg-neutral-900 text-white p-3 rounded-2xl">
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
                                <Plane className="w-3 h-3 text-primary fill-primary" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex-1">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase leading-none mb-1 text-center">Scan pour validation</p>
                    <div className="w-full py-1 text-center border-y border-neutral-200 mt-2">
                        <span className="text-[10px] font-mono tracking-widest text-neutral-600">*{reference}*</span>
                    </div>
                    <p className="text-[8px] text-neutral-400 mt-2 italic leading-tight uppercase font-medium">Document officiel Vanaeroport Abidjan - Côte d'Ivoire</p>
                </div>
            </div>
        </motion.div>
    );
};

export default BoardingPass;
