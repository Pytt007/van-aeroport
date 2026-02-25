import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { User, Mail, Phone, Camera, LogOut, ChevronRight, HelpCircle, MapPin, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";
import MobileLayout, { PageTransition } from "@/components/MobileLayout";
import MobileHeader from "@/components/MobileHeader";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const Rating = () => {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [coursesCount, setCoursesCount] = useState(0);
  const [addressesCount, setAddressesCount] = useState(0);

  const menuItems = [
    { icon: MapPin, label: t("nav.addresses"), subtitle: "Domicile, travail...", path: "/adresses" },
    { icon: HelpCircle, label: "Aide & Support", subtitle: "Centre d'aide", path: "/aide" },
    { icon: Settings, label: t("common.settings"), subtitle: "Langue, thème...", path: "/parametres" },
  ];

  useEffect(() => {
    if (!user) return;

    // Fetch profile
    supabase
      .from("profiles")
      .select("full_name, phone, avatar_url")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setFullName(data.full_name || "");
          setPhone(data.phone || "");
          setAvatarUrl(data.avatar_url);
        }
      });

    // Fetch courses count
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .then(({ count }) => {
        setCoursesCount(count || 0);
      });

    // Fetch addresses count
    supabase
      .from("addresses")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .then(({ count }) => {
        setAddressesCount(count || 0);
      });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, phone })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: t("common.error"), description: "Impossible de sauvegarder.", variant: "destructive" });
    } else {
      toast({ title: "Profil mis à jour ✓" });
      setEditing(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);

    const ext = file.name.split(".").pop();
    const filePath = `avatars/${user.id}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Erreur upload", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const publicUrl = data.publicUrl;

    await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("user_id", user.id);
    setAvatarUrl(publicUrl);
    toast({ title: "Photo de profil mise à jour ✓" });
    setUploading(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const initials = fullName
    ? fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "?";

  return (
    <MobileLayout>
      <PageTransition>
        <MobileHeader title={t("profile.title")} />
        <div className="px-4 pb-4">
          {/* Profile header */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex flex-col items-center"
          >
            <div className="relative">
              <Avatar className="w-24 h-24 border-2 border-primary">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary text-2xl font-heading font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center border-2 border-background active:scale-95 transition-transform"
              >
                <Camera className="w-4 h-4 text-primary-foreground" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>
            {uploading && <p className="text-xs text-muted-foreground mt-2 font-body">{t("common.loading")}</p>}
            <h1 className="font-heading font-bold text-xl mt-4">{fullName || "Voyageur"}</h1>
            <p className="text-muted-foreground text-sm font-body">{user?.email}</p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-3 gap-3 mt-6"
          >
            {[
              { value: coursesCount.toString(), label: t("profile.stats_rides") },
              { value: "Premium", label: "Statut" },
              { value: addressesCount.toString(), label: "Adresses" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-card border border-border p-4 text-center">
                <p className="font-heading font-bold text-lg text-primary">{stat.value}</p>
                <p className="text-muted-foreground text-[10px] font-body mt-1 uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </motion.div>

          {/* Edit profile section */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-6 rounded-2xl bg-card border border-border p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-semibold text-base">{t("profile.personal_info")}</h2>
              <button
                onClick={() => editing ? handleSave() : setEditing(true)}
                className="text-sm font-body text-primary font-medium"
                disabled={saving}
              >
                {saving ? "..." : editing ? t("common.save") : t("common.edit")}
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground text-xs mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> {t("profile.full_name")}
                </Label>
                {editing ? (
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="bg-secondary border-border"
                  />
                ) : (
                  <p className="text-sm font-body">{fullName || "—"}</p>
                )}
              </div>

              <Separator className="bg-border" />

              <div>
                <Label className="text-muted-foreground text-xs mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> {t("profile.email")}
                </Label>
                <p className="text-sm font-body">{user?.email || "—"}</p>
              </div>

              <Separator className="bg-border" />

              <div>
                <Label className="text-muted-foreground text-xs mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> {t("profile.phone")}
                </Label>
                {editing ? (
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+225 07 00 00 00"
                    className="bg-secondary border-border"
                  />
                ) : (
                  <p className="text-sm font-body">{phone || "—"}</p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Menu items */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-5 rounded-2xl bg-card border border-border overflow-hidden"
          >
            {menuItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-4 px-5 py-4 text-left active:bg-secondary/50 transition-colors ${i < menuItems.length - 1 ? "border-b border-border" : ""
                    }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body font-medium text-sm">{item.label}</p>
                    <p className="text-muted-foreground text-xs font-body">{item.subtitle}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              );
            })}
          </motion.div>

          {/* Logout */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full mt-5 py-6 rounded-2xl border-destructive/30 text-destructive active:bg-destructive/10 font-body"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {t("common.logout")}
            </Button>
          </motion.div>
        </div>
      </PageTransition>
    </MobileLayout>
  );
};

export default Rating;
