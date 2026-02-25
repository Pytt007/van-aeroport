import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Share, PlusSquare, Smartphone, MoreVertical, LayoutGrid } from "lucide-react";
import { Button } from "./ui/button";

const PWA_SESSION_KEY = "pwa_prompt_session_shown";

const PWAInstallPrompt = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [platform, setPlatform] = useState<"ios" | "android" | "other">("other");
    const location = useLocation();

    useEffect(() => {
        // 1. Only show on home screen
        if (location.pathname !== "/") return;

        // 2. Check if already installed
        // @ts-ignore
        const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
        if (isStandalone) return;

        // 3. Check if shown in this session
        const isShown = sessionStorage.getItem(PWA_SESSION_KEY);
        if (isShown) return;

        // 4. Detect platform
        const ua = window.navigator.userAgent.toLowerCase();
        const isIOS = /iphone|ipad|ipod/.test(ua);
        const isAndroid = /android/.test(ua);

        if (isIOS) setPlatform("ios");
        else if (isAndroid) setPlatform("android");
        else return;

        // 5. Show with delay
        const timer = setTimeout(() => {
            setIsVisible(true);
            sessionStorage.setItem(PWA_SESSION_KEY, "true");
        }, 3000);

        return () => clearTimeout(timer);
    }, [location.pathname]);

    const handleDismiss = () => {
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed inset-x-4 bottom-24 z-[60] md:max-w-[400px] md:mx-auto"
            >
                <div className="bg-card border border-border rounded-3xl p-5 shadow-2xl relative overflow-hidden">
                    {/* Close button */}
                    <button
                        onClick={() => setIsVisible(false)}
                        className="absolute top-4 right-4 p-1 rounded-full hover:bg-secondary transition-colors"
                    >
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>

                    <div className="flex gap-4 items-center mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                            <Smartphone className="w-7 h-7 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-heading font-bold text-lg text-foreground leading-tight">
                                Installer Vanaeroport
                            </h3>
                            <p className="text-sm text-muted-foreground font-body font-medium">
                                Pour un accès rapide
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4 mb-6">
                        <p className="text-sm font-body font-semibold text-foreground/80">
                            Comment installer :
                        </p>

                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <span className="text-xs font-heading font-bold text-primary text-center">1</span>
                                </div>
                                <p className="text-sm font-body text-muted-foreground flex items-center gap-1.5 flex-wrap">
                                    Appuyez sur
                                    {platform === "ios" ? (
                                        <span className="inline-flex items-center gap-1 bg-secondary px-2 py-0.5 rounded text-foreground font-medium">
                                            <Share className="w-3.5 h-3.5" /> Partager
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 bg-secondary px-2 py-0.5 rounded text-foreground font-medium">
                                            <MoreVertical className="w-3.5 h-3.5" /> Menu
                                        </span>
                                    )}
                                    {platform === "ios" ? "en bas" : "en haut à droite"}
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <span className="text-xs font-heading font-bold text-primary">2</span>
                                </div>
                                <p className="text-sm font-body text-muted-foreground flex items-center gap-1.5 flex-wrap">
                                    Puis
                                    <span className="inline-flex items-center gap-1 bg-secondary px-2 py-0.5 rounded text-foreground font-medium">
                                        {platform === "ios" ? (
                                            <>
                                                <PlusSquare className="w-3.5 h-3.5" /> Sur l'écran d'accueil
                                            </>
                                        ) : (
                                            <>
                                                <LayoutGrid className="w-3.5 h-3.5" /> Ajouter à l'accueil
                                            </>
                                        )}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <Button
                        onClick={handleDismiss}
                        variant="outline"
                        className="w-full h-12 rounded-2xl font-heading font-bold text-sm bg-secondary/50 border-transparent hover:bg-secondary"
                    >
                        J'ai compris
                    </Button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default PWAInstallPrompt;
