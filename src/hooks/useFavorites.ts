import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useFavorites = () => {
    const { user } = useAuth();
    const [favorites, setFavorites] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!user) return;

        const fetchFavorites = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from("addresses")
                .select("*")
                .order("created_at", { ascending: false });

            if (!error) {
                setFavorites(data || []);
            }
            setLoading(false);
        };

        fetchFavorites();
    }, [user]);

    return { favorites, loading };
};
