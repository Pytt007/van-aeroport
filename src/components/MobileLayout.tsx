import { ReactNode } from "react";
import { motion } from "framer-motion";
import BottomNav from "./BottomNav";

interface MobileLayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

const MobileLayout = ({ children, showNav = true }: MobileLayoutProps) => {
  return (
    <div className="flex justify-center min-h-screen bg-background text-foreground">
      <div className={`mobile-container w-full bg-background text-foreground relative ${showNav ? 'pb-24' : 'safe-bottom'}`}>
        {children}
        {showNav && <BottomNav />}
      </div>
    </div>
  );
};

export default MobileLayout;

export const PageTransition = ({ children }: { children: ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, x: 30 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -30 }}
    transition={{ duration: 0.25, ease: "easeOut" }}
    className="min-h-full"
  >
    {children}
  </motion.div>
);
