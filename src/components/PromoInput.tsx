import { useState } from "react";
import { Tag, Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PromoData {
    id: string;
    code: string;
    discount_type: "percentage" | "fixed";
    discount_value: number;
}

interface PromoInputProps {
    onApply: (promo: PromoData | null) => void;
    className?: string;
}

export default function PromoInput({ onApply, className }: PromoInputProps) {
    const [code, setCode] = useState("");
    const [isChecking, setIsChecking] = useState(false);
    const [appliedPromo, setAppliedPromo] = useState<PromoData | null>(null);

    const handleApply = async () => {
        if (!code.trim()) return;

        setIsChecking(true);
        try {
            const { data, error } = await supabase
                .from("coupons")
                .select("*")
                .eq("code", code.toUpperCase())
                .eq("is_active", true)
                .single();

            if (error || !data) {
                toast.error("Code promo invalide ou expiré");
                return;
            }

            // Check dates and limits
            if (data.expires_at && new Date(data.expires_at) < new Date()) {
                toast.error("Ce code promo est expiré");
                return;
            }

            if (data.max_uses && data.current_uses && data.current_uses >= data.max_uses) {
                toast.error("Ce code promo a atteint sa limite d'utilisation");
                return;
            }

            const validPromo: PromoData = {
                id: data.id,
                code: data.code,
                discount_type: data.discount_type as "percentage" | "fixed",
                discount_value: data.discount_value
            };

            setAppliedPromo(validPromo);
            onApply(validPromo);
            toast.success("Code promo appliqué !");
        } catch (err) {
            console.error(err);
            toast.error("Erreur lors de la vérification");
        } finally {
            setIsChecking(false);
        }
    };

    const handleRemove = () => {
        setCode("");
        setAppliedPromo(null);
        onApply(null);
    };

    return (
        <div className={cn("p-4 rounded-2xl bg-card border border-border shadow-sm", className)}>
            <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-heading font-semibold flex items-center gap-2">
                    <Tag className="w-4 h-4 text-primary" />
                    Code Promo
                </label>
            </div>

            {!appliedPromo ? (
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Ex: BIENVENUE10"
                        className="flex-1 px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-body text-sm uppercase"
                        disabled={isChecking}
                    />
                    <Button
                        onClick={handleApply}
                        disabled={!code.trim() || isChecking}
                        className="rounded-xl px-5 h-auto bg-primary text-primary-foreground font-semibold"
                    >
                        {isChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : "Appliquer"}
                    </Button>
                </div>
            ) : (
                <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                            <Check className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                            <p className="font-heading font-bold text-sm text-green-700">{appliedPromo.code}</p>
                            <p className="text-[11px] text-green-600/80 font-body">Promotion appliquée</p>
                        </div>
                    </div>
                    <button
                        onClick={handleRemove}
                        className="p-2 bg-red-500/10 rounded-full active:scale-95 transition-transform"
                    >
                        <X className="w-4 h-4 text-red-500" />
                    </button>
                </div>
            )}
        </div>
    );
}
