import { supabase } from "@/integrations/supabase/client";

export interface DiscountResult {
    discountAmount: number;
    discountReason: string | null;
    finalPrice: number;
}

export const getAutomaticDiscount = async (userId: string | undefined, originalPrice: number): Promise<DiscountResult> => {
    if (!userId) {
        return { discountAmount: 0, discountReason: null, finalPrice: originalPrice };
    }

    try {
        // Count total bookings for this user
        const { count, error } = await supabase
            .from("bookings")
            .select("*", { count: 'exact', head: true })
            .eq("user_id", userId);

        if (error) throw error;

        const bookingCount = count || 0;
        const currentOrderNumber = bookingCount + 1;
        const now = new Date();
        const promoEndDate = new Date('2026-04-30T23:59:59');

        let discountAmount = 0;
        let discountReason = null;

        // 20th order is free
        if (currentOrderNumber === 20) {
            discountAmount = originalPrice;
            discountReason = "Félicitations ! Votre 20ème commande est offerte !";
        }
        // 15th order is 50% off
        else if (currentOrderNumber === 15) {
            discountAmount = originalPrice * 0.5;
            discountReason = "Cadeau : 50% de réduction sur votre 15ème commande !";
        }
        // Early bird / First orders discount until April 30th
        else if (now <= promoEndDate && bookingCount < 5) {
            discountAmount = originalPrice * 0.1;
            discountReason = "Offre de lancement : -10% sur vos premières commandes !";
        }

        return {
            discountAmount,
            discountReason,
            finalPrice: originalPrice - discountAmount
        };
    } catch (error) {
        console.error("Error calculating discount:", error);
        return { discountAmount: 0, discountReason: null, finalPrice: originalPrice };
    }
};
