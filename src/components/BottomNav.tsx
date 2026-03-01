import { Home, Search, MapPin, User, Car } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const BottomNav = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { icon: Home, label: t("nav.home"), path: "/" },
    { icon: Search, label: t("nav.explorer"), path: "/vehicles" },
    { icon: Car, label: t("nav.rentals"), path: "/rentals" },
    { icon: MapPin, label: t("nav.rides"), path: "/ride-booking" },
    { icon: User, label: t("nav.profile"), path: "/profile" },
  ];

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50">
      <div
        className="glass border-t border-border/40 px-2 flex items-center justify-around"
        style={{
          paddingBottom: "max(env(safe-area-inset-bottom), 12px)",
          paddingTop: "10px",
        }}
      >
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center gap-1 relative py-1"
              style={{ minWidth: 64, flex: 1 }}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-[10px] left-1/2 -ml-4 w-8 h-1 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <Icon
                className={`w-[22px] h-[22px] transition-colors ${isActive ? "text-primary" : "text-muted-foreground"
                  }`}
              />
              <span
                className={`text-[10px] font-body leading-none transition-colors ${isActive ? "text-primary font-medium" : "text-muted-foreground"
                  }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
