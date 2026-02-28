
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Safely saves a booking to Supabase by handling potential missing columns.
 * If a column (like booking_type) is missing in the database, it retries without it
 * and packs the extra info into the destination field.
 */
export async function saveBookingSafe(bookingData: any) {
    try {
        // 1. Try initial insert
        const { data, error } = await supabase
            .from("bookings")
            .insert(bookingData)
            .select()
            .single();

        if (!error) return { data, error: null };

        // 2. If it's a "column does not exist" error, handle it
        if (error.message.includes("column") || error.code === "42703") {
            console.warn("Detected missing columns in Supabase. Re-mapping data...");

            const {
                booking_type,
                total_price,
                deposit_amount,
                pickup_address,
                ...safeData
            } = bookingData;

            // Pack info into destination if missing
            const metadata = [];
            if (booking_type) metadata.push(`Type: ${booking_type}`);
            if (total_price) metadata.push(`Prix: ${total_price}`);
            if (deposit_amount) metadata.push(`Acompte: ${deposit_amount}`);
            if (pickup_address) metadata.push(`Départ: ${pickup_address}`);

            if (metadata.length > 0) {
                safeData.destination = `${safeData.destination} | [META: ${metadata.join(', ')}]`;
            }

            // Retry with safe data
            const { data: retryData, error: retryError } = await supabase
                .from("bookings")
                .insert(safeData)
                .select()
                .single();

            if (retryError) {
                console.error("Critical insert failure even after re-mapping:", retryError);
                return { data: null, error: retryError };
            }

            return { data: retryData, error: null };
        }

        return { data: null, error };
    } catch (err: any) {
        console.error("Safe insert exception:", err);
        return { data: null, error: err };
    }
}

/**
 * Safely updates a booking by handling missing columns.
 */
export async function updateBookingSafe(id: string, updateData: any) {
    try {
        const { error } = await supabase
            .from("bookings")
            .update(updateData)
            .eq("id", id);

        if (!error) return { error: null };

        if (error.message.includes("column") || error.code === "42703") {
            console.warn("Detected missing columns during update. Pruning data...");

            const {
                payment_status,
                transaction_id,
                ...safeUpdate
            } = updateData;

            const { error: retryError } = await supabase
                .from("bookings")
                .update(safeUpdate)
                .eq("id", id);

            return { error: retryError };
        }

        return { error };
    } catch (err: any) {
        return { error: err };
    }
}
