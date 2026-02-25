import { motion } from "framer-motion";
import { MapPin, Home, Briefcase, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import MobileLayout, { PageTransition } from "@/components/MobileLayout";
import MobileHeader from "@/components/MobileHeader";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const Adresses = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAdding, setIsAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newAddr, setNewAddr] = useState("");

  useEffect(() => {
    if (!user) return;
    fetchAddresses();
  }, [user]);

  const fetchAddresses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("addresses")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erreur chargement adresses");
    } else {
      setAddresses(data || []);
    }
    setLoading(false);
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("addresses").delete().eq("id", id);
    if (error) {
      toast.error("Erreur suppression");
    } else {
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      toast.success("Adresse supprimée");
    }
  };

  const addAddress = async () => {
    if (!newLabel || !newAddr || !user) return;

    const { data, error } = await supabase.from("addresses").insert({
      user_id: user.id,
      label: newLabel,
      address: newAddr,
      type: "other",
    }).select().single();

    if (error) {
      toast.error("Erreur lors de l'ajout");
    } else {
      setAddresses([data, ...addresses]);
      setNewLabel("");
      setNewAddr("");
      setIsAdding(false);
      toast.success("Adresse ajoutée ✓");
    }
  };

  const getIcon = (type: string) => {
    if (type === "home") return Home;
    if (type === "work") return Briefcase;
    return MapPin;
  };

  return (
    <MobileLayout>
      <PageTransition>
        <MobileHeader title="Adresses enregistrées" />
        <div className="px-4 pb-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-10 text-muted-foreground text-sm font-body">Chargement...</div>
          ) : addresses.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm font-body">Aucune adresse enregistrée</div>
          ) : (
            addresses.map((addr, i) => {
              const Icon = getIcon(addr.type);
              return (
                <motion.div
                  key={addr.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-semibold text-sm">{addr.label}</p>
                    <p className="text-muted-foreground text-xs font-body truncate">{addr.address}</p>
                  </div>
                  <button
                    onClick={() => remove(addr.id)}
                    className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 active:scale-90 transition-transform"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </motion.div>
              );
            })
          )}

          {isAdding ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-2xl bg-card border border-primary/30 space-y-3 shadow-lg"
            >
              <input
                autoFocus
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Nom (ex: Maison, Amis)"
                className="w-full bg-secondary rounded-xl px-4 py-2.5 text-sm font-body focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <input
                value={newAddr}
                onChange={(e) => setNewAddr(e.target.value)}
                placeholder="Adresse complète"
                className="w-full bg-secondary rounded-xl px-4 py-2.5 text-sm font-body focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <div className="flex flex-col gap-2 pt-1">
                <Button
                  onClick={addAddress}
                  className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-heading font-semibold text-sm tracking-wide"
                >
                  Enregistrer
                </Button>
                <button
                  onClick={() => setIsAdding(false)}
                  className="w-full py-4 rounded-2xl bg-secondary text-sm font-body font-medium"
                >
                  Annuler
                </button>
              </div>
            </motion.div>
          ) : (

            <motion.button
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: addresses.length * 0.08 }}
              onClick={() => setIsAdding(true)}
              className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border border-dashed border-primary/40 text-primary font-body text-sm active:border-primary transition-colors"
            >
              <Plus className="w-4 h-4" />
              Ajouter une adresse
            </motion.button>
          )}
        </div>
      </PageTransition>
    </MobileLayout>
  );
};

export default Adresses;
