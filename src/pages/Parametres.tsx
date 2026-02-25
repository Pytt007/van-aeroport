import { motion } from "framer-motion";
import { Globe, Moon, Sun, Info, Save } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import MobileLayout, { PageTransition } from "@/components/MobileLayout";
import MobileHeader from "@/components/MobileHeader";
import { useTheme } from "@/components/theme-provider";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Trash2, AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


const languages = [
  { code: "fr", label: "Français" },
  { code: "en", label: "English" },
];

const Parametres = () => {
  const { theme, setTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // States for pending changes
  const [tempDarkMode, setTempDarkMode] = useState(theme === "dark");
  const [tempLang, setTempLang] = useState(i18n.language.startsWith("fr") ? "fr" : "en");
  const [isDeleting, setIsDeleting] = useState(false);

  const hasChanges = (tempDarkMode !== (theme === "dark")) ||
    (!i18n.language.startsWith(tempLang));

  const handleSave = () => {
    // Apply theme
    setTheme(tempDarkMode ? "dark" : "light");
    // Apply language
    i18n.changeLanguage(tempLang);

    toast.success(t("common.success_save"));
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    setIsDeleting(true);
    try {
      // Direct call to our RPC function which handles auth.users deletion
      const { error: deleteError } = await (supabase as any).rpc('delete_user');

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      // Logout visually
      await signOut();
      toast.success(t("settings.delete_success") || "Account deleted");
      navigate("/login");
    } catch (error: any) {
      console.error("Deletion error:", error);
      toast.error(error.message || t("common.error"));
    } finally {
      setIsDeleting(false);
    }
  };


  return (
    <MobileLayout>
      <PageTransition>
        <MobileHeader title={t("common.settings")} showProfile={true} />
        <div className="px-4 pb-4 space-y-5">
          {/* Apparence */}
          <div>
            <p className="text-xs text-muted-foreground font-body uppercase tracking-wider mb-2">
              {t("settings.appearance")}
            </p>
            <div className="rounded-2xl bg-card border border-border overflow-hidden">
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  {tempDarkMode ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
                </div>
                <div className="flex-1">
                  <p className="font-body font-medium text-sm">{t("settings.dark_mode")}</p>
                  <p className="text-muted-foreground text-[11px] font-body">
                    {tempDarkMode ? t("settings.enabled") : t("settings.disabled")}
                  </p>
                </div>
                <button
                  onClick={() => setTempDarkMode(!tempDarkMode)}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-200 shrink-0 ${tempDarkMode ? "bg-primary" : "bg-secondary border border-border"}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200 ${tempDarkMode ? "left-6" : "left-0.5"}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Langue */}
          <div>
            <p className="text-xs text-muted-foreground font-body uppercase tracking-wider mb-2">
              {t("settings.language")}
            </p>
            <Drawer>
              <DrawerTrigger asChild>
                <div className="rounded-2xl bg-card border border-border flex items-center gap-4 px-5 py-4 cursor-pointer active:scale-[0.98] transition-all">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Globe className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-body font-medium text-sm">{t("settings.language")}</p>
                    <p className="text-muted-foreground text-[11px] font-body">
                      {languages.find(l => l.code === tempLang)?.label || "Français"}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </DrawerTrigger>
              <DrawerContent className="px-4 pb-8">
                <DrawerHeader className="px-0">
                  <DrawerTitle className="text-left font-heading">{t("settings.language")}</DrawerTitle>
                  <DrawerDescription className="text-left font-body">
                    Choisissez votre langue d'affichage
                  </DrawerDescription>
                </DrawerHeader>
                <div className="grid grid-cols-1 gap-2 mt-4">
                  {languages.map((lang) => (
                    <DrawerClose asChild key={lang.code}>
                      <button
                        onClick={() => setTempLang(lang.code)}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-xl border transition-all text-left group",
                          tempLang === lang.code
                            ? "bg-primary/10 border-primary"
                            : "bg-secondary/40 border-transparent"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Globe className={cn("w-5 h-5", tempLang === lang.code ? "text-primary" : "text-muted-foreground")} />
                          <span className={cn("font-heading font-semibold text-sm", tempLang === lang.code ? "text-primary" : "text-foreground")}>
                            {lang.label}
                          </span>
                        </div>
                        {tempLang === lang.code && <CheckCircle2 className="w-5 h-5 text-primary" />}
                      </button>
                    </DrawerClose>
                  ))}
                </div>
              </DrawerContent>
            </Drawer>
          </div>

          {/* Save Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="pt-4"
          >
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className={`w-full h-14 rounded-2xl font-heading font-bold text-base flex items-center justify-center gap-3 transition-all shadow-lg ${hasChanges ? "bg-primary text-primary-foreground shadow-primary/20 glow-amber active:scale-95" : "bg-muted text-muted-foreground cursor-not-allowed"}`}
            >
              <Save className="w-5 h-5" />
              {t("common.save")}
            </button>
          </motion.div>

          {/* Danger Zone */}
          <div className="pt-4">
            <p className="text-xs text-destructive font-body uppercase tracking-wider mb-2 flex items-center gap-2">
              <AlertTriangle className="w-3 h-3" />
              {t("settings.danger_zone")}
            </p>
            <div className="rounded-2xl bg-destructive/5 border border-destructive/20 overflow-hidden p-5">
              <p className="text-[11px] text-muted-foreground font-body mb-4">
                {t("settings.delete_account_desc")}
              </p>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    className="w-full h-12 rounded-xl bg-destructive/10 text-destructive font-heading font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all border border-destructive/20 hover:bg-destructive hover:text-white group"
                  >
                    <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    {t("settings.delete_account")}
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="w-[90%] rounded-2xl max-w-sm">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-heading font-bold text-lg">
                      {t("settings.delete_confirm_title")}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="font-body text-sm">
                      {t("settings.delete_confirm_desc")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex-row gap-3 pt-2">
                    <AlertDialogCancel className="flex-1 mt-0 h-12 rounded-xl font-heading font-bold">
                      {t("common.cancel")}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                      className="flex-1 h-12 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 font-heading font-bold"
                    >
                      {isDeleting ? t("common.loading") : t("common.delete")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>


          {/* Version */}
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-secondary/30 border border-border/50">
            <Info className="w-4 h-4 text-muted-foreground shrink-0" />
            <p className="text-xs font-body text-muted-foreground">
              {t("settings.version")} : 1.1.2
            </p>
          </div>
        </div>
      </PageTransition>
    </MobileLayout>
  );
};

export default Parametres;
