import { motion, AnimatePresence } from "framer-motion";
import { X, User, Car, Clock, Star, MapPin, HelpCircle, Settings, LogOut, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface MobileDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

const MobileDrawer = ({ isOpen, onClose }: MobileDrawerProps) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user, signOut } = useAuth();
    const [profile, setProfile] = useState<{ full_name: string | null; avatar_url: string | null } | null>(null);

    useEffect(() => {
        if (user && isOpen) {
            supabase
                .from("profiles")
                .select("full_name, avatar_url")
                .eq("user_id", user.id)
                .single()
                .then(({ data }) => {
                    if (data) setProfile(data);
                });
        }
    }, [user, isOpen]);

    const handleNavigation = (path: string) => {
        onClose();
        setTimeout(() => navigate(path), 300);
    };

    const handleLogout = async () => {
        await signOut();
        onClose();
        navigate("/login");
    };

    const menuSections = [
        {
            title: "Services",
            items: [
                { icon: Car, label: t("nav.explorer"), path: "/vehicles" },
                { icon: Car, label: t("nav.rentals"), path: "/rentals" },
                { icon: MapPin, label: t("nav.booking"), path: "/booking" },
            ],
        },
        {
            title: t("nav.profile"),
            items: [
                { icon: User, label: t("profile.title"), path: "/rating" },
                { icon: Clock, label: t("nav.history"), path: "/recents" },
                { icon: Star, label: t("nav.favoris"), path: "/favoris" },
                { icon: MapPin, label: t("nav.addresses"), path: "/adresses" },
            ],
        },
        {
            title: "Support",
            items: [
                { icon: Settings, label: t("common.settings"), path: "/parametres" },
                { icon: HelpCircle, label: "Centre d'aide", path: "/aide" },
            ],
        },
    ];

    const initials = profile?.full_name
        ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
        : user?.email?.[0]?.toUpperCase() || "V";

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "-100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed inset-y-0 left-0 w-[85%] max-w-sm bg-background border-r border-border z-[101] flex flex-col"
                    >
                        {/* Header / Profile Area */}
                        <div className="p-6 pt-12 bg-secondary/30">
                            <button
                                onClick={onClose}
                                className="mb-8 w-10 h-10 rounded-full bg-secondary flex items-center justify-center active:scale-90 transition-transform"
                            >
                                <X className="w-5 h-5 text-foreground" />
                            </button>

                            <div className="flex items-center gap-4 group" onClick={() => handleNavigation("/rating")}>
                                <Avatar className="w-16 h-16 border-2 border-primary/20">
                                    <AvatarImage src={profile?.avatar_url || undefined} />
                                    <AvatarFallback className="bg-primary/10 text-primary font-heading font-bold text-xl">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <h2 className="font-heading font-bold text-lg truncate text-foreground">
                                        {profile?.full_name || t("common.welcome")}
                                    </h2>
                                    <p className="text-primary text-xs font-body font-medium flex items-center gap-1 group-active:translate-x-1 transition-transform">
                                        {t("nav.profile")} <ChevronRight className="w-3 h-3" />
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Menu Items */}
                        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8 scroll-area">
                            {menuSections.map((section) => (
                                <div key={section.title} className="space-y-3">
                                    <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-bold font-body">
                                        {section.title}
                                    </p>
                                    <div className="space-y-1">
                                        {section.items.map((item) => (
                                            <button
                                                key={item.label}
                                                onClick={() => handleNavigation(item.path)}
                                                className="w-full flex items-center gap-4 py-3 text-left active:bg-secondary/50 rounded-xl px-2 -mx-2 transition-colors"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                                    <item.icon className="w-4 h-4 text-primary" />
                                                </div>
                                                <span className="font-body font-medium text-sm text-foreground flex-1">
                                                    {item.label}
                                                </span>
                                                <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer / Logout */}
                        <div className="p-6 border-t border-border">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-4 py-4 text-destructive active:bg-destructive/10 rounded-2xl px-4 -mx-4 transition-colors"
                            >
                                <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                                    <LogOut className="w-5 h-5" />
                                </div>
                                <span className="font-heading font-bold text-sm">{t("common.logout")}</span>
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default MobileDrawer;
